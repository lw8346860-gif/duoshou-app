import { useMemo, useState } from 'react';
import { useAssets } from '../hooks/useAssets';
import { useWishlist } from '../hooks/useWishlist';
import { useCategories } from '../hooks/useSettings';
import {
  getTotalCost, getDailyCost, getLoss, getRetentionRate, getUsedDays,
  formatCurrency,
} from '../utils/calculations';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#111111', '#B7F23A', '#1890ff', '#ff4d4f', '#faad14', '#52c41a', '#722ed1', '#eb2f96', '#13c2c2', '#fa8c16'];

type Tab = 'overview' | 'rankings' | 'category' | 'brand';

export default function Stats() {
  const { assets } = useAssets();
  const { items: wishlistItems } = useWishlist();
  const { categories } = useCategories();
  const [tab, setTab] = useState<Tab>('overview');

  const allAccessories = useMemo(() => [] as any[], []);

  const stats = useMemo(() => {
    const totalInvested = assets.reduce((s, a) => s + getTotalCost(a, allAccessories), 0);
    const totalValue = assets.reduce((s, a) => s + (a.status === 'sold' ? (a.soldPrice || 0) : a.currentValue), 0);
    const totalRecovery = assets.filter(a => a.status === 'sold').reduce((s, a) => s + (a.soldPrice || 0), 0);
    const netCost = totalInvested - totalRecovery;
    const totalLoss = assets.reduce((s, a) => s + getLoss(a, allAccessories), 0);
    const avgDaily = assets.filter(a => a.status === 'active').length > 0
      ? assets.filter(a => a.status === 'active').reduce((s, a) => s + getDailyCost(a, allAccessories), 0) / assets.filter(a => a.status === 'active').length
      : 0;

    return { totalInvested, totalValue, totalRecovery, netCost, totalLoss, avgDaily, assetCount: assets.length, wishlistCount: wishlistItems.length };
  }, [assets, wishlistItems, allAccessories]);

  const rankings = useMemo(() => {
    const sorted = (key: (a: any) => number, desc = true) =>
      [...assets].sort((a, b) => desc ? key(b) - key(a) : key(a) - key(b)).slice(0, 10);

    return {
      mostExpensive: sorted(a => getTotalCost(a, allAccessories)),
      highestDaily: sorted(a => a.status === 'active' ? getDailyCost(a, allAccessories) : 0),
      lowestDaily: sorted(a => a.status === 'active' ? getDailyCost(a, allAccessories) : 0, false).filter(a => a.status === 'active'),
      mostLoss: sorted(a => getLoss(a, allAccessories)),
      bestRetention: sorted(a => getRetentionRate(a, allAccessories)),
      mostIdle: sorted(a => a.status === 'idle' ? getUsedDays(a.lastUsedDate || a.purchaseDate) : 0),
    };
  }, [assets, allAccessories]);

  const categoryStats = useMemo(() => {
    const map = new Map<string, { count: number; invested: number; value: number; loss: number; dailySum: number; dailyCount: number }>();
    assets.forEach(a => {
      const existing = map.get(a.categoryId) || { count: 0, invested: 0, value: 0, loss: 0, dailySum: 0, dailyCount: 0 };
      existing.count++;
      existing.invested += getTotalCost(a, allAccessories);
      existing.value += a.status === 'sold' ? (a.soldPrice || 0) : a.currentValue;
      existing.loss += getLoss(a, allAccessories);
      if (a.status === 'active') {
        existing.dailySum += getDailyCost(a, allAccessories);
        existing.dailyCount++;
      }
      map.set(a.categoryId, existing);
    });
    return Array.from(map.entries()).map(([catId, data]) => ({
      categoryId: catId,
      ...data,
      avgDaily: data.dailyCount > 0 ? data.dailySum / data.dailyCount : 0,
    })).sort((a, b) => b.invested - a.invested);
  }, [assets, allAccessories]);

  const brandStats = useMemo(() => {
    const map = new Map<string, { count: number; invested: number; value: number; loss: number }>();
    assets.forEach(a => {
      if (!a.brand) return;
      const existing = map.get(a.brand) || { count: 0, invested: 0, value: 0, loss: 0 };
      existing.count++;
      existing.invested += getTotalCost(a, allAccessories);
      existing.value += a.status === 'sold' ? (a.soldPrice || 0) : a.currentValue;
      existing.loss += getLoss(a, allAccessories);
      map.set(a.brand, existing);
    });
    return Array.from(map.entries()).map(([brand, data]) => ({ brand, ...data })).sort((a, b) => b.invested - a.invested);
  }, [assets, allAccessories]);

  const pieData = categoryStats.map(cs => {
    const cat = categories.find(c => c.id === cs.categoryId);
    return { name: cat?.name || '未知', value: cs.invested };
  });

  return (
    <div className="px-4 pt-12 pb-4">
      <h1 className="text-2xl font-bold text-[#1D1D1F] mb-4">统计</h1>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatBox label="总投入" value={formatCurrency(stats.totalInvested)} />
        <StatBox label="当前估值" value={formatCurrency(stats.totalValue)} />
        <StatBox label="累计回收" value={formatCurrency(stats.totalRecovery)} color="#52c41a" />
        <StatBox label="净消费" value={formatCurrency(stats.netCost)} />
        <StatBox label="资产数量" value={String(stats.assetCount)} />
        <StatBox label="心愿数量" value={String(stats.wishlistCount)} />
        <StatBox label="平均日均" value={formatCurrency(stats.avgDaily)} color="#B7F23A" />
        <StatBox label="总亏损" value={formatCurrency(stats.totalLoss)} color="#FF4D4F" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-white rounded-xl p-1 border border-[#E5E5E5]">
        {([
          { key: 'overview' as Tab, label: '总览' },
          { key: 'rankings' as Tab, label: '排行' },
          { key: 'category' as Tab, label: '分类' },
          { key: 'brand' as Tab, label: '品牌' },
        ]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${tab === t.key ? 'bg-[#111111] text-white' : 'text-[#8E8E93]'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          {/* Pie Chart */}
          {pieData.length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-[#E5E5E5] mb-4">
              <h3 className="text-sm font-semibold text-[#1D1D1F] mb-3">分类投入占比</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Bar Charts */}
          {rankings.highestDaily.length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-[#E5E5E5] mb-4">
              <h3 className="text-sm font-semibold text-[#1D1D1F] mb-3">日均成本 Top10</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={rankings.highestDaily.map(a => ({ name: a.name.slice(0, 6), daily: getDailyCost(a, allAccessories) }))}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
                  <Bar dataKey="daily" fill="#111111" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {rankings.mostLoss.length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-[#E5E5E5] mb-4">
              <h3 className="text-sm font-semibold text-[#1D1D1F] mb-3">亏损 Top10</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={rankings.mostLoss.map(a => ({ name: a.name.slice(0, 6), loss: getLoss(a, allAccessories) }))}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
                  <Bar dataKey="loss" fill="#FF4D4F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {tab === 'rankings' && (
        <>
          <RankingSection title="💸 最贵 Top10" items={rankings.mostExpensive} getValue={a => formatCurrency(getTotalCost(a, allAccessories))} />
          <RankingSection title="📈 最高日均 Top10" items={rankings.highestDaily} getValue={a => formatCurrency(getDailyCost(a, allAccessories))} />
          <RankingSection title="📉 最低日均 Top10" items={rankings.lowestDaily} getValue={a => formatCurrency(getDailyCost(a, allAccessories))} />
          <RankingSection title="🔥 最大亏损 Top10" items={rankings.mostLoss} getValue={a => formatCurrency(getLoss(a, allAccessories))} />
          <RankingSection title="💎 最保值 Top10" items={rankings.bestRetention} getValue={a => `${(getRetentionRate(a, allAccessories) * 100).toFixed(1)}%`} />
        </>
      )}

      {tab === 'category' && (
        <div className="space-y-3">
          {categoryStats.map(cs => {
            const cat = categories.find(c => c.id === cs.categoryId);
            return (
              <div key={cs.categoryId} className="bg-white rounded-2xl p-4 border border-[#E5E5E5]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{cat?.icon}</span>
                  <span className="font-semibold text-sm">{cat?.name}</span>
                  <span className="text-xs text-[#8E8E93]">{cs.count}个</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>投入: <span className="font-bold">{formatCurrency(cs.invested)}</span></div>
                  <div>估值: <span className="font-bold">{formatCurrency(cs.value)}</span></div>
                  <div>亏损: <span className="font-bold text-[#FF4D4F]">{formatCurrency(cs.loss)}</span></div>
                  <div>均日: <span className="font-bold">{formatCurrency(cs.avgDaily)}</span></div>
                </div>
              </div>
            );
          })}
          {categoryStats.length === 0 && <div className="text-center py-8 text-[#8E8E93]">暂无数据</div>}
        </div>
      )}

      {tab === 'brand' && (
        <div className="space-y-3">
          {brandStats.map(bs => (
            <div key={bs.brand} className="bg-white rounded-2xl p-4 border border-[#E5E5E5]">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-sm">{bs.brand}</span>
                <span className="text-xs text-[#8E8E93]">{bs.count}个</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>投入: <span className="font-bold">{formatCurrency(bs.invested)}</span></div>
                <div>估值: <span className="font-bold">{formatCurrency(bs.value)}</span></div>
                <div>亏损: <span className="font-bold text-[#FF4D4F]">{formatCurrency(bs.loss)}</span></div>
              </div>
            </div>
          ))}
          {brandStats.length === 0 && <div className="text-center py-8 text-[#8E8E93]">暂无数据</div>}
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl p-3 border border-[#E5E5E5]">
      <div className="text-[10px] text-[#8E8E93] mb-1">{label}</div>
      <div className="text-base font-bold" style={{ color: color || '#1D1D1F' }}>{value}</div>
    </div>
  );
}

function RankingSection({ title, items, getValue }: { title: string; items: any[]; getValue: (a: any) => string }) {
  if (items.length === 0) return null;
  return (
    <div className="bg-white rounded-2xl p-4 border border-[#E5E5E5] mb-3">
      <h3 className="text-sm font-semibold text-[#1D1D1F] mb-3">{title}</h3>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={item.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-xs text-[#8E8E93] w-5">{i + 1}</span>
              <span className="text-sm truncate">{item.name}</span>
            </div>
            <span className="text-sm font-bold shrink-0 ml-2">{getValue(item)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
