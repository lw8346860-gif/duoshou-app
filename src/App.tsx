import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AssetList from './pages/AssetList';
import AssetForm from './pages/AssetForm';
import AssetDetail from './pages/AssetDetail';
import Wishlist from './pages/Wishlist';
import Stats from './pages/Stats';
import Settings from './pages/Settings';
import { useCategoryMutations, useTagMutations } from './hooks/useLiveQuery';

export default function App() {
  const { initDefaults: initCats } = useCategoryMutations();
  const { initDefaults: initTags } = useTagMutations();

  useEffect(() => {
    initCats();
    initTags();
  }, [initCats, initTags]);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/assets" element={<AssetList />} />
        <Route path="/assets/new" element={<AssetForm />} />
        <Route path="/assets/:id" element={<AssetDetail />} />
        <Route path="/assets/:id/edit" element={<AssetForm />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
