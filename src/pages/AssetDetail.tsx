import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAsset, useAssetAccessories, useAssetUsageRecords, useAssetMutations, useUsageRecordMutations } from '../hooks/useLiveQuery';
import { calcAssetMetrics, formatMoney, formatDays, formatNumber } from '../utils/calculations';
import { STATUS_LABELS, STATUS_COLORS, ACCESSORY_TYPE_LABELS } from '../types';

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const asset = useAsset(id);
  const accessories = useAssetAccessories(id);
  const usageRecords = useAssetUsageRecords(id);
  const { remove } = useAssetMutations();
  const { add: addUsage, remove: removeUsage } = useUsageRecordMutations();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newUsageNote, setNewUsageNote] = useState('');
  const [showUsageForm, setShowUsageForm] = useState(false);

  if (!asset) {
    return (
      <div className="text-center py-20">
        <div className="text-3xl mb-2">🔍</div>
        <div className="text-sm text-[#8E8E93]">资产不存在</div>
      </div>
    );
  }

  const metrics = calcAssetMetrics(asset, accessories);

  const handleDelete = async () => {
    await remove(asset.id);
    navigate('/assets');
  };

  const handleAddUsage = async () => {
    if (!id) return;
    await addUsage({
      assetId: id,
      date: new Date().toISOString().split('T')[0],
      note: newUsageNote,
    });
    setNewUsageNote('');
    setShowUsageForm(false);
  };

  const handleRecordUsage = async () => {
    if (!id) return;
    await addUsage({
      assetId: id,
      date: new Date().toISOString().split('T')[0],
      note: '',
    });
  };

  // 消费复盘
  const postmortem = asset.postmortem;

  return (
    <div className="space-y-4 pb-8">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-sm text-[#8E8E93]">← 返回</button>
        <h1 className="text-lg font-bold text-[#1D1D1F] truncate flex-1 text-center px-2">{asset.name}</h1>
        <button onClick={() => navigate(`/assets/${id}/edit`)} className="text-sm text-[#B7F23A] font-semibold">编辑</button>
      </div>

      {/* 资产头像 */}
      <div className="bg-white rounded-3xl p-6 text-center">
        <div className="w-20 h-20 bg-[#F5F5F3] rounded-2xl flex items-center justify-center text-4xl mx-auto mb-3">
          {asset.imageUri ? (
            <img src={asset.imageUri} alt="" className="w-full h-full object-cover rounded-2xl" />
          ) : (
            '📦'
          )}
        </div>
        <h2 className="text-xl font-bold text-[#1D1D1F]">{asset.name}</h2>
        <div className="text-sm text-[#8E8E93] mt-1">
          {asset.brand && `${asset.brand} · `}{asset.model}
        </div>
        <span
          className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: STATUS_COLORS[asset.status] + '20',
            color: STATUS_COLORS[asset.status],
          }}
        >
          {STATUS_LABELS[asset.status]}
        </span>
      </div>

      {/* 核心指标 */}
      <div className="bg-white rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-[#1D1D1F] mb-3">核心指标</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#F5F5F3] rounded-xl p-3">
            <div className="text-lg font-bold text-[#1D1D1F]">{formatMoney(asset.purchasePrice, asset.currency)}</div>
            <div className="text-[10px] text-[#8E8E93]">购买价</div>
          </div>
          <div className="bg-[#F5F5F3] rounded-xl p-3">
            <div className="text-lg font-bold text-[#1D1D1F]">{formatMoney(metrics.totalCost, asset.currency)}</div>
            <div className="text-[10px] text-[#8E8E93]">总成本（含配件）</div>
          </div>
          <div className="bg-[#F5F5F3] rounded-xl p-3">
            <div className="text-lg font-bold text-[#1D1D1F]">
              {asset.currentValue > 0 ? formatMoney(asset.currentValue, asset.currency) : '—'}
            </div>
            <div className="text-[10px] text-[#8E8E93]">当前估值</div>
          </div>
          <div className="bg-[#F5F5F3] rounded-xl p-3">
            <div className="text-lg font-bold text-[#1D1D1F]">{formatDays(metrics.usedDays)}</div>
            <div className="text-[10px] text-[#8E8E93]">已使用天数</div>
          </div>
          <div className="bg-[#F5F5F3] rounded-xl p-3">
            <div className="text-lg font-bold text-[#B7F23A]">{formatMoney(metrics.dailyCost, asset.currency)}</div>
            <div className="text-[10px] text-[#8E8E93]">日均成本</div>
          </div>
          <div className="bg-[#F5F5F3] rounded-xl p-3">
            <div className="text-lg font-bold text-[#FF4D4F]">{formatMoney(metrics.loss, asset.currency)}</div>
            <div className="text-[10px] text-[#8E8E93]">亏损</div>
          </div>
          <div className="bg-[#F5F5F3] rounded-xl p-3 col-span-2">
            <div className="text-lg font-bold text-[#1D1D1F]">{(metrics.retainRate * 100).toFixed(1)}%</div>
            <div className="text-[10px] text-[#8E8E93]">保值率</div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, metrics.retainRate * 100)}%`,
                  backgroundColor: metrics.retainRate > 0.7 ? '#52c41a' : metrics.retainRate > 0.3 ? '#faad14' : '#ff4d4f',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 成本测算区 */}
      <div className="bg-white rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-[#1D1D1F] mb-3">成本测算</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#8E8E93]">购买价</span>
            <span className="text-[#1D1D1F]">{formatMoney(asset.purchasePrice, asset.currency)}</span>
          </div>
          {accessories.filter(a => a.includedInCost).map(acc => (
            <div key={acc.id} className="flex justify-between text-sm">
              <span className="text-[#8E8E93]">+ {acc.name} ({ACCESSORY_TYPE_LABELS[acc.type]})</span>
              <span className="text-[#1D1D1F]">{formatMoney(acc.price, asset.currency)}</span>
            </div>
          ))}
          <div className="border-t border-gray-100 pt-2 flex justify-between text-sm font-semibold">
            <span className="text-[#1D1D1F]">总成本</span>
            <span className="text-[#1D1D1F]">{formatMoney(metrics.totalCost, asset.currency)}</span>
          </div>
          {asset.currentValue > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[#8E8E93]">- 当前估值</span>
              <span className="text-[#52c41a]">{formatMoney(asset.currentValue, asset.currency)}</span>
            </div>
          )}
          <div className="border-t border-gray-100 pt-2 flex justify-between text-sm font-bold">
            <span className="text-[#FF4D4F]">净成本</span>
            <span className="text-[#FF4D4F]">{formatMoney(metrics.netCost, asset.currency)}</span>
          </div>
        </div>
      </div>

      {/* 目标测算器 */}
      {asset.targetDailyCost > 0 && (
        <div className="bg-white rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-[#1D1D1F] mb-3">🎯 目标测算</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#8E8E93]">目标日均成本</span>
              <span className="text-[#1D1D1F]">{formatMoney(asset.targetDailyCost, asset.currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#8E8E93]">需使用天数</span>
              <span className="text-[#1D1D1F]">{formatDays(metrics.targetDays)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#8E8E93]">已使用</span>
              <span className="text-[#52c41a]">{formatDays(metrics.usedDays)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-[#1D1D1F]">还需</span>
              <span className={metrics.remainingDays <= 0 ? 'text-[#52c41a]' : 'text-[#FF4D4F]'}>
                {metrics.remainingDays <= 0 ? '已达标！' : formatDays(metrics.remainingDays)}
              </span>
            </div>
            {metrics.targetDays > 0 && (
              <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (metrics.usedDays / metrics.targetDays) * 100)}%`,
                    backgroundColor: metrics.remainingDays <= 0 ? '#52c41a' : '#B7F23A',
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 卖出测算器（仅服役中/闲置） */}
      {(asset.status === 'active' || asset.status === 'idle') && asset.currentValue > 0 && (
        <div className="bg-white rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-[#1D1D1F] mb-3">💰 卖出测算</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#8E8E93]">以当前估值卖出</span>
              <span className="text-[#1D1D1F]">{formatMoney(asset.currentValue, asset.currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#8E8E93]">亏损</span>
              <span className="text-[#FF4D4F]">{formatMoney(metrics.loss, asset.currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#8E8E93]">回收率</span>
              <span className="text-[#1D1D1F]">{(metrics.retainRate * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* 使用记录 */}
      <div className="bg-white rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#1D1D1F]">使用记录</h3>
          <div className="flex gap-2">
            <button
              onClick={handleRecordUsage}
              className="bg-[#B7F23A] text-[#111111] px-3 py-1 rounded-full text-xs font-semibold"
            >
              +1 次
            </button>
            <button
              onClick={() => setShowUsageForm(!showUsageForm)}
              className="bg-[#F5F5F3] text-[#1D1D1F] px-3 py-1 rounded-full text-xs"
            >
              添加记录
            </button>
          </div>
        </div>

        {showUsageForm && (
          <div className="flex gap-2 mb-3">
            <input
              placeholder="备注（可选）"
              value={newUsageNote}
              onChange={e => setNewUsageNote(e.target.value)}
              className="flex-1 bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none"
            />
            <button onClick={handleAddUsage} className="bg-[#111111] text-white px-3 py-2 rounded-xl text-xs">
              确定
            </button>
          </div>
        )}

        {usageRecords.length === 0 ? (
          <div className="text-center py-4 text-xs text-[#8E8E93]">暂无使用记录</div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {[...usageRecords].reverse().map(record => (
              <div key={record.id} className="flex items-center justify-between bg-[#F5F5F3] rounded-xl px-3 py-2">
                <div>
                  <div className="text-sm text-[#1D1D1F]">{record.date}</div>
                  {record.note && <div className="text-[10px] text-[#8E8E93]">{record.note}</div>}
                </div>
                <button onClick={() => removeUsage(record.id)} className="text-[#8E8E93] text-xs">删除</button>
              </div>
            ))}
          </div>
        )}
        <div className="mt-2 text-xs text-[#8E8E93]">共 {asset.useCount} 次使用</div>
      </div>

      {/* 消费复盘 */}
      <div className="bg-white rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-[#1D1D1F] mb-3">📝 消费复盘</h3>
        {postmortem ? (
          <div className="space-y-2">
            {postmortem.satisfaction > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#8E8E93]">满意度</span>
                <span className="text-lg">
                  {'⭐'.repeat(postmortem.satisfaction)}
                </span>
              </div>
            )}
            {postmortem.worthIt && (
              <div>
                <div className="text-xs text-[#8E8E93]">值不值</div>
                <div className="text-sm text-[#1D1D1F]">{postmortem.worthIt}</div>
              </div>
            )}
            {postmortem.wouldBuyAgain && (
              <div>
                <div className="text-xs text-[#8E8E93]">会再买吗</div>
                <div className="text-sm text-[#1D1D1F]">{postmortem.wouldBuyAgain}</div>
              </div>
            )}
            {postmortem.biggestMistake && (
              <div>
                <div className="text-xs text-[#8E8E93]">最大失误</div>
                <div className="text-sm text-[#1D1D1F]">{postmortem.biggestMistake}</div>
              </div>
            )}
            {postmortem.advice && (
              <div>
                <div className="text-xs text-[#8E8E93]">建议</div>
                <div className="text-sm text-[#1D1D1F]">{postmortem.advice}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="text-xs text-[#8E8E93] mb-2">还没有复盘</div>
            <button
              onClick={() => navigate(`/assets/${id}/edit`)}
              className="bg-[#F5F5F3] text-[#1D1D1F] px-4 py-2 rounded-xl text-xs"
            >
              去编辑复盘
            </button>
          </div>
        )}
      </div>

      {/* 备注 */}
      {asset.note && (
        <div className="bg-white rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-[#1D1D1F] mb-2">备注</h3>
          <p className="text-sm text-[#8E8E93] whitespace-pre-wrap">{asset.note}</p>
        </div>
      )}

      {/* 删除按钮 */}
      <div className="pt-4">
        {showDeleteConfirm ? (
          <div className="bg-red-50 rounded-2xl p-4 text-center space-y-2">
            <div className="text-sm text-[#FF4D4F] font-medium">确定删除「{asset.name}」？</div>
            <div className="text-xs text-[#8E8E93]">将同时删除所有配件和使用记录，此操作不可撤销</div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl text-sm bg-gray-100"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl text-sm bg-[#FF4D4F] text-white"
              >
                确认删除
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-3 text-sm text-[#FF4D4F] bg-white rounded-2xl"
          >
            删除资产
          </button>
        )}
      </div>
    </div>
  );
}
