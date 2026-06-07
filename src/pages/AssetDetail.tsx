import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAsset, useAssetAccessories, useAssetUsageRecords, useAssetMutations, useBackup, useUsageRecordMutations, useCategories } from '../hooks/useLiveQuery';
import { calcAssetMetrics, formatMoney, formatDays, getCurrentValue } from '../utils/calculations';
import { STATUS_LABELS, ACCESSORY_TYPE_LABELS } from '../types';
import CategoryIcon from '../components/CategoryIcon';

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const asset = useAsset(id);
  const accessories = useAssetAccessories(id);
  const usageRecords = useAssetUsageRecords(id);
  const categories = useCategories();
  const { remove } = useAssetMutations();
  const { update } = useAssetMutations();
  const { createSnapshot } = useBackup();
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
  const dailyNetProfitLoss = -metrics.dailyNetHoldingCost;
  const category = categories.find(cat => cat.id === asset.categoryId);

  const handleDelete = async () => {
    await createSnapshot(`删除「${asset.name}」前自动备份`);
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

  const markStatus = async (status: 'active' | 'idle' | 'retired') => {
    if (!id) return;
    const today = new Date().toISOString().split('T')[0];
    if (status === 'retired') {
      await update(id, { status, retiredDate: asset.retiredDate ?? today });
    } else {
      await update(id, { status });
    }
  };

  // 消费复盘
  const postmortem = asset.postmortem;

  return (
    <div className="page-safe space-y-4 pb-8">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="back-button">←</button>
        <h1 className="text-lg font-bold text-[#1D1D1F] truncate flex-1 text-center px-2">{asset.name}</h1>
        <div className="w-10" />
      </div>

      {/* 资产头像 */}
      <div className="bg-white rounded-3xl p-6 text-center">
        <div className="asset-cover asset-cover-large mx-auto mb-3">
          {asset.imageUri ? (
            <img src={asset.imageUri} alt="" className="w-full h-full object-cover rounded-2xl" />
          ) : (
            <CategoryIcon category={category} />
          )}
        </div>
        <h2 className="text-xl font-bold text-[#1D1D1F]">{asset.name}</h2>
        <span className="status-pill inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs font-medium">
          <span className="status-dot" />
          {STATUS_LABELS[asset.status]}
        </span>
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button onClick={handleRecordUsage} className="bg-[#B7F23A] text-[#111111] py-2 rounded-xl text-xs font-semibold">
            今天用了
          </button>
          <button onClick={() => markStatus('active')} className="bg-[#F5F5F3] text-[#1D1D1F] py-2 rounded-xl text-xs">
            服役
          </button>
          <button onClick={() => markStatus('idle')} className="bg-[#F5F5F3] text-[#1D1D1F] py-2 rounded-xl text-xs">
            闲置
          </button>
          <button onClick={() => markStatus('retired')} className="bg-[#F5F5F3] text-[#1D1D1F] py-2 rounded-xl text-xs">
            退役
          </button>
        </div>
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
              {formatMoney(getCurrentValue(asset), asset.currency)}
            </div>
            <div className="text-[10px] text-[#8E8E93]">{asset.currentValue > 0 ? '当前估值' : '折旧估值'}</div>
          </div>
          <div className="bg-[#F5F5F3] rounded-xl p-3">
            <div className="text-lg font-bold text-[#1D1D1F]">{formatMoney(metrics.debtBalance, asset.currency)}</div>
            <div className="text-[10px] text-[#8E8E93]">负债余额</div>
          </div>
          <div className="bg-[#F5F5F3] rounded-xl p-3">
            <div className="text-lg font-bold text-[#1D1D1F]">{formatMoney(metrics.netAssetValue, asset.currency)}</div>
            <div className="text-[10px] text-[#8E8E93]">净资产</div>
          </div>
          <div className="bg-[#F5F5F3] rounded-xl p-3">
            <div className="text-lg font-bold text-[#1D1D1F]">{formatDays(metrics.usedDays)}</div>
            <div className="text-[10px] text-[#8E8E93]">已使用天数</div>
          </div>
          <div className="bg-[#F5F5F3] rounded-xl p-3">
            <div className="text-lg font-bold text-[#1D1D1F]">{formatMoney(dailyNetProfitLoss, asset.currency)}</div>
            <div className="text-[10px] text-[#8E8E93]">日均净损益</div>
          </div>
          <div className="bg-[#F5F5F3] rounded-xl p-3">
            <div className="text-lg font-bold text-[#1D1D1F]">{formatMoney(metrics.dailyCost, asset.currency)}</div>
            <div className="text-[10px] text-[#8E8E93]">日均折耗成本</div>
          </div>
          <div className="bg-[#F5F5F3] rounded-xl p-3 col-span-2">
            <div className="text-lg font-bold text-[#1D1D1F]">{(metrics.retainRate * 100).toFixed(1)}%</div>
            <div className="text-[10px] text-[#8E8E93]">保值率</div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div
                className="progress-fill h-1.5 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, metrics.retainRate * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {(metrics.monthlyIncome > 0 || metrics.monthlyCost > 0) && (
        <div className="bg-white rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-[#1D1D1F] mb-3">现金流</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#F5F5F3] rounded-xl p-3 col-span-2">
              <div className="text-xl font-bold text-[#1D1D1F]">{formatMoney(metrics.netMonthlyCashflow, asset.currency)}</div>
              <div className="text-[10px] text-[#8E8E93]">月净现金流</div>
            </div>
            <div className="bg-[#F5F5F3] rounded-xl p-3">
              <div className="text-lg font-bold text-[#1D1D1F]">{formatMoney(metrics.monthlyIncome, asset.currency)}</div>
              <div className="text-[10px] text-[#8E8E93]">月收入</div>
            </div>
            <div className="bg-[#F5F5F3] rounded-xl p-3">
              <div className="text-lg font-bold text-[#1D1D1F]">{formatMoney(metrics.monthlyPayment, asset.currency)}</div>
              <div className="text-[10px] text-[#8E8E93]">当前月供</div>
            </div>
            <div className="bg-[#F5F5F3] rounded-xl p-3">
              <div className="text-lg font-bold text-[#1D1D1F]">{formatMoney(metrics.monthlyMaintenanceCost, asset.currency)}</div>
              <div className="text-[10px] text-[#8E8E93]">月维护</div>
            </div>
            <div className="bg-[#F5F5F3] rounded-xl p-3">
              <div className="text-lg font-bold text-[#1D1D1F]">{formatMoney(metrics.monthlyOtherCost, asset.currency)}</div>
              <div className="text-[10px] text-[#8E8E93]">其他月成本</div>
            </div>
            <div className="bg-[#F5F5F3] rounded-xl p-3">
              <div className="text-lg font-bold text-[#1D1D1F]">{formatMoney(metrics.totalIncome, asset.currency)}</div>
              <div className="text-[10px] text-[#8E8E93]">累计收入</div>
            </div>
            <div className="bg-[#F5F5F3] rounded-xl p-3">
              <div className="text-lg font-bold text-[#1D1D1F]">{formatMoney(metrics.netHoldingCost, asset.currency)}</div>
              <div className="text-[10px] text-[#8E8E93]">净持有成本</div>
            </div>
          </div>
        </div>
      )}

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
          <div className="flex justify-between text-sm">
            <span className="text-[#8E8E93]">- {asset.currentValue > 0 ? '当前估值' : '折旧估值'}</span>
            <span className="text-[#1D1D1F]">{formatMoney(getCurrentValue(asset), asset.currency)}</span>
          </div>
          <div className="border-t border-gray-100 pt-2 flex justify-between text-sm font-bold">
            <span className="text-[#1D1D1F]">净持有成本</span>
            <span className="text-[#1D1D1F]">{formatMoney(metrics.netHoldingCost, asset.currency)}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-100">
          {[30, 90, 180, 365].map(days => (
            <div key={days} className="bg-[#F5F5F3] rounded-xl p-2">
              <div className="text-xs text-[#8E8E93]">继续使用 {days} 天</div>
              <div className="text-sm font-bold text-[#1D1D1F]">
                {formatMoney(metrics.netHoldingCost / Math.max(1, metrics.usedDays + days), asset.currency)}/天
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 目标测算器 */}
      {asset.targetDailyCost > 0 && (
        <div className="bg-white rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-[#1D1D1F] mb-3">目标测算</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#8E8E93]">目标日均持有成本</span>
              <span className="text-[#1D1D1F]">{formatMoney(asset.targetDailyCost, asset.currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#8E8E93]">需使用天数</span>
              <span className="text-[#1D1D1F]">{formatDays(metrics.targetDays)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#8E8E93]">已使用</span>
              <span className="text-[#1D1D1F]">{formatDays(metrics.usedDays)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-[#1D1D1F]">还需</span>
              <span className="text-[#1D1D1F]">
                {metrics.remainingDays <= 0 ? '已达标！' : formatDays(metrics.remainingDays)}
              </span>
            </div>
            {metrics.estimatedTargetDate && (
              <div className="flex justify-between text-sm">
                <span className="text-[#8E8E93]">预计达到日期</span>
                <span className="text-[#1D1D1F]">{metrics.estimatedTargetDate}</span>
              </div>
            )}
            {metrics.targetDays > 0 && (
              <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                <div
                  className="progress-fill h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (metrics.usedDays / metrics.targetDays) * 100)}%` }}
                />
              </div>
            )}
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
            <button onClick={handleAddUsage} className="btn-primary px-3 py-2 rounded-xl text-xs">
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
            {(postmortem.satisfaction ?? 0) > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#8E8E93]">满意度</span>
                <span className="text-lg">
                  {'⭐'.repeat(postmortem.satisfaction ?? 0)}
                </span>
              </div>
            )}
            {(postmortem.finalVerdict || postmortem.worthIt) && (
              <div>
                <div className="text-xs text-[#8E8E93]">值不值</div>
                <div className="text-sm text-[#1D1D1F]">{postmortem.finalVerdict || postmortem.worthIt}</div>
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
            {(postmortem.adviceToPastSelf || postmortem.advice) && (
              <div>
                <div className="text-xs text-[#8E8E93]">建议</div>
                <div className="text-sm text-[#1D1D1F]">{postmortem.adviceToPastSelf || postmortem.advice}</div>
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

      {/* 底部操作 */}
      <div className="pt-4 space-y-2">
        {showDeleteConfirm ? (
          <div className="delete-confirm rounded-2xl p-4 text-center space-y-2">
            <div className="text-sm text-[#1D1D1F] font-medium">确定删除「{asset.name}」？</div>
            <div className="text-xs text-[#8E8E93]">将同时删除使用记录，此操作不可撤销</div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary px-4 py-2 rounded-xl text-sm"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="btn-danger px-4 py-2 rounded-xl text-sm"
              >
                确认删除
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => navigate(`/assets/${id}/edit`)}
              className="btn-primary py-3 rounded-2xl text-sm"
            >
              编辑资产
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn-secondary py-3 rounded-2xl text-sm"
            >
              删除资产
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
