import Dexie, { type EntityTable } from 'dexie';
import type { Asset, Accessory, WishlistItem, UsageRecord, Category, Tag, Settings, Snapshot } from '../types';

const db = new Dexie('duoshou') as Dexie & {
  assets: EntityTable<Asset, 'id'>;
  accessories: EntityTable<Accessory, 'id'>;
  wishlistItems: EntityTable<WishlistItem, 'id'>;
  usageRecords: EntityTable<UsageRecord, 'id'>;
  categories: EntityTable<Category, 'id'>;
  tags: EntityTable<Tag, 'id'>;
  settings: EntityTable<Settings, 'id'>;
  snapshots: EntityTable<Snapshot, 'id'>;
};

db.version(1).stores({
  assets: 'id, name, status, categoryId, purchaseDate, createdAt',
  accessories: 'id, assetId, date',
  wishlistItems: 'id, name, status, createdAt',
  usageRecords: 'id, assetId, date',
  categories: 'id, order',
  tags: 'id',
  settings: 'id',
  snapshots: 'id, createdAt',
});

export default db;
