import { differenceInDays } from 'date-fns';
import type { Asset, Accessory } from '../types';

/** 已使用天数 = today - purchaseDate + 1（最小1） */
export function calcUsedDays(purchaseDate: string): number {
  if (!purchaseDate) return 1;
  const days = differenceInDays(new Date(), new Date(purchaseDate)) + 1;
  return Math.max(1, days);
}

/** 总成本 = purchasePrice + Σ(includedInCost accessories) */
export function calcTotalCost(asset: Asset, accessories: Accessory[]): number {
  const accessoryCost = accessories
    .filter(a => a.includedInCost)
    .reduce((sum, a) => sum + a.price, 0);
  return asset.purchasePrice + accessoryCost;
}

/** 净成本 = 总成本 - currentValue（无估值=总成本） */
export function calcNetCost(totalCost: number, currentValue: number): number {
  if (currentValue > 0) return totalCost - currentValue;
  return totalCost;
}

/** 日均成本 = 净成本 / 已使用天数 */
export function calcDailyCost(netCost: number, usedDays: number): number {
  if (usedDays <= 0) return 0;
  return netCost / usedDays;
}

/** 亏损 = 总成本 - currentValue（已卖出=总成本 - soldPrice） */
export function calcLoss(asset: Asset, totalCost: number): number {
  if (asset.status === 'sold' && asset.soldPrice != null) {
    return totalCost - asset.soldPrice;
  }
  if (asset.currentValue > 0) {
    return totalCost - asset.currentValue;
  }
  return totalCost;
}

/** 保值率 = currentValue / totalCost（已卖出= soldPrice / totalCost） */
export function calcRetainRate(asset: Asset, totalCost: number): number {
  if (totalCost <= 0) return 0;
  if (asset.status === 'sold' && asset.soldPrice != null) {
    return asset.soldPrice / totalCost;
  }
  if (asset.currentValue > 0) {
    return asset.currentValue / totalCost;
  }
  return 0;
}

/** 目标天数 = 净成本 / targetDailyCost */
export function calcTargetDays(netCost: number, targetDailyCost: number): number {
  if (targetDailyCost <= 0) return 0;
  return Math.ceil(netCost / targetDailyCost);
}

/** 还需天数 = 目标天数 - 已使用天数 */
export function calcRemainingDays(targetDays: number, usedDays: number): number {
  return Math.max(0, targetDays - usedDays);
}

/** 心愿天数 = (expectedPrice - expectedResidualValue) / targetDailyCost */
export function calcWishlistDays(expectedPrice: number, expectedResidualValue: number, targetDailyCost: number): number {
  if (targetDailyCost <= 0) return 0;
  const netCost = expectedPrice - expectedResidualValue;
  return Math.ceil(Math.max(0, netCost) / targetDailyCost);
}

/** 冲动等级：<3天=危险，3-14天=观察，15-30天=冷静中，>30天=冷静。价格>5000提一级 */
export function calcImpulseLevel(cooldownDays: number, price: number): string {
  let level: string;
  if (cooldownDays < 3) level = '危险';
  else if (cooldownDays < 15) level = '观察';
  else if (cooldownDays < 31) level = '冷静中';
  else level = '冷静';

  // 价格>5000 提一级
  if (price > 5000) {
    if (level === '冷静') level = '非常冷静';
    else if (level === '冷静中') level = '冷静';
    else if (level === '观察') level = '冷静中';
    else if (level === '危险') level = '观察';
  }
  return level;
}

/** 格式化金额（formatCurrency alias） */
export function formatCurrency(amount: number, currency = 'CNY', decimals = 2): string {
  return formatMoney(amount, currency, decimals);
}

/** 格式化金额 */
export function formatMoney(amount: number, currency = 'CNY', decimals = 2): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/** 格式化数字（带千位分隔符） */
export function formatNumber(num: number, thousandsSep = true, decimals = 0): string {
  if (thousandsSep) {
    return new Intl.NumberFormat('zh-CN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  }
  return num.toFixed(decimals);
}

/** 格式化时长（formatDuration alias） */
export function formatDuration(days: number): string {
  return formatDays(days);
}

/** getTotalCost alias */
export function getTotalCost(asset: Asset, accessories: Accessory[]): number {
  return calcTotalCost(asset, accessories);
}

/** getDailyCost alias */
export function getDailyCost(asset: Asset, accessories: Accessory[]): number {
  const usedDays = calcUsedDays(asset.purchaseDate);
  const totalCost = calcTotalCost(asset, accessories);
  const netCost = calcNetCost(totalCost, asset.currentValue);
  return calcDailyCost(netCost, usedDays);
}

/** getLoss alias */
export function getLoss(asset: Asset, accessories: Accessory[]): number {
  const totalCost = calcTotalCost(asset, accessories);
  return calcLoss(asset, totalCost);
}

/** getUsedDays alias */
export function getUsedDays(asset: Asset): number {
  return calcUsedDays(asset.purchaseDate);
}

/** getRetentionRate alias */
export function getRetentionRate(asset: Asset, accessories: Accessory[]): number {
  const totalCost = calcTotalCost(asset, accessories);
  return calcRetainRate(asset, totalCost);
}

/** 闲置警报：高价值但闲置的资产 */
export function getIdleAlertAssets(assets: Asset[], accessories: Accessory[]): Asset[] {
  return assets
    .filter(a => a.status === 'idle')
    .sort((a, b) => b.currentValue - a.currentValue);
}

/** 接近目标的资产：日均成本已接近目标日均 */
export function getNearTargetAssets(assets: Asset[], accessories: Accessory[]): Asset[] {
  return assets
    .filter(a => a.status === 'active' && a.targetDailyCost > 0)
    .map(a => {
      const daily = getDailyCost(a, accessories);
      const ratio = daily / a.targetDailyCost;
      return { asset: a, ratio };
    })
    .filter(x => x.ratio <= 1.2 && x.ratio >= 0.5)
    .sort((a, b) => a.ratio - b.ratio)
    .map(x => x.asset);
}

/** 格式化天数 */
export function formatDays(days: number): string {
  if (days < 30) return `${days}天`;
  if (days < 365) return `${Math.floor(days / 30)}个月${days % 30 > 0 ? `${days % 30}天` : ''}`;
  const years = Math.floor(days / 365);
  const remainDays = days % 365;
  const months = Math.floor(remainDays / 30);
  return `${years}年${months > 0 ? `${months}个月` : ''}`;
}

/** 获取有效估值（有估值用估值，没有用购买价） */
export function getEffectiveValue(asset: Asset): number {
  return asset.currentValue > 0 ? asset.currentValue : asset.purchasePrice;
}

/** 计算资产的完整指标 */
export function calcAssetMetrics(asset: Asset, accessories: Accessory[]) {
  const usedDays = calcUsedDays(asset.purchaseDate);
  const totalCost = calcTotalCost(asset, accessories);
  const netCost = calcNetCost(totalCost, asset.currentValue);
  const dailyCost = calcDailyCost(netCost, usedDays);
  const loss = calcLoss(asset, totalCost);
  const retainRate = calcRetainRate(asset, totalCost);
  const targetDays = calcTargetDays(netCost, asset.targetDailyCost);
  const remainingDays = calcRemainingDays(targetDays, usedDays);

  return {
    usedDays,
    totalCost,
    netCost,
    dailyCost,
    loss,
    retainRate,
    targetDays,
    remainingDays,
  };
}
