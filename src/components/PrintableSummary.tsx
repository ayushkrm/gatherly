import React from 'react';
import { Printer, X } from 'lucide-react';
import { usePlanStore } from '../store/usePlanStore';
import { formatCurrency } from '../lib/budget';
import { Logo } from './Logo';

interface PrintableSummaryProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrintableSummary: React.FC<PrintableSummaryProps> = ({ isOpen, onClose }) => {
  const { plan, onboarding, guests } = usePlanStore();

  if (!isOpen || !plan) return null;

  const attendingGuests = guests.filter((g) => g.rsvp === 'attending').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 overflow-y-auto">
      <div className="bg-[#FFFFFF] text-[#37352F] border border-[#E9E9E7] rounded-lg p-6 sm:p-8 max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-lg relative font-sans">
        {/* Screen-only Controls Bar */}
        <div className="no-print flex items-center justify-between pb-4 mb-6 border-b border-[#E9E9E7]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#787774]">
              Printable Event Brief
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#FF5B26] hover:bg-[#EA4B18] text-white text-xs font-medium transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Document</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-[#787774] hover:text-[#37352F] hover:bg-[#EFEFED]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="space-y-6">
          {/* Header */}
          <div className="border-b border-[#E9E9E7] pb-5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#787774] mb-1">
              Event Specification
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#37352F]">
              {plan.title}
            </h1>
            <p className="text-[#787774] text-xs sm:text-sm mt-1 font-serif italic">
              {plan.theme}
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-[#787774] mt-3 pt-3 border-t border-[#E9E9E7]">
              <span><strong>Date:</strong> {onboarding.date}</span>
              <span>•</span>
              <span><strong>Location:</strong> {onboarding.city}</span>
              <span>•</span>
              <span><strong>Guests:</strong> {onboarding.guestCount} ({attendingGuests} confirmed)</span>
              <span>•</span>
              <span><strong>Total Budget:</strong> {formatCurrency(onboarding.totalBudget, onboarding.currency)}</span>
            </div>
          </div>

          {/* Executive Summary */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#787774] mb-2">
              Vision & Strategy
            </h2>
            <p className="text-xs sm:text-sm text-[#37352F] leading-relaxed bg-[#F7F6F3] p-3.5 rounded-md border border-[#E9E9E7]">
              {plan.summary}
            </p>
          </div>

          {/* Budget Allocation Table */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#787774] mb-2.5">
              Budget Allocations
            </h2>
            <table className="w-full text-xs text-left border border-[#E9E9E7] rounded-md overflow-hidden">
              <thead className="bg-[#F7F6F3] text-[#787774] border-b border-[#E9E9E7] uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-3 font-semibold">Category</th>
                  <th className="py-2 px-2 text-center font-semibold">Priority</th>
                  <th className="py-2 px-3 text-right font-semibold">Percent</th>
                  <th className="py-2 px-3 text-right font-semibold">Planned</th>
                  <th className="py-2 px-3 text-right font-semibold">Actual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E9E7]">
                {plan.budget.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#F7F6F3]">
                    <td className="py-2 px-3 font-medium text-[#37352F]">{item.category}</td>
                    <td className="py-2 px-2 text-center">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#E3E2E0] text-[#37352F]">
                        {item.priority}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-[#787774]">{item.percent}%</td>
                    <td className="py-2 px-3 text-right font-medium text-[#37352F]">{formatCurrency(item.amount, onboarding.currency)}</td>
                    <td className="py-2 px-3 text-right font-mono text-[#37352F]">{formatCurrency(item.actualSpent || 0, onboarding.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Timeline Milestones */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#787774] mb-2.5">
              Timeline Milestones
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {plan.timeline.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-md border border-[#E9E9E7] bg-[#FFFFFF] flex items-start gap-2">
                  <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 mt-0.5 text-[10px] ${
                    item.done ? 'bg-[#FF5B26] border-[#FF5B26] text-white' : 'border-[#E9E9E7]'
                  }`}>
                    {item.done && '✓'}
                  </span>
                  <div>
                    <div className="font-medium text-[#37352F]">{item.task}</div>
                    <div className="text-[11px] text-[#787774]">
                      {item.category} • {item.weeksBefore === 0 ? 'Event Day' : `${item.weeksBefore}w before`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vendor Diligence */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#787774] mb-2.5">
              Vendor Diligence
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {plan.vendors.map((v, i) => (
                <div key={i} className="p-3 rounded-md border border-[#E9E9E7] bg-[#F7F6F3]">
                  <div className="font-semibold text-xs mb-1 flex items-center justify-between text-[#37352F]">
                    <span>{v.category}</span>
                    <span className="text-[11px] font-normal text-[#787774]">
                      {v.booked ? `Booked: ${v.bookedVendorName || 'Yes'}` : 'Open'}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#787774] mb-1.5">
                    Est: {formatCurrency(v.estimatedCost, onboarding.currency)}
                  </div>
                  <div className="space-y-0.5 text-[11px] text-[#37352F]">
                    {v.checklist.slice(0, 2).map((item, c) => (
                      <div key={c}>• {item}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-[#E9E9E7] flex items-center justify-between text-[11px] text-[#787774]">
            <Logo size={24} asLink={false} />
            <span>Advisory estimates for {onboarding.city}.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
