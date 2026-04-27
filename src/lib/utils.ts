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
  // Stage 1 (Production Cost): Tier Hours × 715 (500 Labor + 215 Overhead)
  const productionCost = hours * 715;

  // Stage 2 (Total Base Cost): Add Raw Material Cost
  const totalBaseCost = productionCost + materialsCost;

  // Stage 3 (Retail Markup): 1.3x Profit Multiplier
  const retailPrice = totalBaseCost * 1.3;

  // Stage 4 (Luxury Rounding): Round up to nearest KES 500
  const finalPrice = Math.ceil(retailPrice / 500) * 500;

  return {
    productionCost,
    totalBaseCost, // This is the "Production Floor"
    retailPrice: finalPrice,
    expansionFund: finalPrice - totalBaseCost // 30% margin + rounding bonus
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
  const profit = sellingPrice - metrics.totalBaseCost;
  const profitMargin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

  return {
    totalMaterialCost: materialsCost,
    laborCost: hours * 500,
    hourlyOverhead: hours * 215,
    baseCost: metrics.totalBaseCost,
    totalCost: metrics.totalBaseCost,
    profit: profit,
    profitMargin: profitMargin,
    markupProfit: profit, // Use actual profit for stall goal
    expansionFund: profit,
    recommendedPrice: metrics.retailPrice
  };
}
