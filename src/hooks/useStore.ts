/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Order, Garment, GarmentType, Expense } from '../types';
import { GARMENT_WEIGHTS, TOTAL_MONTHLY_OVERHEAD } from '../constants';
import { format, parseISO } from 'date-fns';
import { syncManager } from '../lib/SyncManager';

const API_BASE = '/api';

/**
 * Fetch helper with error handling.
 */
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('atelier_token');
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${url}`, {
    headers,
    ...options,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `API error: ${res.status}`);
  }
  return res.json();
}

export function useStore() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [garments, setGarments] = useState<Garment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(syncManager.getPendingCount());

  // Load initial data from the API
  useEffect(() => {
    async function loadData() {
      try {
        const [ordersData, garmentsData, expensesData] = await Promise.all([
          apiFetch<Order[]>('/orders'),
          apiFetch<Garment[]>('/garments'),
          apiFetch<Expense[]>('/expenses'),
        ]);
        setOrders(ordersData);
        setGarments(garmentsData);
        setExpenses(expensesData);
        
        // Save for offline fallback
        localStorage.setItem('atelier_orders', JSON.stringify(ordersData));
        localStorage.setItem('atelier_garments', JSON.stringify(garmentsData));
      } catch (err) {
        console.error('Failed to load data from server:', err);
        // Fallback: try localStorage if server is down
        const savedOrders = localStorage.getItem('atelier_orders');
        const savedGarments = localStorage.getItem('atelier_garments');
        if (savedOrders) setOrders(JSON.parse(savedOrders));
        if (savedGarments) setGarments(JSON.parse(savedGarments));
      } finally {
        setLoading(false);
      }
    }
    if (isOnline) loadData();
    else setLoading(false);
  }, [isOnline]);

  // Offline/Online listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync Logic
  useEffect(() => {
    if (isOnline && pendingCount > 0 && !isSyncing) {
      const performSync = async () => {
        setIsSyncing(true);
        await syncManager.processQueue(apiFetch);
        setPendingCount(syncManager.getPendingCount());
        setIsSyncing(false);
      };
      performSync();
    }
  }, [isOnline, pendingCount, isSyncing]);

  // Periodic Sync Check
  useEffect(() => {
    const interval = setInterval(() => {
      setPendingCount(syncManager.getPendingCount());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Calculate overhead allocation for each garment
  const garmentsWithOverhead = useMemo(() => {
    // Group garments by month (using dueDate as the "completion" month)
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

  const addOrder = useCallback(async (order: Order) => {
    if (!isOnline) {
      syncManager.enqueue('order', 'POST', '/orders', order);
      setOrders(prev => [...prev, order]);
      setPendingCount(syncManager.getPendingCount());
      return;
    }

    try {
      await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify(order),
      });
      setOrders(prev => [...prev, order]);
    } catch (err) {
      console.error('Failed to add order:', err);
      // Fallback to offline if API fails
      syncManager.enqueue('order', 'POST', '/orders', order);
      setPendingCount(syncManager.getPendingCount());
    }
  }, [isOnline]);

  const updateOrder = useCallback(async (updatedOrder: Order) => {
    try {
      await apiFetch(`/orders/${updatedOrder.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedOrder),
      });
      setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    } catch (err) {
      console.error('Failed to update order:', err);
    }
  }, []);

  const deleteOrder = useCallback(async (id: string) => {
    try {
      await apiFetch(`/orders/${id}`, { method: 'DELETE' });
      setOrders(prev => prev.filter(o => o.id !== id));
      setGarments(prev => prev.filter(g => g.orderId !== id));
    } catch (err) {
      console.error('Failed to delete order:', err);
    }
  }, []);

  const addGarment = useCallback(async (garment: Garment) => {
    if (!isOnline) {
      syncManager.enqueue('garment', 'POST', '/garments', garment);
      setGarments(prev => [...prev, garment]);
      setPendingCount(syncManager.getPendingCount());
      return;
    }

    try {
      await apiFetch('/garments', {
        method: 'POST',
        body: JSON.stringify(garment),
      });
      setGarments(prev => [...prev, garment]);
    } catch (err) {
      console.error('Failed to add garment:', err);
      // Fallback to offline
      syncManager.enqueue('garment', 'POST', '/garments', garment);
      setPendingCount(syncManager.getPendingCount());
    }
  }, [isOnline]);

  const updateGarment = useCallback(async (updatedGarment: Garment) => {
    try {
      await apiFetch(`/garments/${updatedGarment.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedGarment),
      });
      setGarments(prev => prev.map(g => g.id === updatedGarment.id ? updatedGarment : g));
    } catch (err) {
      console.error('Failed to update garment:', err);
    }
  }, []);

  const deleteGarment = useCallback(async (id: string) => {
    try {
      await apiFetch(`/garments/${id}`, { method: 'DELETE' });
      setGarments(prev => prev.filter(g => g.id !== id));
    } catch (err) {
      console.error('Failed to delete garment:', err);
    }
  }, []);

  const addExpense = useCallback(async (expense: Expense) => {
    if (!isOnline) {
      syncManager.enqueue('expense', 'POST', '/expenses', expense);
      setExpenses(prev => [expense, ...prev]);
      setPendingCount(syncManager.getPendingCount());
      return;
    }

    try {
      await apiFetch('/expenses', {
        method: 'POST',
        body: JSON.stringify(expense),
      });
      setExpenses(prev => [expense, ...prev]);
    } catch (err) {
      console.error('Failed to add expense:', err);
      // Fallback to offline
      syncManager.enqueue('expense', 'POST', '/expenses', expense);
      setPendingCount(syncManager.getPendingCount());
    }
  }, [isOnline]);

  const updateExpense = useCallback(async (updatedExpense: Expense) => {
    try {
      await apiFetch(`/expenses/${updatedExpense.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedExpense),
      });
      setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
    } catch (err) {
      console.error('Failed to update expense:', err);
    }
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    try {
      await apiFetch(`/expenses/${id}`, { method: 'DELETE' });
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('Failed to delete expense:', err);
    }
  }, []);

  return {
    orders,
    garments: garmentsWithOverhead,
    expenses,
    loading,
    addOrder,
    updateOrder,
    deleteOrder,
    addGarment,
    updateGarment,
    deleteGarment,
    addExpense,
    updateExpense,
    deleteExpense,
    isOnline,
    isSyncing,
    pendingCount
  };
}
