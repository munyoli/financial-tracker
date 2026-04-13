/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { Order, Garment, GarmentType } from '../types';
import { GARMENT_WEIGHTS, TOTAL_MONTHLY_OVERHEAD } from '../constants';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

export function useStore() {
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('atelier_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [garments, setGarments] = useState<Garment[]>(() => {
    const saved = localStorage.getItem('atelier_garments');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('atelier_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('atelier_garments', JSON.stringify(garments));
  }, [garments]);

  // Calculate overhead allocation for each garment
  const garmentsWithOverhead = useMemo(() => {
    // Group garments by month (using dueDate or startDate? Let's use dueDate as the "completion" month)
    const monthlyWeights: Record<string, number> = {};
    
    garments.forEach(g => {
      const monthKey = format(parseISO(g.dueDate), 'yyyy-MM');
      const weight = GARMENT_WEIGHTS[g.type] || 0;
      monthlyWeights[monthKey] = (monthlyWeights[monthKey] || 0) + weight;
    });

    return garments.map(g => {
      const monthKey = format(parseISO(g.dueDate), 'yyyy-MM');
      const totalMonthlyWeight = monthlyWeights[monthKey] || 0;
      const weight = GARMENT_WEIGHTS[g.type] || 0;
      const overheadAllocation = totalMonthlyWeight > 0 
        ? (weight / totalMonthlyWeight) * TOTAL_MONTHLY_OVERHEAD 
        : 0;

      return {
        ...g,
        overheadAllocation,
      };
    });
  }, [garments]);

  const addOrder = (order: Order) => {
    setOrders(prev => [...prev, order]);
  };

  const updateOrder = (updatedOrder: Order) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  };

  const deleteOrder = (id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id));
    setGarments(prev => prev.filter(g => g.orderId !== id));
  };

  const addGarment = (garment: Garment) => {
    setGarments(prev => [...prev, garment]);
  };

  const updateGarment = (updatedGarment: Garment) => {
    setGarments(prev => prev.map(g => g.id === updatedGarment.id ? updatedGarment : g));
  };

  const deleteGarment = (id: string) => {
    setGarments(prev => prev.filter(g => g.id !== id));
  };

  return {
    orders,
    garments: garmentsWithOverhead,
    addOrder,
    updateOrder,
    deleteOrder,
    addGarment,
    updateGarment,
    deleteGarment,
  };
}
