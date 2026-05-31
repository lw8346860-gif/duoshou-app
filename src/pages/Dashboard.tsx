import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssets } from '../hooks/useAssets';
import { useCategories } from '../hooks/useSettings';
import {
  getTotalCost, getDailyCost, getLoss,
  formatCurrency, getIdleAlertAssets, getNearTargetAssets,
} from '../utils/calculations';
import AssetCard from '../components/AssetCard';

export default function Dashboard() {
  const { assets } = useAssets();
  const { categories } = useCategories();
  const navigate = useNavigate();

  const allAccessories = useMemo(() => {
    // We need a hook-based approach, but for dashboard we'll use a simplified version
    return [] as any[];
  }, []);

  const stats = useMemo(() => {
    const active = assets.filter(a => a.status === 'active');
    const idle = assets.filter(a => a.status === 'idle');
    const sold = assets.filter(a => a.status === 'sold');

    const totalInvested = assets.reduce((s, a) => s + getTotalCost(a, allAccessories), 0);
    const totalValue = assets.reduce((s, a) => s + (a.status === 'sold' ? (a.soldPrice || 0) : a.currentValue), 0);
    const totalRecovery = sold.reduce((s, a) => s + (a.soldPrice || 0), 0);
    const netCost = totalInvested - totalRecovery;
    const avgDaily = active.length > 0
      ? active.reduce((s, a) => s + getDailyCost(a, allAccessories), 0) / active.length
      : 0;

    return {
      total: assets.length,
      active: active.length,
      idle: idle.length,
      sold: sold.length,
      totalInvested,
      totalValue,
      totalRecovery,
      netCost,
      avgDaily,
    };
  }, [assets, allAccessories]);

  const quickCards = useMemo(() => {
    const withLoss = assets
      .map(a => ({ asset: a, loss: getLoss(a, allAccessories) }))
      .sort((a, b) => b.loss - a.loss);
    const mostCostlyError = withLoss[0]?.asset;

    const withDaily = assets
      .filter(a => a.status === 'active')
      .map(a => ({ asset: a, daily: getDailyCost(a, allAccessories) }))
      .sort((a, b) => a.daily - b.daily);
    const bestValue = withDaily[0]?.asset;

    const idleAlerts = getIdleAlertAssets(assets, allAccessories);
    const nearTarget = getNearTargetAssets(assets, allAccessories);

    return { mostCostlyError, bestValue, idleAlert: idleAlerts[0], nearTarget: nearTarget[0] };
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
      <div className="bg-[#111111] rounded-3xl p-5 mb-4 text-white">
        <div className="text-xs text-white/60 mb-3">📊 今日剁手指数</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="text-xs text-white/60">资产总数</div>
          </div>
          <div className="text-right">
            <div className="text-sm">
              <span className="text-[#B7F23A]">{stats.active}</span>
              <span className="text-white/40"> 服役 · </span>
              <span className="text-[#FAAD14]">{stats.idle}</span>
              <span className="text-white/40"> 闲置 · </span>
              <span className="text-white/60">{stats.sold}</span>
              <span className="text-white/40"> 卖出</span>
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
            <div className="text-lg font-bold text-[#B7F23A]">{formatCurrency(stats.totalRecovery)}</div>
            <div className="text-xs text-white/60">累计回收</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">{formatCurrency(stats.netCost)}</div>
            <div className="text-xs text-white/60">净消费</div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="text-xs text-white/60">平均日均成本</div>
          <div className="text-xl font-bold text-[#B7F23A]">{formatCurrency(stats.avgDaily)}</div>
        </div>
      </div>

      {/* Quick Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {quickCards.mostCostlyError && (
          <button
            onClick={() => navigate(`/assets/${quickCards.mostCostlyError!.id}`)}
            className="bg-white rounded-2xl p-4 text-left shadow-sm border border-[#E5E5E5]"
          >
            <div className="text-xs text-[#FF4D4F] mb-1">💸 最贵错误</div>
            <div className="text-sm font-semibold text-[#1D1D1F] truncate">{quickCards.mostCostlyError.name}</div>
            <div className="text-xs text-[#8E8E93]">亏损 {formatCurrency(getLoss(quickCards.mostCostlyError, allAccessories))}</div>
          </button>
        )}
        {quickCards.bestValue && (
          <button
            onClick={() => navigate(`/assets/${quickCards.bestValue!.id}`)}
            className="bg-white rounded-2xl p-4 text-left shadow-sm border border-[#E5E5E5]"
          >
            <div className="text-xs text-[#52c41a] mb-1">🏆 最值回票价</div>
            <div className="text-sm font-semibold text-[#1D1D1F] truncate">{quickCards.bestValue.name}</div>
            <div className="text-xs text-[#8E8E93]">日均 {formatCurrency(getDailyCost(quickCards.bestValue, allAccessories))}</div>
          </button>
        )}
        {quickCards.idleAlert && (
          <button
            onClick={() => navigate(`/assets/${quickCards.idleAlert!.id}`)}
            className="bg-white rounded-2xl p-4 text-left shadow-sm border border-[#E5E5E5]"
          >
            <div className="text-xs text-[#FAAD14] mb-1">⚠️ 闲置警报</div>
            <div className="text-sm font-semibold text-[#1D1D1F] truncate">{quickCards.idleAlert.name}</div>
            <div className="text-xs text-[#8E8E93]">高价闲置中</div>
          </button>
        )}
        {quickCards.nearTarget && (
          <button
            onClick={() => navigate(`/assets/${quickCards.nearTarget!.id}`)}
            className="bg-white rounded-2xl p-4 text-left shadow-sm border border-[#E5E5E5]"
          >
            <div className="text-xs text-[#B7F23A] mb-1">🎯 快到目标</div>
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
              accessories={allAccessories}
              categories={categories}
              onClick={() => navigate(`/assets/${asset.id}`)}
            />
          ))}
          {recentAssets.length === 0 && (
            <div className="text-center py-12 text-[#8E8E93]">
              <div className="text-4xl mb-2">📦</div>
              <div>还没有资产，点击右下角 + 添加</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
