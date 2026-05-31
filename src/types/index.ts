export type AssetStatus = 'active' | 'idle' | 'retired' | 'sold' | 'discarded';

export type AccessoryType = 'accessory' | 'repair' | 'maintenance' | 'insurance' | 'modification' | 'service' | 'authentication' | 'other';

export type WishlistStatus = 'watching' | 'decided' | 'abandoned' | 'converted';

export type SubscriptionCycle = 'monthly' | 'quarterly' | 'yearly' | 'one-time';

export type EnergyType = 'fuel' | 'electric' | 'hybrid' | 'range-extended';

export type PurchaseType = 'new' | 'used';

export interface LuxuryInfo {
  condition: string;
  hasBox: boolean;
  hasReceipt: boolean;
  hasWarrantyCard: boolean;
  hasCertificate: boolean;
  purchaseRegion: string;
  material: string;
  color: string;
  size: string;
  year: string;
  serialNumber: string;
  maintenanceRecord: string;
  authenticationOrg: string;
  isLimitedEdition: boolean;
  isSecondHand: boolean;
}

export interface CarInfo {
  carBrand: string;
  carModel: string;
  modelYear: string;
  mileage: number;
  energyType: EnergyType;
  purchaseType: PurchaseType;
  insuranceExpiry: string;
  inspectionExpiry: string;
  licensePlate: string;
  loanInfo: string;
}

export interface SubscriptionInfo {
  startDate: string;
  endDate: string;
  cycleType: SubscriptionCycle;
  autoRenew: boolean;
  renewPrice: number;
  renewCycle: string;
  expiryReminder: boolean;
}

export interface Postmortem {
  wouldBuyAgain: string;
  biggestMistake: string;
  worthIt: string;
  advice: string;
  satisfaction: number; // 1-5
}

export interface Asset {
  id: string;
  name: string;
  brand: string;
  model: string;
  spec: string;
  categoryId: string;
  tagIds: string[];
  purchasePrice: number;
  currency: string;
  purchaseDate: string;
  purchaseChannel: string;
  currentValue: number;
  expectedResidualValue: number;
  targetDailyCost: number;
  targetUseDays: number;
  status: AssetStatus;
  lastUsedDate: string;
  useCount: number;
  retiredDate: string | null;
  soldDate: string | null;
  soldPrice: number | null;
  soldChannel: string | null;
  discardedDate: string | null;
  imageUri: string | null;
  note: string;
  isExcludedFromTotal: boolean;
  isExcludedFromDailyAverage: boolean;
  luxuryInfo: LuxuryInfo | null;
  carInfo: CarInfo | null;
  subscriptionInfo: SubscriptionInfo | null;
  postmortem: Postmortem | null;
  createdAt: string;
  updatedAt: string;
}

export interface Accessory {
  id: string;
  assetId: string;
  name: string;
  price: number;
  date: string;
  type: AccessoryType;
  includedInCost: boolean;
  note: string;
}

