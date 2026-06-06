import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';
import FAB from './FAB';
import ImportHandler from './ImportHandler';

export default function Layout() {
  const location = useLocation();
  const hideFab = /^\/(assets|wishlist)\/(new|[^/]+\/edit)$/.test(location.pathname);

  return (
    <div className="app-shell min-h-screen max-w-[430px] mx-auto relative pb-20">
      <Outlet />
      {!hideFab && <FAB />}
      <BottomNav />
      <ImportHandler />
    </div>
  );
}
