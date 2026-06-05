import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAllAccessories, useAssets } from '../hooks/useAssets';
import { useCategories } from '../hooks/useSettings';
import {
  getTotalCost, getDailyCost, getLoss,
  formatCurrency, getNearTargetAssets, getCurrentValue,
} from '../utils/calculations';
import AssetCard from '../components/AssetCard';

export default function Dashboard() {
  const { assets } = useAssets();
  const allAccessories = useAllAccessories();
  const { categories } = useCategories();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const active = assets.filter(a => a.status === 'active');
    const idle = assets.filter(a => a.status === 'idle');
    const retired = assets.filter(a => a.status === 'retired' || a.status === 'sold' || a.status === 'discarded');

    const totalInvested = assets
      .filter(a => !a.isExcludedFromTotal)
      .reduce((s, a) => s + getTotalCost(a, allAccessories.filter(acc => acc.assetId === a.id)), 0);
    const totalValue = assets
      .reduce((s, a) => s + getCurrentValue(a), 0);
    const netCost = totalInvested - totalValue;
    const dailyAssets = active.filter(a => !a.isExcludedFromDailyAverage);
    const avgDaily = dailyAssets.length > 0
      ? dailyAssets.reduce((s, a) => s + getDailyCost(a, allAccessories.filter(acc => acc.assetId === a.id)), 0) / dailyAssets.length
      : 0;

    return {
      total: assets.length,
      active: active.length,
      idle: idle.length,
      retired: retired.length,
      totalInvested,
      totalValue,
      netCost,
      avgDaily,
    };
  }, [assets, allAccessories]);

  const quickCards = useMemo(() => {
    const withLoss = assets
      .map(a => ({ asset: a, loss: getLoss(a, allAccessories.filter(acc => acc.assetId === a.id)) }))
      .sort((a, b) => b.loss - a.loss);
    const mostCostlyError = withLoss[0]?.asset;

    const withDaily = assets
      .filter(a => a.status === 'active')
      .map(a => ({ asset: a, daily: getDailyCost(a, allAccessories.filter(acc => acc.assetId === a.id)) }))
      .sort((a, b) => a.daily - b.daily);
    const bestValue = withDaily[0]?.asset;

    const nearTarget = getNearTargetAssets(assets, allAccessories);

    return { mostCostlyError, bestValue, nearTarget: nearTarget[0] };
  }, [assets, allAccessories]);

  const recentAssets = useMemo(() => assets.slice(0, 5), [assets]);

  return (
    <div className="px-4 pt-12 pb-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#1D1D1F]">剁手</h1>
        <p className="text-sm text-[#8E8E93] mt-1">买的时候冲动，以后慢慢算账。</p>
      </div>

      {/* Main Stats Card */}
      <div className="surface-ink rounded-3xl p-5 mb-4">
        <div className="text-xs text-white/60 mb-3">今日剁手指数</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="text-xs text-white/60">资产总数</div>
          </div>
          <div className="text-right">
            <div className="text-sm">
              <span className="text-white/60">{stats.active}</span>
              <span className="text-white/40"> 服役 · </span>
              <span className="text-white/60">{stats.idle}</span>
              <span className="text-white/40"> 闲置 · </span>
              <span className="text-white/60">{stats.retired}</span>
              <span className="text-white/40"> 退役</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-white/10">
          <div>
            <div className="text-lg font-bold">{formatCurrency(stats.totalInvested)}</div>
            <div className="text-xs text-white/60">总投入</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">{formatCurrency(stats.totalValue)}</div>
            <div className="text-xs text-white/60">当前估值</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <div className="text-lg font-bold">{formatCurrency(stats.netCost)}</div>
            <div className="text-xs text-white/60">净消费</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">{formatCurrency(stats.avgDaily)}</div>
            <div className="text-xs text-white/60">平均日均</div>
          </div>
        </div>
      </div>

      {/* Quick Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {quickCards.mostCostlyError && (
          <button
            onClick={() => navigate(`/assets/${quickCards.mostCostlyError!.id}`)}
            className="bg-white rounded-2xl p-4 text-left shadow-sm border border-[#E5E5E5]"
          >
            <div className="text-xs text-[#1D1D1F] mb-1 inline-flex items-center gap-1"><span className="notice-dot" />最贵错误</div>
            <div className="text-sm font-semibold text-[#1D1D1F] truncate">{quickCards.mostCostlyError.name}</div>
            <div className="text-xs text-[#8E8E93]">亏损 {formatCurrency(getLoss(quickCards.mostCostlyError, allAccessories.filter(acc => acc.assetId === quickCards.mostCostlyError!.id)))}</div>
          </button>
        )}
        {quickCards.bestValue && (
          <button
            onClick={() => navigate(`/assets/${quickCards.bestValue!.id}`)}
            className="bg-white rounded-2xl p-4 text-left shadow-sm border border-[#E5E5E5]"
          >
            <div className="text-xs text-[#1D1D1F] mb-1 inline-flex items-center gap-1"><span className="notice-dot" />最值回票价</div>
            <div className="text-sm font-semibold text-[#1D1D1F] truncate">{quickCards.bestValue.name}</div>
            <div className="text-xs text-[#8E8E93]">日均 {formatCurrency(getDailyCost(quickCards.bestValue, allAccessories.filter(acc => acc.assetId === quickCards.bestValue!.id)))}</div>
          </button>
        )}
        {quickCards.nearTarget && (
          <button
            onClick={() => navigate(`/assets/${quickCards.nearTarget!.id}`)}
            className="bg-white rounded-2xl p-4 text-left shadow-sm border border-[#E5E5E5]"
          >
            <div className="text-xs text-[#1D1D1F] mb-1 inline-flex items-center gap-1"><span className="notice-dot" />快到目标</div>
            <div className="text-sm font-semibold text-[#1D1D1F] truncate">{quickCards.nearTarget.name}</div>
            <div className="text-xs text-[#8E8E93]">即将达标</div>
          </button>
        )}
      </div>

      {/* Recent Assets */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-[#1D1D1F]">最近更新</h2>
          <button onClick={() => navigate('/assets')} className="text-xs text-[#8E8E93]">查看全部 →</button>
        </div>
        <div className="flex flex-col gap-3">
          {recentAssets.map(asset => (
            <AssetCard
              key={asset.id}
              asset={asset}
              accessories={allAccessories.filter(acc => acc.assetId === asset.id)}
              categories={categories}
              onClick={() => navigate(`/assets/${asset.id}`)}
            />
          ))}
          {recentAssets.length === 0 && (
            <div className="text-center py-12 text-[#8E8E93]">
              <div className="category-icon text-4xl mb-2 mx-auto"><span className="category-icon-fallback">剁</span></div>
              <div>还没有资产，点击右下角 + 添加</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
