import { useWishlistItems, useWishlistMutations } from './useLiveQuery';

export function useWishlist() {
  const items = useWishlistItems();
  const mutations = useWishlistMutations();
  return { items, ...mutations };
}
