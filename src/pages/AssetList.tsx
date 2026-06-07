import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAllAccessories, useAssets } from '../hooks/useAssets';
import { useCategories, useTags } from '../hooks/useSettings';
import type { AssetStatus } from '../types';
import { REMOVED_CATEGORY_IDS, STATUS_LABELS } from '../types';
import AssetCard from '../components/AssetCard';
import CategoryIcon from '../components/CategoryIcon';
import { formatMoney, getCurrentValue, getDailyNetHoldingCost, getDebtBalance, getNetAssetValue, getNetMonthlyCashflow, getTotalCost } from '../utils/calculations';

type SortKey = 'purchaseDate' | 'totalCost' | 'currentValue' | 'netCashflow' | 'dailyHoldingCost' | 'updatedAt';
type AssetStatMode = 'net' | 'debt' | 'gross';
type CashflowStatMode = 'monthly' | 'yearly';
type HoldingCostStatMode = 'daily' | 'weekly' | 'monthly' | 'yearly';

const ASSET_STAT_MODES: AssetStatMode[] = ['net', 'debt', 'gross'];
const CASHFLOW_STAT_MODES: CashflowStatMode[] = ['monthly', 'yearly'];
const HOLDING_COST_STAT_MODES: HoldingCostStatMode[] = ['daily', 'weekly', 'monthly', 'yearly'];

