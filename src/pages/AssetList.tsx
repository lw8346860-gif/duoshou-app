import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAllAccessories, useAssets } from '../hooks/useAssets';
import { useCategories, useTags } from '../hooks/useSettings';
import type { AssetStatus } from '../types';
import { REMOVED_CATEGORY_IDS, STATUS_LABELS } from '../types';
import AssetCard from '../components/AssetCard';
import CategoryIcon from '../components/CategoryIcon';
import { getDailyCost, getLoss, getRetentionRate, getUsedDays } from '../utils/calculations';

type SortKey = 'updatedAt' | 'purchaseDate' | 'purchasePrice' | 'dailyCost' | 'loss' | 'usedDays' | 'retention';

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
  const [sortBy, setSortBy] = useState<SortKey>('updatedAt');
  const [showFilters, setShowFilters] = useState(false);

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
        case 'purchasePrice': return b.purchasePrice - a.purchasePrice;
        case 'dailyCost': return getDailyCost(b, allAccessories.filter(acc => acc.assetId === b.id)) - getDailyCost(a, allAccessories.filter(acc => acc.assetId === a.id));
        case 'loss': return getLoss(b, allAccessories.filter(acc => acc.assetId === b.id)) - getLoss(a, allAccessories.filter(acc => acc.assetId === a.id));
        case 'usedDays': return getUsedDays(b) - getUsedDays(a);
        case 'retention': return getRetentionRate(b, allAccessories.filter(acc => acc.assetId === b.id)) - getRetentionRate(a, allAccessories.filter(acc => acc.assetId === a.id));
        case 'updatedAt': return b.updatedAt.localeCompare(a.updatedAt);
        default: return b.updatedAt.localeCompare(a.updatedAt);
      }
    });

    return result;
  }, [assets, allAccessories, search, statusFilter, categoryFilter, sortBy, tags]);

  return (
    <div className="px-4 pt-12 pb-4">
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
                { key: 'updatedAt' as SortKey, label: '最近更新' },
                { key: 'purchaseDate' as SortKey, label: '购买日期' },
                { key: 'purchasePrice' as SortKey, label: '价格' },
                { key: 'dailyCost' as SortKey, label: '日均成本' },
                { key: 'loss' as SortKey, label: '亏损' },
                { key: 'usedDays' as SortKey, label: '使用天数' },
                { key: 'retention' as SortKey, label: '保值率' },
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
            <div className="category-icon text-4xl mb-2 mx-auto"><span className="category-icon-fallback">剁</span></div>
            <div>{search ? '没有找到匹配的资产' : '还没有资产'}</div>
          </div>
        )}
      </div>
    </div>
  );
}
