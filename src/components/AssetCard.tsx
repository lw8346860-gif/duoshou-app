import type { Asset, Accessory, Category } from '../types';
import { STATUS_LABELS } from '../types';
import { calcUsedDays, calcTotalCost, formatMoney, formatDays, getDailyNetHoldingCost, getNetMonthlyCashflow } from '../utils/calculations';
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
  const totalCost = calcTotalCost(asset, accessories);
  const dailyNetCost = getDailyNetHoldingCost(asset, accessories);
  const netMonthlyCashflow = getNetMonthlyCashflow(asset);
  const isNetIncome = dailyNetCost < 0;

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

          <div className="text-xs text-[#8E8E93] mb-2">
            {cat && <span>{cat.name}</span>}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-[#8E8E93]">
              {formatMoney(totalCost)} · {formatDays(usedDays)}
            </div>
            {asset.status !== 'sold' && (
              <div className="text-xs font-bold text-[#1D1D1F] text-right">
                {isNetIncome ? '净收益 ' : ''}
                {formatMoney(Math.abs(dailyNetCost))}/天
              </div>
            )}
          </div>
          {netMonthlyCashflow !== 0 && (
            <div className="cashflow-mini mt-2">
              月净现金流 {formatMoney(netMonthlyCashflow)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
