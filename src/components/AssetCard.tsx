import type { Asset, Accessory, Category } from '../types';
import { STATUS_LABELS } from '../types';
import { calcUsedDays, formatMoney, formatDays, getCurrentValue, getDailyNetHoldingCost, getNetMonthlyCashflow } from '../utils/calculations';
import CategoryIcon from './CategoryIcon';

interface AssetCardProps {
  asset: Asset;
  accessories: Accessory[];
  categories: Category[];
  onClick?: () => void;
}

export default function AssetCard({ asset, accessories, categories, onClick }: AssetCardProps) {
  const cat = categories.find(c => c.id === asset.categoryId);
  const usedDays = calcUsedDays(asset.purchaseDate);
  const currentValue = getCurrentValue(asset);
  const dailyNetProfitLoss = -getDailyNetHoldingCost(asset, accessories);
  const netMonthlyCashflow = getNetMonthlyCashflow(asset);

  return (
    <div
      onClick={onClick}
      className="asset-card bg-white rounded-2xl p-3 active:bg-[#FAFAFA] transition-colors cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div className="asset-cover shrink-0">
          <CategoryIcon category={cat} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-[#1D1D1F] text-[15px] truncate">{asset.name}</span>
            <span
              className="status-pill text-[11px] px-1.5 py-0.5 rounded-full shrink-0 inline-flex items-center gap-1"
            >
              <span className="status-dot" />
              {STATUS_LABELS[asset.status]}
            </span>
          </div>

          <div className="text-xs text-[#8E8E93] mb-2 flex items-center gap-1.5">
            {cat && <span>{cat.name}</span>}
            <span>·</span>
            <span>{formatDays(usedDays)}</span>
          </div>

          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] text-[#8E8E93] mb-0.5">当前估值</div>
              <div className="text-sm font-black text-[#1D1D1F] truncate">{formatMoney(currentValue)}</div>
            </div>
            {asset.status !== 'sold' && (
              <div className="min-w-0 text-left">
                <div className="text-[10px] text-[#8E8E93] mb-0.5">日均净损益</div>
                <div className="text-xs font-bold text-[#1D1D1F] truncate">{formatMoney(dailyNetProfitLoss)}/日</div>
              </div>
            )}
          </div>

          <div className="mt-2 flex justify-end">
            <div className="cashflow-mini">
              月净现金流 {formatMoney(netMonthlyCashflow)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
