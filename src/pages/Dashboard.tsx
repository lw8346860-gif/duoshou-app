import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAllAccessories, useAssets } from '../hooks/useAssets';
import { useCategories } from '../hooks/useSettings';
import {
  formatCurrency,
  getCurrentValue,
  getDailyNetHoldingCost,
  getDebtBalance,
  getNetAssetValue,
  getNetMonthlyCashflow,
  getNetHoldingCost,
  getTotalCost,
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
    const totalValue = assets.reduce((s, a) => s + getCurrentValue(a), 0);
    const totalDebt = assets.reduce((s, a) => s + getDebtBalance(a), 0);
    const netAssetValue = assets.reduce((s, a) => s + getNetAssetValue(a), 0);
    const netMonthlyCashflow = assets.reduce((s, a) => s + getNetMonthlyCashflow(a), 0);
    const netYearlyCashflow = netMonthlyCashflow * 12;
    const netHoldingCost = assets.reduce((s, a) => s + getNetHoldingCost(a, allAccessories.filter(acc => acc.assetId === a.id)), 0);
    const dailyAssets = active.filter(a => !a.isExcludedFromDailyAverage);
    const avgDaily = dailyAssets.length > 0
      ? dailyAssets.reduce((s, a) => s + getDailyNetHoldingCost(a, allAccessories.filter(acc => acc.assetId === a.id)), 0) / dailyAssets.length
      : 0;

    return {
      total: assets.length,
      active: active.length,
      idle: idle.length,
      retired: retired.length,
      totalInvested,
      totalValue,
      totalDebt,
      netAssetValue,
      netMonthlyCashflow,
      netYearlyCashflow,
      netHoldingCost,
      avgDaily,
    };
  }, [assets, allAccessories]);

  const highlights = useMemo(() => {
    const cashflowKing = assets
      .filter(a => getNetMonthlyCashflow(a) !== 0)
      .sort((a, b) => getNetMonthlyCashflow(b) - getNetMonthlyCashflow(a))[0];
    const mostInvested = assets
      .map(a => ({ asset: a, cost: getTotalCost(a, allAccessories.filter(acc => acc.assetId === a.id)) }))
      .sort((a, b) => b.cost - a.cost)[0]?.asset;
    const bestDaily = assets
      .filter(a => a.status === 'active')
      .map(a => ({ asset: a, daily: getDailyNetHoldingCost(a, allAccessories.filter(acc => acc.assetId === a.id)) }))
      .sort((a, b) => a.daily - b.daily)[0]?.asset;

    return { cashflowKing, mostInvested, bestDaily };
  }, [assets, allAccessories]);

  const recentAssets = useMemo(() => assets.slice(0, 5), [assets]);

  return (
    <div className="dashboard-page px-4 pt-12 pb-4">
      <div className="dashboard-top mb-5">
        <div>
          <h1 className="text-3xl font-black text-[#1D1D1F]">年轮</h1>
          <p className="text-sm text-[#8E8E93] mt-1">长期资产，慢慢长出自己的时间刻度。</p>
        </div>
        <button onClick={() => navigate('/assets/new')} className="dashboard-add" aria-label="新增资产">+</button>
      </div>

      <section className="dashboard-hero rounded-3xl p-5 mb-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-white/72">长期资产总览</div>
          <div className="text-xs text-white/45">{stats.total} 项</div>
        </div>
        <div className="mt-5">
          <div className="text-xs text-white/48">净资产</div>
          <div className="text-4xl font-black tracking-normal mt-1">{formatCurrency(stats.netAssetValue)}</div>
        </div>
        <div className="dashboard-bars mt-5" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <Metric label="总投入" value={formatCurrency(stats.totalInvested)} />
          <Metric label="当前估值" value={formatCurrency(stats.totalValue)} />
          <Metric label="总负债" value={formatCurrency(stats.totalDebt)} />
          <Metric label="月净现金流" value={formatCurrency(stats.netMonthlyCashflow)} />
        </div>
      </section>

      <section className="cashflow-panel bg-white rounded-3xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-black text-[#1D1D1F]">净现金流折算</h2>
          <span className="text-xs text-[#8E8E93]">收入 - 月供 - 成本</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <SmallMetric label="日" value={formatCurrency(stats.netMonthlyCashflow / (365 / 12))} />
          <SmallMetric label="周" value={formatCurrency((stats.netMonthlyCashflow / (365 / 12)) * 7)} />
          <SmallMetric label="年" value={formatCurrency(stats.netYearlyCashflow)} />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 mb-4">
        {highlights.mostInvested && (
          <Highlight title="最大持仓" assetName={highlights.mostInvested.name} value={formatCurrency(getTotalCost(highlights.mostInvested, allAccessories.filter(acc => acc.assetId === highlights.mostInvested!.id)))} onClick={() => navigate(`/assets/${highlights.mostInvested!.id}`)} />
        )}
        {highlights.cashflowKing && (
          <Highlight title="净现金流最高" assetName={highlights.cashflowKing.name} value={`${formatCurrency(getNetMonthlyCashflow(highlights.cashflowKing))}/月`} onClick={() => navigate(`/assets/${highlights.cashflowKing!.id}`)} />
        )}
        {highlights.bestDaily && (
          <Highlight title="日均最优" assetName={highlights.bestDaily.name} value={`${formatCurrency(getDailyNetHoldingCost(highlights.bestDaily, allAccessories.filter(acc => acc.assetId === highlights.bestDaily!.id)))}/天`} onClick={() => navigate(`/assets/${highlights.bestDaily!.id}`)} />
        )}
      </section>

      <section className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-black text-[#1D1D1F]">资产年轮</h2>
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
            <div className="empty-orbit bg-white rounded-3xl p-8 text-center">
              <div className="empty-orbit-icon mx-auto mb-4" aria-hidden="true" />
              <div className="text-sm font-black text-[#1D1D1F]">还没有长期资产</div>
              <div className="text-xs text-[#8E8E93] mt-2">预计持有 1 年以上的资产，再放进年轮。</div>
              <button onClick={() => navigate('/assets/new')} className="btn-secondary mt-4 px-4 py-2 rounded-xl text-xs">
                添加第一项
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="dashboard-metric">
      <div>{label}</div>
      <strong>{value}</strong>
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="small-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Highlight({ title, assetName, value, onClick }: { title: string; assetName: string; value: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="highlight-card bg-white rounded-2xl p-4 text-left">
      <div className="text-xs text-[#8E8E93] mb-2">{title}</div>
      <div className="text-sm font-black text-[#1D1D1F] truncate">{assetName}</div>
      <div className="text-xs text-[#1D1D1F] mt-1 font-bold truncate">{value}</div>
    </button>
  );
}
