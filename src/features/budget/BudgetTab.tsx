import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Check,
  Edit2,
  Filter,
  History,
  PieChart,
  SlidersHorizontal,
} from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore';
import { calculateBudgetSummary, formatCurrency, calculateBudgetDiffs } from '../../lib/budget';
import { BudgetPriority } from '../../lib/schema';
import { BudgetHistory } from './BudgetHistory';

// Notion-style refined palette for donut chart
const NOTION_DONUT_PALETTE = [
  '#2383E2', // Notion Blue
  '#E89A3C', // Warm Orange
  '#4DAB9A', // Sage / Green
  '#9065B0', // Purple
  '#E25555', // Red / Coral
  '#69899C', // Slate
  '#B58A58', // Brown
  '#C96395', // Pink
  '#4F7E70', // Forest
];

export const BudgetTab: React.FC = () => {
  const {
    plan,
    onboarding,
    guests,
    updateBudgetItem,
    setPlan,
    budgetHistory,
    recordBudgetChange,
  } = usePlanStore();
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'allocations' | 'history'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | BudgetPriority>('all');
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [rebalanceMessage, setRebalanceMessage] = useState<string | null>(null);
  const [editingActualCategory, setEditingActualCategory] = useState<string | null>(null);
  const [tempActualValue, setTempActualValue] = useState<number>(0);
  const [hoveredSliceIdx, setHoveredSliceIdx] = useState<number | null>(null);

  if (!plan) return null;

  const budgetSummary = calculateBudgetSummary(plan.budget, onboarding.totalBudget);

  // Filtered categories
  const filteredBudget = useMemo(() => {
    if (priorityFilter === 'all') return plan.budget;
    return plan.budget.filter((item) => item.priority === priorityFilter);
  }, [plan.budget, priorityFilter]);

  // Donut chart math
  const donutData = useMemo(() => {
    let cumulativePercent = 0;
    return plan.budget.map((item, idx) => {
      const startPercent = cumulativePercent;
      const percent = Number(item.percent) || 0;
      cumulativePercent += percent;
      const color = NOTION_DONUT_PALETTE[idx % NOTION_DONUT_PALETTE.length];
      return {
        ...item,
        startPercent,
        color,
      };
    });
  }, [plan.budget]);

  // Handle inline actual spend save
  const handleSaveActual = (category: string) => {
    updateBudgetItem(category, { actualSpent: tempActualValue });
    setEditingActualCategory(null);
  };

  // Rebalance with AI
  const handleRebalanceWithAi = async () => {
    setIsRebalancing(true);
    setRebalanceMessage(null);
    try {
      const res = await fetch('/api/plan/rebalance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budgetItems: plan.budget,
          totalBudget: onboarding.totalBudget,
          currency: onboarding.currency,
          city: onboarding.city,
          reason: budgetSummary.isOverBudget
            ? `We have exceeded budget by ${formatCurrency(budgetSummary.overBudgetAmount, onboarding.currency)}. Rebalance categories to fit limit.`
            : 'Reallocate remaining budget cleanly with 8% contingency.',
        }),
      });
      const data = await res.json();
      if (data.budget && Array.isArray(data.budget)) {
        const updated = plan.budget.map((item) => {
          const matched = data.budget.find((b: any) => b.category.toLowerCase() === item.category.toLowerCase());
          if (matched) {
            return {
              ...item,
              percent: matched.percent,
              amount: matched.amount,
              tip: matched.tip || item.tip,
              priority: (matched.priority as BudgetPriority) || item.priority,
            };
          }
          return item;
        });

        const diffs = calculateBudgetDiffs(plan.budget, updated);
        const totalPlanned = updated.reduce((s, i) => s + (Number(i.amount) || 0), 0);
        const totalActual = updated.reduce((s, i) => s + (Number(i.actualSpent) || 0), 0);

        setPlan({ ...plan, budget: updated });
        recordBudgetChange({
          changeType: 'ai_rebalance',
          title: budgetSummary.isOverBudget
            ? 'AI Budget Deficit Rebalance'
            : 'AI Budget Allocation Rebalance',
          description: data.rebalanceNotes || (budgetSummary.isOverBudget
            ? `Redistributed categories to absorb budget overspend of ${formatCurrency(budgetSummary.overBudgetAmount, onboarding.currency)}.`
            : 'Rebalanced category allocations with 8% contingency safety buffer.'),
          totalPlanned,
          totalActual,
          categories: updated.map((b) => ({ ...b })),
          diffs,
        });

        setRebalanceMessage(data.rebalanceNotes || 'Budget successfully rebalanced!');
        setTimeout(() => setRebalanceMessage(null), 5000);
      }
    } catch (err: any) {
      console.error(err);
      setRebalanceMessage('Failed to rebalance budget. Please try again.');
    } finally {
      setIsRebalancing(false);
    }
  };

  const totalGuests = onboarding.guestCount > 0 ? onboarding.guestCount : 100;
  const attendingGuests = guests.filter((g) => g.rsvp === 'attending').length;
  const activeGuestDenominator = attendingGuests > 0 ? attendingGuests : totalGuests;
  const plannedPerGuest = Math.round(budgetSummary.totalPlanned / activeGuestDenominator);
  const actualPerGuest = Math.round(budgetSummary.totalActual / activeGuestDenominator);

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#37352F] dark:text-[#D4D4D4]">
            Budget & Expense Allocations
          </h2>
          <p className="text-[#787774] text-xs sm:text-sm mt-0.5">
            Track planned vs actual spend, contingency safety reserve, and rebalance allocations.
          </p>
        </div>

        {/* Rebalance Button in Notion Blue */}
        <button
          onClick={handleRebalanceWithAi}
          disabled={isRebalancing}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#2383E2] hover:bg-[#0B6FCC] text-white font-medium text-xs sm:text-sm shadow-2xs transition-colors disabled:opacity-50 active:scale-98"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRebalancing ? 'animate-spin' : ''}`} />
          <span>{isRebalancing ? 'Rebalancing...' : 'Rebalance Budget'}</span>
        </button>
      </div>

      {/* Over-Budget Alert Callout (Notion Red Pastel) */}
      {budgetSummary.isOverBudget && (
        <div className="p-3.5 rounded-md bg-[#FFE2DD] dark:bg-[#4D2322] border border-[#F3958F] dark:border-[#6B2A29] text-[#5D1715] dark:text-[#F3B78E] flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[#EB5757] mt-0.5" />
          <div className="space-y-0.5 text-xs">
            <h4 className="font-semibold">
              Over-Budget: Exceeding Target by {formatCurrency(budgetSummary.overBudgetAmount, onboarding.currency)} ({budgetSummary.overBudgetPercent}%)
            </h4>
            <p className="text-[#5D1715]/80 dark:text-[#F3B78E]/90">
              Overspent categories:{' '}
              {budgetSummary.overspentCategories.map((c) => `${c.category} (+${formatCurrency(c.diff, onboarding.currency)})`).join(', ')}.
              Click &quot;Rebalance Budget&quot; to redistribute from flexible categories or contingency reserve.
            </p>
          </div>
        </div>
      )}

      {/* Rebalance Toast (Notion Green Pastel) */}
      {rebalanceMessage && (
        <div className="p-3 rounded-md bg-[#DBEDDB] dark:bg-[#243D30] border border-[#86C19F] dark:border-[#335643] text-[#1C3829] dark:text-[#86C19F] text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#2383E2] shrink-0" />
          <span>{rebalanceMessage}</span>
        </div>
      )}

      {/* View Switcher Tabs (Notion-style) */}
      <div className="flex items-center gap-1 border-b border-[#E9E9E7] dark:border-[#2E2E2E] pb-2">
        <button
          onClick={() => setActiveSubTab('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeSubTab === 'all'
              ? 'bg-[#EFEFED] dark:bg-[#2C2C2C] text-[#37352F] dark:text-[#D4D4D4] font-semibold'
              : 'text-[#787774] hover:text-[#37352F] hover:bg-[#F7F6F3] dark:hover:bg-[#252525]'
          }`}
        >
          <PieChart className="w-3.5 h-3.5 text-[#787774]" />
          <span>All Overview</span>
        </button>

        <button
          onClick={() => setActiveSubTab('allocations')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeSubTab === 'allocations'
              ? 'bg-[#EFEFED] dark:bg-[#2C2C2C] text-[#37352F] dark:text-[#D4D4D4] font-semibold'
              : 'text-[#787774] hover:text-[#37352F] hover:bg-[#F7F6F3] dark:hover:bg-[#252525]'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#787774]" />
          <span>Allocations &amp; Spend</span>
        </button>

        <button
          onClick={() => setActiveSubTab('history')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeSubTab === 'history'
              ? 'bg-[#EFEFED] dark:bg-[#2C2C2C] text-[#37352F] dark:text-[#D4D4D4] font-semibold'
              : 'text-[#787774] hover:text-[#37352F] hover:bg-[#F7F6F3] dark:hover:bg-[#252525]'
          }`}
        >
          <History className="w-3.5 h-3.5 text-[#2383E2]" />
          <span>Budget History</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#E3E2E0] dark:bg-[#333333] text-[#37352F] dark:text-[#D4D4D4]">
            {budgetHistory.length}
          </span>
        </button>
      </div>

      {(activeSubTab === 'all' || activeSubTab === 'allocations') && (
        <>
          {/* Donut Chart & Live Metrics Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#FFFFFF] dark:bg-[#202020] border border-[#E9E9E7] dark:border-[#2E2E2E] rounded-lg p-5 sm:p-7 shadow-2xs">
            {/* Left: Donut Chart */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center">
              <div className="relative w-56 h-56 sm:w-64 sm:h-64">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform">
              {donutData.map((slice, i) => {
                const strokeDash = `${slice.percent} ${100 - slice.percent}`;
                const strokeOffset = -slice.startPercent;
                const isHovered = hoveredSliceIdx === i;

                return (
                  <circle
                    key={i}
                    cx="50"
                    cy="50"
                    r="36"
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth={isHovered ? 13 : 11}
                    strokeDasharray={strokeDash}
                    strokeDashoffset={strokeOffset}
                    className="transition-all duration-200 cursor-pointer"
                    onMouseEnter={() => setHoveredSliceIdx(i)}
                    onMouseLeave={() => setHoveredSliceIdx(null)}
                  />
                );
              })}
            </svg>

            {/* Center Summary */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 pointer-events-none">
              <span className="text-[10px] font-semibold text-[#787774] uppercase tracking-wider">
                {hoveredSliceIdx !== null
                  ? donutData[hoveredSliceIdx]?.category
                  : 'Total Actual'}
              </span>
              <span className="text-lg sm:text-xl font-bold font-serif text-[#37352F] dark:text-[#D4D4D4] mt-0.5">
                {hoveredSliceIdx !== null
                  ? formatCurrency(donutData[hoveredSliceIdx]?.actualSpent || 0, onboarding.currency)
                  : formatCurrency(budgetSummary.totalActual, onboarding.currency)}
              </span>
              <span className="text-[11px] text-[#787774] font-mono">
                {hoveredSliceIdx !== null
                  ? `${donutData[hoveredSliceIdx]?.percent}% of planned`
                  : `Limit: ${formatCurrency(onboarding.totalBudget, onboarding.currency)}`}
              </span>
            </div>
          </div>

          {/* Quick Legend Chips */}
          <div className="flex flex-wrap justify-center gap-1.5 mt-4 max-w-md">
            {donutData.map((item, idx) => (
              <span
                key={idx}
                onMouseEnter={() => setHoveredSliceIdx(idx)}
                onMouseLeave={() => setHoveredSliceIdx(null)}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] cursor-pointer transition-colors ${
                  hoveredSliceIdx === idx ? 'bg-[#EFEFED] dark:bg-[#2C2C2C] font-semibold text-[#37352F] dark:text-white' : 'text-[#787774]'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="truncate max-w-[90px]">{item.category}</span>
                <span className="font-mono text-[#787774]">({item.percent}%)</span>
              </span>
            ))}
          </div>
        </div>

        {/* Right: Key Summary Statistics & Live Per-Head math */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            <h3 className="text-base font-serif font-bold text-[#37352F] dark:text-[#D4D4D4]">
              Budget Breakdown & Contingency
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3.5 rounded-md bg-[#F7F6F3] dark:bg-[#252525] border border-[#E9E9E7] dark:border-[#2E2E2E]">
                <span className="text-[11px] text-[#787774] block">Total Planned</span>
                <span className="text-base font-bold font-serif text-[#37352F] dark:text-[#D4D4D4]">
                  {formatCurrency(budgetSummary.totalPlanned, onboarding.currency)}
                </span>
                <span className="text-[10px] text-[#787774] block mt-0.5">Sum of categories</span>
              </div>

              <div className="p-3.5 rounded-md bg-[#DBEDDB]/30 dark:bg-[#243D30]/40 border border-[#86C19F]/40 dark:border-[#335643]">
                <span className="text-[11px] text-[#1C3829] dark:text-[#86C19F] block font-medium">Contingency Reserve</span>
                <span className="text-base font-bold font-serif text-[#1C3829] dark:text-[#86C19F]">
                  {formatCurrency(budgetSummary.contingencyAmount, onboarding.currency)}
                </span>
                <span className="text-[10px] text-[#787774] block mt-0.5">
                  {budgetSummary.contingencyPercent}% safety buffer
                </span>
              </div>
            </div>

            {/* Per-head live calculation banner */}
            <div className="p-3.5 rounded-md bg-[#F7F6F3] dark:bg-[#252525] border border-[#E9E9E7] dark:border-[#2E2E2E] space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-[#37352F] dark:text-[#D4D4D4]">
                <span>Per-Head Economics ({activeGuestDenominator} Guests):</span>
                <span className="text-[#787774] font-normal text-[11px]">
                  {attendingGuests > 0 ? `${attendingGuests} Confirmed RSVPs` : 'Planned Headcount'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#787774]">Planned per Head:</span>
                  <div className="text-sm font-bold text-[#37352F] dark:text-white font-mono">
                    {formatCurrency(plannedPerGuest, onboarding.currency)}
                  </div>
                </div>
                <div>
                  <span className="text-[#787774]">Actual Spend per Head:</span>
                  <div className="text-sm font-bold text-[#2383E2] font-mono">
                    {formatCurrency(actualPerGuest, onboarding.currency)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Responsible AI Disclaimer */}
          <div className="text-[11px] text-[#787774] flex items-center gap-1.5">
            <span>Estimates and tips reflect market benchmarks in {onboarding.city}.</span>
          </div>
        </div>
      </div>

      {/* Filter and Category Table (Notion Database View) */}
      <div className="bg-[#FFFFFF] dark:bg-[#202020] border border-[#E9E9E7] dark:border-[#2E2E2E] rounded-lg p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[#787774]" />
            <span className="text-xs font-semibold text-[#787774] mr-1">Priority:</span>
            {(['all', 'must', 'should', 'nice'] as const).map((p) => {
              const active = priorityFilter === p;
              return (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={`px-2 py-0.5 rounded text-xs font-medium capitalize transition-colors ${
                    active
                      ? p === 'must'
                        ? 'bg-[#FFE2DD] text-[#5D1715] font-semibold'
                        : p === 'should'
                        ? 'bg-[#FADEC9] text-[#49290E] font-semibold'
                        : p === 'nice'
                        ? 'bg-[#DBEDDB] text-[#1C3829] font-semibold'
                        : 'bg-[#2383E2] text-white font-semibold'
                      : 'bg-[#F7F6F3] dark:bg-[#2A2A2A] text-[#787774] hover:bg-[#EFEFED]'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <span className="text-xs text-[#787774]">
            {filteredBudget.length} of {plan.budget.length} categories
          </span>
        </div>

        {/* Database Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border border-[#E9E9E7] dark:border-[#2E2E2E] rounded-md overflow-hidden">
            <thead className="bg-[#F7F6F3] dark:bg-[#252525] border-b border-[#E9E9E7] dark:border-[#2E2E2E] text-[#787774] text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Category</th>
                <th className="py-2.5 px-2 text-center font-semibold">Priority</th>
                <th className="py-2.5 px-3 text-right font-semibold">Planned (%)</th>
                <th className="py-2.5 px-3 text-right font-semibold">Planned Amount</th>
                <th className="py-2.5 px-3 text-right font-semibold">Actual Spent</th>
                <th className="py-2.5 px-3 text-right font-semibold">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9E9E7] dark:divide-[#2E2E2E]">
              {filteredBudget.map((item, idx) => {
                const actual = Number(item.actualSpent) || 0;
                const planned = Number(item.amount) || 0;
                const variance = planned - actual;
                const isOver = actual > planned;
                const isEditing = editingActualCategory === item.category;

                // Pastel tag color for priority
                const tagColor =
                  item.priority === 'must'
                    ? 'bg-[#FFE2DD] text-[#5D1715] dark:bg-[#4D2322] dark:text-[#F3958F]'
                    : item.priority === 'should'
                    ? 'bg-[#FADEC9] text-[#49290E] dark:bg-[#422C1A] dark:text-[#F3B78E]'
                    : 'bg-[#DBEDDB] text-[#1C3829] dark:bg-[#243D30] dark:text-[#86C19F]';

                return (
                  <tr key={idx} className="hover:bg-[#F7F6F3] dark:hover:bg-[#252525] transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-[#37352F] dark:text-[#D4D4D4]">
                        {item.category}
                      </div>
                      {item.tip && (
                        <div className="text-[11px] text-[#787774] mt-0.5 line-clamp-1 italic">
                          💡 {item.tip}
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 px-2 text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${tagColor}`}>
                        {item.priority}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono text-[#787774]">
                      {item.percent}%
                    </td>

                    <td className="py-2.5 px-3 text-right font-medium text-[#37352F] dark:text-[#D4D4D4]">
                      {formatCurrency(planned, onboarding.currency)}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            value={tempActualValue}
                            onChange={(e) => setTempActualValue(parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-0.5 rounded border border-[#2383E2] bg-[#FFFFFF] dark:bg-[#191919] text-xs font-mono text-right focus:outline-hidden"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveActual(item.category)}
                            className="p-1 rounded bg-[#2383E2] text-white hover:bg-[#0B6FCC]"
                            title="Save"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingActualCategory(item.category);
                            setTempActualValue(actual);
                          }}
                          className="group inline-flex items-center gap-1 font-mono font-medium text-[#37352F] dark:text-[#D4D4D4] hover:text-[#2383E2]"
                          title="Click to edit actual spend"
                        >
                          <span>{formatCurrency(actual, onboarding.currency)}</span>
                          <Edit2 className="w-3 h-3 text-[#787774] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono text-xs">
                      {actual === 0 ? (
                        <span className="text-[#787774]">-</span>
                      ) : isOver ? (
                        <span className="text-[#EB5757] font-semibold">
                          +{formatCurrency(Math.abs(variance), onboarding.currency)}
                        </span>
                      ) : (
                        <span className="text-[#27AE60] font-semibold">
                          -{formatCurrency(variance, onboarding.currency)}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Budget History Revision Timeline & Evolution */}
      {(activeSubTab === 'all' || activeSubTab === 'history') && (
        <BudgetHistory />
      )}
    </div>
  );
};
