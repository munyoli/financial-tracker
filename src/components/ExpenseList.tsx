/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Expense } from '../types';
import { formatCurrency } from '../lib/utils';
import { Plus, Search, Trash2, Edit2, Wallet } from 'lucide-react';
import Modal from './Modal';

interface ExpenseListProps {
  expenses: Expense[];
  onAdd: (expense: Expense) => void;
  onUpdate: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export default function ExpenseList({ expenses, onAdd, onUpdate, onDelete }: ExpenseListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExpenses = expenses.filter(e => 
    e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const expenseData: Expense = {
      id: editingExpense?.id || `EXP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      category: formData.get('category') as string,
      description: formData.get('description') as string,
      amount: Number(formData.get('amount')),
      paymentDate: formData.get('paymentDate') as string,
    };

    if (editingExpense) {
      onUpdate(expenseData);
    } else {
      onAdd(expenseData);
    }
    
    setIsModalOpen(false);
    setEditingExpense(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-stone-900">Expenses</h2>
          <p className="text-stone-500 mt-1">Track daily purchases and non-overhead costs.</p>
        </div>
        <button
          onClick={() => {
            setEditingExpense(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 bg-brand-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-800 transition-colors shadow-lg shadow-brand-900/20"
        >
          <Plus className="w-5 h-5" />
          Log Expense
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm md:col-span-1 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-rose-50 rounded-xl">
              <Wallet className="w-5 h-5 text-rose-600" />
            </div>
            <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider">Total Evaluated</h3>
          </div>
          <p className="text-3xl font-bold text-stone-900">{formatCurrency(totalExpenses)}</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden md:col-span-2">
          <div className="p-4 border-b border-stone-100 bg-stone-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="text"
                placeholder="Search by description or category..."
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
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Expense Details</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-stone-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-stone-900">{expense.paymentDate}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-stone-900">{expense.description}</div>
                      <div className="text-xs text-stone-500 uppercase tracking-wide mt-1">{expense.category}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-rose-600">{formatCurrency(expense.amount)}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingExpense(expense);
                            setIsModalOpen(true);
                          }}
                          className="p-2 hover:bg-stone-100 rounded-lg text-stone-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(expense.id)}
                          className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredExpenses.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-stone-500">
                      No expenses found. Log a new purchase to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingExpense(null);
        }}
        title={editingExpense ? 'Edit Expense' : 'Log New Expense'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Category</label>
              <select
                name="category"
                defaultValue={editingExpense?.category || 'Materials'}
                className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none bg-white"
              >
                <option value="Materials">Materials & Fabrics</option>
                <option value="Maintenance">Equipment Maintenance</option>
                <option value="Marketing">Marketing & Ads</option>
                <option value="Shipping">Shipping</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Payment Date</label>
              <input
                name="paymentDate"
                type="date"
                defaultValue={editingExpense?.paymentDate || new Date().toISOString().split('T')[0]}
                required
                className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-stone-700">Description</label>
              <input
                name="description"
                defaultValue={editingExpense?.description}
                required
                placeholder="e.g. Bought 10m of Silk from Zara Fabrics"
                className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-stone-700">Amount Spent</label>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0"
                defaultValue={editingExpense?.amount}
                required
                className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
              />
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
              {editingExpense ? 'Save Changes' : 'Log Expense'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
