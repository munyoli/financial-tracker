/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Garment, GarmentType, ComplexityLevel, ProductionStatus, Order } from '../types';
import { formatCurrency, calculateGarmentMetrics, calculateRecommendedPrice, cn } from '../lib/utils';
import { PROFIT_MARGIN_THRESHOLD, MIN_MARGIN_PERCENT, ESTIMATED_HOURS, DEFAULT_HOURLY_RATE, HOURLY_OVERHEAD, STALL_GOAL } from '../constants';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  AlertCircle, 
  TrendingDown,
  Clock,
  CheckCircle2,
  Info,
  AlertTriangle,
  Download,
  Target,
  TrendingUp as TrendingUpIcon,
  ShoppingBag
} from 'lucide-react';
import Modal from './Modal';
import { useAuth } from '../context/AuthContext';

interface GarmentListProps {
  garments: Garment[];
  orders: Order[];
  onAdd: (garment: Garment) => void;
  onUpdate: (garment: Garment) => void;
  onDelete: (id: string) => void;
  prefilledData?: Partial<Garment> | null;
  onClearPrefilled?: () => void;
}

export default function GarmentList({ garments, orders, onAdd, onUpdate, onDelete, prefilledData, onClearPrefilled }: GarmentListProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingGarment, setEditingGarment] = React.useState<Garment | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [formLiveCost, setFormLiveCost] = React.useState({ 
    selling: 0, cost: 0, isCalculated: false, recommendedPrice: 0 
  });
  const [selectedComplexity, setSelectedComplexity] = React.useState<string>('Medium');

  const liveProfit = formLiveCost.selling - formLiveCost.cost;
  const liveMargin = formLiveCost.selling > 0 ? liveProfit / formLiveCost.selling : 0;
  const showProfitWarning = formLiveCost.isCalculated && (formLiveCost.cost > 0 || formLiveCost.selling > 0) && liveMargin < MIN_MARGIN_PERCENT;

  // Calculate Stall Goal Progress
  const goalProgress = React.useMemo(() => {
    return garments.reduce((sum, g) => {
      // Only count profit from jobs that are "Accepted" (In Progress, Fitting, Done, Delivered)
      if (['Not Started'].includes(g.status)) return sum;
      const { markupProfit } = calculateGarmentMetrics(g);
      return sum + markupProfit;
    }, 0);
  }, [garments]);

  const progressPercentage = Math.min((goalProgress / STALL_GOAL) * 100, 100);

  const openModal = (garment: Garment | null) => {
    setEditingGarment(garment);
    if (garment) {
      const metrics = calculateGarmentMetrics(garment);
      const recommended = calculateRecommendedPrice(garment.fabricCost, garment.otherMaterialsCost, garment.estimatedHours || 0);
      setFormLiveCost({
        selling: garment.sellingPrice,
        cost: metrics.totalCost,
        isCalculated: true,
        recommendedPrice: recommended
      });
      setSelectedComplexity(garment.complexity);
    } else {
      setFormLiveCost({ selling: 0, cost: 0, isCalculated: false, recommendedPrice: 0 });
      setSelectedComplexity('Moderate');
    }
    setIsModalOpen(true);
  };

  // Handle prefilled data from Simulator
  React.useEffect(() => {
    if (prefilledData) {
      setEditingGarment(null);
      setFormLiveCost({
        selling: prefilledData.sellingPrice || 0,
        cost: (prefilledData.fabricCost || 0) + ((prefilledData.estimatedHours || 0) * 715),
        isCalculated: true,
        recommendedPrice: prefilledData.sellingPrice || 0
      });
      setSelectedComplexity(prefilledData.complexity || 'Moderate');
      setIsModalOpen(true);
    }
  }, [prefilledData]);

  const handleComplexityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedComplexity(e.target.value);
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Client', 'Type', 'Complexity', 'Selling Price', 'Fabric Cost', 'Other Materials Cost', 'Estimated Hours', 'Actual Hours', 'Total Cost', 'Profit', 'Margin %', 'Status', 'Due Date'];
    const rows = garments.map(g => {
      const metrics = calculateGarmentMetrics(g);
      return [
        g.id,
        g.clientName,
        g.type,
        g.complexity,
        g.sellingPrice,
        g.fabricCost,
        g.otherMaterialsCost,
        g.estimatedHours || 0,
        g.actualHours || 0,
        metrics.totalCost,
        metrics.profit,
        metrics.profitMargin.toFixed(2),
        g.status,
        g.dueDate
      ].map(row => `"${row}"`).join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `atelier_garments_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFormChange = (e: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(e.currentTarget);
    const selling = Number(formData.get('sellingPrice')) || 0;
    const fCost = Number(formData.get('fabricCost')) || 0;
    const oCost = Number(formData.get('otherMaterialsCost')) || 0;
    const estHours = Number(formData.get('estimatedHours')) || 0;
    
    setFormLiveCost({
      selling,
      cost: (fCost + oCost + (estHours * (DEFAULT_HOURLY_RATE + HOURLY_OVERHEAD))),
      isCalculated: true,
      recommendedPrice: calculateRecommendedPrice(fCost, oCost, estHours)
    });
  };

  const filteredGarments = garments.filter(g => 
    g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const orderId = formData.get('orderId') as string;
    const selectedOrder = orders.find(o => o.id === orderId);

    const garmentData: Garment = {
      id: editingGarment?.id || `GRM-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      orderId,
      clientName: selectedOrder?.clientName || 'Unknown',
      type: formData.get('type') as GarmentType,
      description: formData.get('description') as string,
      complexity: formData.get('complexity') as ComplexityLevel,
      sellingPrice: Number(formData.get('sellingPrice')),
      fabricCost: Number(formData.get('fabricCost')),
      otherMaterialsCost: Number(formData.get('otherMaterialsCost')),
      estimatedHours: Number(formData.get('estimatedHours')),
      actualHours: Number(formData.get('actualHours')),
      laborCost: 0,
      overheadAllocation: editingGarment?.overheadAllocation || 0, // Calculated by store
      startDate: formData.get('startDate') as string,
      dueDate: formData.get('dueDate') as string,
      status: formData.get('status') as ProductionStatus,
    };

    if (editingGarment) {
      onUpdate(garmentData);
    } else {
      onAdd(garmentData);
    }
    
    setIsModalOpen(false);
    setEditingGarment(null);
  };

  const getStatusColor = (status: ProductionStatus) => {
    switch (status) {
      case 'Delivered': return 'bg-stone-900 text-white';
      case 'Done': return 'bg-emerald-100 text-emerald-700';
      case 'Fitting': return 'bg-purple-100 text-purple-700';
      case 'In Progress': return 'bg-blue-100 text-blue-700';
      default: return 'bg-stone-100 text-stone-700';
    }
  };

  return (
    <div className="space-y-8">
      {/* Visual Dashboard - Stall Expansion Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-brand-900 rounded-3xl p-8 text-white shadow-xl shadow-brand-900/20 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-white/10 rounded-xl">
                <Target className="w-6 h-6 text-brand-300" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-bold">Stall Expansion Tracker</h3>
                <p className="text-brand-300 text-sm">Target: {formatCurrency(STALL_GOAL)}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-4xl font-bold">{formatCurrency(goalProgress)}</p>
                  <p className="text-brand-300 text-sm mt-1">Total Markup Profit Earned</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{progressPercentage.toFixed(1)}%</p>
                  <p className="text-brand-300 text-sm mt-1">Goal Reached</p>
                </div>
              </div>
              
              <div className="h-4 bg-white/10 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-brand-400 to-emerald-400 transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              <div className="pt-4 flex items-center gap-2 text-brand-200 text-xs">
                <Info className="w-4 h-4" />
                <p>Only profit from jobs in production (In Progress, Fitting, Done, Delivered) is counted toward this tally.</p>
              </div>
            </div>
          </div>
          
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-64 h-64 bg-brand-400/10 rounded-full blur-3xl" />
        </div>

        <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-stone-100 rounded-xl">
                <Clock className="w-6 h-6 text-stone-600" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">Current Hourly Rate</h3>
            </div>
            <p className="text-4xl font-bold text-stone-900">{formatCurrency(DEFAULT_HOURLY_RATE + HOURLY_OVERHEAD)}<span className="text-sm text-stone-400 font-normal">/hr</span></p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Base Labor</span>
                <span className="font-medium">{formatCurrency(DEFAULT_HOURLY_RATE)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Calculated Overhead</span>
                <span className="font-medium">{formatCurrency(HOURLY_OVERHEAD)}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <p className="text-xs text-emerald-800 leading-relaxed font-medium">
              You need {formatCurrency(Math.max(STALL_GOAL - goalProgress, 0))} more in profit to reach your goal.
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-stone-900">Garment Tracking</h2>
          <p className="text-stone-500 mt-1">Detailed costing and production status for every item.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportToCSV}
            className="flex items-center justify-center gap-2 bg-stone-100 text-stone-700 px-4 py-3 rounded-xl font-medium hover:bg-stone-200 transition-colors"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </button>
          <button
            onClick={() => openModal(null)}
            className="flex items-center justify-center gap-2 bg-brand-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-800 transition-colors shadow-lg shadow-brand-900/20"
          >
            <Plus className="w-5 h-5" />
            Add Garment
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 bg-stone-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input
              type="text"
              placeholder="Search by description, client or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/50 text-stone-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Garment Info</th>
                {isAdmin && <th className="px-6 py-4">Costing & Profit</th>}
                <th className="px-6 py-4">Status</th>
                {isAdmin && <th className="px-6 py-4">Flags</th>}
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredGarments.map((garment) => {
                const { totalCost, profit, profitMargin } = calculateGarmentMetrics(garment);
                const isLowProfit = profitMargin < PROFIT_MARGIN_THRESHOLD * 100;
                const isLoss = profit < 0;
                const isOverdue = new Date(garment.dueDate) < new Date() && garment.status !== 'Delivered';
                const hasScopeCreep = garment.actualHours != null && garment.estimatedHours != null && garment.actualHours > garment.estimatedHours;

                return (
                  <tr key={garment.id} className="hover:bg-stone-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center text-stone-500 font-serif font-bold italic">
                          {garment.type[0]}
                        </div>
                        <div>
                          <div className="font-bold text-stone-900">{garment.description}</div>
                          <div className="text-xs text-stone-500">{garment.type} • {garment.complexity}</div>
                          <div className="text-xs text-brand-700 font-medium mt-0.5">Client: {garment.clientName}</div>
                        </div>
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-stone-500">
                            <span>Price:</span>
                            <span className="font-medium text-stone-900">{formatCurrency(garment.sellingPrice)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-stone-500">
                            <span>Cost:</span>
                            <span className="font-medium text-stone-900">{formatCurrency(totalCost)}</span>
                          </div>
                          <div className="flex justify-between text-xs font-bold pt-1 border-t border-stone-100">
                            <span>Profit:</span>
                            <span className={profit >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                              {formatCurrency(profit)} ({profitMargin.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(garment.status)}`}>
                        {garment.status}
                      </span>
                      <div className="text-[10px] text-stone-400 mt-1 uppercase tracking-tight font-bold">Due: {garment.dueDate}</div>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4">
                        <div className="flex gap-1.5">
                          {isLoss && (
                            <div className="p-1.5 bg-red-100 text-red-600 rounded-lg" title="Loss Making">
                              <TrendingDown className="w-4 h-4" />
                            </div>
                          )}
                          {isLowProfit && !isLoss && (
                            <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg" title="Low Profit Margin">
                              <AlertCircle className="w-4 h-4" />
                            </div>
                          )}
                          {hasScopeCreep && (
                            <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg" title="Scope Creep: Actual Hours > Estimated">
                              <Clock className="w-4 h-4" />
                            </div>
                          )}
                          {isOverdue && (
                            <div className="p-1.5 bg-purple-100 text-purple-600 rounded-lg" title="Overdue">
                              <Clock className="w-4 h-4" />
                            </div>
                          )}
                          {!isLoss && !isLowProfit && !isOverdue && (
                            <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openModal(garment)}
                          className="p-2 hover:bg-stone-100 rounded-lg text-stone-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => onDelete(garment.id)}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredGarments.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 5 : 3} className="px-6 py-12 text-center text-stone-500">
                    No garments found. {orders.length === 0 ? 'Create an order first.' : 'Add a garment to get started.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          if (onClearPrefilled) onClearPrefilled();
        }}
        title={editingGarment ? 'Edit Garment' : 'Add New Garment'}
        className="max-w-3xl"
      >
        <form onSubmit={handleSubmit} onChange={handleFormChange} className="space-y-8">
          <div className={isAdmin ? "grid grid-cols-1 md:grid-cols-2 gap-8" : "grid grid-cols-1 gap-8"}>
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-stone-400 uppercase tracking-wider">Basic Information</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700">Link to Order</label>
                  <select
                    name="orderId"
                    defaultValue={editingGarment?.orderId}
                    required
                    disabled={!isAdmin}
                    className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none bg-stone-50 disabled:opacity-50"
                  >
                    <option value="">Select an order...</option>
                    {orders.map(o => (
                      <option key={o.id} value={o.id}>{o.clientName} ({o.id})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-700">Garment Type</label>
                    <select
                      name="type"
                      defaultValue={prefilledData?.type || editingGarment?.type || 'Dress'}
                      className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none bg-white"
                    >
                      <option value="Gown">Gown</option>
                      <option value="Dress">Dress</option>
                      <option value="Top">Top</option>
                      <option value="Pants">Pants</option>
                      <option value="Suit">Suit</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-700">Complexity</label>
                    <select
                      name="complexity"
                      value={selectedComplexity}
                      onChange={handleComplexityChange}
                      className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none bg-white"
                    >
                      <option value="Simple">Simple (3h)</option>
                      <option value="Moderate">Moderate (10h)</option>
                      <option value="Complex">Complex (20h)</option>
                      <option value="Bridal">Bridal (40h)</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700">Description</label>
                  <input
                    name="description"
                    defaultValue={prefilledData?.description || editingGarment?.description}
                    required
                    disabled={!isAdmin}
                    placeholder="e.g. Silk Wedding Gown with Lace"
                    className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none bg-white disabled:bg-stone-50 disabled:opacity-50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-700">Start Date</label>
                    <input
                      name="startDate"
                      type="date"
                      defaultValue={editingGarment?.startDate}
                      required
                      disabled={!isAdmin}
                      className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none bg-white disabled:bg-stone-50 disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-700">Due Date</label>
                    <input
                      name="dueDate"
                      type="date"
                      defaultValue={editingGarment?.dueDate}
                      required
                      disabled={!isAdmin}
                      className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none bg-white disabled:bg-stone-50 disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Financials - Hidden for Staff */}
            {isAdmin && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-stone-400 uppercase tracking-wider">Costing & Pricing</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-700">Selling Price</label>
                    <input
                      name="sellingPrice"
                      type="number"
                      defaultValue={prefilledData?.sellingPrice || editingGarment?.sellingPrice}
                      required
                      className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                    />
                    {formLiveCost.isCalculated && formLiveCost.recommendedPrice > 0 && (
                      <p className="text-xs text-brand-600 font-medium mt-1">
                        Recommended: {formatCurrency(formLiveCost.recommendedPrice)}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-stone-700">Fabric Cost</label>
                      <input
                        name="fabricCost"
                        type="number"
                        defaultValue={prefilledData?.fabricCost || editingGarment?.fabricCost}
                        required
                        className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-stone-700">Other Materials</label>
                      <input
                        name="otherMaterialsCost"
                        type="number"
                        defaultValue={editingGarment?.otherMaterialsCost}
                        required
                        className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-stone-700">Estimated Hours</label>
                      <input
                        name="estimatedHours"
                        type="number"
                        defaultValue={prefilledData?.estimatedHours || editingGarment?.estimatedHours || ESTIMATED_HOURS[selectedComplexity] || 0}
                        required
                        className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none bg-stone-50"
                      />
                      <p className="text-[10px] text-stone-500">Based on complexity matrix</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-stone-700">Actual Hours (Opt.)</label>
                      <input
                        name="actualHours"
                        type="number"
                        defaultValue={editingGarment?.actualHours}
                        className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                        placeholder="Log time..."
                      />
                    </div>
                  </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 flex items-start gap-2">
                  <Info className="w-4 h-4 text-stone-400 mt-0.5" />
                  <p className="text-[10px] text-stone-500 leading-relaxed">
                    Pricing includes a KES 2,500 Expansion Fund allocation and a 30% profit markup.
                  </p>
                </div>
                
                {showProfitWarning && (
                  <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-start gap-3 mt-4">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-red-900">Warning: Not Profitable</p>
                      <p className="text-xs text-red-700 mt-1">
                        This garment is below your {MIN_MARGIN_PERCENT * 100}% Negotiation Floor. 
                        Current Margin: {(liveMargin * 100).toFixed(1)}%.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            )}

            {/* Production Tracking */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-stone-400 uppercase tracking-wider">Production</h4>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-700">Start Date</label>
                    <input
                      name="startDate"
                      type="date"
                      defaultValue={editingGarment?.startDate || new Date().toISOString().split('T')[0]}
                      required
                      className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-700">Due Date</label>
                    <input
                      name="dueDate"
                      type="date"
                      defaultValue={editingGarment?.dueDate}
                      required
                      disabled={!isAdmin}
                      className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none disabled:bg-stone-50 disabled:opacity-50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700">Production Status</label>
                  <select
                    name="status"
                    defaultValue={editingGarment?.status || 'Not Started'}
                    className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none bg-white"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Fitting">Fitting</option>
                    <option value="Done">Done</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2 text-stone-600 font-medium hover:bg-stone-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-brand-900 text-white font-medium rounded-xl hover:bg-brand-800 transition-colors shadow-lg shadow-brand-900/20"
            >
              {editingGarment ? 'Save Changes' : 'Add Garment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
