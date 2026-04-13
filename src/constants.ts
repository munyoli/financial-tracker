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
};

export const PROFIT_MARGIN_THRESHOLD = 0.2; // 20%
