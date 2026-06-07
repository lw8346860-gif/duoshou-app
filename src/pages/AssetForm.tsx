import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAsset, useAssetMutations, useCategories, useTags } from '../hooks/useLiveQuery';
import type { Asset, AssetStatus } from '../types';
import { REMOVED_CATEGORY_IDS } from '../types';
import { calcUsedDays, estimateDepreciatedValue, formatMoney } from '../utils/calculations';
import CategoryIcon from '../components/CategoryIcon';

type FormData = Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>;
type TargetMode = 'daily' | 'days';

const todayString = () => new Date().toISOString().split('T')[0];

const emptyForm: FormData = {
  name: '',
  brand: '',
  model: '',
  spec: '',
  categoryId: 'cat-other',
  tagIds: [],
  purchasePrice: 0,
  currency: 'CNY',
  purchaseDate: todayString(),
  purchaseChannel: '',
  currentValue: 0,
  valuationMode: 'none',
  annualDepreciationRate: 0,
  expectedResidualValue: 0,
  targetDailyCost: 0,
  targetUseDays: 0,
  hasIncome: false,
  monthlyIncome: 0,
  incomeNote: '',
  debtBalance: 0,
  monthlyPayment: 0,
  paymentStartDate: '',
  paymentEndDate: '',
  monthlyMaintenanceCost: 0,
  monthlyOtherCost: 0,
  monthlyCost: 0,
  costNote: '',
  status: 'active',
  lastUsedDate: '',
  useCount: 0,
  retiredDate: null,
  soldDate: null,
  soldPrice: null,
  soldChannel: null,
  discardedDate: null,
  imageUri: null,
  note: '',
  isExcludedFromTotal: false,
  isExcludedFromDailyAverage: false,
  luxuryInfo: null,
  carInfo: null,
  subscriptionInfo: null,
  postmortem: null,
};

const statusOptions: Array<{ value: AssetStatus; label: string }> = [
  { value: 'active', label: '服役' },
  { value: 'idle', label: '闲置' },
  { value: 'retired', label: '退役' },
];

