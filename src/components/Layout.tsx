import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import FAB from './FAB';
import ImportHandler from './ImportHandler';

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#F5F5F3] max-w-[430px] mx-auto relative pb-20">
      <Outlet />
      <FAB />
      <BottomNav />
      <ImportHandler />
    </div>
  );
}
