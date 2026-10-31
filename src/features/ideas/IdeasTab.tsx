import React, { useState } from 'react';
import {
  Lightbulb,
  Sparkles,
  Plus,
  RefreshCw,
  TrendingDown,
  Check,
  Tag,
  DollarSign,
  Heart,
} from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore';
import { IdeaItem } from '../../lib/schema';

export const IdeasTab: React.FC = () => {
  const {
    plan,
    onboarding,
    addIdeaToPlan,
    replaceIdea,
    removeIdea,
  } = usePlanStore();

  const [loadingAction, setLoadingAction] = useState<string | null>(null); // "cheaper-id" or "regen-id"
  const [filter, setFilter] = useState<'all' | 'added' | 'wishlist'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!plan) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleMakeCheaper = async (idea: IdeaItem) => {
    const actionKey = `cheaper-${idea.id || idea.title}`;
    setLoadingAction(actionKey);

    try {
      const res = await fetch('/api/ideas/cheaper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea,
          city: onboarding.city,
          currency: onboarding.currency,
        }),
      });

      const data = await res.json();
      if (data.idea && data.idea.title) {
        replaceIdea(idea.id || idea.title, {
          id: idea.id,
          title: data.idea.title,
          description: data.idea.description,
          estCost: data.idea.estCost,
          addedToPlan: idea.addedToPlan,
        });
        showToast(`💡 Created budget-friendly version: "${data.idea.title}"`);
      }
    } catch (err) {
      console.error(err);
      showToast('Could not optimize idea cost.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRegenerate = async (idea: IdeaItem) => {
    const actionKey = `regen-${idea.id || idea.title}`;
    setLoadingAction(actionKey);

    try {
      const existingTitles = plan.ideas.map((i) => i.title);
      const res = await fetch('/api/ideas/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vibe: onboarding.vibe,
          city: onboarding.city,
          eventType: onboarding.eventType,
          existingTitles,
        }),
      });

      const data = await res.json();
      if (data.idea && data.idea.title) {
        replaceIdea(idea.id || idea.title, {
          id: idea.id || `idea-${Date.now()}`,
          title: data.idea.title,
          description: data.idea.description,
          estCost: data.idea.estCost,
          addedToPlan: false,
        });
        showToast(`✨ Generated new bespoke idea: "${data.idea.title}"`);
      }
    } catch (err) {
      console.error(err);
      showToast('Could not regenerate idea.');
    } finally {
      setLoadingAction(null);
    }
  };

  const filteredIdeas = plan.ideas.filter((i) => {
    if (filter === 'added') return i.addedToPlan;
    if (filter === 'wishlist') return !i.addedToPlan;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#37352F] dark:text-[#D4D4D4]">
            Bespoke Creative Concepts & Touches
          </h2>
          <p className="text-[#787774] text-xs sm:text-sm mt-0.5">
            Personalized celebration ideas honoring {onboarding.city} and your &ldquo;{onboarding.vibe}&rdquo; aesthetic.
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1 bg-[#F7F6F3] dark:bg-[#252525] border border-[#E9E9E7] dark:border-[#2E2E2E] p-0.5 rounded-md">
          {(['all', 'added', 'wishlist'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setFilter(m)}
              className={`px-2.5 py-1 rounded text-xs capitalize transition-colors ${
                filter === m
                  ? 'bg-[#FFFFFF] dark:bg-[#191919] text-[#37352F] dark:text-[#D4D4D4] font-medium shadow-2xs'
                  : 'text-[#787774] hover:text-[#37352F] dark:hover:text-[#D4D4D4]'
              }`}
            >
              {m === 'added' ? 'In Plan' : m}
            </button>
          ))}
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 rounded-md bg-[#DBEDDB] dark:bg-[#243D30] border border-[#86C19F] dark:border-[#335643] text-[#1C3829] dark:text-[#86C19F] text-xs flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#FF5B26] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Ideas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredIdeas.map((idea, idx) => {
          const idKey = idea.id || idea.title;
          const isCheaperLoading = loadingAction === `cheaper-${idKey}`;
          const isRegenLoading = loadingAction === `regen-${idKey}`;

          return (
            <div
              key={idKey || idx}
              className={`bg-[#FFFFFF] dark:bg-[#202020] border rounded-lg p-5 sm:p-6 shadow-2xs flex flex-col justify-between transition-colors ${
                idea.addedToPlan
                  ? 'border-[#86C19F] dark:border-[#335643]'
                  : 'border-[#E9E9E7] dark:border-[#2E2E2E]'
              }`}
            >
              <div className="space-y-3.5">
                {/* Top Badge & Cost */}
                <div className="flex items-start justify-between gap-3">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#FADEC9] dark:bg-[#422C1A] text-[#49290E] dark:text-[#F3B78E] text-xs font-mono font-medium">
                    <Lightbulb className="w-3 h-3 text-[#49290E] dark:text-[#F3B78E]" />
                    <span>Est. {idea.estCost}</span>
                  </div>

                  {idea.addedToPlan ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1C3829] dark:text-[#86C19F] bg-[#DBEDDB] dark:bg-[#243D30] px-2 py-0.5 rounded">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Added to Plan</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => addIdeaToPlan(idKey)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FF5B26] hover:bg-[#EA4B18] text-white text-xs font-medium transition-colors shadow-2xs active:scale-98"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add to Plan</span>
                    </button>
                  )}
                </div>

                <h3 className="text-lg font-serif font-bold text-[#37352F] dark:text-[#D4D4D4] leading-snug">
                  {idea.title}
                </h3>

                <p className="text-xs text-[#787774] dark:text-[#A4A4A4] leading-relaxed">
                  {idea.description}
                </p>
              </div>

              {/* Action Buttons Row */}
              <div className="pt-4 mt-4 border-t border-[#E9E9E7] dark:border-[#2E2E2E] flex items-center justify-between gap-2">
                {/* Make Cheaper Action */}
                <button
                  onClick={() => handleMakeCheaper(idea)}
                  disabled={isCheaperLoading || isRegenLoading}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F7F6F3] dark:bg-[#252525] border border-[#E9E9E7] dark:border-[#2E2E2E] hover:bg-[#EFEFED] dark:hover:bg-[#2C2C2C] text-[#37352F] dark:text-[#D4D4D4] text-xs font-medium transition-colors disabled:opacity-50"
                  title="Prompt AI to generate a lower-cost or DIY alternative"
                >
                  <TrendingDown className={`w-3.5 h-3.5 text-[#27AE60] ${isCheaperLoading ? 'animate-bounce' : ''}`} />
                  <span>{isCheaperLoading ? 'Optimizing...' : 'Make Cheaper'}</span>
                </button>

                {/* Regenerate Action */}
                <button
                  onClick={() => handleRegenerate(idea)}
                  disabled={isCheaperLoading || isRegenLoading}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F7F6F3] dark:bg-[#252525] border border-[#E9E9E7] dark:border-[#2E2E2E] hover:bg-[#EFEFED] dark:hover:bg-[#2C2C2C] text-[#37352F] dark:text-[#D4D4D4] text-xs font-medium transition-colors disabled:opacity-50"
                  title="Replace with a fresh creative concept"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#FF5B26] ${isRegenLoading ? 'animate-spin' : ''}`} />
                  <span>{isRegenLoading ? 'Generating...' : 'Regenerate'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
