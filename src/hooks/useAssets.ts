import {
  useAssets as useAssetsRaw,
  useAsset as useAssetRaw,
  useAccessories as useAccessoriesRaw,
  useAssetAccessories as useAssetAccessoriesRaw,
  useAssetMutations,
  useAccessoryMutations,
} from './useLiveQuery';

export function useAssets() {
  const assets = useAssetsRaw();
  return { assets };
}

export function useAsset(id: string | undefined) {
  return useAssetRaw(id);
}

export function useAccessories(assetId?: string) {
  return useAssetAccessoriesRaw(assetId);
}

export function useAllAccessories() {
  return useAccessoriesRaw();
}

export { useAssetMutations, useAccessoryMutations };
