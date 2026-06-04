import { useNavigate, useParams } from 'react-router-dom';
import { useAssetMutations, useCategories, useWishlistItems, useWishlistMutations } from '../hooks/useLiveQuery';
import { calcImpulseLevel, calcWishlistDays, formatDays, formatMoney } from '../utils/calculations';
import CategoryIcon from '../components/CategoryIcon';

export default function WishlistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const items = useWishlistItems();
  const item = items.find(entry => entry.id === id);
  const categories = useCategories();
  const { update } = useWishlistMutations();
  const { add: addAsset } = useAssetMutations();

  if (!item) {
    return (
      <div className="text-center py-20">
        <div className="text-sm text-[#8E8E93]">心愿不存在</div>
      </div>
    );
  }

  const category = categories.find(cat => cat.id === item.categoryId);
  const requiredDays = calcWishlistDays(item.expectedPrice, 0, item.targetDailyCost);
  const expectedUseDays = Math.max(1, Math.round(item.expectedUseYears * 365));
  const expectedDaily = item.expectedPrice / expectedUseDays;
  const impulse = calcImpulseLevel(item.cooldownDays, item.expectedPrice + (item.desireLevel >= 5 ? 5001 : 0));

  const handleConvert = async () => {
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
      targetUseDays: requiredDays,
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

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="back-button">←</button>
        <h1 className="text-lg font-bold text-[#1D1D1F] truncate px-2">{item.name}</h1>
        <button onClick={() => navigate(`/wishlist/${item.id}/edit`)} className="text-sm text-[#1D1D1F] font-semibold">编辑</button>
      </div>

      <section className="bg-white rounded-3xl p-5 text-center">
        <div className="w-20 h-20 bg-[#F5F5F3] rounded-2xl flex items-center justify-center text-4xl mx-auto mb-3">
          <CategoryIcon category={category} />
        </div>
        <div className="text-xl font-bold text-[#1D1D1F]">{item.name}</div>
        <div className="notice-pill inline-flex items-center gap-1 mt-3 px-3 py-1 rounded-full text-xs"><span className="notice-dot" />{impulse}</div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Metric label="预计价格" value={formatMoney(item.expectedPrice, item.currency)} />
        <Metric label="需要使用" value={requiredDays > 0 ? formatDays(requiredDays) : '未设置目标'} />
        <Metric label="预计日均" value={formatMoney(expectedDaily, item.currency)} />
        <Metric label="目标日期" value={item.targetDate || '未设置'} />
      </section>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={handleConvert} className="btn-primary py-3 rounded-xl text-sm">
          转为资产
        </button>
        <button onClick={() => update(item.id, { status: 'abandoned' })} className="bg-white text-[#1D1D1F] py-3 rounded-xl text-sm">
          放弃
        </button>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl p-4">
      <div className="text-[10px] text-[#8E8E93] mb-1">{label}</div>
      <div className="text-base font-bold text-[#1D1D1F]">{value}</div>
    </div>
  );
}
