/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Order, PaymentStatus } from '../types';
import { formatCurrency } from '../lib/utils';
import { Plus, Search, MoreVertical, Trash2, Edit2, ExternalLink } from 'lucide-react';
import Modal from './Modal';

interface OrderListProps {
  orders: Order[];
  onAdd: (order: Order) => void;
  onUpdate: (order: Order) => void;
  onDelete: (id: string) => void;
}

export default function OrderList({ orders, onAdd, onUpdate, onDelete }: OrderListProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingOrder, setEditingOrder] = React.useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredOrders = orders.filter(o => 
    o.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const orderData: Order = {
      id: editingOrder?.id || `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      clientName: formData.get('clientName') as string,
      contact: formData.get('contact') as string,
      orderDate: formData.get('orderDate') as string,
      dueDate: formData.get('dueDate') as string,
      totalOrderPrice: Number(formData.get('totalOrderPrice')),
      totalDepositPaid: Number(formData.get('totalDepositPaid')),
      paymentStatus: formData.get('paymentStatus') as PaymentStatus,
      notes: formData.get('notes') as string,
    };

    if (editingOrder) {
      onUpdate(orderData);
    } else {
      onAdd(orderData);
    }
    
    setIsModalOpen(false);
    setEditingOrder(null);
  };

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'Paid': return 'bg-emerald-100 text-emerald-700';
      case 'Partial': return 'bg-amber-100 text-amber-700';
      case 'Deposit': return 'bg-blue-100 text-blue-700';
      default: return 'bg-stone-100 text-stone-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-stone-900">Client Orders</h2>
          <p className="text-stone-500 mt-1">Manage your high-level client relationships.</p>
        </div>
        <button
          onClick={() => {
            setEditingOrder(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 bg-brand-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-800 transition-colors shadow-lg shadow-brand-900/20"
        >
          <Plus className="w-5 h-5" />
          New Order
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 bg-stone-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input
              type="text"
              placeholder="Search by client or order ID..."
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
                <th className="px-6 py-4">Order Details</th>
                <th className="px-6 py-4">Dates</th>
                <th className="px-6 py-4">Financials</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-stone-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-stone-900">{order.clientName}</div>
                    <div className="text-xs text-stone-500 font-mono">{order.id}</div>
                    <div className="text-xs text-stone-400 mt-1">{order.contact}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-stone-600">Ordered: {order.orderDate}</div>
                    <div className="text-sm font-medium text-stone-900">Due: {order.dueDate}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-stone-900">{formatCurrency(order.totalOrderPrice)}</div>
                    <div className="text-xs text-stone-500">Paid: {formatCurrency(order.totalDepositPaid)}</div>
                    <div className="text-xs font-medium text-red-600">Due: {formatCurrency(order.totalOrderPrice - order.totalDepositPaid)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.paymentStatus)}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingOrder(order);
                          setIsModalOpen(true);
                        }}
                        className="p-2 hover:bg-stone-100 rounded-lg text-stone-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(order.id)}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-stone-500">
                    No orders found. Start by creating a new one.
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
          setEditingOrder(null);
        }}
        title={editingOrder ? 'Edit Order' : 'New Client Order'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Client Name</label>
              <input
                name="clientName"
                defaultValue={editingOrder?.clientName}
                required
                className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Contact Info</label>
              <input
                name="contact"
                defaultValue={editingOrder?.contact}
                required
                className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Order Date</label>
              <input
                name="orderDate"
                type="date"
                defaultValue={editingOrder?.orderDate || new Date().toISOString().split('T')[0]}
                required
                className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Due Date</label>
              <input
                name="dueDate"
                type="date"
                defaultValue={editingOrder?.dueDate}
                required
                className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Total Order Price</label>
              <input
                name="totalOrderPrice"
                type="number"
                defaultValue={editingOrder?.totalOrderPrice}
                required
                className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Deposit Paid</label>
              <input
                name="totalDepositPaid"
                type="number"
                defaultValue={editingOrder?.totalDepositPaid}
                required
                className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Payment Status</label>
              <select
                name="paymentStatus"
                defaultValue={editingOrder?.paymentStatus || 'Deposit'}
                className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none bg-white"
              >
                <option value="Deposit">Deposit</option>
                <option value="Partial">Partial</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700">Notes</label>
            <textarea
              name="notes"
              defaultValue={editingOrder?.notes}
              rows={3}
              className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
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
              {editingOrder ? 'Save Changes' : 'Create Order'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
