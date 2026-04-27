import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Copy, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  Info,
  ChevronRight,
  Quote,
  Save,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { ComplexityLevel, GarmentType } from '../types';
import { ESTIMATED_HOURS } from '../constants';
import { formatCurrency, calculateSimulationPrice, generateQuoteMessage, cn } from '../lib/utils';
import Modal from './Modal';

interface Draft {
  id: string;
  name: string;
  type: GarmentType;
  complexity: ComplexityLevel;
  hours: number;
  materials: number;
  description: string;
}

interface PreQuoteSimulatorProps {
  onConfirm: (draft: Draft & { finalPrice: number }) => void;
}

export default function PreQuoteSimulator({ onConfirm }: PreQuoteSimulatorProps) {
  const [activeDraftIdx, setActiveDraftIdx] = useState(0);
  const [drafts, setDrafts] = useState<Draft[]>([
    { id: 'A', name: 'Option A', type: 'Dress', complexity: 'Moderate', hours: 10, materials: 5000, description: 'Standard Fabric' },
    { id: 'B', name: 'Option B', type: 'Gown', complexity: 'Complex', hours: 20, materials: 15000, description: 'Luxury Silk' },
    { id: 'C', name: 'Option C', type: 'Suit', complexity: 'Bridal/Couture', hours: 40, materials: 25000, description: 'High-Complexity' },
  ]);

  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeDraft = drafts[activeDraftIdx];
  
  const metrics = useMemo(() => {
    return calculateSimulationPrice(activeDraft.hours, activeDraft.materials);
  }, [activeDraft.hours, activeDraft.materials]);

  const updateDraft = (updates: Partial<Draft>) => {
    const newDrafts = [...drafts];
    newDrafts[activeDraftIdx] = { ...activeDraft, ...updates };
    setDrafts(newDrafts);
  };

  const handleComplexityChange = (val: ComplexityLevel) => {
    updateDraft({ 
      complexity: val, 
      hours: ESTIMATED_HOURS[val] 
    });
  };

  const quoteMessage = useMemo(() => {
    return generateQuoteMessage(activeDraft.description || activeDraft.type, metrics.retailPrice, activeDraft.hours);
  }, [activeDraft, metrics.retailPrice]);

  const handleCopyQuote = () => {
    navigator.clipboard.writeText(quoteMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif font-bold text-stone-900 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-brand-600" />
            Pre-Quote Simulator
          </h2>
          <p className="text-stone-500 mt-1">Real-time simulation workspace for premium client quotes.</p>
        </div>
      </div>

      {/* Draft Tabs */}
      <div className="flex p-1 bg-stone-100 rounded-2xl w-fit">
        {drafts.map((draft, idx) => (
          <button
            key={draft.id}
            onClick={() => setActiveDraftIdx(idx)}
            className={cn(
              "px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2",
              activeDraftIdx === idx 
                ? "bg-white text-brand-900 shadow-sm" 
                : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"
            )}
          >
            <Layers className="w-4 h-4" />
            {draft.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Workspace - Stage 1 & 2 */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-8 space-y-8">
            <div className="flex items-center gap-3 pb-6 border-b border-stone-100">
              <div className="p-3 bg-brand-50 rounded-2xl text-brand-600">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-stone-900">Simulation Workspace</h3>
                <p className="text-sm text-stone-500">Draft Mode - Changes do not affect the ledger.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="text-sm font-bold text-stone-700 uppercase tracking-wider flex items-center justify-between">
                    Complexity Tier
                    <span className="text-xs font-normal text-stone-400 normal-case italic">Stage 1: Production Cost</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(Object.keys(ESTIMATED_HOURS) as ComplexityLevel[]).map((level) => (
                      <button
                        key={level}
                        onClick={() => handleComplexityChange(level)}
                        className={cn(
                          "px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left",
                          activeDraft.complexity === level
                            ? "bg-brand-900 border-brand-900 text-white shadow-lg shadow-brand-900/20"
                            : "bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-400"
                        )}
                      >
                        <div className="font-bold">{level}</div>
                        <div className={cn("text-[10px]", activeDraft.complexity === level ? "text-brand-200" : "text-stone-400")}>
                          {ESTIMATED_HOURS[level]} Hours
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold text-stone-700 uppercase tracking-wider flex items-center justify-between">
                    Raw Material Cost
                    <span className="text-xs font-normal text-stone-400 normal-case italic">Stage 2: Base Cost</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-medium">KES</span>
                    <input
                      type="number"
                      value={activeDraft.materials}
                      onChange={(e) => updateDraft({ materials: Number(e.target.value) })}
                      className="w-full pl-14 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all font-bold text-stone-900"
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100000"
                    step="500"
                    value={activeDraft.materials}
                    onChange={(e) => updateDraft({ materials: Number(e.target.value) })}
                    className="w-full accent-brand-600 h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="text-sm font-bold text-stone-700 uppercase tracking-wider">Garment Details</label>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-stone-500">Short Description (for Quote)</label>
                      <input
                        type="text"
                        value={activeDraft.description}
                        onChange={(e) => updateDraft({ description: e.target.value })}
                        placeholder="e.g. Silk Architectural Gown"
                        className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-stone-500">Garment Type</label>
                      <select
                        value={activeDraft.type}
                        onChange={(e) => updateDraft({ type: e.target.value as GarmentType })}
                        className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white outline-none"
                      >
                        <option value="Gown">Gown</option>
                        <option value="Dress">Dress</option>
                        <option value="Top">Top</option>
                        <option value="Pants">Pants</option>
                        <option value="Suit">Suit</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-stone-500">Adjust Hours (Manual Override)</label>
                      <input
                        type="number"
                        value={activeDraft.hours}
                        onChange={(e) => updateDraft({ hours: Number(e.target.value) })}
                        className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison View */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {drafts.map((d, i) => {
              const dMetrics = calculateSimulationPrice(d.hours, d.materials);
              return (
                <div 
                  key={d.id}
                  onClick={() => setActiveDraftIdx(i)}
                  className={cn(
                    "p-6 rounded-3xl border transition-all cursor-pointer group",
                    activeDraftIdx === i 
                      ? "bg-brand-900 border-brand-900 text-white ring-4 ring-brand-500/10" 
                      : "bg-white border-stone-200 text-stone-600 hover:border-brand-300"
                  )}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className={cn("text-xs font-bold uppercase tracking-wider", activeDraftIdx === i ? "text-brand-300" : "text-stone-400")}>
                      {d.name}
                    </span>
                    {activeDraftIdx === i && <CheckCircle2 className="w-4 h-4 text-brand-400" />}
                  </div>
                  <div className="text-2xl font-bold mb-1">{formatCurrency(dMetrics.retailPrice)}</div>
                  <div className={cn("text-[10px] uppercase font-bold", activeDraftIdx === i ? "text-brand-300" : "text-stone-400")}>
                    {d.complexity} • {d.hours}h
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Output - Stage 3 & 4 */}
        <div className="space-y-6">
          <div className="bg-brand-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-brand-900/40 relative overflow-hidden flex flex-col justify-between h-full min-h-[500px]">
            <div className="relative z-10 space-y-8">
              <div>
                <p className="text-brand-300 text-sm font-bold uppercase tracking-[0.2em] mb-2">Final Client Quote</p>
                <h1 className="text-6xl font-serif font-bold tracking-tight">
                  {formatCurrency(metrics.retailPrice).split('.')[0]}
                  <span className="text-2xl font-normal text-brand-400">.00</span>
                </h1>
              </div>

              <div className="space-y-4 pt-8 border-t border-white/10">
                <div className="flex justify-between items-center group">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-brand-200 text-sm">Retail Markup (1.3x)</span>
                  </div>
                  <span className="font-medium">Applied</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                    <span className="text-brand-200 text-sm">Luxury Rounding (500)</span>
                  </div>
                  <span className="font-medium">Included</span>
                </div>
              </div>

              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4">
                <p className="text-xs font-bold text-brand-300 uppercase tracking-widest">Internal Transparency</p>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-200">Production Floor</span>
                    <span className="font-bold">{formatCurrency(metrics.totalBaseCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-200">Expansion Fund</span>
                    <span className="font-bold text-emerald-400">+{formatCurrency(metrics.expansionFund)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 space-y-3 mt-8">
              <button
                onClick={() => setIsQuoteModalOpen(true)}
                className="w-full bg-white text-brand-900 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-brand-50 transition-all active:scale-95"
              >
                <Quote className="w-5 h-5" />
                Generate Client Quote
              </button>
              <button
                onClick={() => onConfirm({ ...activeDraft, finalPrice: metrics.retailPrice })}
                className="w-full bg-brand-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-brand-400 transition-all active:scale-95 shadow-lg shadow-brand-500/20"
              >
                <Save className="w-5 h-5" />
                Confirm Order
              </button>
            </div>

            {/* Decorative background */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-white/5 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-[100px]" />
          </div>

          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex items-start gap-3">
            <Info className="w-5 h-5 text-stone-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-stone-500 leading-relaxed">
              <strong>Tip:</strong> The 'Production Floor' is your absolute break-even point. Ensure the 'Expansion Fund' is always above KES 2,500 for business growth.
            </p>
          </div>
        </div>
      </div>

      {/* Quote Generation Modal */}
      <Modal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        title="Professional Client Quote"
        className="max-w-xl"
      >
        <div className="space-y-6">
          <div className="p-8 bg-stone-50 rounded-3xl border border-stone-200 relative group">
            <p className="text-stone-800 font-serif text-lg leading-relaxed italic">
              "{quoteMessage}"
            </p>
            <button
              onClick={handleCopyQuote}
              className="absolute top-4 right-4 p-2 bg-white rounded-xl shadow-sm border border-stone-200 text-stone-500 hover:text-brand-600 transition-all active:scale-90"
              title="Copy to clipboard"
            >
              {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl flex items-center gap-2 text-sm font-bold">
                <MessageSquare className="w-5 h-5" />
                WhatsApp Ready
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center gap-2 text-sm font-bold">
                <Sparkles className="w-5 h-5" />
                Premium Tone
              </div>
            </div>
            <p className="text-sm text-stone-500">
              Copy this message and send it directly to your client. 
              The 'Confirm Order' button will record this in your financial history.
            </p>
          </div>

          <button
            onClick={() => setIsQuoteModalOpen(false)}
            className="w-full bg-brand-900 text-white py-4 rounded-2xl font-bold hover:bg-brand-800 transition-all"
          >
            Done
          </button>
        </div>
      </Modal>
    </div>
  );
}
