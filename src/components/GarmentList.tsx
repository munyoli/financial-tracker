/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Garment, GarmentType, ComplexityLevel, ProductionStatus, Order } from '../types';
import { formatCurrency, calculateGarmentMetrics, cn } from '../lib/utils';
import { PROFIT_MARGIN_THRESHOLD } from '../constants';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  AlertCircle, 
  TrendingDown,
  Clock,
  CheckCircle2,
  Info
} from 'lucide-react';
import Modal from './Modal';

interface GarmentListProps {
  garments: Garment[];
  orders: Order[];
  onAdd: (garment: Garment) => void;
  onUpdate: (garment: Garment) => void;
  onDelete: (id: string) => void;
}

export default function GarmentList({ garments, orders, onAdd, onUpdate, onDelete }: GarmentListProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingGarment, setEditingGarment] = React.useState<Garment | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');

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
      laborCost: Number(formData.get('laborCost')),
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-stone-900">Garment Tracking</h2>
          <p className="text-stone-500 mt-1">Detailed costing and production status for every item.</p>
        </div>
        <button
          onClick={() => {
            setEditingGarment(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 bg-brand-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-800 transition-colors shadow-lg shadow-brand-900/20"
        >
          <Plus className="w-5 h-5" />
          Add Garment
        </button>
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
                <th className="px-6 py-4">Costing & Profit</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Flags</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredGarments.map((garment) => {
                const { totalCost, profit, profitMargin } = calculateGarmentMetrics(garment);
                const isLowProfit = profitMargin < PROFIT_MARGIN_THRESHOLD * 100;
                const isLoss = profit < 0;
                const isOverdue = new Date(garment.dueDate) < new Date() && garment.status !== 'Delivered';

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
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(garment.status)}`}>
                        {garment.status}
                      </span>
                      <div className="text-[10px] text-stone-400 mt-1 uppercase tracking-tight font-bold">Due: {garment.dueDate}</div>
                    </td>
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
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingGarment(garment);
                            setIsModalOpen(true);
                          }}
                          className="p-2 hover:bg-stone-100 rounded-lg text-stone-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(garment.id)}
                          className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredGarments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-stone-500">
                    No garments found. {orders.length === 0 ? 'Create an order first.' : 'Add a garment to get started.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingGarment(null);
        }}
        title={editingGarment ? 'Edit Garment' : 'Add New Garment'}
        className="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                    className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none bg-white"
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
                      defaultValue={editingGarment?.type || 'Dress'}
                      className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none bg-white"
                    >
                      <option value="Gown">Gown</option>
                      <option value="Dress">Dress</option>
                      <option value="Top">Top</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-700">Complexity</label>
                    <select
                      name="complexity"
                      defaultValue={editingGarment?.complexity || 'Medium'}
                      className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none bg-white"
                    >
                      <option value="Simple">Simple</option>
                      <option value="Medium">Medium</option>
                      <option value="Complex">Complex</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700">Description</label>
                  <input
                    name="description"
                    defaultValue={editingGarment?.description}
                    required
                    placeholder="e.g. Silk Wedding Gown with Lace"
                    className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Financials */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-stone-400 uppercase tracking-wider">Costing & Pricing</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700">Selling Price</label>
                  <input
                    name="sellingPrice"
                    type="number"
                    defaultValue={editingGarment?.sellingPrice}
                    required
                    className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-700">Fabric Cost</label>
                    <input
                      name="fabricCost"
                      type="number"
                      defaultValue={editingGarment?.fabricCost}
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
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700">Labor Cost</label>
                  <input
                    name="laborCost"
                    type="number"
                    defaultValue={editingGarment?.laborCost}
                    required
                    className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                  />
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 flex items-start gap-2">
                  <Info className="w-4 h-4 text-stone-400 mt-0.5" />
                  <p className="text-[10px] text-stone-500 leading-relaxed">
                    Overhead allocation is automatically calculated based on the monthly production weight system.
                  </p>
                </div>
              </div>
            </div>

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
                      className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
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
