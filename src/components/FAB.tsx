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
        <div className="fixed bottom-40 right-5 z-50 flex flex-col gap-2 items-end">
          <button
            onClick={() => { setOpen(false); navigate('/assets/new'); }}
            className="btn-secondary flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-sm active:scale-95 transition-transform"
          >
            <span className="menu-icon menu-icon-asset" aria-hidden="true" /> 新增资产
          </button>
          <button
            onClick={() => { setOpen(false); navigate('/wishlist/new'); }}
            className="btn-secondary flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-sm active:scale-95 transition-transform"
          >
            <span className="menu-icon menu-icon-wishlist" aria-hidden="true" /> 新增心愿
          </button>
          <button
            onClick={() => { setOpen(false); navigate('/settings/backup'); }}
            className="btn-secondary flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-sm active:scale-95 transition-transform"
          >
            <span className="menu-icon menu-icon-import" aria-hidden="true" /> 导入备份
          </button>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fab-button fixed bottom-24 right-5 z-50 w-14 h-14 rounded-full text-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"
      >
        <span className={`transition-transform duration-200 ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
    </>
  );
}
