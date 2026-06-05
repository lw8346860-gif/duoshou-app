import { useNavigate } from 'react-router-dom';
import { useWishlistItems, useWishlistMutations, useAssetMutations } from '../hooks/useLiveQuery';
import { calcWishlistDays, calcImpulseLevel, formatMoney, formatDays } from '../utils/calculations';
import type { WishlistItem } from '../types';
import { WISHLIST_STATUS_LABELS } from '../types';

function WishlistCard({ item, onConvert, onDelete, onClick }: {
  item: WishlistItem;
  onConvert: (item: WishlistItem) => void;
  onDelete: (id: string) => void;
  onClick: () => void;
}) {
  const days = calcWishlistDays(item.expectedPrice, 0, item.targetDailyCost);
  const impulse = calcImpulseLevel(item.cooldownDays, item.expectedPrice);

  return (
    <div onClick={onClick} className="bg-white rounded-2xl p-4 space-y-3 cursor-pointer active:bg-[#FAFAFA]">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#1D1D1F] truncate">{item.name}</span>
            <span className="notice-pill text-[10px] px-1.5 py-0.5 rounded-full inline-flex items-center gap-1">
              <span className="notice-dot" />
              {impulse}
            </span>
          </div>
        </div>
        <span className="status-pill text-[10px] px-2 py-0.5 rounded-full">
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

      {item.status === 'watching' && (
        <div className="flex gap-2">
          <button
            onClick={e => { e.stopPropagation(); onConvert(item); }}
            className="flex-1 bg-[#B7F23A] text-[#111111] py-2 rounded-xl text-xs font-semibold"
          >
            转为资产
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(item.id); }}
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
  const { update, remove } = useWishlistMutations();
  const { add: addAsset } = useAssetMutations();
  const navigate = useNavigate();

  const handleConvert = async (item: WishlistItem) => {
    const assetId = await addAsset({
      name: item.name,
      brand: '',
      model: '',
      spec: '',
      categoryId: item.categoryId,
      tagIds: item.tagIds,
      purchasePrice: item.expectedPrice,
      currency: item.currency,
      purchaseDate: new Date().toISOString().split('T')[0],
      purchaseChannel: '',
      currentValue: 0,
      expectedResidualValue: 0,
      targetDailyCost: item.targetDailyCost,
      targetUseDays: calcWishlistDays(item.expectedPrice, 0, item.targetDailyCost),
      status: 'active',
      lastUsedDate: '',
      useCount: 0,
      retiredDate: null,
      soldDate: null,
      soldPrice: null,
      soldChannel: null,
      discardedDate: null,
      imageUri: item.imageUri,
      note: '',
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

  const handleRemove = async (id: string) => {
    await remove(id);
  };

  const watchingItems = items.filter(i => i.status === 'watching');
  const otherItems = items.filter(i => i.status !== 'watching');

  return (
    <div className="px-4 pt-12 pb-4 space-y-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[#1D1D1F]">心愿列表</h1>
        <p className="text-xs text-[#8E8E93] mt-1">先放进来，等冲动降温再决定。</p>
      </div>

      {/* 观望中的心愿 */}
      {watchingItems.length > 0 && (
        <div className="space-y-3">
          {watchingItems.map(item => (
            <WishlistCard
              key={item.id}
              item={item}
              onConvert={handleConvert}
              onDelete={handleDelete}
              onClick={() => navigate(`/wishlist/${item.id}`)}
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
              <div key={item.id} className="swipe-row">
                <div className="swipe-content bg-white rounded-2xl p-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-[#1D1D1F]">{item.name}</div>
                    <div className="text-[10px] text-[#8E8E93]">{formatMoney(item.expectedPrice, item.currency)}</div>
                  </div>
                  <span className="status-pill text-[10px] px-2 py-0.5 rounded-full">
                    {WISHLIST_STATUS_LABELS[item.status]}
                  </span>
                </div>
                <button onClick={() => handleRemove(item.id)} className="swipe-delete">删除</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="bg-white rounded-3xl p-8 text-center">
          <div className="wish-empty-icon mx-auto mb-3" aria-hidden="true" />
          <div className="text-sm font-bold text-[#1D1D1F]">心愿还空着</div>
          <button onClick={() => navigate('/wishlist/new')} className="btn-secondary mt-4 px-4 py-2 rounded-xl text-xs">
            添加心愿
          </button>
        </div>
      )}
    </div>
  );
}
