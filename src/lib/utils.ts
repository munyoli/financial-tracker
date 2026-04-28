/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  DEFAULT_HOURLY_RATE, 
  HOURLY_OVERHEAD, 
  EXPANSION_FUND_PER_GARMENT, 
  MARKUP_MULTIPLIER 
} from '../constants';
import { Garment } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
  }).format(amount);
}

export function calculateSimulationPrice(
  hours: number,
  materialsCost: number
) {
  // 1. Production Floor: Tier Hours × (500 Labor + 215 Overhead) + Materials
  const laborCost = hours * DEFAULT_HOURLY_RATE;
  const overhead = hours * HOURLY_OVERHEAD;
  const productionFloor = laborCost + overhead + materialsCost;

  // 2. Base Price: Apply 1.3x Markup to Production Floor
  const priceBeforeExpansion = productionFloor * MARKUP_MULTIPLIER;

  // 3. Expansion Fund: Add fixed amount
  const expansionFund = EXPANSION_FUND_PER_GARMENT;

  // 4. Total Price before Rounding
  const priceAfterExpansion = priceBeforeExpansion + expansionFund;

  // 5. Luxury Rounding: Round up to nearest KES 500
  const finalPrice = Math.ceil(priceAfterExpansion / 500) * 500;

  return {
    laborCost,
    overhead,
    materialsCost,
    productionFloor,
    priceBeforeExpansion,
    expansionFund,
    priceAfterExpansion,
    retailPrice: finalPrice,
    roundingBonus: finalPrice - priceAfterExpansion
  };
}

export function generateQuoteMessage(
  description: string,
  price: number,
  hours: number
) {
  return `TwoStones Architectural ${description}: ${formatCurrency(price)}. Includes ${hours} hours of engineering and premium materials.`;
}

export function calculateGarmentMetrics(garment: Garment) {
  const hours = (garment.actualHours != null && garment.actualHours > 0) 
    ? garment.actualHours 
    : (garment.estimatedHours || 0);

  const materialsCost = garment.fabricCost + garment.otherMaterialsCost;
  const metrics = calculateSimulationPrice(hours, materialsCost);

  // If the selling price is already set (confirmed order), use it
  const sellingPrice = garment.sellingPrice || metrics.retailPrice;
  const profit = sellingPrice - metrics.productionFloor;
  const profitMargin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

  return {
    totalMaterialCost: materialsCost,
    laborCost: metrics.laborCost,
    hourlyOverhead: metrics.overhead,
    baseCost: metrics.productionFloor,
    totalCost: metrics.productionFloor,
    profit: profit,
    profitMargin: profitMargin,
    markupProfit: profit, // Use actual profit for stall goal
    expansionFund: profit,
    recommendedPrice: metrics.retailPrice
  };
}
