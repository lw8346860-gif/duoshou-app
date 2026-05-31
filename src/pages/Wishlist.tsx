import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWishlistItems, useWishlistMutations, useAssetMutations, useCategories, useTags } from '../hooks/useLiveQuery';
import { calcWishlistDays, calcImpulseLevel, formatMoney, formatDays } from '../utils/calculations';
import type { WishlistItem } from '../types';
import { WISHLIST_STATUS_LABELS } from '../types';

function WishlistCard({ item, onConvert, onDelete }: {
  item: WishlistItem;
  onConvert: (item: WishlistItem) => void;
  onDelete: (id: string) => void;
}) {
  const days = calcWishlistDays(item.expectedPrice, item.expectedResidualValue, item.targetDailyCost);
  const impulse = calcImpulseLevel(item.cooldownDays, item.expectedPrice);

  const impulseColors: Record<string, string> = {
    '危险': '#FF4D4F',
    '观察': '#faad14',
    '冷静中': '#1890ff',
    '冷静': '#52c41a',
    '非常冷静': '#52c41a',
  };

  return (
    <div className="bg-white rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#1D1D1F] truncate">{item.name}</span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: (impulseColors[impulse] ?? '#8E8E93') + '20',
                color: impulseColors[impulse] ?? '#8E8E93',
              }}
            >
              {impulse}
            </span>
          </div>
          <div className="text-xs text-[#8E8E93] mt-0.5">
            {item.brand && `${item.brand} · `}{item.model}
          </div>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
          item.status === 'watching' ? 'bg-blue-50 text-blue-600' :
          item.status === 'decided' ? 'bg-yellow-50 text-yellow-600' :
          item.status === 'abandoned' ? 'bg-gray-100 text-gray-500' :
          'bg-green-50 text-green-600'
        }`}>
          {WISHLIST_STATUS_LABELS[item.status]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-[#F5F5F3] rounded-xl p-2">
          <div className="font-semibold text-[#1D1D1F]">{formatMoney(item.expectedPrice, item.currency)}</div>
          <div className="text-[#8E8E93]">预期价格</div>
        </div>
        {days > 0 && (
          <div className="bg-[#F5F5F3] rounded-xl p-2">
            <div className="font-semibold text-[#1D1D1F]">{formatDays(days)}</div>
            <div className="text-[#8E8E93]">需要使用</div>
          </div>
        )}
      </div>

      {item.reason && (
        <div className="text-xs text-[#8E8E93] bg-[#F5F5F3] rounded-xl p-2">
          理由：{item.reason}
        </div>
      )}

      {item.status === 'watching' && (
        <div className="flex gap-2">
          <button
            onClick={() => onConvert(item)}
            className="flex-1 bg-[#B7F23A] text-[#111111] py-2 rounded-xl text-xs font-semibold"
          >
            转为资产
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="px-3 py-2 rounded-xl text-xs text-[#8E8E93] bg-[#F5F5F3]"
          >
            放弃
          </button>
        </div>
      )}
    </div>
  );
}

export default function Wishlist() {
  const items = useWishlistItems();
  const categories = useCategories();
  const { add, update } = useWishlistMutations();
  const { add: addAsset } = useAssetMutations();
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', brand: '', model: '', categoryId: '',
    expectedPrice: 0, currency: 'CNY', expectedResidualValue: 0,
    targetDailyCost: 0, expectedUseYears: 1, reason: '',
    cooldownDays: 0, desireLevel: 3, note: '', tagIds: [] as string[],
  });

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    await add({
      ...form,
      status: 'watching',
      imageUri: null,
    });
    setForm({ name: '', brand: '', model: '', categoryId: '', expectedPrice: 0, currency: 'CNY', expectedResidualValue: 0, targetDailyCost: 0, expectedUseYears: 1, reason: '', cooldownDays: 0, desireLevel: 3, note: '', tagIds: [] });
    setShowForm(false);
  };

  const handleConvert = async (item: WishlistItem) => {
    const assetId = await addAsset({
      name: item.name,
      brand: item.brand,
      model: item.model,
      spec: '',
      categoryId: item.categoryId,
      tagIds: item.tagIds,
      purchasePrice: item.expectedPrice,
      currency: item.currency,
      purchaseDate: new Date().toISOString().split('T')[0],
      purchaseChannel: '',
      currentValue: 0,
      expectedResidualValue: item.expectedResidualValue,
      targetDailyCost: item.targetDailyCost,
      targetUseDays: 0,
      status: 'active',
      lastUsedDate: '',
      useCount: 0,
      retiredDate: null,
      soldDate: null,
      soldPrice: null,
      soldChannel: null,
      discardedDate: null,
      imageUri: item.imageUri,
      note: item.note,
      isExcludedFromTotal: false,
      isExcludedFromDailyAverage: false,
      luxuryInfo: null,
      carInfo: null,
      subscriptionInfo: null,
      postmortem: null,
    });
    await update(item.id, { status: 'converted' });
    navigate(`/assets/${assetId}`);
  };

  const handleDelete = async (id: string) => {
    await update(id, { status: 'abandoned' });
  };

  const watchingItems = items.filter(i => i.status === 'watching');
  const otherItems = items.filter(i => i.status !== 'watching');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#1D1D1F]">心愿清单</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#111111] text-white px-3 py-1.5 rounded-full text-xs"
        >
          + 新心愿
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-4 space-y-3">
          <input
            placeholder="名称 *"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            className="w-full bg-[#F5F5F3] rounded-xl px-4 py-2.5 text-sm outline-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="品牌"
              value={form.brand}
              onChange={e => setForm(p => ({ ...p, brand: e.target.value }))}
              className="bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none"
            />
            <input
              placeholder="型号"
              value={form.model}
              onChange={e => setForm(p => ({ ...p, model: e.target.value }))}
              className="bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-[#8E8E93]">预期价格</label>
              <input
                type="number"
                value={form.expectedPrice || ''}
                onChange={e => setForm(p => ({ ...p, expectedPrice: Number(e.target.value) }))}
                className="w-full bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-[#8E8E93]">预期残值</label>
              <input
                type="number"
                value={form.expectedResidualValue || ''}
                onChange={e => setForm(p => ({ ...p, expectedResidualValue: Number(e.target.value) }))}
                className="w-full bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-[#8E8E93]">目标日均成本</label>
              <input
                type="number"
                value={form.targetDailyCost || ''}
                onChange={e => setForm(p => ({ ...p, targetDailyCost: Number(e.target.value) }))}
                className="w-full bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-[#8E8E93]">冷静天数</label>
              <input
                type="number"
                value={form.cooldownDays || ''}
                onChange={e => setForm(p => ({ ...p, cooldownDays: Number(e.target.value) }))}
                className="w-full bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none mt-1"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-[#8E8E93]">分类</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setForm(p => ({ ...p, categoryId: cat.id }))}
                  className={`px-2 py-1 rounded-full text-[10px] ${
                    form.categoryId === cat.id ? 'bg-[#111111] text-white' : 'bg-[#F5F5F3] text-[#1D1D1F]'
                  }`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>
          <textarea
            placeholder="购买理由..."
            value={form.reason}
            onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
            rows={2}
            className="w-full bg-[#F5F5F3] rounded-xl px-4 py-2.5 text-sm outline-none resize-none"
          />
          <button
            onClick={handleAdd}
            disabled={!form.name.trim()}
            className="w-full bg-[#B7F23A] text-[#111111] py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
          >
            添加心愿
          </button>
        </div>
      )}

      {/* 观望中的心愿 */}
      {watchingItems.length > 0 && (
        <div className="space-y-3">
          {watchingItems.map(item => (
            <WishlistCard
              key={item.id}
              item={item}
              onConvert={handleConvert}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* 已处理的心愿 */}
      {otherItems.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[#8E8E93] mb-2">历史记录</h2>
          <div className="space-y-2">
            {otherItems.map(item => (
              <div key={item.id} className="bg-white rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm text-[#1D1D1F]">{item.name}</div>
                  <div className="text-[10px] text-[#8E8E93]">{formatMoney(item.expectedPrice, item.currency)}</div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  item.status === 'converted' ? 'bg-green-50 text-green-600' :
                  item.status === 'abandoned' ? 'bg-gray-100 text-gray-500' :
                  'bg-yellow-50 text-yellow-600'
                }`}>
                  {WISHLIST_STATUS_LABELS[item.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && !showForm && (
        <div className="bg-white rounded-2xl p-8 text-center">
          <div className="text-3xl mb-2">💝</div>
          <div className="text-sm text-[#8E8E93]">还没有心愿，点击「+ 新心愿」添加</div>
        </div>
      )}
    </div>
  );
}
