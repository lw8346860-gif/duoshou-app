import { addDays, differenceInCalendarDays, differenceInDays, format } from 'date-fns';
import type { Asset, Accessory } from '../types';

/** 已使用天数 = today - purchaseDate + 1（最小1） */
export function calcUsedDays(purchaseDate: string): number {
  if (!purchaseDate) return 1;
  const days = differenceInCalendarDays(new Date(), new Date(`${purchaseDate}T00:00:00`)) + 1;
  return Math.max(0, days);
}

export function calcDateSpanDays(startDate: string, endDate: string | null | undefined): number {
  if (!startDate || !endDate) return calcUsedDays(startDate);
  const days = differenceInCalendarDays(new Date(`${endDate}T00:00:00`), new Date(`${startDate}T00:00:00`)) + 1;
  return Math.max(0, days);
}

/** 总成本 = purchasePrice + Σ(includedInCost accessories) */
export function calcTotalCost(asset: Asset, accessories: Accessory[]): number {
  const accessoryCost = accessories
    .filter(a => a.includedInCost)
    .reduce((sum, a) => sum + a.price, 0);
  return asset.purchasePrice + accessoryCost;
}

/** 6 年折旧期，加速折旧暂按每年减值 30% 估算当前估值 */
export function estimateDepreciatedValue(purchasePrice: number, purchaseDate: string): number {
  if (purchasePrice <= 0) return 0;
  const usedDays = calcUsedDays(purchaseDate);
  if (usedDays <= 0) return purchasePrice;
  const years = Math.min(6, usedDays / 365);
  return Math.max(0, purchasePrice * Math.pow(0.7, years));
}

export function getCurrentValue(asset: Asset): number {
  return asset.currentValue > 0
    ? asset.currentValue
    : estimateDepreciatedValue(asset.purchasePrice, asset.purchaseDate);
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
  return totalCost - getCurrentValue(asset);
}

/** 保值率 = currentValue / totalCost（已卖出= soldPrice / totalCost） */
export function calcRetainRate(asset: Asset, totalCost: number): number {
  if (totalCost <= 0) return 0;
  if (asset.status === 'sold' && asset.soldPrice != null) {
    return asset.soldPrice / totalCost;
  }
  return getCurrentValue(asset) / totalCost;
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

export function calcEstimatedTargetDate(remainingDays: number): string | null {
  if (remainingDays <= 0) return null;
  return format(addDays(new Date(), remainingDays), 'yyyy-MM-dd');
}

/** 心愿天数 = (expectedPrice - expectedResidualValue) / targetDailyCost */
export function calcWishlistDays(expectedPrice: number, expectedResidualValue: number, targetDailyCost: number): number {
  if (targetDailyCost <= 0) return 0;
  const netCost = expectedPrice - expectedResidualValue;
  return Math.ceil(Math.max(0, netCost) / targetDailyCost);
}

/** 冲动等级：<3天=危险，3-14天=观察，15-30天=冷静中，>30天=冷静。价格>5000提一级 */
export function calcImpulseLevel(cooldownDays: number, price: number): string {
  const levels = ['冷静', '观察', '危险', '马上剁手'];
  let index: number;
  if (cooldownDays < 3) index = 2;
  else if (cooldownDays < 15) index = 1;
  else if (cooldownDays < 31) index = 0;
  else index = 0;

  if (price > 5000) {
    index += 1;
  }
  return levels[Math.min(levels.length - 1, index)];
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
  const totalCost = calcTotalCost(asset, accessories);
  if (asset.status === 'sold' && asset.soldPrice != null) {
    return calcDailyCost(totalCost - asset.soldPrice, calcDateSpanDays(asset.purchaseDate, asset.soldDate));
  }
  if (asset.status === 'retired') {
    return calcDailyCost(totalCost, calcDateSpanDays(asset.purchaseDate, asset.retiredDate));
  }
  const usedDays = calcUsedDays(asset.purchaseDate);
  return calcDailyCost(calcNetCost(totalCost, getCurrentValue(asset)), usedDays);
}

/** getLoss alias */
export function getLoss(asset: Asset, accessories: Accessory[]): number {
  const totalCost = calcTotalCost(asset, accessories);
  return calcLoss(asset, totalCost);
}

/** getUsedDays alias */
export function getUsedDays(assetOrDate: Asset | string): number {
  if (typeof assetOrDate === 'string') return calcUsedDays(assetOrDate);
  if (assetOrDate.status === 'sold') return calcDateSpanDays(assetOrDate.purchaseDate, assetOrDate.soldDate);
  if (assetOrDate.status === 'retired') return calcDateSpanDays(assetOrDate.purchaseDate, assetOrDate.retiredDate);
  return calcUsedDays(assetOrDate.purchaseDate);
}

/** getRetentionRate alias */
export function getRetentionRate(asset: Asset, accessories: Accessory[]): number {
  const totalCost = calcTotalCost(asset, accessories);
  return calcRetainRate(asset, totalCost);
}

/** 闲置警报：高价值但闲置的资产 */
export function getIdleAlertAssets(assets: Asset[], accessories: Accessory[]): Asset[] {
  return assets
    .filter(a => {
      if (a.status === 'idle') return true;
      if (a.status !== 'active') return false;
      const lastDate = a.lastUsedDate || a.purchaseDate;
      return calcTotalCost(a, accessories) > 1000 && differenceInDays(new Date(), new Date(lastDate)) >= 30;
    })
    .sort((a, b) => calcTotalCost(b, accessories) - calcTotalCost(a, accessories));
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
  return getCurrentValue(asset);
}

/** 计算资产的完整指标 */
export function calcAssetMetrics(asset: Asset, accessories: Accessory[]) {
  const totalCost = calcTotalCost(asset, accessories);
  const usedDays = getUsedDays(asset);
  const netCost = asset.status === 'sold' && asset.soldPrice != null
    ? totalCost - asset.soldPrice
    : calcNetCost(totalCost, getCurrentValue(asset));
  const dailyCost = calcDailyCost(netCost, usedDays);
  const loss = calcLoss(asset, totalCost);
  const retainRate = calcRetainRate(asset, totalCost);
  const targetDays = calcTargetDays(netCost, asset.targetDailyCost);
  const remainingDays = calcRemainingDays(targetDays, usedDays);
  const estimatedTargetDate = calcEstimatedTargetDate(remainingDays);

  return {
    usedDays,
    totalCost,
    netCost,
    dailyCost,
    loss,
    retainRate,
    targetDays,
    remainingDays,
    estimatedTargetDate,
  };
}
