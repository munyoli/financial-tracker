/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Order, Garment } from '../types';
import { calculateGarmentMetrics, formatCurrency } from '../lib/utils';
import { PROFIT_MARGIN_THRESHOLD, STALL_GOAL } from '../constants';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  DollarSign,
  CheckCircle2,
  ArrowUpRight, 
  ArrowDownRight, 
  Target,
  Calculator,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  orders: Order[];
  garments: Garment[];
  setActiveTab?: (tab: string) => void;
}

export default function Dashboard({ orders, garments, setActiveTab }: DashboardProps) {
  const metrics = React.useMemo(() => {
    const totalRevenue = garments.reduce((sum, g) => sum + g.sellingPrice, 0);
    const garmentMetrics = garments.map(calculateGarmentMetrics);
    const totalProfit = garmentMetrics.reduce((sum, m) => sum + m.profit, 0);
    const avgProfitPerGarment = garments.length > 0 ? totalProfit / garments.length : 0;
    
    const outstandingBalance = orders.reduce((sum, o) => sum + (o.totalOrderPrice - o.totalDepositPaid), 0);
    
    const profitByType: Record<string, { profit: number; count: number }> = {};
    garments.forEach((g, i) => {
      if (!profitByType[g.type]) profitByType[g.type] = { profit: 0, count: 0 };
      profitByType[g.type].profit += garmentMetrics[i].profit;
      profitByType[g.type].count += 1;
    });

    const typeStats = Object.entries(profitByType).map(([type, data]) => ({
      type,
      avgProfit: data.profit / data.count,
      totalProfit: data.profit
    }));

    const mostProfitableType = [...typeStats].sort((a, b) => b.avgProfit - a.avgProfit)[0]?.type || 'N/A';
    const leastProfitableType = [...typeStats].sort((a, b) => a.avgProfit - b.avgProfit)[0]?.type || 'N/A';

    const lowProfitGarments = garmentMetrics.filter(m => m.profitMargin < PROFIT_MARGIN_THRESHOLD * 100).length;
    const lossMakingGarments = garmentMetrics.filter(m => m.profit < 0).length;
    
    const now = new Date();
    const overdueOrders = orders.filter(o => {
      const dueDate = new Date(o.dueDate);
      return dueDate < now && o.paymentStatus !== 'Paid';
    }).length;

    const stallGoalProfit = garments.reduce((sum, g) => {
      if (['Not Started'].includes(g.status)) return sum;
      const { markupProfit } = calculateGarmentMetrics(g);
      return sum + markupProfit;
    }, 0);

    return {
      totalRevenue,
      totalProfit,
      avgProfitPerGarment,
      mostProfitableType,
      leastProfitableType,
      outstandingBalance,
      lowProfitGarments,
      lossMakingGarments,
      overdueOrders,
      typeStats,
      stallGoalProfit
    };
  }, [orders, garments]);

  const statCards = [
    { label: 'Total Revenue', value: formatCurrency(metrics.totalRevenue), icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Profit', value: formatCurrency(metrics.totalProfit), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Stall Goal Tally', value: formatCurrency(metrics.stallGoalProfit), icon: Target, color: 'text-brand-600', bg: 'bg-brand-50' },
    { label: 'Outstanding', value: formatCurrency(metrics.outstandingBalance), icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-serif font-bold text-stone-900">Business Overview</h2>
        <p className="text-stone-500 mt-1">Real-time performance tracking for your atelier.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            <p className="text-sm font-medium text-stone-500">{stat.label}</p>
            <p className="text-2xl font-bold text-stone-900 mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Alerts & Flags */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <h3 className="text-lg font-bold text-stone-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-600" />
            Profitability by Garment Type
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.typeStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="type" axisLine={false} tickLine={false} tick={{ fill: '#78716c', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#78716c', fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [formatCurrency(value), 'Avg Profit']}
                />
                <Bar dataKey="avgProfit" radius={[6, 6, 0, 0]}>
                  {metrics.typeStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.avgProfit > 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <h3 className="text-lg font-bold text-stone-900 mb-4">Smart Flags</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span className="text-sm font-medium text-amber-900">Low Profit Items</span>
                </div>
                <span className="text-lg font-bold text-amber-900">{metrics.lowProfitGarments}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-100">
                <div className="flex items-center gap-3">
                  <ArrowDownRight className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-red-900">Loss Making Items</span>
                </div>
                <span className="text-lg font-bold text-red-900">{metrics.lossMakingGarments}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50 border border-purple-100">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">Overdue Orders</span>
                </div>
                <span className="text-lg font-bold text-purple-900">{metrics.overdueOrders}</span>
              </div>
            </div>
          </div>

          <div className="bg-brand-900 p-6 rounded-2xl text-white shadow-lg shadow-brand-900/20">
            <h3 className="text-lg font-serif font-bold mb-4">Performance Insights</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-brand-200">Most Profitable</span>
                <span className="font-bold">{metrics.mostProfitableType}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-brand-200">Least Profitable</span>
                <span className="font-bold">{metrics.leastProfitableType}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-brand-200">Efficiency</span>
                <span className="font-bold">84%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simulator Quick Link */}
      <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-brand-50 rounded-[2rem] text-brand-600">
            <Calculator className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-2xl font-serif font-bold text-stone-900">Pre-Quote Simulation Tool</h3>
            <p className="text-stone-500 mt-1 max-w-lg">
              Analyze pricing options, generate professional client quotes, and compare material costs before committing to the ledger.
            </p>
          </div>
        </div>
        <button
          onClick={() => setActiveTab?.('simulator')}
          className="flex items-center justify-center gap-3 px-8 py-4 bg-brand-900 text-white rounded-2xl font-bold hover:bg-brand-800 transition-all group whitespace-nowrap shadow-xl shadow-brand-900/20"
        >
          Launch Simulation Workspace
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
