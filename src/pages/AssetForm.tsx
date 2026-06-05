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
  expectedResidualValue: 0,
  targetDailyCost: 0,
  targetUseDays: 0,
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
    () => estimateDepreciatedValue(form.purchasePrice, form.purchaseDate),
    [form.purchasePrice, form.purchaseDate],
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
      expectedResidualValue: 0,
      targetDailyCost: Number.isFinite(targetDailyCost) ? Number(targetDailyCost.toFixed(2)) : 0,
      targetUseDays: Number.isFinite(targetUseDays) ? Math.max(0, Math.ceil(targetUseDays)) : 0,
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
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="back-button">←</button>
        <h1 className="text-base font-bold text-[#1D1D1F]">{id ? '编辑资产' : '新增资产'}</h1>
        <div className="w-10" />
      </div>

      <section className="bg-white rounded-2xl p-3 space-y-2.5">
        <label className="field-label">名称</label>
        <input
          placeholder="例如 Mac mini、Model 3、腕表"
          value={form.name}
          onChange={e => setField('name', e.target.value)}
          className="form-input"
        />
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
            日均成本
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
        </div>
        <div className="summary-strip">
          <div>
            <span>估值</span>
            <strong>{formatMoney(effectiveValue, 'CNY')}</strong>
          </div>
          <div>
            <span>{manualValue ? '手动填写' : '按年 30% 折旧'}</span>
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
