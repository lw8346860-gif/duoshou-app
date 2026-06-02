import { useLocation, useNavigate } from 'react-router-dom';

const tabs = [
  { path: '/', label: '首页', icon: 'home' },
  { path: '/assets', label: '资产', icon: 'assets' },
  { path: '/wishlist', label: '心愿', icon: 'wishlist' },
  { path: '/stats', label: '统计', icon: 'stats' },
  { path: '/settings', label: '设置', icon: 'settings' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center h-16 z-50 max-w-[430px] mx-auto">
      {tabs.map(tab => {
        const active = location.pathname === tab.path || (tab.path !== '/' && location.pathname.startsWith(tab.path));
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              active ? 'text-[#1D1D1F]' : 'text-[#8E8E93]'
            }`}
          >
            <span className={`nav-icon nav-${tab.icon}`} aria-hidden="true" />
            <span className={`text-[10px] mt-0.5 ${active ? 'font-semibold' : ''}`}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
