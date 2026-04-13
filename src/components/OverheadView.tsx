/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MONTHLY_OVERHEAD, GARMENT_WEIGHTS, TOTAL_MONTHLY_OVERHEAD } from '../constants';
import { formatCurrency } from '../lib/utils';
import { Settings, Info, Scale, Calculator } from 'lucide-react';

export default function OverheadView() {
  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-serif font-bold text-stone-900">Overhead Configuration</h2>
        <p className="text-stone-500 mt-1">Manage fixed costs and weight-based distribution settings.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Fixed Costs */}
        <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Calculator className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-stone-900">Monthly Fixed Overheads</h3>
          </div>
          
          <div className="space-y-4">
            {Object.entries(MONTHLY_OVERHEAD).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center py-3 border-b border-stone-100 last:border-0">
                <span className="text-stone-600 capitalize">{key}</span>
                <span className="font-bold text-stone-900">{formatCurrency(value)}</span>
              </div>
            ))}
            <div className="pt-4 mt-4 border-t-2 border-stone-100 flex justify-between items-center">
              <span className="text-lg font-bold text-stone-900">Total Monthly Overhead</span>
              <span className="text-2xl font-serif font-bold text-brand-900">{formatCurrency(TOTAL_MONTHLY_OVERHEAD)}</span>
            </div>
          </div>
        </div>

        {/* Weight System */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-50 rounded-xl">
                <Scale className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-stone-900">Weight-Based Distribution</h3>
            </div>
            
            <p className="text-sm text-stone-500 mb-6 leading-relaxed">
              Each garment type carries a different overhead weight. The total monthly overhead is distributed proportionally based on the sum of weights of all garments produced in a given month.
            </p>

            <div className="grid grid-cols-3 gap-4">
              {Object.entries(GARMENT_WEIGHTS).map(([type, weight]) => (
                <div key={type} className="p-4 bg-stone-50 rounded-2xl border border-stone-100 text-center">
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">{type}</p>
                  <p className="text-2xl font-serif font-bold text-stone-900">{weight}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-stone-900 p-8 rounded-3xl text-white">
            <div className="flex items-center gap-3 mb-4">
              <Info className="w-6 h-6 text-brand-400" />
              <h3 className="text-lg font-bold">The Formula</h3>
            </div>
            <div className="bg-white/10 p-4 rounded-2xl font-mono text-sm leading-relaxed">
              Overhead per garment = <br/>
              ( Garment Weight ÷ Total Monthly Weight ) × Monthly Overhead
            </div>
            <p className="mt-4 text-sm text-stone-400 leading-relaxed">
              This ensures that more complex items (like Gowns) absorb a larger share of the rent and salaries compared to simpler items (like Tops).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
