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

export function calculateRecommendedPrice(
  fabricCost: number,
  otherCost: number,
  estimatedHours: number
) {
  const labor = estimatedHours * DEFAULT_HOURLY_RATE;
  const overhead = estimatedHours * HOURLY_OVERHEAD;
  const baseCost = fabricCost + otherCost + labor + overhead;
  
  // Markup: Apply a 1.3x multiplier (30% profit) to the total of (Labor + Overhead + Materials)
  // Plus fixed Expansion Fund
  return (baseCost * MARKUP_MULTIPLIER) + EXPANSION_FUND_PER_GARMENT;
}

export function calculateGarmentMetrics(garment: Garment) {
  const hours = (garment.actualHours != null && garment.actualHours > 0) 
    ? garment.actualHours 
    : (garment.estimatedHours || 0);

  const totalMaterialCost = garment.fabricCost + garment.otherMaterialsCost;
  const laborCost = hours * DEFAULT_HOURLY_RATE;
  const hourlyOverhead = hours * HOURLY_OVERHEAD;
  
  // Base cost including expansion fund as a fixed allocation
  const baseCost = totalMaterialCost + laborCost + hourlyOverhead;
  const totalCostIncludingExpansion = baseCost + EXPANSION_FUND_PER_GARMENT;
  
  const profit = garment.sellingPrice - totalCostIncludingExpansion;
  const profitMargin = garment.sellingPrice > 0 ? (profit / garment.sellingPrice) * 100 : 0;
  
  // Calculate the specific 30% markup profit for the stall goal tally
  // Markup Profit = Subtotal * 0.3
  const markupProfit = baseCost * 0.3;

  return {
    totalMaterialCost,
    laborCost,
    hourlyOverhead,
    baseCost,
    totalCost: totalCostIncludingExpansion,
    profit,
    profitMargin,
    markupProfit,
    expansionFund: EXPANSION_FUND_PER_GARMENT
  };
}
