import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBackup, useSnapshots } from '../hooks/useLiveQuery';
import type { BackupData } from '../types';

function validateBackup(data: unknown): data is BackupData {
  if (!data || typeof data !== 'object') return false;
  const value = data as Partial<BackupData>;
  return (
    (value.appName === 'DuoShou' || value.appName === '剁手') &&
    value.schemaVersion === 1 &&
    Array.isArray(value.assets) &&
    Array.isArray(value.categories) &&
    Array.isArray(value.tags) &&
    Array.isArray(value.accessories) &&
    Array.isArray(value.usageRecords) &&
    (Array.isArray(value.wishlistItems) || Array.isArray(value.wishlist))
  );
}

export default function Backup() {
  const navigate = useNavigate();
  const snapshots = useSnapshots();
  const { exportData, importData, restoreSnapshot, deleteSnapshot } = useBackup();
  const [message, setMessage] = useState('');

  const handleExport = async () => {
    const data = await exportData();
    const stamp = new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '-');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `duoshou-backup-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('已生成 JSON 备份文件。');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async event => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const parsed = JSON.parse(await file.text());
        if (!validateBackup(parsed)) {
          setMessage('导入失败：文件格式不正确或版本不支持。');
          return;
        }
        if (!confirm('导入后将覆盖当前数据。系统会先自动保存一份当前数据快照。')) return;
        await importData(parsed);
        setMessage('导入成功。');
      } catch {
        setMessage('导入失败：读取失败或 JSON 损坏。');
      }
    };
    input.click();
  };

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-sm text-[#8E8E93]">← 返回</button>
        <h1 className="text-lg font-bold text-[#1D1D1F]">备份与恢复</h1>
        <span className="w-8" />
      </div>

      <section className="bg-white rounded-2xl p-4 space-y-3">
        <button onClick={handleExport} className="w-full btn-accent py-4 rounded-xl text-base">
          导出全部数据
        </button>
        <button onClick={handleImport} className="w-full btn-primary py-4 rounded-xl text-base">
          导入备份
        </button>
        {message && <div className="text-xs text-[#8E8E93]">{message}</div>}
      </section>

      <section className="bg-white rounded-2xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-[#1D1D1F]">本地自动快照</h2>
        {snapshots.length === 0 ? (
          <div className="text-xs text-[#8E8E93]">暂无快照。导入或清空数据前会自动生成。</div>
        ) : (
          snapshots.map(snapshot => (
            <div key={snapshot.id} className="flex items-center justify-between bg-[#F5F5F3] rounded-xl px-3 py-2">
              <div>
                <div className="text-xs text-[#1D1D1F]">{snapshot.name}</div>
                <div className="text-[10px] text-[#8E8E93]">{new Date(snapshot.createdAt).toLocaleString('zh-CN')}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => restoreSnapshot(snapshot.id)} className="text-[#1D1D1F] text-xs">恢复</button>
                <button onClick={() => deleteSnapshot(snapshot.id)} className="text-[#1D1D1F] text-xs">删除</button>
              </div>
            </div>
          ))
        )}
      </section>

      <section className="bg-white rounded-2xl p-4 text-xs text-[#8E8E93] leading-5">
        数据全部保存在本机 IndexedDB。导出的 JSON 可以保存到手机文件夹、百度网盘、NAS 或电脑硬盘；换手机或清空浏览器数据前请先导出。
      </section>
    </div>
  );
}