export default function AssetForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const existingAsset = useAsset(id);
  const { add, update } = useAssetMutations();
  const categories = useCategories().filter(cat => !REMOVED_CATEGORY_IDS.includes(cat.id));
  const tags = useTags();

  const [form, setForm] = useState<FormData>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [targetMode, setTargetMode] = useState<TargetMode>('daily');

  useEffect(() => {
    if (existingAsset) {
      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = existingAsset;
      void _id;
      void _createdAt;
      void _updatedAt;
      // Existing IndexedDB records need to be mirrored into local editable form state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        ...rest,
        status: rest.status === 'sold' || rest.status === 'discarded' ? 'retired' : rest.status,
        currency: 'CNY',
        brand: '',
        model: '',
        spec: '',
        purchaseChannel: '',
        expectedResidualValue: 0,
        valuationMode: rest.valuationMode ?? 'depreciation',
        annualDepreciationRate: rest.annualDepreciationRate ?? 0.3,
        imageUri: null,
        note: '',
      });
      setTargetMode(rest.targetUseDays > 0 ? 'days' : 'daily');
    }
  }, [existingAsset]);

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const visibleCategory = categories.some(cat => cat.id === form.categoryId) ? form.categoryId : 'cat-other';
  const manualValue = form.currentValue > 0;
  const estimatedValue = useMemo(
    () => form.valuationMode === 'depreciation'
      ? estimateDepreciatedValue(form.purchasePrice, form.purchaseDate, form.annualDepreciationRate ?? 0.3)
      : form.purchasePrice,
    [form.annualDepreciationRate, form.purchasePrice, form.purchaseDate, form.valuationMode],
  );
  const effectiveValue = manualValue ? form.currentValue : estimatedValue;
  const netCost = Math.max(0, form.purchasePrice - effectiveValue);
  const usedDays = calcUsedDays(form.purchaseDate);
  const targetDailyCost = targetMode === 'days' && form.targetUseDays > 0
    ? netCost / form.targetUseDays
    : form.targetDailyCost;
  const targetUseDays = targetMode === 'daily' && form.targetDailyCost > 0
    ? Math.ceil(netCost / form.targetDailyCost)
    : form.targetUseDays;
  const targetDate = targetUseDays > 0
    ? new Date(new Date(`${form.purchaseDate}T00:00:00`).getTime() + Math.max(0, targetUseDays - 1) * 86400000).toISOString().split('T')[0]
    : '';

  const handleMonthChange = (month: string) => {
    if (!month) return;
    const currentDay = form.purchaseDate.split('-')[2] ?? '01';
    const lastDay = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate();
    const safeDay = String(Math.min(Number(currentDay), lastDay)).padStart(2, '0');
    setField('purchaseDate', `${month}-${safeDay}`);
  };

  const handleSave = async () => {
    if (!form.name.trim() || form.purchasePrice < 0 || !form.purchaseDate || !visibleCategory) return;
    if (targetDailyCost < 0 || targetUseDays < 0) return;
    if (form.status === 'retired' && form.retiredDate && form.retiredDate < form.purchaseDate) return;

    const payload: FormData = {
      ...form,
      name: form.name.trim(),
      brand: '',
      model: '',
      spec: '',
      categoryId: visibleCategory,
      currency: 'CNY',
      purchaseChannel: '',
      currentValue: manualValue ? form.currentValue : 0,
      valuationMode: form.valuationMode ?? 'none',
      annualDepreciationRate: form.valuationMode === 'depreciation' ? Math.min(1, Math.max(0, form.annualDepreciationRate ?? 0)) : 0,
      expectedResidualValue: 0,
      targetDailyCost: Number.isFinite(targetDailyCost) ? Number(targetDailyCost.toFixed(2)) : 0,
      targetUseDays: Number.isFinite(targetUseDays) ? Math.max(0, Math.ceil(targetUseDays)) : 0,
      hasIncome: Boolean(form.hasIncome && (form.monthlyIncome ?? 0) > 0),
      monthlyIncome: form.hasIncome ? Math.max(0, form.monthlyIncome ?? 0) : 0,
      incomeNote: form.hasIncome ? (form.incomeNote ?? '').trim() : '',
      debtBalance: Math.max(0, form.debtBalance ?? 0),
      monthlyPayment: Math.max(0, form.monthlyPayment ?? 0),
      paymentStartDate: form.monthlyPayment ? (form.paymentStartDate || '') : '',
      paymentEndDate: form.monthlyPayment ? (form.paymentEndDate || '') : '',
      monthlyMaintenanceCost: Math.max(0, form.monthlyMaintenanceCost ?? 0),
      monthlyOtherCost: Math.max(0, form.monthlyOtherCost ?? 0),
      monthlyCost: Math.max(0, (form.monthlyMaintenanceCost ?? 0) + (form.monthlyOtherCost ?? 0)),
      costNote: (form.costNote ?? '').trim(),
      retiredDate: form.status === 'retired' ? (form.retiredDate ?? todayString()) : null,
      soldDate: null,
      soldPrice: null,
      soldChannel: null,
      discardedDate: null,
      imageUri: null,
      note: '',
      luxuryInfo: null,
      carInfo: null,
      subscriptionInfo: null,
      postmortem: form.status === 'retired' ? form.postmortem : null,
    };

    setSaving(true);
    try {
      if (id && existingAsset) {
        await update(id, payload);
      } else {
        await add(payload);
      }
      navigate(-1);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-safe space-y-3 pb-8">
      <div className="form-header">
        <button onClick={() => navigate(-1)} className="back-button">←</button>
        <h1 className="form-page-title">{id ? '编辑资产' : '新增资产'}</h1>
        <div className="form-header-spacer" />
      </div>

      <section className="bg-white rounded-2xl p-3 space-y-2.5">
        <label className="field-label">名称</label>
        <input
          placeholder="预计持有 1 年以上的资产"
          value={form.name}
          onChange={e => setField('name', e.target.value)}
          className="form-input"
        />
        <div className="hint-line">适合记录房产、股票、车位、汽车、数码、收藏等长期持有资产。</div>
      </section>

      <section className="bg-white rounded-2xl p-3 space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          <label className="field-label">
            购买价格
            <input
              type="number"
              placeholder="0"
              value={form.purchasePrice || ''}
              onChange={e => setField('purchasePrice', Number(e.target.value))}
              className="form-input mt-1"
            />
          </label>
          <label className="field-label">
            购买日期
            <input
              type="date"
              value={form.purchaseDate}
              onChange={e => setField('purchaseDate', e.target.value)}
              className="form-input mt-1"
            />
          </label>
        </div>
        <label className="field-label block">
          快速选年月
          <input
            type="month"
            value={form.purchaseDate.slice(0, 7)}
            onChange={e => handleMonthChange(e.target.value)}
            className="form-input mt-1"
          />
        </label>
      </section>

      <section className="bg-white rounded-2xl p-3 space-y-2.5">
        <h2 className="section-title">分类</h2>
        <div className="flex flex-wrap gap-1.5">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setField('categoryId', cat.id)}
              className={`choice-chip rounded-full inline-flex items-center gap-1 ${visibleCategory === cat.id ? 'choice-chip-selected' : ''}`}
            >
              <CategoryIcon category={cat} /> {cat.name}
            </button>
          ))}
        </div>
        <h2 className="section-title pt-1">标签</h2>
        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => {
            const selected = form.tagIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                onClick={() => setField('tagIds', selected ? form.tagIds.filter(tagId => tagId !== tag.id) : [...form.tagIds, tag.id])}
                className={`tag-chip rounded-full inline-flex items-center gap-1 ${selected ? 'tag-chip-selected' : ''}`}
              >
                <span className="tag-color-dot" />
                {tag.name}
              </button>
            );
          })}
        </div>
      </section>

      <section className="bg-white rounded-2xl p-3 space-y-2.5">
        <h2 className="section-title">估值目标</h2>
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: 'none' as const, label: '不折旧' },
            { key: 'manual' as const, label: '手动估值' },
            { key: 'depreciation' as const, label: '年折旧' },
          ].map(option => (
            <button
              key={option.key}
              type="button"
              onClick={() => setField('valuationMode', option.key)}
              className={`choice-chip rounded-full ${form.valuationMode === option.key ? 'choice-chip-selected' : ''}`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <label className="field-label">
            当前估值
            <input
              type="number"
              placeholder="自动"
              value={form.currentValue || ''}
              onChange={e => setField('currentValue', Number(e.target.value))}
              className="form-input mt-1"
            />
          </label>
          <label className="field-label">
            日均持有成本
            <input
              type="number"
              placeholder="自动"
              value={targetDailyCost || ''}
              onFocus={() => setTargetMode('daily')}
              onChange={e => {
                setTargetMode('daily');
                setField('targetDailyCost', Number(e.target.value));
              }}
              className="form-input mt-1"
            />
          </label>
          <label className="field-label">
            目标天数
            <input
              type="number"
              placeholder="自动"
              value={targetUseDays || ''}
              onFocus={() => setTargetMode('days')}
              onChange={e => {
                setTargetMode('days');
                setField('targetUseDays', Number(e.target.value));
              }}
              className="form-input mt-1"
            />
          </label>
          {form.valuationMode === 'depreciation' && (
            <label className="field-label col-span-3">
              年折旧率
              <input
                type="number"
                min="0"
                max="100"
                placeholder="例如 30"
                value={((form.annualDepreciationRate ?? 0) * 100) || ''}
                onChange={e => setField('annualDepreciationRate', Number(e.target.value) / 100)}
                className="form-input mt-1"
              />
            </label>
          )}
        </div>
        <div className="summary-strip">
          <div>
            <span>估值</span>
            <strong>{formatMoney(effectiveValue, 'CNY')}</strong>
          </div>
          <div>
            <span>{manualValue ? '手动填写' : form.valuationMode === 'depreciation' ? `年折旧 ${Math.round((form.annualDepreciationRate ?? 0) * 100)}%` : '不自动折旧'}</span>
            <strong>{usedDays > 0 ? `${usedDays} 天` : '未开始'}</strong>
          </div>
        </div>
        <div className="summary-strip">
          <div>
            <span>净成本</span>
            <strong>{formatMoney(netCost, 'CNY')}</strong>
          </div>
          <div>
            <span>{targetMode === 'days' ? '反推日均' : '反推天数'}</span>
            <strong>{targetMode === 'days' ? `${formatMoney(targetDailyCost, 'CNY')}/天` : `${targetUseDays || 0} 天`}</strong>
          </div>
        </div>
        {targetDate && <div className="hint-line">目标预计到 {targetDate}</div>}
      </section>

      <section className="bg-white rounded-2xl p-3 space-y-2.5">
        <h2 className="section-title">使用状态</h2>
        <div className="grid grid-cols-3 gap-2">
          {statusOptions.map(option => (
            <button
              key={option.value}
              onClick={() => {
                setField('status', option.value);
                if (option.value === 'retired' && !form.retiredDate) {
                  setField('retiredDate', todayString());
                }
              }}
              className={`choice-chip rounded-full ${form.status === option.value ? 'choice-chip-selected' : ''}`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {form.status === 'retired' && (
          <label className="field-label block">
            退役日期
            <input
              type="date"
              value={form.retiredDate ?? todayString()}
              onChange={e => setField('retiredDate', e.target.value || null)}
              className="form-input mt-1"
            />
          </label>
        )}
      </section>

      <section className="bg-white rounded-2xl p-3 space-y-2.5">
        <div>
          <h2 className="section-title">存量与现金流</h2>
          <p className="field-label mt-1">存量看净资产，流量只展示净现金流。</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="field-label">
            当前负债
            <input
              type="number"
              placeholder="贷款余额/负债余额"
              value={form.debtBalance || ''}
              onChange={e => setField('debtBalance', Number(e.target.value))}
              className="form-input mt-1"
            />
          </label>
          <label className="field-label">
            月收入
            <input
              type="number"
              placeholder="租金/分红/出租"
              value={form.monthlyIncome || ''}
              onChange={e => {
                const value = Number(e.target.value);
                setField('monthlyIncome', value);
                setField('hasIncome', value > 0);
              }}
              className="form-input mt-1"
            />
          </label>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <label className="field-label">
            月供
            <input
              type="number"
              placeholder="负现金流"
              value={form.monthlyPayment || ''}
              onChange={e => setField('monthlyPayment', Number(e.target.value))}
              className="form-input mt-1"
            />
          </label>
          <label className="field-label">
            月供开始
            <input
              type="date"
              value={form.paymentStartDate ?? ''}
              onChange={e => setField('paymentStartDate', e.target.value)}
              className="form-input mt-1"
            />
          </label>
          <label className="field-label">
            月供结束
            <input
              type="date"
              value={form.paymentEndDate ?? ''}
              onChange={e => setField('paymentEndDate', e.target.value)}
              className="form-input mt-1"
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="field-label">
            月维护
            <input
              type="number"
              placeholder="物业/保养"
              value={form.monthlyMaintenanceCost || ''}
              onChange={e => setField('monthlyMaintenanceCost', Number(e.target.value))}
              className="form-input mt-1"
            />
          </label>
          <label className="field-label">
            其他月成本
            <input
              type="number"
              placeholder="可不填"
              value={form.monthlyOtherCost || ''}
              onChange={e => setField('monthlyOtherCost', Number(e.target.value))}
              className="form-input mt-1"
            />
          </label>
        </div>
        <div className="summary-strip">
          <div>
            <span>净资产</span>
            <strong>{formatMoney(effectiveValue - Math.max(0, form.debtBalance ?? 0), 'CNY')}</strong>
          </div>
          <div>
            <span>月净现金流</span>
            <strong>{formatMoney((form.monthlyIncome ?? 0) - (form.monthlyPayment ?? 0) - (form.monthlyMaintenanceCost ?? 0) - (form.monthlyOtherCost ?? 0), 'CNY')}</strong>
          </div>
        </div>
        <label className="field-label block">
          说明
          <input
            placeholder="租金、月供、维护成本说明"
            value={form.costNote ?? ''}
            onChange={e => setField('costNote', e.target.value)}
            className="form-input mt-1"
          />
        </label>
      </section>

      <div className="form-action-bar sticky bottom-20 z-30 -mx-1 rounded-2xl p-2 backdrop-blur">
        <button
          onClick={handleSave}
          disabled={saving || !form.name.trim()}
          className="btn-accent w-full rounded-2xl py-4 text-base disabled:opacity-40 disabled:shadow-none"
        >
          {saving ? '保存中...' : '保存资产'}
        </button>
      </div>
    </div>
  );
}