export interface WishlistItem {
  id: string;
  name: string;
  brand: string;
  model: string;
  categoryId: string;
  tagIds: string[];
  expectedPrice: number;
  currency: string;
  expectedResidualValue: number;
  targetDailyCost: number;
  expectedUseYears: number;
  reason: string;
  cooldownDays: number;
  desireLevel: number;
  note: string;
  imageUri: string | null;
  status: WishlistStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UsageRecord {
  id: string;
  assetId: string;
  date: string;
  note: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  order: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Settings {
  id: string;
  currency: string;
  decimalPlaces: number;
  thousandsSeparator: boolean;
  durationDisplay: 'days' | 'months' | 'years' | 'auto';
  theme: 'light' | 'dark' | 'system';
}

export interface Snapshot {
  id: string;
  name: string;
  data: BackupData;
  createdAt: string;
}

export interface BackupData {
  appName: string;
  schemaVersion: number;
  exportedAt: string;
  assets: Asset[];
  accessories: Accessory[];
  wishlistItems: WishlistItem[];
  usageRecords: UsageRecord[];
  categories: Category[];
  tags: Tag[];
  settings: Settings | null;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-digital', name: '数码', icon: '📱', order: 0 },
  { id: 'cat-car', name: '汽车', icon: '🚗', order: 1 },
  { id: 'cat-luxury', name: '奢侈品', icon: '💎', order: 2 },
  { id: 'cat-watch', name: '腕表', icon: '⌚', order: 3 },
  { id: 'cat-bag', name: '包袋', icon: '👜', order: 4 },
  { id: 'cat-jewelry', name: '珠宝', icon: '💍', order: 5 },
  { id: 'cat-clothing', name: '服饰', icon: '👔', order: 6 },
  { id: 'cat-shoes', name: '鞋履', icon: '👟', order: 7 },
  { id: 'cat-camera', name: '摄影', icon: '📷', order: 8 },
  { id: 'cat-gaming', name: '游戏', icon: '🎮', order: 9 },
  { id: 'cat-appliance', name: '家电', icon: '🏠', order: 10 },
  { id: 'cat-furniture', name: '家具', icon: '🪑', order: 11 },
  { id: 'cat-subscription', name: '会员订阅', icon: '💳', order: 12 },
  { id: 'cat-collectible', name: '收藏', icon: '🏺', order: 13 },
  { id: 'cat-tool', name: '工具', icon: '🔧', order: 14 },
  { id: 'cat-office', name: '办公', icon: '💼', order: 15 },
  { id: 'cat-sports', name: '运动', icon: '⚽', order: 16 },
  { id: 'cat-other', name: '其他', icon: '📦', order: 17 },
];

export const DEFAULT_TAGS: Tag[] = [
  { id: 'tag-freq-use', name: '高频使用', color: '#52c41a' },
  { id: 'tag-low-use', name: '低频使用', color: '#faad14' },
  { id: 'tag-impulse', name: '冲动消费', color: '#ff4d4f' },
  { id: 'tag-regret', name: '后悔', color: '#ff4d4f' },
  { id: 'tag-worth', name: '值得', color: '#52c41a' },
  { id: 'tag-work', name: '工作刚需', color: '#1890ff' },
  { id: 'tag-fun', name: '娱乐', color: '#722ed1' },
  { id: 'tag-collect', name: '收藏', color: '#faad14' },
  { id: 'tag-hold-value', name: '保值', color: '#52c41a' },
  { id: 'tag-depreciate', name: '贬值快', color: '#ff4d4f' },
  { id: 'tag-sellable', name: '可卖出', color: '#1890ff' },
  { id: 'tag-long-term', name: '长期持有', color: '#52c41a' },
  { id: 'tag-idle-risk', name: '闲置风险', color: '#faad14' },
  { id: 'tag-secondhand', name: '二手购入', color: '#8c8c8c' },
  { id: 'tag-essential', name: '刚需', color: '#1890ff' },
  { id: 'tag-emotional', name: '情绪消费', color: '#eb2f96' },
];

export const LUXURY_CATEGORIES = ['cat-luxury', 'cat-watch', 'cat-bag', 'cat-jewelry', 'cat-clothing', 'cat-shoes'];
export const CAR_CATEGORY = 'cat-car';
export const SUBSCRIPTION_CATEGORY = 'cat-subscription';

export const STATUS_LABELS: Record<AssetStatus, string> = {
  active: '服役中',
  idle: '闲置',
  retired: '已退役',
  sold: '已卖出',
  discarded: '已丢弃',
};

export const STATUS_COLORS: Record<AssetStatus, string> = {
  active: '#52c41a',
  idle: '#faad14',
  retired: '#8c8c8c',
  sold: '#1890ff',
  discarded: '#ff4d4f',
};

export const ACCESSORY_TYPE_LABELS: Record<AccessoryType, string> = {
  accessory: '配件',
  repair: '维修',
  maintenance: '保养',
  insurance: '保险',
  modification: '改装',
  service: '服务',
  authentication: '鉴定',
  other: '其他',
};

export const WISHLIST_STATUS_LABELS: Record<WishlistStatus, string> = {
  watching: '观望中',
  decided: '已决定',
  abandoned: '已放弃',
  converted: '已转化',
};
