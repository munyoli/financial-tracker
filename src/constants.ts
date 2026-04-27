/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GarmentType, OverheadConfig } from './types';

export const MONTHLY_OVERHEAD: OverheadConfig = {
  salary: 10000,
  rent: 10440,
  water: 400,
  tokens: 500,
  washroom: 200,
};

export const TOTAL_MONTHLY_OVERHEAD = Object.values(MONTHLY_OVERHEAD).reduce((a, b) => a + b, 0);

export const GARMENT_WEIGHTS: Record<GarmentType, number> = {
  'Gown': 1.5,
  'Dress': 1.2,
  'Top': 0.8,
  'Pants': 1.0,
  'Suit': 2.0,
};

export const DEFAULT_HOURLY_RATE = 500;
export const HOURLY_OVERHEAD = 215;
export const EXPANSION_FUND_PER_GARMENT = 2500;
export const STALL_GOAL = 40000;
export const MARKUP_MULTIPLIER = 1.3;

export const TARGET_MARGIN = 0.3; // 30% profit
export const PROFIT_MARGIN_THRESHOLD = 0.2; // 20%
export const MIN_MARGIN_PERCENT = 0.2; // 20% negotiation floor

export const ESTIMATED_HOURS: Record<string, number> = {
  'Simple': 3,
  'Moderate': 10,
  'Complex': 20,
  'Bridal': 40,
};
