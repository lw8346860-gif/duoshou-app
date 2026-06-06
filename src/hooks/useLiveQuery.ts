import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db';
import type { Asset, Accessory, WishlistItem, UsageRecord, Category, Tag, Settings, Snapshot } from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_TAGS, REMOVED_CATEGORY_IDS } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useCallback } from 'react';

// ===== Assets =====
export function useAssets() {
  const assets = useLiveQuery(() => db.assets.toArray()) ?? [];
  return assets;
}

export function useAsset(id: string | undefined) {
  return useLiveQuery(() => (id ? db.assets.get(id) : undefined), [id]) ?? null;
}

export function useAssetAccessories(assetId: string | undefined) {
  return useLiveQuery(
    () => (assetId ? db.accessories.where('assetId').equals(assetId).toArray() : []),
    [assetId],
  ) ?? [];
}

export function useAccessories() {
  return useLiveQuery(() => db.accessories.toArray()) ?? [];
}

export function useAssetUsageRecords(assetId: string | undefined) {
  return useLiveQuery(
    () => (assetId ? db.usageRecords.where('assetId').equals(assetId).sortBy('date') : []),
    [assetId],
  ) ?? [];
}

// ===== Mutations =====
export function useAssetMutations() {
  const add = useCallback(async (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const id = uuidv4();
    await db.assets.add({ ...asset, id, createdAt: now, updatedAt: now });
    return id;
  }, []);

  const update = useCallback(async (id: string, changes: Partial<Asset>) => {
    await db.assets.update(id, { ...changes, updatedAt: new Date().toISOString() });
  }, []);

  const remove = useCallback(async (id: string) => {
    await db.transaction('rw', [db.assets, db.accessories, db.usageRecords], async () => {
      await db.accessories.where('assetId').equals(id).delete();
      await db.usageRecords.where('assetId').equals(id).delete();
      await db.assets.delete(id);
    });
  }, []);

  return { add, update, remove };
}

export function useAccessoryMutations() {
  const add = useCallback(async (accessory: Omit<Accessory, 'id'>) => {
    const id = uuidv4();
    const now = new Date().toISOString();
    await db.accessories.add({ ...accessory, id, createdAt: now, updatedAt: now });
    return id;
  }, []);

  const update = useCallback(async (id: string, changes: Partial<Accessory>) => {
    await db.accessories.update(id, { ...changes, updatedAt: new Date().toISOString() });
  }, []);

  const remove = useCallback(async (id: string) => {
    await db.accessories.delete(id);
  }, []);

  return { add, update, remove };
}

// ===== Wishlist =====
export function useWishlistItems() {
  return useLiveQuery(() => db.wishlistItems.toArray()) ?? [];
}

export function useWishlistMutations() {
  const add = useCallback(async (item: Omit<WishlistItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const id = uuidv4();
    await db.wishlistItems.add({ ...item, id, createdAt: now, updatedAt: now });
    return id;
  }, []);

  const update = useCallback(async (id: string, changes: Partial<WishlistItem>) => {
    await db.wishlistItems.update(id, { ...changes, updatedAt: new Date().toISOString() });
  }, []);

  const remove = useCallback(async (id: string) => {
    await db.wishlistItems.delete(id);
  }, []);

  return { add, update, remove };
}

