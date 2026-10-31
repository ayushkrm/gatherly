import React, { useState } from 'react';
import {
  CheckCircle2,
  HelpCircle,
  Search,
  ExternalLink,
  Check,
  Sparkles,
} from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore';
import { formatCurrency } from '../../lib/budget';

interface GroundedSearchResult {
  category: string;
  text: string;
  sources: { title: string; uri: string }[];
  searchQueries: string[];
}

export const VendorsTab: React.FC = () => {
  const {
    plan,
    onboarding,
    toggleVendorBooked,
  } = usePlanStore();

  const [activeCategoryModal, setActiveCategoryModal] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<GroundedSearchResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [editingVendorNameCat, setEditingVendorNameCat] = useState<string | null>(null);
  const [vendorNameInput, setVendorNameInput] = useState('');

  if (!plan) return null;

  const handleFindRealOptions = async (category: string) => {
    setActiveCategoryModal(category);
    setIsSearching(true);
    setSearchResult(null);
    setSearchError(null);

    const vendorCat = plan.vendors.find((v) => v.category === category);
    const budgetLimit = vendorCat ? vendorCat.estimatedCost : undefined;

    try {
      const res = await fetch('/api/vendors/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          city: onboarding.city,
          currency: onboarding.currency,
          budgetLimit,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to search vendors');
      }

      setSearchResult({
        category,
        text: data.text,
        sources: data.sources || [],
        searchQueries: data.searchQueries || [],
      });
    } catch (err: any) {
      console.error(err);
      setSearchError(err.message || 'Error conducting grounded vendor search.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#37352F] dark:text-[#D4D4D4]">
            Vendor Directory & Due Diligence
          </h2>
          <p className="text-[#787774] text-xs sm:text-sm mt-0.5">
            Category checklists, interview questions, and real options grounded in {onboarding.city}.
          </p>
        </div>

        {/* Responsible AI Disclaimer badge */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-[#787774] bg-[#F7F6F3] dark:bg-[#202020] border border-[#E9E9E7] dark:border-[#2E2E2E]">
          <span>Grounded via Google Search</span>
        </div>
      </div>

      {/* Vendor Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plan.vendors.map((vendor, idx) => {
          const isEditingName = editingVendorNameCat === vendor.category;

          return (
            <div
              key={idx}
              className={`bg-[#FFFFFF] dark:bg-[#202020] border rounded-lg p-5 sm:p-6 shadow-2xs flex flex-col justify-between transition-colors ${
                vendor.booked
                  ? 'border-[#86C19F] dark:border-[#335643]'
                  : 'border-[#E9E9E7] dark:border-[#2E2E2E]'
              }`}
            >
              <div className="space-y-4">
                {/* Top Row: Category & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-serif font-bold text-[#37352F] dark:text-[#D4D4D4]">
                      {vendor.category}
                    </h3>
                    <div className="text-xs text-[#787774] mt-0.5 font-mono">
                      Benchmark: {formatCurrency(vendor.estimatedCost, onboarding.currency)}
                    </div>
                  </div>

                  {/* Notion Pastel Booking Status Badge */}
                  <div>
                    {vendor.booked ? (
                      <button
                        onClick={() => toggleVendorBooked(vendor.category, false)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#DBEDDB] dark:bg-[#243D30] text-[#1C3829] dark:text-[#86C19F] transition-colors"
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Booked</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingVendorNameCat(vendor.category);
                          setVendorNameInput('');
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#E3E2E0] dark:bg-[#2F2F2F] text-[#37352F] dark:text-[#D4D4D4] hover:bg-[#D5D4D2] transition-colors"
                      >
                        <span>Mark Booked</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Booked Vendor Name Banner */}
                {vendor.booked && (
                  <div className="p-2.5 rounded-md bg-[#DBEDDB]/40 dark:bg-[#243D30]/40 border border-[#86C19F]/60 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[#1C3829] dark:text-[#86C19F] text-[10px] block uppercase font-medium">Confirmed Vendor:</span>
                      <span className="font-semibold text-[#1C3829] dark:text-[#86C19F] text-xs">
                        {vendor.bookedVendorName || 'Selected Vendor'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setEditingVendorNameCat(vendor.category);
                        setVendorNameInput(vendor.bookedVendorName || '');
                      }}
                      className="text-[#FF5B26] text-[11px] hover:underline font-medium"
                    >
                      Edit
                    </button>
                  </div>
                )}

                {/* Edit Vendor Name Input */}
                {isEditingName && (
                  <div className="p-2.5 rounded-md bg-[#F7F6F3] dark:bg-[#252525] border border-[#E9E9E7] dark:border-[#2E2E2E] space-y-2">
                    <label className="text-[11px] font-semibold text-[#787774] block">
                      Vendor / Business Name:
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="e.g. Royal Palace Caterers"
                        value={vendorNameInput}
                        onChange={(e) => setVendorNameInput(e.target.value)}
                        className="flex-1 px-2.5 py-1 rounded border border-[#E9E9E7] dark:border-[#2E2E2E] bg-[#FFFFFF] dark:bg-[#191919] text-xs text-[#37352F] dark:text-white"
                      />
                      <button
                        onClick={() => {
                          toggleVendorBooked(vendor.category, true, vendorNameInput.trim() || 'Selected Vendor');
                          setEditingVendorNameCat(null);
                        }}
                        className="px-2.5 py-1 rounded bg-[#FF5B26] text-white font-medium text-xs hover:bg-[#EA4B18]"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingVendorNameCat(null)}
                        className="px-2 py-1 rounded text-[#787774] text-xs hover:bg-[#EFEFED]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Checklist Section */}
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-semibold text-[#787774] uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-[#FF5B26]" />
                    <span>Diligence Checklist</span>
                  </h4>
                  <ul className="space-y-1 text-xs text-[#37352F] dark:text-[#D4D4D4]">
                    {vendor.checklist.map((item, cIdx) => (
                      <li key={cIdx} className="flex items-start gap-2">
                        <span className="text-[#787774] mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Questions to Ask Section */}
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-semibold text-[#787774] uppercase tracking-wider flex items-center gap-1.5">
                    <HelpCircle className="w-3 h-3 text-[#787774]" />
                    <span>Questions to Ask</span>
                  </h4>
                  <div className="space-y-1">
                    {vendor.questionsToAsk.map((q, qIdx) => (
                      <div
                        key={qIdx}
                        className="p-2 rounded bg-[#F7F6F3] dark:bg-[#252525] text-xs text-[#37352F] dark:text-[#D4D4D4] italic border border-[#E9E9E7] dark:border-[#2E2E2E]"
                      >
                        &ldquo;{q}&rdquo;
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Card Action: Find Real Options */}
              <div className="pt-4 mt-4 border-t border-[#E9E9E7] dark:border-[#2E2E2E]">
                <button
                  onClick={() => handleFindRealOptions(vendor.category)}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md bg-[#F7F6F3] dark:bg-[#252525] hover:bg-[#EFEFED] dark:hover:bg-[#2C2C2C] text-[#37352F] dark:text-[#D4D4D4] font-medium text-xs border border-[#E9E9E7] dark:border-[#2E2E2E] transition-colors"
                >
                  <Search className="w-3.5 h-3.5 text-[#FF5B26]" />
                  <span>Find Real Options in {onboarding.city}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grounded Vendor Search Modal */}
      {activeCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 overflow-y-auto">
          <div className="bg-[#FFFFFF] dark:bg-[#202020] border border-[#E9E9E7] dark:border-[#2E2E2E] rounded-lg p-6 max-w-xl w-full max-h-[85vh] overflow-y-auto shadow-lg space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-[#E9E9E7] dark:border-[#2E2E2E] pb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#D3E5EF] dark:bg-[#21374A] text-[#183347] dark:text-[#85B7DC] mb-1">
                  <Sparkles className="w-3 h-3 text-[#FF5B26]" />
                  <span>Google Search Grounding</span>
                </div>
                <h3 className="text-lg font-serif font-bold text-[#37352F] dark:text-[#D4D4D4]">
                  Real {activeCategoryModal} Options in {onboarding.city}
                </h3>
              </div>

              <button
                onClick={() => setActiveCategoryModal(null)}
                className="text-[#787774] hover:text-[#37352F] text-xs font-semibold p-1"
              >
                ✕ Close
              </button>
            </div>

            {isSearching && (
              <div className="py-10 text-center space-y-2.5">
                <div className="w-8 h-8 rounded-full border-2 border-[#E9E9E7] border-t-[#FF5B26] animate-spin mx-auto" />
                <p className="text-xs text-[#787774]">
                  Searching Google for verified {activeCategoryModal} in {onboarding.city}...
                </p>
              </div>
            )}

            {searchError && (
              <div className="p-3 rounded-md bg-[#FFE2DD] border border-[#F3958F] text-[#5D1715] text-xs">
                {searchError}
              </div>
            )}

            {searchResult && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-md bg-[#F7F6F3] dark:bg-[#252525] text-xs text-[#37352F] dark:text-[#D4D4D4] leading-relaxed whitespace-pre-wrap border border-[#E9E9E7] dark:border-[#2E2E2E]">
                  {searchResult.text}
                </div>

                {/* Grounding Source Citations */}
                {searchResult.sources.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-semibold text-[#787774] uppercase tracking-wider">
                      Grounding Sources:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {searchResult.sources.map((src, sIdx) => (
                        <a
                          key={sIdx}
                          href={src.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2 rounded-md border border-[#E9E9E7] dark:border-[#2E2E2E] hover:border-[#FF5B26] transition-colors text-xs text-[#37352F] dark:text-[#D4D4D4] group bg-[#FFFFFF] dark:bg-[#191919]"
                        >
                          <span className="truncate pr-1.5 font-medium">{src.title}</span>
                          <ExternalLink className="w-3 h-3 text-[#787774] group-hover:text-[#FF5B26] shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-[#E9E9E7] dark:border-[#2E2E2E]">
              <button
                onClick={() => setActiveCategoryModal(null)}
                className="px-3.5 py-1.5 rounded-md bg-[#F7F6F3] dark:bg-[#252525] border border-[#E9E9E7] dark:border-[#2E2E2E] hover:bg-[#EFEFED] text-[#37352F] dark:text-[#D4D4D4] text-xs font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
