import React, { useState } from 'react';
import {
  Wallet,
  Calendar,
  Users,
  Store,
  ShieldAlert,
  Palette,
  Copy,
  ArrowRight,
} from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore';
import { HeroCountdown } from '../../components/HeroCountdown';
import { calculateBudgetSummary, formatCurrency } from '../../lib/budget';

interface OverviewTabProps {
  onOpenPlanB: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ onOpenPlanB }) => {
  const { plan, onboarding, guests, moodBoard, setActiveTab } = usePlanStore();
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  if (!plan) return null;

  const budgetSummary = calculateBudgetSummary(plan.budget, onboarding.totalBudget);

  const totalTasks = plan.timeline.length;
  const doneTasks = plan.timeline.filter((t) => t.done).length;
  const nextTask = plan.timeline.find((t) => !t.done);

  const totalVendors = plan.vendors.length;
  const bookedVendors = plan.vendors.filter((v) => v.booked).length;

  const attendingGuests = guests.filter((g) => g.rsvp === 'attending').length;
  const totalRsvpCount = guests.length > 0 ? attendingGuests : onboarding.guestCount;
  const perHeadSpend = Math.round(
    budgetSummary.totalActual > 0
      ? budgetSummary.totalActual / totalRsvpCount
      : budgetSummary.totalPlanned / totalRsvpCount
  );

  const copyToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Hero Countdown Moment */}
      <HeroCountdown onOpenPlanB={onOpenPlanB} />

      {/* 2. Key Metrics Row - Notion Database Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Budget Health */}
        <div
          onClick={() => setActiveTab('budget')}
          className="bg-[#FFFFFF] dark:bg-[#202020] border border-[#E9E9E7] dark:border-[#2E2E2E] rounded-lg p-4 hover:bg-[#F7F6F3] dark:hover:bg-[#252525] transition-colors cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-[#787774] uppercase tracking-wider">
              Budget Health
            </span>
            <Wallet className="w-3.5 h-3.5 text-[#787774]" />
          </div>
          <div className="text-xl font-bold font-serif text-[#37352F] dark:text-[#D4D4D4]">
            {formatCurrency(budgetSummary.totalActual, onboarding.currency)}
          </div>
          <div className="text-xs text-[#787774] mt-1 flex items-center justify-between">
            <span>Limit: {formatCurrency(onboarding.totalBudget, onboarding.currency)}</span>
            <span className="text-[#2383E2] font-medium group-hover:translate-x-0.5 transition-transform flex items-center">
              View <ArrowRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
          {budgetSummary.isOverBudget && (
            <div className="mt-2 text-[10px] font-medium text-[#5D1715] bg-[#FFE2DD] dark:bg-[#4D2322] dark:text-[#F3958F] px-1.5 py-0.5 rounded inline-block">
              Over by {formatCurrency(budgetSummary.overBudgetAmount, onboarding.currency)}
            </div>
          )}
        </div>

        {/* Metric 2: Timeline Milestones */}
        <div
          onClick={() => setActiveTab('timeline')}
          className="bg-[#FFFFFF] dark:bg-[#202020] border border-[#E9E9E7] dark:border-[#2E2E2E] rounded-lg p-4 hover:bg-[#F7F6F3] dark:hover:bg-[#252525] transition-colors cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-[#787774] uppercase tracking-wider">
              Timeline Progress
            </span>
            <Calendar className="w-3.5 h-3.5 text-[#787774]" />
          </div>
          <div className="text-xl font-bold font-serif text-[#37352F] dark:text-[#D4D4D4]">
            {doneTasks} / {totalTasks}
          </div>
          <div className="text-xs text-[#787774] mt-1 truncate">
            Next: {nextTask ? nextTask.task : 'All tasks completed'}
          </div>
          <div className="mt-2 text-[11px] text-[#2383E2] font-medium flex items-center group-hover:translate-x-0.5 transition-transform">
            Schedule <ArrowRight className="w-3 h-3 ml-0.5" />
          </div>
        </div>

        {/* Metric 3: Vendors Diligence */}
        <div
          onClick={() => setActiveTab('vendors')}
          className="bg-[#FFFFFF] dark:bg-[#202020] border border-[#E9E9E7] dark:border-[#2E2E2E] rounded-lg p-4 hover:bg-[#F7F6F3] dark:hover:bg-[#252525] transition-colors cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-[#787774] uppercase tracking-wider">
              Vendors Booked
            </span>
            <Store className="w-3.5 h-3.5 text-[#787774]" />
          </div>
          <div className="text-xl font-bold font-serif text-[#37352F] dark:text-[#D4D4D4]">
            {bookedVendors} / {totalVendors}
          </div>
          <div className="text-xs text-[#787774] mt-1">
            {totalVendors - bookedVendors} categories remaining
          </div>
          <div className="mt-2 text-[11px] text-[#2383E2] font-medium flex items-center group-hover:translate-x-0.5 transition-transform">
            Directory <ArrowRight className="w-3 h-3 ml-0.5" />
          </div>
        </div>

        {/* Metric 4: Headcount & Per-Head Cost */}
        <div
          onClick={() => setActiveTab('guests')}
          className="bg-[#FFFFFF] dark:bg-[#202020] border border-[#E9E9E7] dark:border-[#2E2E2E] rounded-lg p-4 hover:bg-[#F7F6F3] dark:hover:bg-[#252525] transition-colors cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-[#787774] uppercase tracking-wider">
              Guest Headcount
            </span>
            <Users className="w-3.5 h-3.5 text-[#787774]" />
          </div>
          <div className="text-xl font-bold font-serif text-[#37352F] dark:text-[#D4D4D4]">
            {onboarding.guestCount} Guests
          </div>
          <div className="text-xs text-[#787774] mt-1">
            ~{formatCurrency(perHeadSpend, onboarding.currency)} / guest
          </div>
          <div className="mt-2 text-[11px] text-[#2383E2] font-medium flex items-center group-hover:translate-x-0.5 transition-transform">
            RSVPs <ArrowRight className="w-3 h-3 ml-0.5" />
          </div>
        </div>
      </div>

      {/* 3. Mood Board Palette & Aesthetic Swatches */}
      {moodBoard && (
        <div className="bg-[#FFFFFF] dark:bg-[#202020] border border-[#E9E9E7] dark:border-[#2E2E2E] rounded-lg p-5 sm:p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-[#E8DEEE] dark:bg-[#3C2849] text-[#412454] dark:text-[#C2A3D8] mb-1.5">
                <Palette className="w-3 h-3" />
                <span>Extracted Aesthetic Palette</span>
              </div>
              <h3 className="text-lg font-serif font-bold text-[#37352F] dark:text-[#D4D4D4]">
                Palette & Decor Notes
              </h3>
              <p className="text-xs text-[#787774] mt-0.5">
                {moodBoard.styleDescriptor}
              </p>
            </div>

            {/* Aesthetic Keywords as Pastel Tags */}
            <div className="flex flex-wrap gap-1">
              {moodBoard.keywords.map((kw, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#E3E2E0] dark:bg-[#2F2F2F] text-[#37352F] dark:text-[#D4D4D4]"
                >
                  #{kw}
                </span>
              ))}
            </div>
          </div>

          {/* Color Palette Swatches */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-5">
            {moodBoard.palette.map((swatch, idx) => (
              <div
                key={idx}
                onClick={() => copyToClipboard(swatch.hex)}
                className="group p-2.5 rounded-md border border-[#E9E9E7] dark:border-[#2E2E2E] hover:border-[#787774] transition-colors cursor-pointer bg-[#F7F6F3] dark:bg-[#252525] relative"
                title="Click to copy hex code"
              >
                <div
                  className="w-full h-12 rounded border border-[#E9E9E7] dark:border-[#2E2E2E] mb-2 transition-transform group-hover:scale-101"
                  style={{ backgroundColor: swatch.hex }}
                />
                <div className="text-xs font-semibold text-[#37352F] dark:text-[#D4D4D4] truncate">
                  {swatch.name}
                </div>
                <div className="text-[11px] text-[#787774] flex items-center justify-between mt-0.5 font-mono">
                  <span>{swatch.hex}</span>
                  <Copy className="w-3 h-3 text-[#787774] group-hover:text-[#37352F]" />
                </div>
                {copiedHex === swatch.hex && (
                  <span className="absolute inset-0 bg-[#37352F]/90 dark:bg-black/90 rounded-md flex items-center justify-center text-white text-xs font-medium">
                    Copied!
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Decor Suggestions */}
          <div>
            <h4 className="text-[11px] font-semibold text-[#787774] uppercase tracking-wider mb-2">
              Decor & Styling Suggestions
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {moodBoard.decorSuggestions.map((tip, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-2.5 rounded-md bg-[#F7F6F3] dark:bg-[#252525] border border-[#E9E9E7] dark:border-[#2E2E2E] text-xs text-[#37352F] dark:text-[#D4D4D4]"
                >
                  <span className="text-[#2383E2] mt-0.5">•</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Top Risks & Plan B Contingencies Trigger */}
      <div className="bg-[#FFFFFF] dark:bg-[#202020] border border-[#E9E9E7] dark:border-[#2E2E2E] rounded-lg p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-[#FDECC8] dark:bg-[#43371B] text-[#402C1B] dark:text-[#E8C477] mb-1.5">
              <ShieldAlert className="w-3 h-3" />
              <span>Risk Management</span>
            </div>
            <h3 className="text-lg font-serif font-bold text-[#37352F] dark:text-[#D4D4D4]">
              Anticipated Event Risks & Mitigations
            </h3>
            <p className="text-xs text-[#787774] mt-0.5">
              Active contingency plans to keep celebration logistics resilient.
            </p>
          </div>

          <button
            onClick={onOpenPlanB}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#2383E2] hover:bg-[#0B6FCC] text-white font-medium text-xs sm:text-sm transition-colors shadow-2xs active:scale-98 self-start sm:self-auto"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Generate Plan B Contingencies</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {plan.risks.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-md border border-[#E9E9E7] dark:border-[#2E2E2E] bg-[#F7F6F3] dark:bg-[#252525] space-y-1.5"
            >
              <div className="flex items-start gap-1.5">
                <span className="text-[#787774] font-mono text-xs">#{idx + 1}</span>
                <h4 className="text-xs font-semibold text-[#37352F] dark:text-[#D4D4D4]">
                  {item.risk}
                </h4>
              </div>
              <p className="text-xs text-[#787774] leading-relaxed pl-4">
                <strong className="text-[#37352F] dark:text-[#D4D4D4]">Mitigation:</strong> {item.mitigation}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
