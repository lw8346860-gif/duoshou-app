import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAsset, useAssetMutations, useAssetAccessories, useAccessoryMutations, useCategories, useTags } from '../hooks/useLiveQuery';
import { v4 as uuidv4 } from 'uuid';
import type { Asset, Accessory, AssetStatus, LuxuryInfo, CarInfo, SubscriptionInfo } from '../types';
import { LUXURY_CATEGORIES, CAR_CATEGORY, SUBSCRIPTION_CATEGORY, ACCESSORY_TYPE_LABELS } from '../types';
import { calcUsedDays, formatMoney } from '../utils/calculations';
import CategoryIcon from '../components/CategoryIcon';

type FormData = Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>;

const emptyForm: FormData = {
  name: '',
  brand: '',
  model: '',
  spec: '',
  categoryId: 'cat-other',
  tagIds: [],
  purchasePrice: 0,
  currency: 'CNY',
  purchaseDate: new Date().toISOString().split('T')[0],
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

export default function AssetForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const existingAsset = useAsset(id);
  const existingAccessories = useAssetAccessories(id);
  const { add, update } = useAssetMutations();
  const { add: addAccessory, remove: removeAccessory } = useAccessoryMutations();
  const categories = useCategories();
  const tags = useTags();

  const [form, setForm] = useState<FormData>({ ...emptyForm });
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [newAccessory, setNewAccessory] = useState({ name: '', price: 0, type: 'accessory' as keyof typeof ACCESSORY_TYPE_LABELS, includedInCost: true });
  const [saving, setSaving] = useState(false);
  const [today] = useState(() => new Date());

  useEffect(() => {
    if (existingAsset) {
      const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = existingAsset;
      void _id;
      void _c;
      void _u;
      // Existing records are loaded from IndexedDB and mirrored into the editable form state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(rest);
      setAccessories(existingAccessories);
    }
  }, [existingAsset, existingAccessories]);

  const updateForm = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const isLuxury = LUXURY_CATEGORIES.includes(form.categoryId);
  const isCar = form.categoryId === CAR_CATEGORY;
  const isSubscription = form.categoryId === SUBSCRIPTION_CATEGORY;
  const includedAccessoryCost = accessories.filter(acc => acc.includedInCost).reduce((sum, acc) => sum + acc.price, 0);
  const expectedNetCost = Math.max(0, form.purchasePrice + includedAccessoryCost - form.expectedResidualValue);
  const impliedDailyCost = form.targetUseDays > 0 ? expectedNetCost / form.targetUseDays : 0;
  const usedDays = calcUsedDays(form.purchaseDate);
  const requiredTargetDays = form.targetDailyCost > 0 ? Math.ceil(expectedNetCost / form.targetDailyCost) : 0;
  const remainingTargetDays = Math.max(0, requiredTargetDays - usedDays);
  const estimatedTargetDate = remainingTargetDays > 0
    ? new Date(today.getTime() + remainingTargetDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    : '';

  const handleAddAccessory = () => {
    if (!newAccessory.name || newAccessory.price <= 0) return;
    const acc: Accessory = {
      id: uuidv4(),
      assetId: id ?? '',
      name: newAccessory.name,
      price: newAccessory.price,
      date: new Date().toISOString().split('T')[0],
      type: newAccessory.type,
      includedInCost: newAccessory.includedInCost,
      note: '',
    };
    setAccessories(prev => [...prev, acc]);
    setNewAccessory({ name: '', price: 0, type: 'accessory', includedInCost: true });
  };

  const handleRemoveAccessory = (accId: string) => {
    setAccessories(prev => prev.filter(a => a.id !== accId));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (form.purchasePrice < 0 || !form.purchaseDate || !form.categoryId) return;
    if (form.targetDailyCost < 0) return;
    if (form.status === 'sold' && (!form.soldDate || form.soldPrice == null || form.soldPrice < 0)) return;
    if (form.status === 'sold' && form.soldDate && form.soldDate < form.purchaseDate) return;
    if (form.status === 'retired' && form.retiredDate && form.retiredDate < form.purchaseDate) return;
    setSaving(true);
    try {
      if (id && existingAsset) {
        await update(id, form);
        // 处理新增的配件
        for (const acc of accessories) {
          const exists = existingAccessories.find(ea => ea.id === acc.id);
          if (!exists) {
            await addAccessory({ ...acc, assetId: id });
          }
        }
        // 处理删除的配件
        for (const oldAcc of existingAccessories) {
          if (!accessories.find(a => a.id === oldAcc.id)) {
            await removeAccessory(oldAcc.id);
          }
        }
      } else {
        const newId = await add(form);
        for (const acc of accessories) {
          await addAccessory({ ...acc, assetId: newId });
        }
      }
      navigate(-1);
    } finally {
      setSaving(false);
    }
  };

  const updateLuxury = (key: keyof LuxuryInfo, value: unknown) => {
    const info = form.luxuryInfo ?? {
      condition: '', hasBox: false, hasReceipt: false, hasWarrantyCard: false,
      hasCertificate: false, purchaseRegion: '', material: '', color: '',
      size: '', year: '', serialNumber: '', maintenanceRecord: '',
      authenticationOrg: '', isLimitedEdition: false, isSecondHand: false,
    };
    updateForm('luxuryInfo', { ...info, [key]: value });
  };

  const updateCar = (key: keyof CarInfo, value: unknown) => {
    const info = form.carInfo ?? {
      carBrand: '', carModel: '', modelYear: '', mileage: 0,
      energyType: 'fuel' as const, purchaseType: 'new' as const,
      insuranceExpiry: '', inspectionExpiry: '', licensePlate: '',
      hasLoan: false, monthlyPayment: 0, loanBalance: 0, loanInfo: '',
    };
    updateForm('carInfo', { ...info, [key]: value });
  };

  const updateSubscription = (key: keyof SubscriptionInfo, value: unknown) => {
    const info = form.subscriptionInfo ?? {
      startDate: '', endDate: '', cycleType: 'monthly' as const,
      autoRenew: false, renewPrice: 0, renewCycle: '', expiryReminder: false,
    };
    updateForm('subscriptionInfo', { ...info, [key]: value });
  };

  const updatePostmortem = (changes: Partial<NonNullable<FormData['postmortem']>>) => {
    updateForm('postmortem', {
      wouldBuyAgain: form.postmortem?.wouldBuyAgain ?? '',
      biggestMistake: form.postmortem?.biggestMistake ?? '',
      worthIt: form.postmortem?.worthIt ?? '',
      finalVerdict: form.postmortem?.finalVerdict ?? form.postmortem?.worthIt ?? '',
      advice: form.postmortem?.advice ?? '',
      adviceToPastSelf: form.postmortem?.adviceToPastSelf ?? form.postmortem?.advice ?? '',
      satisfaction: form.postmortem?.satisfaction ?? null,
      ...changes,
    });
  };

  return (
    <div className="space-y-4 pb-8">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-sm text-[#8E8E93]">← 返回</button>
        <h1 className="text-lg font-bold text-[#1D1D1F]">{id ? '编辑资产' : '新增资产'}</h1>
        <button
          onClick={handleSave}
          disabled={saving || !form.name.trim()}
          className="btn-primary px-5 py-2.5 rounded-xl text-sm disabled:opacity-40 disabled:shadow-none"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>

      {/* 模块1: 基础信息 */}
      <section className="bg-white rounded-2xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-[#1D1D1F]">基础信息</h2>
        <input
          placeholder="名称 *"
          value={form.name}
          onChange={e => updateForm('name', e.target.value)}
          className="w-full bg-[#F5F5F3] rounded-xl px-4 py-2.5 text-sm outline-none"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            placeholder="品牌"
            value={form.brand}
            onChange={e => updateForm('brand', e.target.value)}
            className="bg-[#F5F5F3] rounded-xl px-4 py-2.5 text-sm outline-none"
          />
          <input
            placeholder="型号"
            value={form.model}
            onChange={e => updateForm('model', e.target.value)}
            className="bg-[#F5F5F3] rounded-xl px-4 py-2.5 text-sm outline-none"
          />
        </div>
        <input
          placeholder="规格"
          value={form.spec}
          onChange={e => updateForm('spec', e.target.value)}
          className="w-full bg-[#F5F5F3] rounded-xl px-4 py-2.5 text-sm outline-none"
        />
      </section>

      {/* 模块2: 价格日期 */}
      <section className="bg-white rounded-2xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-[#1D1D1F]">价格日期</h2>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-[#8E8E93]">购买价格</label>
            <input
              type="number"
              placeholder="0"
              value={form.purchasePrice || ''}
              onChange={e => updateForm('purchasePrice', Number(e.target.value))}
              className="w-full bg-[#F5F5F3] rounded-xl px-4 py-2.5 text-sm outline-none mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-[#8E8E93]">货币</label>
            <select
              value={form.currency}
              onChange={e => updateForm('currency', e.target.value)}
              className="w-full bg-[#F5F5F3] rounded-xl px-4 py-2.5 text-sm outline-none mt-1"
            >
              <option value="CNY">CNY ¥</option>
              <option value="USD">USD $</option>
              <option value="EUR">EUR €</option>
              <option value="JPY">JPY ¥</option>
              <option value="GBP">GBP £</option>
              <option value="HKD">HKD $</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-[#8E8E93]">购买日期</label>
            <input
              type="date"
              value={form.purchaseDate}
              onChange={e => updateForm('purchaseDate', e.target.value)}
              className="w-full bg-[#F5F5F3] rounded-xl px-4 py-2.5 text-sm outline-none mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-[#8E8E93]">购买渠道</label>
            <input
              placeholder="如：京东、淘宝"
              value={form.purchaseChannel}
              onChange={e => updateForm('purchaseChannel', e.target.value)}
              className="w-full bg-[#F5F5F3] rounded-xl px-4 py-2.5 text-sm outline-none mt-1"
            />
          </div>
        </div>
      </section>

      {/* 模块3: 分类标签 */}
      <section className="bg-white rounded-2xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-[#1D1D1F]">分类标签</h2>
        <div>
          <label className="text-xs text-[#8E8E93]">分类</label>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => updateForm('categoryId', cat.id)}
                className={`choice-chip px-3 py-1.5 rounded-full text-xs transition-colors ${
                  form.categoryId === cat.id ? 'choice-chip-selected' : ''
                }`}
              >
                <CategoryIcon category={cat} /> {cat.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-[#8E8E93]">标签</label>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map(tag => {
              const selected = form.tagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => {
                    updateForm('tagIds', selected
                      ? form.tagIds.filter(t => t !== tag.id)
                      : [...form.tagIds, tag.id]
                    );
                  }}
                  className={`tag-chip px-3 py-1.5 rounded-full text-xs transition-colors inline-flex items-center gap-1.5 ${selected ? 'tag-chip-selected' : ''}`}
                >
                  <span className="tag-color-dot" style={{ backgroundColor: tag.color }} />
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 模块4: 估值目标 */}
      <section className="bg-white rounded-2xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-[#1D1D1F]">估值目标</h2>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-[#8E8E93]">当前估值</label>
            <input
              type="number"
              placeholder="0"
              value={form.currentValue || ''}
              onChange={e => updateForm('currentValue', Number(e.target.value))}
              className="w-full bg-[#F5F5F3] rounded-xl px-4 py-2.5 text-sm outline-none mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-[#8E8E93]">预期残值</label>
            <input
              type="number"
              placeholder="0"
              value={form.expectedResidualValue || ''}
              onChange={e => updateForm('expectedResidualValue', Number(e.target.value))}
              className="w-full bg-[#F5F5F3] rounded-xl px-4 py-2.5 text-sm outline-none mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-[#8E8E93]">目标日均成本</label>
            <input
              type="number"
              placeholder="0"
              value={form.targetDailyCost || ''}
              onChange={e => updateForm('targetDailyCost', Number(e.target.value))}
              className="w-full bg-[#F5F5F3] rounded-xl px-4 py-2.5 text-sm outline-none mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-[#8E8E93]">目标使用天数</label>
            <input
              type="number"
              placeholder="0"
              value={form.targetUseDays || ''}
              onChange={e => updateForm('targetUseDays', Number(e.target.value))}
              className="w-full bg-[#F5F5F3] rounded-xl px-4 py-2.5 text-sm outline-none mt-1"
            />
          </div>
        </div>
        <div className="surface-ink rounded-2xl p-4">
          <div className="text-xs text-white/60 mb-3">目标测算</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] text-white/50">按预期周期</div>
              <div className="text-lg font-bold">
                {form.targetUseDays > 0 ? `${formatMoney(impliedDailyCost, form.currency)}/天` : '填使用天数'}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-white/50">按目标日均</div>
              <div className="text-lg font-bold">
                {form.targetDailyCost > 0 ? `${requiredTargetDays} 天` : '填日均目标'}
              </div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-white/10 pt-3">
            <div>
              <div className="text-[10px] text-white/50">当前净成本</div>
              <div className="text-sm font-semibold">{formatMoney(expectedNetCost, form.currency)}</div>
            </div>
            <div>
              <div className="text-[10px] text-white/50">还需使用</div>
              <div className="text-sm font-semibold">
                {form.targetDailyCost > 0 ? (remainingTargetDays <= 0 ? '已达标' : `${remainingTargetDays} 天`) : '-'}
              </div>
            </div>
          </div>
          {estimatedTargetDate && (
            <div className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-xs">
              如果目标日均为 {formatMoney(form.targetDailyCost, form.currency)}/天，预计需要用到 {estimatedTargetDate}。
            </div>
          )}
        </div>
      </section>

      {/* 模块5: 使用状态 */}
      <section className="bg-white rounded-2xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-[#1D1D1F]">使用状态</h2>
        <div className="flex flex-wrap gap-1.5">
          {(['active', 'idle', 'retired', 'sold', 'discarded'] as AssetStatus[]).map(s => (
            <button
              key={s}
              onClick={() => updateForm('status', s)}
              className={`choice-chip px-3 py-1.5 rounded-full text-xs transition-colors ${
                form.status === s ? 'choice-chip-selected' : ''
              }`}
            >
              {s === 'active' ? '服役中' : s === 'idle' ? '闲置' : s === 'retired' ? '已退役' : s === 'sold' ? '已卖出' : '已丢弃'}
            </button>
          ))}
        </div>
        {form.status === 'sold' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-[#8E8E93]">卖出价格</label>
              <input
                type="number"
                value={form.soldPrice ?? ''}
                onChange={e => updateForm('soldPrice', Number(e.target.value) || null)}
                className="w-full bg-[#F5F5F3] rounded-xl px-4 py-2.5 text-sm outline-none mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-[#8E8E93]">卖出渠道</label>
              <input
                value={form.soldChannel ?? ''}
                onChange={e => updateForm('soldChannel', e.target.value || null)}
                className="w-full bg-[#F5F5F3] rounded-xl px-4 py-2.5 text-sm outline-none mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-[#8E8E93]">卖出日期</label>
              <input
                type="date"
                value={form.soldDate ?? ''}
                onChange={e => updateForm('soldDate', e.target.value || null)}
                className="w-full bg-[#F5F5F3] rounded-xl px-4 py-2.5 text-sm outline-none mt-1"
              />
            </div>
          </div>
        )}
        {form.status === 'retired' && (
          <div>
            <label className="text-xs text-[#8E8E93]">退役日期</label>
            <input
              type="date"
              value={form.retiredDate ?? ''}
              onChange={e => updateForm('retiredDate', e.target.value || null)}
              className="w-full bg-[#F5F5F3] rounded-xl px-4 py-2.5 text-sm outline-none mt-1"
            />
          </div>
        )}
        {form.status === 'discarded' && (
          <div>
            <label className="text-xs text-[#8E8E93]">丢弃日期</label>
            <input
              type="date"
              value={form.discardedDate ?? ''}
              onChange={e => updateForm('discardedDate', e.target.value || null)}
              className="w-full bg-[#F5F5F3] rounded-xl px-4 py-2.5 text-sm outline-none mt-1"
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="excludeTotal"
            checked={form.isExcludedFromTotal}
            onChange={e => updateForm('isExcludedFromTotal', e.target.checked)}
            className="rounded"
          />
          <label htmlFor="excludeTotal" className="text-xs text-[#8E8E93]">从总投入中排除</label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="excludeDaily"
            checked={form.isExcludedFromDailyAverage}
            onChange={e => updateForm('isExcludedFromDailyAverage', e.target.checked)}
            className="rounded"
          />
          <label htmlFor="excludeDaily" className="text-xs text-[#8E8E93]">从日均成本中排除</label>
        </div>
      </section>

      {/* 模块6: 附加成本 */}
      <section className="bg-white rounded-2xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-[#1D1D1F]">附加成本</h2>
        {accessories.map(acc => (
          <div key={acc.id} className="flex items-center justify-between bg-[#F5F5F3] rounded-xl px-3 py-2">
            <div>
              <div className="text-sm text-[#1D1D1F]">{acc.name}</div>
              <div className="text-[10px] text-[#8E8E93]">
                {ACCESSORY_TYPE_LABELS[acc.type]} · ¥{acc.price} · {acc.includedInCost ? '计入成本' : '不计入'}
              </div>
            </div>
            <button onClick={() => handleRemoveAccessory(acc.id)} className="text-[#1D1D1F] text-sm">删除</button>
          </div>
        ))}
        <div className="flex gap-2">
          <input
            placeholder="名称"
            value={newAccessory.name}
            onChange={e => setNewAccessory(p => ({ ...p, name: e.target.value }))}
            className="flex-1 bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none"
          />
          <input
            type="number"
            placeholder="价格"
            value={newAccessory.price || ''}
            onChange={e => setNewAccessory(p => ({ ...p, price: Number(e.target.value) }))}
            className="w-20 bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none"
          />
          <button
            onClick={handleAddAccessory}
            className="btn-primary px-3 py-2 rounded-xl text-xs"
          >
            添加
          </button>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="includedInCost"
            checked={newAccessory.includedInCost}
            onChange={e => setNewAccessory(p => ({ ...p, includedInCost: e.target.checked }))}
          />
          <label htmlFor="includedInCost" className="text-xs text-[#8E8E93]">计入总成本</label>
        </div>
      </section>

      {/* 模块7: 扩展字段 */}
      {isLuxury && (
        <section className="bg-white rounded-2xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-[#1D1D1F]">奢侈品信息</h2>
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="成色" value={form.luxuryInfo?.condition ?? ''} onChange={e => updateLuxury('condition', e.target.value)} className="bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none" />
            <input placeholder="材质" value={form.luxuryInfo?.material ?? ''} onChange={e => updateLuxury('material', e.target.value)} className="bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none" />
            <input placeholder="颜色" value={form.luxuryInfo?.color ?? ''} onChange={e => updateLuxury('color', e.target.value)} className="bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none" />
            <input placeholder="尺寸" value={form.luxuryInfo?.size ?? ''} onChange={e => updateLuxury('size', e.target.value)} className="bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none" />
            <input placeholder="购买地区" value={form.luxuryInfo?.purchaseRegion ?? ''} onChange={e => updateLuxury('purchaseRegion', e.target.value)} className="bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none" />
            <input placeholder="鉴定机构" value={form.luxuryInfo?.authenticationOrg ?? ''} onChange={e => updateLuxury('authenticationOrg', e.target.value)} className="bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none" />
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { key: 'hasBox' as const, label: '有盒' },
              { key: 'hasReceipt' as const, label: '有票' },
              { key: 'hasWarrantyCard' as const, label: '有保卡' },
              { key: 'isLimitedEdition' as const, label: '限量' },
              { key: 'isSecondHand' as const, label: '二手' },
            ].map(item => (
              <label key={item.key} className="flex items-center gap-1 text-xs text-[#8E8E93]">
                <input
                  type="checkbox"
                  checked={form.luxuryInfo?.[item.key] ?? false}
                  onChange={e => updateLuxury(item.key, e.target.checked)}
                />
                {item.label}
              </label>
            ))}
          </div>
        </section>
      )}

      {isCar && (
        <section className="bg-white rounded-2xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-[#1D1D1F]">汽车信息</h2>
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="品牌" value={form.carInfo?.carBrand ?? ''} onChange={e => updateCar('carBrand', e.target.value)} className="bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none" />
            <input placeholder="车型" value={form.carInfo?.carModel ?? ''} onChange={e => updateCar('carModel', e.target.value)} className="bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none" />
            <input placeholder="年款" value={form.carInfo?.modelYear ?? ''} onChange={e => updateCar('modelYear', e.target.value)} className="bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none" />
            <input type="number" placeholder="里程(km)" value={form.carInfo?.mileage ?? ''} onChange={e => updateCar('mileage', Number(e.target.value))} className="bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none" />
            <input placeholder="车牌" value={form.carInfo?.licensePlate ?? ''} onChange={e => updateCar('licensePlate', e.target.value)} className="bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none" />
            <input type="date" value={form.carInfo?.insuranceExpiry ?? ''} onChange={e => updateCar('insuranceExpiry', e.target.value)} className="bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none" />
            <input type="date" value={form.carInfo?.inspectionExpiry ?? ''} onChange={e => updateCar('inspectionExpiry', e.target.value)} className="bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none" />
            <select value={form.carInfo?.energyType ?? 'fuel'} onChange={e => updateCar('energyType', e.target.value)} className="bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none">
              <option value="fuel">燃油</option>
              <option value="electric">纯电</option>
              <option value="hybrid">混动</option>
              <option value="range-extended">增程</option>
            </select>
            <select value={form.carInfo?.purchaseType ?? 'new'} onChange={e => updateCar('purchaseType', e.target.value)} className="bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none">
              <option value="new">新车</option>
              <option value="used">二手车</option>
            </select>
            <input type="number" placeholder="月供" value={form.carInfo?.monthlyPayment || ''} onChange={e => updateCar('monthlyPayment', Number(e.target.value))} className="bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none" />
            <input type="number" placeholder="贷款余额" value={form.carInfo?.loanBalance || ''} onChange={e => updateCar('loanBalance', Number(e.target.value))} className="bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none" />
          </div>
        </section>
      )}

      {isSubscription && (
        <section className="bg-white rounded-2xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-[#1D1D1F]">订阅信息</h2>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-[#8E8E93]">开始日期</label>
              <input type="date" value={form.subscriptionInfo?.startDate ?? ''} onChange={e => updateSubscription('startDate', e.target.value)} className="w-full bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none mt-1" />
            </div>
            <div>
              <label className="text-xs text-[#8E8E93]">结束日期</label>
              <input type="date" value={form.subscriptionInfo?.endDate ?? ''} onChange={e => updateSubscription('endDate', e.target.value)} className="w-full bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none mt-1" />
            </div>
            <select value={form.subscriptionInfo?.cycleType ?? 'monthly'} onChange={e => updateSubscription('cycleType', e.target.value)} className="bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none">
              <option value="monthly">月付</option>
              <option value="quarterly">季付</option>
              <option value="yearly">年付</option>
              <option value="one-time">一次性</option>
            </select>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.subscriptionInfo?.autoRenew ?? false} onChange={e => updateSubscription('autoRenew', e.target.checked)} />
              <span className="text-xs text-[#8E8E93]">自动续费</span>
            </div>
            <input type="number" placeholder="续费金额" value={form.subscriptionInfo?.renewPrice || ''} onChange={e => updateSubscription('renewPrice', Number(e.target.value))} className="bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none" />
            <input placeholder="续费周期" value={form.subscriptionInfo?.renewCycle ?? ''} onChange={e => updateSubscription('renewCycle', e.target.value)} className="bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none" />
          </div>
        </section>
      )}

      {(form.status === 'sold' || form.status === 'retired' || form.status === 'discarded') && (
        <section className="bg-white rounded-2xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-[#1D1D1F]">消费复盘</h2>
          <textarea
            placeholder="如果重来一次，你还会买吗？"
            value={form.postmortem?.wouldBuyAgain ?? ''}
            onChange={e => updatePostmortem({ wouldBuyAgain: e.target.value })}
            rows={2}
            className="w-full bg-[#F5F5F3] rounded-xl px-4 py-2.5 text-sm outline-none resize-none"
          />
          <textarea
            placeholder="这次购买最大的错误是什么？"
            value={form.postmortem?.biggestMistake ?? ''}
            onChange={e => updatePostmortem({ biggestMistake: e.target.value })}
            rows={2}
            className="w-full bg-[#F5F5F3] rounded-xl px-4 py-2.5 text-sm outline-none resize-none"
          />
          <textarea
            placeholder="这件东西最终值不值？"
            value={form.postmortem?.finalVerdict ?? form.postmortem?.worthIt ?? ''}
            onChange={e => updatePostmortem({ finalVerdict: e.target.value, worthIt: e.target.value })}
            rows={2}
            className="w-full bg-[#F5F5F3] rounded-xl px-4 py-2.5 text-sm outline-none resize-none"
          />
          <textarea
            placeholder="给当时的自己一句建议"
            value={form.postmortem?.adviceToPastSelf ?? form.postmortem?.advice ?? ''}
            onChange={e => updatePostmortem({ adviceToPastSelf: e.target.value, advice: e.target.value })}
            rows={2}
            className="w-full bg-[#F5F5F3] rounded-xl px-4 py-2.5 text-sm outline-none resize-none"
          />
          <select
            value={form.postmortem?.satisfaction ?? ''}
            onChange={e => updatePostmortem({ satisfaction: e.target.value ? Number(e.target.value) : null })}
            className="w-full bg-[#F5F5F3] rounded-xl px-4 py-2.5 text-sm outline-none"
          >
            <option value="">满意度评分</option>
            <option value="1">1 分</option>
            <option value="2">2 分</option>
            <option value="3">3 分</option>
            <option value="4">4 分</option>
            <option value="5">5 分</option>
          </select>
        </section>
      )}

      {/* 模块8: 备注图片 */}
      <section className="bg-white rounded-2xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-[#1D1D1F]">备注图片</h2>
        <textarea
          placeholder="备注..."
          value={form.note}
          onChange={e => updateForm('note', e.target.value)}
          rows={3}
          className="w-full bg-[#F5F5F3] rounded-xl px-4 py-2.5 text-sm outline-none resize-none"
        />
        <input
          placeholder="图片URL"
          value={form.imageUri ?? ''}
          onChange={e => updateForm('imageUri', e.target.value || null)}
          className="w-full bg-[#F5F5F3] rounded-xl px-4 py-2.5 text-sm outline-none"
        />
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
