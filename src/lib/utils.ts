/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GARMENT_WEIGHTS, TOTAL_MONTHLY_OVERHEAD } from '../constants';
import { Garment } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD', // User can change this, but USD is a safe default
  }).format(amount);
}

export function calculateGarmentOverhead(garmentType: string, totalMonthlyWeight: number) {
  const weight = GARMENT_WEIGHTS[garmentType as keyof typeof GARMENT_WEIGHTS] || 0;
  if (totalMonthlyWeight === 0) return 0;
  return (weight / totalMonthlyWeight) * TOTAL_MONTHLY_OVERHEAD;
}

export function calculateGarmentMetrics(garment: Garment) {
  const totalMaterialCost = garment.fabricCost + garment.otherMaterialsCost;
  const totalCost = totalMaterialCost + garment.laborCost + garment.overheadAllocation;
  const profit = garment.sellingPrice - totalCost;
  const profitMargin = garment.sellingPrice > 0 ? (profit / garment.sellingPrice) * 100 : 0;

  return {
    totalMaterialCost,
    totalCost,
    profit,
    profitMargin,
  };
}
