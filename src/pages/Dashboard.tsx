import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAllAccessories, useAssets } from '../hooks/useAssets';
import { useCategories } from '../hooks/useSettings';
import {
  formatCurrency,
  getCurrentValue,
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
  const [holdingHighlightMode, setHoldingHighlightMode] = useState<'max' | 'min'>('max');
  const [cashflowHighlightMode, setCashflowHighlightMode] = useState<'max' | 'min'>('max');

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
    };
  }, [assets, allAccessories]);

  const highlights = useMemo(() => {
    const valuedAssets = assets
      .map(asset => ({ asset, value: getNetAssetValue(asset) }))
      .sort((a, b) => b.value - a.value);
    const cashflowAssets = assets
      .map(asset => ({ asset, value: getNetMonthlyCashflow(asset) }))
      .sort((a, b) => b.value - a.value);

    return {
      largestHolding: valuedAssets[0],
      smallestHolding: valuedAssets[valuedAssets.length - 1],
      highestCashflow: cashflowAssets[0],
      lowestCashflow: cashflowAssets[cashflowAssets.length - 1],
    };
  }, [assets]);

  const holdingHighlight = holdingHighlightMode === 'max' ? highlights.largestHolding : highlights.smallestHolding;
  const cashflowHighlight = cashflowHighlightMode === 'max' ? highlights.highestCashflow : highlights.lowestCashflow;

  const distribution = useMemo(() => {
    const grouped = assets.reduce<Array<{ name: string; value: number }>>((items, asset) => {
      const value = Math.max(0, getNetAssetValue(asset));
      if (value <= 0) return items;
      const categoryName = categories.find(category => category.id === asset.categoryId)?.name ?? '其他';
      const existing = items.find(item => item.name === categoryName);
      if (existing) existing.value += value;
      else items.push({ name: categoryName, value });
      return items;
    }, []);

    const sorted = grouped.sort((a, b) => b.value - a.value);
    const top = sorted.slice(0, 4);
    const rest = sorted.slice(4).reduce((sum, item) => sum + item.value, 0);
    return rest > 0 ? [...top, { name: '其他', value: rest }] : top;
  }, [assets, categories]);

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
        {holdingHighlight && (
          <Highlight
            title={holdingHighlightMode === 'max' ? '最大持仓' : '最小持仓'}
            assetName={holdingHighlight.asset.name}
            value={formatCurrency(holdingHighlight.value)}
            hint="点击切换"
            onClick={() => setHoldingHighlightMode(mode => mode === 'max' ? 'min' : 'max')}
          />
        )}
        {cashflowHighlight && (
          <Highlight
            title={cashflowHighlightMode === 'max' ? '净现金流最高' : '净现金流最低'}
            assetName={cashflowHighlight.asset.name}
            value={`${formatCurrency(cashflowHighlight.value)}/月`}
            hint="点击切换"
            onClick={() => setCashflowHighlightMode(mode => mode === 'max' ? 'min' : 'max')}
          />
        )}
      </section>

      <AssetDistribution data={distribution} />

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

function Highlight({ title, assetName, value, hint, onClick }: { title: string; assetName: string; value: string; hint?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="highlight-card bg-white rounded-2xl p-4 text-left">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-xs text-[#8E8E93]">{title}</div>
        {hint && <div className="text-[10px] text-[#C57A3D]">{hint}</div>}
      </div>
      <div className="text-sm font-black text-[#1D1D1F] truncate">{assetName}</div>
      <div className="text-xs text-[#1D1D1F] mt-1 font-bold truncate">{value}</div>
    </button>
  );
}

function AssetDistribution({ data }: { data: Array<{ name: string; value: number }> }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const palette = ['#FFB15E', '#E07633', '#B8501F', '#F3D2A8', '#7B3E1D'];
  let cursor = 0;
  const gradient = total > 0
    ? data.map((item, index) => {
      const start = cursor;
      const size = (item.value / total) * 360;
      cursor += size;
      return `${palette[index % palette.length]} ${start}deg ${cursor}deg`;
    }).join(', ')
    : '#EEE8E0 0deg 360deg';

  return (
    <section className="asset-distribution bg-white rounded-3xl p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-black text-[#1D1D1F]">净资产分布</h2>
          <p className="text-xs text-[#8E8E93] mt-1">按当前净资产估算</p>
        </div>
        <div className="text-xs font-bold text-[#1D1D1F]">{formatCurrency(total)}</div>
      </div>

      <div className="flex items-center gap-4">
        <div className="asset-pie-wrap" aria-hidden="true">
          <div className="asset-pie-shadow" />
          <div className="asset-pie" style={{ background: `conic-gradient(${gradient})` }}>
            <div className="asset-pie-core" />
          </div>
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          {data.length === 0 && (
            <div className="text-xs text-[#8E8E93]">有估值的资产会在这里形成分布。</div>
          )}
          {data.map((item, index) => (
            <div key={item.name} className="distribution-row">
              <span style={{ backgroundColor: palette[index % palette.length] }} />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-[#1D1D1F] truncate">{item.name}</div>
                <div className="text-[10px] text-[#8E8E93]">{total > 0 ? `${((item.value / total) * 100).toFixed(0)}%` : '0%'}</div>
              </div>
              <strong>{formatCurrency(item.value)}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
