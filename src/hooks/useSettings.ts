import { useCategories as useCategoriesRaw, useTags as useTagsRaw, useSettings as useSettingsRaw, useSettingsMutations, useCategoryMutations, useTagMutations } from './useLiveQuery';

export function useCategories() {
  const categories = useCategoriesRaw();
  return { categories };
}

export function useTags() {
  const tags = useTagsRaw();
  return { tags };
}

export function useSettings() {
  return useSettingsRaw();
}

export { useSettingsMutations, useCategoryMutations, useTagMutations };