export default function AssetList() {
  const { assets } = useAssets();
  const allAccessories = useAllAccessories();
  const { categories: rawCategories } = useCategories();
  const categories = rawCategories.filter(cat => !REMOVED_CATEGORY_IDS.includes(cat.id));
  const { tags } = useTags();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AssetStatus | ''>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('purchaseDate');
  const [showFilters, setShowFilters] = useState(false);
  const [assetStatMode, setAssetStatMode] = useState<AssetStatMode>('net');
  const [cashflowStatMode, setCashflowStatMode] = useState<CashflowStatMode>('monthly');
  const [holdingCostStatMode, setHoldingCostStatMode] = useState<HoldingCostStatMode>('daily');

  const filtered = useMemo(() => {
    let result = [...assets];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.tagIds.some(tId => {
          const tag = tags.find(t => t.id === tId);
          return tag?.name.toLowerCase().includes(q);
        })
      );
    }

    if (statusFilter) {
      result = result.filter(a => a.status === statusFilter);
    }

    if (categoryFilter) {
      result = result.filter(a => a.categoryId === categoryFilter);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'purchaseDate': return b.purchaseDate.localeCompare(a.purchaseDate);
        case 'totalCost': return getTotalCost(b, allAccessories.filter(acc => acc.assetId === b.id)) - getTotalCost(a, allAccessories.filter(acc => acc.assetId === a.id));
        case 'currentValue': return getCurrentValue(b) - getCurrentValue(a);
        case 'netCashflow': return getNetMonthlyCashflow(b) - getNetMonthlyCashflow(a);
        case 'dailyHoldingCost': return getDailyNetHoldingCost(b, allAccessories.filter(acc => acc.assetId === b.id)) - getDailyNetHoldingCost(a, allAccessories.filter(acc => acc.assetId === a.id));
        case 'updatedAt': return b.updatedAt.localeCompare(a.updatedAt);
        default: return b.purchaseDate.localeCompare(a.purchaseDate);
      }
    });

    return result;
  }, [assets, allAccessories, search, statusFilter, categoryFilter, sortBy, tags]);

  const listStats = useMemo(() => {
    const activeAssets = filtered.filter(asset => asset.status !== 'sold' && asset.status !== 'discarded');
    const netAssetValue = activeAssets.reduce((sum, asset) => sum + getNetAssetValue(asset), 0);
    const totalAssetValue = activeAssets.reduce((sum, asset) => sum + getCurrentValue(asset), 0);
    const totalDebt = activeAssets.reduce((sum, asset) => sum + getDebtBalance(asset), 0);
    const netMonthlyCashflow = activeAssets.reduce((sum, asset) => sum + getNetMonthlyCashflow(asset), 0);
    const dailyHoldingCost = activeAssets
      .filter(asset => !asset.isExcludedFromDailyAverage)
      .reduce((sum, asset) => sum + getDailyNetHoldingCost(asset, allAccessories.filter(acc => acc.assetId === asset.id)), 0);

    return {
      count: activeAssets.length,
      netAssetValue,
      totalAssetValue,
      totalDebt,
      netMonthlyCashflow,
      dailyHoldingCost,
    };
  }, [filtered, allAccessories]);

  const assetStat = useMemo(() => {
    switch (assetStatMode) {
      case 'debt':
        return { label: '负债总额', value: listStats.totalDebt };
      case 'gross':
        return { label: '资产总额', value: listStats.totalAssetValue };
      default:
        return { label: '资产净额', value: listStats.netAssetValue };
    }
  }, [assetStatMode, listStats]);

  const cashflowStat = useMemo(() => {
    if (cashflowStatMode === 'yearly') {
      return { label: '年净现金流', value: listStats.netMonthlyCashflow * 12 };
    }
    return { label: '月净现金流', value: listStats.netMonthlyCashflow };
  }, [cashflowStatMode, listStats.netMonthlyCashflow]);

  const holdingCostStat = useMemo(() => {
    switch (holdingCostStatMode) {
      case 'weekly':
        return { label: '合计周持有成本', value: listStats.dailyHoldingCost * 7 };
      case 'monthly':
        return { label: '合计月持有成本', value: listStats.dailyHoldingCost * (365 / 12) };
      case 'yearly':
        return { label: '合计年持有成本', value: listStats.dailyHoldingCost * 365 };
      default:
        return { label: '合计日均持有成本', value: listStats.dailyHoldingCost };
    }
  }, [holdingCostStatMode, listStats.dailyHoldingCost]);

  const cycleAssetStat = () => {
    setAssetStatMode(current => ASSET_STAT_MODES[(ASSET_STAT_MODES.indexOf(current) + 1) % ASSET_STAT_MODES.length]);
  };

  const cycleCashflowStat = () => {
    setCashflowStatMode(current => CASHFLOW_STAT_MODES[(CASHFLOW_STAT_MODES.indexOf(current) + 1) % CASHFLOW_STAT_MODES.length]);
  };

  const cycleHoldingCostStat = () => {
    setHoldingCostStatMode(current => HOLDING_COST_STAT_MODES[(HOLDING_COST_STAT_MODES.indexOf(current) + 1) % HOLDING_COST_STAT_MODES.length]);
  };

  return (
    <div className="px-4 pt-12 pb-32">
      <h1 className="text-2xl font-bold text-[#1D1D1F] mb-4">资产列表</h1>

      {/* Search */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          placeholder="搜索名称或标签..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-white rounded-xl px-4 py-2.5 text-sm border border-[#E5E5E5] outline-none focus:border-[#111111]"
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-2.5 rounded-xl text-sm border font-semibold ${showFilters ? 'choice-chip-selected' : 'bg-white border-[#E5E5E5]'}`}
        >
          筛选
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-2xl p-4 mb-3 border border-[#E5E5E5]">
          <div className="mb-3">
            <div className="text-xs text-[#8E8E93] mb-2">状态</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStatusFilter('')}
                className={`choice-chip px-3 py-1 rounded-full text-xs ${!statusFilter ? 'choice-chip-selected' : ''}`}
              >全部</button>
              {(['active', 'idle', 'retired'] as AssetStatus[]).map(k => (
                <button
                  key={k}
                  onClick={() => setStatusFilter(k)}
                  className={`choice-chip px-3 py-1 rounded-full text-xs ${statusFilter === k ? 'choice-chip-selected' : ''}`}
                >{STATUS_LABELS[k]}</button>
              ))}
            </div>
          </div>
          <div className="mb-3">
            <div className="text-xs text-[#8E8E93] mb-2">分类</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCategoryFilter('')}
                className={`choice-chip px-3 py-1 rounded-full text-xs ${!categoryFilter ? 'choice-chip-selected' : ''}`}
              >全部</button>
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCategoryFilter(c.id)}
                  className={`choice-chip px-3 py-1 rounded-full text-xs ${categoryFilter === c.id ? 'choice-chip-selected' : ''}`}
                ><CategoryIcon category={c} /> {c.name}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#8E8E93] mb-2">排序</div>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'purchaseDate' as SortKey, label: '购买日期' },
                { key: 'totalCost' as SortKey, label: '投入金额' },
                { key: 'currentValue' as SortKey, label: '估值金额' },
                { key: 'netCashflow' as SortKey, label: '净现金流' },
                { key: 'dailyHoldingCost' as SortKey, label: '日均持有成本' },
                { key: 'updatedAt' as SortKey, label: '最近更新' },
              ].map(s => (
                <button
                  key={s.key}
                  onClick={() => setSortBy(s.key)}
                  className={`choice-chip px-3 py-1 rounded-full text-xs ${sortBy === s.key ? 'choice-chip-selected' : ''}`}
                >{s.label}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex flex-col gap-3">
        {filtered.map(asset => (
          <AssetCard
            key={asset.id}
            asset={asset}
            accessories={allAccessories.filter(acc => acc.assetId === asset.id)}
            categories={categories}
            onClick={() => navigate(`/assets/${asset.id}`)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-[#8E8E93]">
            <div className="empty-orbit-icon mb-3 mx-auto" aria-hidden="true" />
            <div>{search ? '没有找到匹配的资产' : '还没有长期资产'}</div>
          </div>
        )}
        {filtered.length > 0 && (
          <section className="bg-white rounded-2xl p-4 pb-24 mt-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-[#1D1D1F]">当前列表统计</h2>
              <span className="text-xs text-[#8E8E93]">{listStats.count} 项 · 点击切换口径</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <ListStat label={assetStat.label} value={formatMoney(assetStat.value)} onClick={cycleAssetStat} />
              <ListStat label={cashflowStat.label} value={formatMoney(cashflowStat.value)} onClick={cycleCashflowStat} />
              <ListStat label={holdingCostStat.label} value={formatMoney(holdingCostStat.value)} onClick={cycleHoldingCostStat} />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function ListStat({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-[#F5F5F3] rounded-xl p-2 min-w-0 text-left active:scale-[0.98] transition"
      aria-label={`切换${label}显示口径`}
    >
      <div className="text-[10px] text-[#8E8E93] mb-1 truncate">{label}</div>
      <div className="text-xs font-black text-[#1D1D1F] truncate">{value}</div>
    </button>
  );
}
