import { useState } from 'react';
import { useSettings, useSettingsMutations, useCategories, useCategoryMutations, useTags, useTagMutations, useBackup, useSnapshots } from '../hooks/useLiveQuery';
import { v4 as uuidv4 } from 'uuid';

export default function Settings() {
  const settings = useSettings();
  const { update: updateSettings } = useSettingsMutations();
  const categories = useCategories();
  const { add: addCat, remove: removeCat, initDefaults: initCats } = useCategoryMutations();
  const tags = useTags();
  const { add: addTag, remove: removeTag, initDefaults: initTags } = useTagMutations();
  const snapshots = useSnapshots();
  const { exportData, importData, clearAll, restoreSnapshot, deleteSnapshot } = useBackup();

  const [showCatForm, setShowCatForm] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📦');
  const [showTagForm, setShowTagForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#1890ff');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // 初始化默认数据
  const handleInitDefaults = async () => {
    await initCats();
    await initTags();
  };

  // 分类管理
  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    await addCat({
      id: `cat-${uuidv4().slice(0, 8)}`,
      name: newCatName,
      icon: newCatIcon,
      order: categories.length,
    });
    setNewCatName('');
    setNewCatIcon('📦');
    setShowCatForm(false);
  };

  // 标签管理
  const handleAddTag = async () => {
    if (!newTagName.trim()) return;
    await addTag({
      id: `tag-${uuidv4().slice(0, 8)}`,
      name: newTagName,
      color: newTagColor,
    });
    setNewTagName('');
    setShowTagForm(false);
  };

  // 导出
  const handleExport = async () => {
    const data = await exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `剁手备份_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 导入
  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        await importData(data);
        alert('导入成功！');
      } catch {
        alert('导入失败：文件格式错误');
      }
    };
    input.click();
  };

  // 清空
  const handleClear = async () => {
    await clearAll();
    setShowClearConfirm(false);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-[#1D1D1F]">设置</h1>

      {/* 基础设置 */}
      <section className="bg-white rounded-2xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-[#1D1D1F]">基础设置</h2>
        <div>
          <label className="text-xs text-[#8E8E93]">默认货币</label>
          <select
            value={settings?.currency ?? 'CNY'}
            onChange={e => updateSettings({ currency: e.target.value })}
            className="w-full bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none mt-1"
          >
            <option value="CNY">CNY ¥</option>
            <option value="USD">USD $</option>
            <option value="EUR">EUR €</option>
            <option value="JPY">JPY ¥</option>
            <option value="GBP">GBP £</option>
            <option value="HKD">HKD $</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-[#8E8E93]">小数位数</label>
          <select
            value={settings?.decimalPlaces ?? 2}
            onChange={e => updateSettings({ decimalPlaces: Number(e.target.value) })}
            className="w-full bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none mt-1"
          >
            <option value={0}>0</option>
            <option value={1}>1</option>
            <option value={2}>2</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#1D1D1F]">千位分隔符</span>
          <input
            type="checkbox"
            checked={settings?.thousandsSeparator ?? true}
            onChange={e => updateSettings({ thousandsSeparator: e.target.checked })}
          />
        </div>
        <div>
          <label className="text-xs text-[#8E8E93]">时长显示</label>
          <select
            value={settings?.durationDisplay ?? 'auto'}
            onChange={e => updateSettings({ durationDisplay: e.target.value as 'days' | 'months' | 'years' | 'auto' })}
            className="w-full bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none mt-1"
          >
            <option value="auto">自动</option>
            <option value="days">天</option>
            <option value="months">月</option>
            <option value="years">年</option>
          </select>
        </div>
      </section>

      {/* 分类管理 */}
      <section className="bg-white rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#1D1D1F]">分类管理</h2>
          <button
            onClick={() => setShowCatForm(!showCatForm)}
            className="text-xs text-[#B7F23A] font-semibold"
          >
            + 添加
          </button>
        </div>
        {showCatForm && (
          <div className="flex gap-2">
            <input
              placeholder="图标"
              value={newCatIcon}
              onChange={e => setNewCatIcon(e.target.value)}
              className="w-12 bg-[#F5F5F3] rounded-xl px-2 py-2 text-sm outline-none text-center"
            />
            <input
              placeholder="名称"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              className="flex-1 bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none"
            />
            <button onClick={handleAddCategory} className="bg-[#111111] text-white px-3 py-2 rounded-xl text-xs">
              添加
            </button>
          </div>
        )}
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-[#1D1D1F]">{cat.icon} {cat.name}</span>
              <button onClick={() => removeCat(cat.id)} className="text-[#FF4D4F] text-xs">删除</button>
            </div>
          ))}
        </div>
      </section>

      {/* 标签管理 */}
      <section className="bg-white rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#1D1D1F]">标签管理</h2>
          <button
            onClick={() => setShowTagForm(!showTagForm)}
            className="text-xs text-[#B7F23A] font-semibold"
          >
            + 添加
          </button>
        </div>
        {showTagForm && (
          <div className="flex gap-2">
            <input
              type="color"
              value={newTagColor}
              onChange={e => setNewTagColor(e.target.value)}
              className="w-10 h-10 rounded-lg border-0 cursor-pointer"
            />
            <input
              placeholder="名称"
              value={newTagName}
              onChange={e => setNewTagName(e.target.value)}
              className="flex-1 bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none"
            />
            <button onClick={handleAddTag} className="bg-[#111111] text-white px-3 py-2 rounded-xl text-xs">
              添加
            </button>
          </div>
        )}
        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <span
              key={tag.id}
              className="px-2 py-1 rounded-full text-xs flex items-center gap-1"
              style={{ backgroundColor: tag.color + '20', color: tag.color }}
            >
              {tag.name}
              <button onClick={() => removeTag(tag.id)} className="ml-1 opacity-60 hover:opacity-100">×</button>
            </span>
          ))}
        </div>
      </section>

      {/* 数据管理 */}
      <section className="bg-white rounded-2xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-[#1D1D1F]">数据管理</h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleExport}
            className="bg-[#111111] text-white py-2.5 rounded-xl text-sm font-medium"
          >
            导出备份
          </button>
          <button
            onClick={handleImport}
            className="bg-[#F5F5F3] text-[#1D1D1F] py-2.5 rounded-xl text-sm font-medium"
          >
            导入恢复
          </button>
        </div>

        {/* 快照列表 */}
        {snapshots.length > 0 && (
          <div>
            <div className="text-xs text-[#8E8E93] mb-2">自动快照（最多10个）</div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {snapshots.map(snap => (
                <div key={snap.id} className="flex items-center justify-between bg-[#F5F5F3] rounded-xl px-3 py-2">
                  <div>
                    <div className="text-xs text-[#1D1D1F]">{snap.name}</div>
                    <div className="text-[10px] text-[#8E8E93]">{new Date(snap.createdAt).toLocaleString('zh-CN')}</div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        if (confirm('确定恢复此快照？当前数据将被覆盖。')) {
                          restoreSnapshot(snap.id);
                        }
                      }}
                      className="text-[#1890ff] text-xs px-2 py-1"
                    >
                      恢复
                    </button>
                    <button
                      onClick={() => deleteSnapshot(snap.id)}
                      className="text-[#FF4D4F] text-xs px-2 py-1"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 初始化默认数据 */}
        <button
          onClick={handleInitDefaults}
          className="w-full bg-[#F5F5F3] text-[#1D1D1F] py-2.5 rounded-xl text-sm"
        >
          初始化默认分类和标签
        </button>

        {/* 清空数据 */}
        {showClearConfirm ? (
          <div className="bg-red-50 rounded-xl p-3 text-center space-y-2">
            <div className="text-sm text-[#FF4D4F]">确定清空所有资产数据？</div>
            <div className="text-xs text-[#8E8E93]">将自动创建备份，但清空后需手动恢复</div>
            <div className="flex gap-2 justify-center">
              <button onClick={() => setShowClearConfirm(false)} className="px-4 py-2 rounded-xl text-sm bg-gray-100">
                取消
              </button>
              <button onClick={handleClear} className="px-4 py-2 rounded-xl text-sm bg-[#FF4D4F] text-white">
                确认清空
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="w-full py-2.5 rounded-xl text-sm text-[#FF4D4F] bg-red-50"
          >
            清空所有数据
          </button>
        )}
      </section>

      {/* 关于 */}
      <section className="bg-white rounded-2xl p-4 text-center">
        <div className="text-lg font-bold text-[#1D1D1F]">剁手</div>
        <div className="text-xs text-[#8E8E93] mt-1">v1.0.0</div>
        <div className="text-xs text-[#8E8E93] mt-2">买的时候冲动，以后慢慢算账</div>
        <div className="text-[10px] text-[#8E8E93] mt-2">所有数据存储在本地，零服务器、零账号</div>
      </section>
    </div>
  );
}
