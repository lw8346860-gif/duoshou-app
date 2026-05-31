import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function FAB() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Menu */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex flex-col gap-2 items-end">
          <button
            onClick={() => { setOpen(false); navigate('/assets/new'); }}
            className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-full shadow-lg text-sm font-medium text-[#1D1D1F] border border-[#E5E5E5] active:scale-95 transition-transform"
          >
            <span className="text-base">📦</span> 新增资产
          </button>
          <button
            onClick={() => { setOpen(false); navigate('/wishlist/new'); }}
            className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-full shadow-lg text-sm font-medium text-[#1D1D1F] border border-[#E5E5E5] active:scale-95 transition-transform"
          >
            <span className="text-base">💝</span> 新增心愿
          </button>
          <button
            onClick={() => { setOpen(false); navigate('/settings/backup'); }}
            className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-full shadow-lg text-sm font-medium text-[#1D1D1F] border border-[#E5E5E5] active:scale-95 transition-transform"
          >
            <span className="text-base">📥</span> 导入备份
          </button>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-24 right-5 z-50 w-14 h-14 rounded-full bg-[#111111] text-white text-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}
      >
        <span className={`transition-transform duration-200 ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
    </>
  );
}