// ===== Usage Records =====
export function useUsageRecordMutations() {
  const add = useCallback(async (record: Omit<UsageRecord, 'id'>) => {
    const id = uuidv4();
    const now = new Date().toISOString();
    await db.usageRecords.add({ ...record, id, usedAt: record.date, createdAt: now });
    await db.assets.update(record.assetId, {
      lastUsedDate: record.date,
      useCount: ((await db.assets.get(record.assetId))?.useCount ?? 0) + 1,
      updatedAt: new Date().toISOString(),
    });
    return id;
  }, []);

  const remove = useCallback(async (id: string) => {
    const record = await db.usageRecords.get(id);
    await db.usageRecords.delete(id);
    if (record) {
      const asset = await db.assets.get(record.assetId);
      if (asset) {
        await db.assets.update(record.assetId, {
          useCount: Math.max(0, (asset.useCount ?? 0) - 1),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }, []);

  return { add, remove };
}

// ===== Categories =====
export function useCategories() {
  const cats = useLiveQuery(() => db.categories.orderBy('order').toArray());
  return (cats ?? []).filter(cat => !cat.isHidden && !REMOVED_CATEGORY_IDS.includes(cat.id));
}

export function useCategoryMutations() {
  const initDefaults = useCallback(async () => {
    const now = new Date().toISOString();
    const existing = await db.categories.toArray();
    const existingIds = new Set(existing.map(cat => cat.id));
    const missing = DEFAULT_CATEGORIES.filter(cat => !existingIds.has(cat.id));
    if (missing.length > 0) {
      await db.categories.bulkAdd(missing.map(cat => ({
        ...cat,
        sortOrder: cat.order,
        isDefault: true,
        isHidden: false,
        createdAt: now,
        updatedAt: now,
      })));
    }
  }, []);

  const add = useCallback(async (cat: Category) => {
    const now = new Date().toISOString();
    await db.categories.add({ ...cat, sortOrder: cat.order, isDefault: false, isHidden: false, createdAt: now, updatedAt: now });
  }, []);

  const update = useCallback(async (id: string, changes: Partial<Category>) => {
    await db.categories.update(id, { ...changes, updatedAt: new Date().toISOString() });
  }, []);

  const remove = useCallback(async (id: string) => {
    const cat = await db.categories.get(id);
    if (cat?.isDefault) {
      await db.categories.update(id, { isHidden: true, updatedAt: new Date().toISOString() });
    } else {
      await db.categories.delete(id);
    }
  }, []);

  return { initDefaults, add, update, remove };
}

// ===== Tags =====
export function useTags() {
  return useLiveQuery(() => db.tags.toArray()) ?? [];
}

export function useTagMutations() {
  const initDefaults = useCallback(async () => {
    const now = new Date().toISOString();
    const existing = await db.tags.toArray();
    const existingIds = new Set(existing.map(tag => tag.id));
    const missing = DEFAULT_TAGS.filter(tag => !existingIds.has(tag.id));
    if (missing.length > 0) {
      await db.tags.bulkAdd(missing.map(tag => ({ ...tag, createdAt: now, updatedAt: now })));
    }
  }, []);

  const add = useCallback(async (tag: Tag) => {
    const now = new Date().toISOString();
    await db.tags.add({ ...tag, createdAt: now, updatedAt: now });
  }, []);

  const update = useCallback(async (id: string, changes: Partial<Tag>) => {
    await db.tags.update(id, { ...changes, updatedAt: new Date().toISOString() });
  }, []);

  const remove = useCallback(async (id: string) => {
    await db.tags.delete(id);
  }, []);

  return { initDefaults, add, update, remove };
}

// ===== Settings =====
export function useSettings() {
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  return settings ?? null;
}

export function useSettingsMutations() {
  const update = useCallback(async (changes: Partial<Settings>) => {
    const existing = await db.settings.toCollection().first();
    const now = new Date().toISOString();
    if (existing) {
      await db.settings.update(existing.id, { ...changes, updatedAt: now });
    } else {
      await db.settings.add({
        id: 'default',
        currency: 'CNY',
        decimalPlaces: 2,
        thousandsSeparator: true,
        durationDisplay: 'auto',
        theme: 'system',
        useThousandsSeparator: true,
        durationDisplayMode: 'daysAndDate',
        themeMode: 'dark',
        backupVersion: 1,
        homeSortMode: 'updatedAt',
        createdAt: now,
        updatedAt: now,
        ...changes,
      });
    }
  }, []);

  return { update };
}

// ===== Snapshots / Backup =====
export function useSnapshots() {
  return useLiveQuery(() => db.snapshots.orderBy('createdAt').reverse().toArray()) ?? [];
}

export function useBackup() {
  const exportData = useCallback(async () => {
    const [assets, accessories, wishlistItems, usageRecords, categories, tags, settings] =
      await Promise.all([
        db.assets.toArray(),
        db.accessories.toArray(),
        db.wishlistItems.toArray(),
        db.usageRecords.toArray(),
        db.categories.toArray(),
        db.tags.toArray(),
        db.settings.toCollection().first(),
      ]);
    return {
      appName: 'DuoShou',
      displayName: '年轮',
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      assets,
      accessories,
      wishlist: wishlistItems,
      wishlistItems,
      usageRecords,
      categories,
      tags: tags as Tag[],
      settings: settings ?? null,
    };
  }, []);

  const createSnapshot = useCallback(async (name: string) => {
    const data = await exportData();
    const snapshot: Snapshot = {
      id: uuidv4(),
      name,
      data,
      createdAt: new Date().toISOString(),
    };
    await db.snapshots.add(snapshot);
    // Keep max 10 snapshots
    const all = await db.snapshots.orderBy('createdAt').reverse().toArray();
    if (all.length > 10) {
      const toDelete = all.slice(10);
      await db.snapshots.bulkDelete(toDelete.map(s => s.id));
    }
    return snapshot;
  }, [exportData]);

  const importData = useCallback(async (data: import('../types').BackupData) => {
    await createSnapshot('导入前自动备份');
    await db.transaction('rw', [db.assets, db.accessories, db.wishlistItems, db.usageRecords, db.categories, db.tags, db.settings], async () => {
      await db.assets.clear();
      await db.accessories.clear();
      await db.wishlistItems.clear();
      await db.usageRecords.clear();
      await db.categories.clear();
      await db.tags.clear();
      await db.settings.clear();

      if (data.assets.length) await db.assets.bulkAdd(data.assets);
      if (data.accessories.length) await db.accessories.bulkAdd(data.accessories);
      const wishlist = data.wishlistItems ?? data.wishlist ?? [];
      if (wishlist.length) await db.wishlistItems.bulkAdd(wishlist);
      if (data.usageRecords.length) await db.usageRecords.bulkAdd(data.usageRecords);
      if (data.categories.length) await db.categories.bulkAdd(data.categories);
      if (data.tags.length) await db.tags.bulkAdd(data.tags as Tag[]);
      if (data.settings) await db.settings.add(data.settings);
    });
  }, [createSnapshot]);

  const clearAll = useCallback(async () => {
    await createSnapshot('清空前自动备份');
    await db.transaction('rw', [db.assets, db.accessories, db.wishlistItems, db.usageRecords], async () => {
      await db.assets.clear();
      await db.accessories.clear();
      await db.wishlistItems.clear();
      await db.usageRecords.clear();
    });
  }, [createSnapshot]);

  const restoreSnapshot = useCallback(async (snapshotId: string) => {
    const snapshot = await db.snapshots.get(snapshotId);
    if (snapshot) {
      await importData(snapshot.data);
    }
  }, [importData]);

  const deleteSnapshot = useCallback(async (id: string) => {
    await db.snapshots.delete(id);
  }, []);

  return { exportData, importData, createSnapshot, clearAll, restoreSnapshot, deleteSnapshot };
}
