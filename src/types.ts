/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GarmentType = 'Gown' | 'Dress' | 'Top' | 'Pants' | 'Suit';
export type ComplexityLevel = 'Simple' | 'Moderate' | 'Complex' | 'Bridal/Couture';
export type ProductionStatus = 'Not Started' | 'In Progress' | 'Fitting' | 'Done' | 'Delivered';
export type PaymentStatus = 'Deposit' | 'Partial' | 'Paid';

export interface Order {
  id: string;
  clientName: string;
  contact: string;
  orderDate: string;
  dueDate: string;
  totalOrderPrice: number;
  totalDepositPaid: number;
  paymentStatus: PaymentStatus;
  notes: string;
}

export interface Garment {
  id: string;
  orderId: string;
  clientName: string;
  type: GarmentType;
  description: string;
  complexity: ComplexityLevel;
  sellingPrice: number;
  fabricCost: number;
  otherMaterialsCost: number;
  estimatedHours?: number;
  actualHours?: number;
  laborCost: number;
  overheadAllocation: number;
  startDate: string;
  dueDate: string;
  status: ProductionStatus;
}

export interface OverheadConfig {
  salary: number;
  rent: number;
  water: number;
  tokens: number;
  washroom: number;
}

export interface GarmentWeight {
  type: GarmentType;
  weight: number;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  paymentDate: string;
}
