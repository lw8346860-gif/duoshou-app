import type { Asset, Accessory, Category } from '../types';
import { STATUS_LABELS, STATUS_COLORS } from '../types';
import { calcUsedDays, calcTotalCost, calcDailyCost, calcNetCost, formatMoney, formatDays } from '../utils/calculations';

interface AssetCardProps {
  asset: Asset;
  accessories: Accessory[];
  categories: Category[];
  onClick?: () => void;
}

export default function AssetCard({ asset, accessories, categories, onClick }: AssetCardProps) {
  const cat = categories.find(c => c.id === asset.categoryId);
  const usedDays = calcUsedDays(asset.purchaseDate);
  const totalCost = calcTotalCost(asset, accessories);
  const netCost = calcNetCost(totalCost, asset.currentValue);
  const dailyCost = calcDailyCost(netCost, usedDays);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-4 border border-[#E5E5E5] active:bg-[#FAFAFA] transition-colors cursor-pointer"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-[#F5F5F3] flex items-center justify-center text-2xl shrink-0">
          {cat?.icon || '📦'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-[#1D1D1F] text-[15px] truncate">{asset.name}</span>
            <span
              className="text-[11px] px-1.5 py-0.5 rounded-full shrink-0"
              style={{
                color: STATUS_COLORS[asset.status],
                background: `${STATUS_COLORS[asset.status]}15`,
              }}
            >
              {STATUS_LABELS[asset.status]}
            </span>
          </div>

          <div className="text-xs text-[#8E8E93] mb-2">
            {asset.brand && <span>{asset.brand}</span>}
            {asset.brand && cat && <span> · </span>}
            {cat && <span>{cat.name}</span>}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-[#8E8E93]">
              {formatMoney(asset.purchasePrice)} · {formatDays(usedDays)}
            </div>
            {asset.status !== 'sold' && dailyCost > 0 && (
              <div className="text-xs font-medium text-[#1D1D1F]">
                {formatMoney(dailyCost)}/天
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
