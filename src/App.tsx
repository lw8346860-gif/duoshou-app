import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AssetList from './pages/AssetList';
import AssetForm from './pages/AssetForm';
import AssetDetail from './pages/AssetDetail';
import Wishlist from './pages/Wishlist';
import WishlistDetail from './pages/WishlistDetail';
import WishlistForm from './pages/WishlistForm';
import Stats from './pages/Stats';
import Settings from './pages/Settings';
import Backup from './pages/Backup';
import About from './pages/About';
import { useCategoryMutations, useSettings, useTagMutations } from './hooks/useLiveQuery';

export default function App() {
  const { initDefaults: initCats } = useCategoryMutations();
  const { initDefaults: initTags } = useTagMutations();
  const settings = useSettings();

  useEffect(() => {
    initCats();
    initTags();
  }, [initCats, initTags]);

  useEffect(() => {
    const mode = settings?.themeMode ?? settings?.theme ?? 'light';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolved = mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode;
    document.documentElement.dataset.theme = resolved;
  }, [settings?.theme, settings?.themeMode]);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/assets" element={<AssetList />} />
        <Route path="/assets/new" element={<AssetForm />} />
        <Route path="/assets/:id" element={<AssetDetail />} />
        <Route path="/assets/:id/edit" element={<AssetForm />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/wishlist/new" element={<WishlistForm />} />
        <Route path="/wishlist/:id" element={<WishlistDetail />} />
        <Route path="/wishlist/:id/edit" element={<WishlistForm />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/backup" element={<Backup />} />
        <Route path="/settings/categories" element={<Settings />} />
        <Route path="/settings/tags" element={<Settings />} />
        <Route path="/about" element={<About />} />
      </Route>
    </Routes>
  );
}
