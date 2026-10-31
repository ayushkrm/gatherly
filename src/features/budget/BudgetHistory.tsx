import React, { useState, useMemo } from 'react';
import {
  History,
  RotateCcw,
  Sparkles,
  Edit2,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Filter,
  Trash2,
  ArrowRight,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore';
import { formatCurrency } from '../../lib/budget';
import { BudgetHistoryEntry, BudgetHistoryChangeType } from '../../lib/schema';

function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDays = Math.floor(diffHour / 24);
  return `${diffDays}d ago`;
}

export const BudgetHistory: React.FC = () => {
  const {
    budgetHistory,
    onboarding,
    restoreBudgetVersion,
    clearBudgetHistory,
  } = usePlanStore();

  const [filterType, setFilterType] = useState<'all' | BudgetHistoryChangeType>('all');
  const [expandedDiffId, setExpandedDiffId] = useState<string | null>(null);
  const [expandedSnapshotId, setExpandedSnapshotId] = useState<string | null>(null);
  const [restoredSuccessId, setRestoredSuccessId] = useState<string | null>(null);

  const filteredHistory = useMemo(() => {
    if (filterType === 'all') return budgetHistory;
    return budgetHistory.filter((item) => item.changeType === filterType);
  }, [budgetHistory, filterType]);

  const handleRestore = (entryId: string) => {
    const success = restoreBudgetVersion(entryId);
    if (success) {
      setRestoredSuccessId(entryId);
      setTimeout(() => setRestoredSuccessId(null), 3500);
    }
  };

  const getBadgeStyle = (type: BudgetHistoryChangeType) => {
    switch (type) {
      case 'ai_rebalance':
        return {
          bg: 'bg-[#E8DEEE] dark:bg-[#2D2336]',
          text: 'text-[#2B1E3A] dark:text-[#C4B1D4]',
          label: 'AI Rebalance',
          icon: <Sparkles className="w-3 h-3 text-[#2B1E3A] dark:text-[#C4B1D4]" />,
        };
      case 'manual_edit':
        return {
          bg: 'bg-[#FADEC9] dark:bg-[#3C2B1D]',
          text: 'text-[#49290E] dark:text-[#E2B591]',
          label: 'Manual Edit',
          icon: <Edit2 className="w-3 h-3 text-[#49290E] dark:text-[#E2B591]" />,
        };
      case 'restored':
        return {
          bg: 'bg-[#D3E5EF] dark:bg-[#1C2E3D]',
          text: 'text-[#183347] dark:text-[#9BC2DD]',
          label: 'Restored Version',
          icon: <RotateCcw className="w-3 h-3 text-[#183347] dark:text-[#9BC2DD]" />,
        };
      case 'assistant_edit':
        return {
          bg: 'bg-[#DBEDDB] dark:bg-[#203325]',
          text: 'text-[#1C3829] dark:text-[#A4D0AE]',
          label: 'Assistant Action',
          icon: <Sparkles className="w-3 h-3 text-[#1C3829] dark:text-[#A4D0AE]" />,
        };
      case 'initial':
      default:
        return {
          bg: 'bg-[#E3E2E0] dark:bg-[#2E2E2E]',
          text: 'text-[#37352F] dark:text-[#D4D4D4]',
          label: 'Baseline Plan',
          icon: <Calendar className="w-3 h-3 text-[#787774]" />,
        };
    }
  };

  const formatFieldValue = (field: string, val: number | string) => {
    if (field === 'amount' || field === 'actualSpent') {
      return formatCurrency(Number(val) || 0, onboarding.currency);
    }
    if (field === 'percent') {
      return `${val}%`;
    }
    return String(val);
  };

  const evolutionStats = useMemo(() => {
    if (budgetHistory.length === 0) return null;
    const oldest = budgetHistory[budgetHistory.length - 1];
    const latest = budgetHistory[0];
    const baselinePlanned = oldest?.totalPlanned || 0;
    const currentPlanned = latest?.totalPlanned || 0;
    const currentActual = latest?.totalActual || 0;
    const rebalanceCount = budgetHistory.filter((h) => h.changeType === 'ai_rebalance').length;
    const manualEditCount = budgetHistory.filter((h) => h.changeType === 'manual_edit').length;
    const assistantCount = budgetHistory.filter((h) => h.changeType === 'assistant_edit').length;
    const restoredCount = budgetHistory.filter((h) => h.changeType === 'restored').length;
    const plannedDelta = currentPlanned - baselinePlanned;

    return {
      baselinePlanned,
      currentPlanned,
      currentActual,
      rebalanceCount,
      manualEditCount,
      assistantCount,
      restoredCount,
      plannedDelta,
    };
  }, [budgetHistory]);

  return (
    <div className="bg-[#FFFFFF] dark:bg-[#202020] border border-[#E9E9E7] dark:border-[#2E2E2E] rounded-lg p-5 sm:p-6 shadow-2xs space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E9E9E7] dark:border-[#2E2E2E]">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#FF5B26]" />
            <h3 className="text-base sm:text-lg font-serif font-bold text-[#37352F] dark:text-[#D4D4D4]">
              Budget History & Evolution
            </h3>
            <span className="px-1.5 py-0.2 rounded text-[11px] font-mono bg-[#E3E2E0] dark:bg-[#2F2F2F] text-[#37352F] dark:text-[#D4D4D4]">
              {budgetHistory.length} revisions
            </span>
          </div>
          <p className="text-xs text-[#787774]">
            Track budget evolution over time, inspect category shifts after AI rebalances or manual spend edits, and restore previous snapshots.
          </p>
        </div>

        {/* Clear History Button if items exist */}
        {budgetHistory.length > 0 && (
          <button
            onClick={() => {
              if (confirm('Clear the entire budget revision history? The current plan will remain intact.')) {
                clearBudgetHistory();
              }
            }}
            className="self-start sm:self-auto inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs text-[#787774] hover:text-[#EB5757] hover:bg-[#FFE2DD] dark:hover:bg-[#4D2322] transition-colors"
            title="Clear all saved revision logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Evolution Summary Metric Cards */}
      {evolutionStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-md bg-[#F7F6F3] dark:bg-[#252525] border border-[#E9E9E7] dark:border-[#2E2E2E] space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#787774] block">
              Baseline Target
            </span>
            <div className="text-sm font-bold font-mono text-[#37352F] dark:text-[#D4D4D4]">
              {formatCurrency(evolutionStats.baselinePlanned, onboarding.currency)}
            </div>
            <span className="text-[10px] text-[#787774]">Original Plan</span>
          </div>

          <div className="p-3 rounded-md bg-[#F7F6F3] dark:bg-[#252525] border border-[#E9E9E7] dark:border-[#2E2E2E] space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#787774] block">
              Current Actual Spend
            </span>
            <div className="text-sm font-bold font-mono text-[#FF5B26]">
              {formatCurrency(evolutionStats.currentActual, onboarding.currency)}
            </div>
            <span className="text-[10px] text-[#787774]">
              {evolutionStats.baselinePlanned > 0
                ? `${Math.round((evolutionStats.currentActual / evolutionStats.baselinePlanned) * 100)}% committed`
                : 'Active spend'}
            </span>
          </div>

          <div className="p-3 rounded-md bg-[#F7F6F3] dark:bg-[#252525] border border-[#E9E9E7] dark:border-[#2E2E2E] space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#787774] block">
              AI Rebalances
            </span>
            <div className="text-sm font-bold font-mono text-[#37352F] dark:text-[#D4D4D4] flex items-center gap-1.5">
              <span>{evolutionStats.rebalanceCount}</span>
              <Sparkles className="w-3 h-3 text-[#FF5B26]" />
            </div>
            <span className="text-[10px] text-[#787774]">Automated normalizations</span>
          </div>

          <div className="p-3 rounded-md bg-[#F7F6F3] dark:bg-[#252525] border border-[#E9E9E7] dark:border-[#2E2E2E] space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#787774] block">
              Manual &amp; Chat Edits
            </span>
            <div className="text-sm font-bold font-mono text-[#37352F] dark:text-[#D4D4D4] flex items-center gap-1.5">
              <span>{evolutionStats.manualEditCount + evolutionStats.assistantCount}</span>
              <Edit2 className="w-3 h-3 text-[#E89A3C]" />
            </div>
            <span className="text-[10px] text-[#787774]">Direct modifications</span>
          </div>
        </div>
      )}

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[11px] font-semibold text-[#787774] uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {[
            { id: 'all', label: `All (${budgetHistory.length})` },
            { id: 'ai_rebalance', label: `AI Rebalances (${budgetHistory.filter((h) => h.changeType === 'ai_rebalance').length})` },
            { id: 'manual_edit', label: `Manual Edits (${budgetHistory.filter((h) => h.changeType === 'manual_edit').length})` },
            { id: 'assistant_edit', label: `Assistant (${budgetHistory.filter((h) => h.changeType === 'assistant_edit').length})` },
            { id: 'restored', label: `Restored (${budgetHistory.filter((h) => h.changeType === 'restored').length})` },
          ].map((item) => {
            const active = filterType === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setFilterType(item.id as any)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  active
                    ? 'bg-[#FF5B26] text-white font-semibold shadow-2xs'
                    : 'bg-[#F7F6F3] dark:bg-[#252525] text-[#787774] hover:bg-[#EFEFED] dark:hover:bg-[#2C2C2C] hover:text-[#37352F]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {restoredSuccessId && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs bg-[#DBEDDB] dark:bg-[#243D30] text-[#1C3829] dark:text-[#86C19F] animate-fade-in font-medium">
            <Check className="w-3.5 h-3.5" />
            <span>Budget restored successfully!</span>
          </div>
        )}
      </div>

      {/* Timeline List */}
      {filteredHistory.length === 0 ? (
        <div className="text-center py-10 rounded-md border border-dashed border-[#E9E9E7] dark:border-[#2E2E2E] bg-[#FBFBFA] dark:bg-[#191919] p-6 space-y-2">
          <History className="w-8 h-8 text-[#787774] opacity-40 mx-auto" />
          <h4 className="text-xs font-semibold text-[#37352F] dark:text-[#D4D4D4]">
            No budget revisions found
          </h4>
          <p className="text-xs text-[#787774] max-w-sm mx-auto">
            {filterType === 'all'
              ? 'Edits to actual spend or "Rebalance Budget" operations will automatically generate versioned snapshots here.'
              : `No revisions matching the "${filterType}" filter.`}
          </p>
        </div>
      ) : (
        <div className="relative border-l border-[#E9E9E7] dark:border-[#2E2E2E] ml-3 sm:ml-4 pl-4 sm:pl-6 space-y-5">
          {filteredHistory.map((entry, idx) => {
            const badge = getBadgeStyle(entry.changeType);
            const isDiffExpanded = expandedDiffId === entry.id;
            const isSnapshotExpanded = expandedSnapshotId === entry.id;
            const isLatest = idx === 0 && filterType === 'all';
            const versionNumber = filteredHistory.length - idx;

            return (
              <div
                key={entry.id}
                className="relative group bg-[#FFFFFF] dark:bg-[#202020] border border-[#E9E9E7] dark:border-[#2E2E2E] rounded-lg p-4 sm:p-5 transition-colors hover:border-[#787774]/50 shadow-2xs"
              >
                {/* Timeline Node Dot */}
                <span
                  className={`absolute -left-[23px] sm:-left-[31px] top-5 w-3 h-3 rounded-full border-2 border-[#FFFFFF] dark:border-[#202020] ${
                    isLatest ? 'bg-[#FF5B26] ring-2 ring-[#FF5B26]/20' : 'bg-[#787774]'
                  }`}
                />

                {/* Card Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#E9E9E7] dark:border-[#2E2E2E]">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Version Badge */}
                    <span className="font-mono text-xs font-bold text-[#37352F] dark:text-[#D4D4D4]">
                      v{versionNumber}
                      {isLatest && (
                        <span className="ml-1 text-[10px] font-sans font-medium text-[#FF5B26] bg-[#D3E5EF] dark:bg-[#1C2E3D] px-1.5 py-0.2 rounded">
                          Active
                        </span>
                      )}
                    </span>

                    {/* Change Type Pastel Tag */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${badge.bg} ${badge.text}`}
                    >
                      {badge.icon}
                      <span>{badge.label}</span>
                    </span>

                    {/* Timestamp */}
                    <span
                      className="text-xs text-[#787774] font-mono"
                      title={new Date(entry.timestamp).toLocaleString()}
                    >
                      • {formatRelativeTime(entry.timestamp)} ({new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                    </span>
                  </div>

                  {/* Right side summary totals */}
                  <div className="flex items-center gap-3 text-xs text-[#787774]">
                    <div>
                      <span>Planned: </span>
                      <strong className="text-[#37352F] dark:text-[#D4D4D4] font-mono">
                        {formatCurrency(entry.totalPlanned, onboarding.currency)}
                      </strong>
                    </div>
                    <div>
                      <span>Actual: </span>
                      <strong className="text-[#FF5B26] font-mono">
                        {formatCurrency(entry.totalActual, onboarding.currency)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="py-2.5 space-y-2">
                  <h4 className="text-sm font-semibold text-[#37352F] dark:text-[#D4D4D4]">
                    {entry.title}
                  </h4>
                  <p className="text-xs text-[#787774] leading-relaxed">
                    {entry.description}
                  </p>

                  {/* Quick Diff Summary Pills (if diffs exist) */}
                  {entry.diffs && entry.diffs.length > 0 && !isDiffExpanded && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {entry.diffs.slice(0, 3).map((d, dIdx) => (
                        <span
                          key={dIdx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F7F6F3] dark:bg-[#252525] border border-[#E9E9E7] dark:border-[#2E2E2E] text-[11px] text-[#37352F] dark:text-[#D4D4D4] font-mono"
                        >
                          <span className="font-sans font-medium">{d.category}:</span>
                          <span>{formatFieldValue(d.field, d.oldValue)}</span>
                          <ArrowRight className="w-2.5 h-2.5 text-[#787774]" />
                          <span className="text-[#FF5B26] font-semibold">{formatFieldValue(d.field, d.newValue)}</span>
                        </span>
                      ))}
                      {entry.diffs.length > 3 && (
                        <button
                          onClick={() => setExpandedDiffId(entry.id)}
                          className="text-[11px] text-[#FF5B26] font-medium hover:underline self-center"
                        >
                          +{entry.diffs.length - 3} more
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Expanded Detailed Diff Table */}
                {isDiffExpanded && entry.diffs && entry.diffs.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#E9E9E7] dark:border-[#2E2E2E] space-y-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#787774] block">
                      Category Shift Breakdown ({entry.diffs.length} modified attributes):
                    </span>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border border-[#E9E9E7] dark:border-[#2E2E2E] rounded-md overflow-hidden">
                        <thead className="bg-[#F7F6F3] dark:bg-[#252525] text-[#787774] text-[10px] uppercase tracking-wider">
                          <tr>
                            <th className="py-2 px-3 font-semibold">Category</th>
                            <th className="py-2 px-3 font-semibold">Field</th>
                            <th className="py-2 px-3 font-semibold text-right">Previous Value</th>
                            <th className="py-2 px-3 font-semibold text-right">New Value</th>
                            <th className="py-2 px-3 font-semibold text-right">Net Shift</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E9E9E7] dark:divide-[#2E2E2E]">
                          {entry.diffs.map((d, dIdx) => {
                            const isNumeric = typeof d.oldValue === 'number' && typeof d.newValue === 'number';
                            const numDiff = isNumeric ? (d.newValue as number) - (d.oldValue as number) : 0;
                            const isPositive = numDiff > 0;

                            return (
                              <tr key={dIdx} className="hover:bg-[#F7F6F3] dark:hover:bg-[#252525]">
                                <td className="py-2 px-3 font-medium text-[#37352F] dark:text-[#D4D4D4]">
                                  {d.category}
                                </td>
                                <td className="py-2 px-3 text-[#787774] capitalize">
                                  {d.field === 'actualSpent' ? 'Actual Spend' : d.field === 'amount' ? 'Planned Amount' : d.field}
                                </td>
                                <td className="py-2 px-3 text-right font-mono text-[#787774]">
                                  {formatFieldValue(d.field, d.oldValue)}
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-semibold text-[#37352F] dark:text-[#D4D4D4]">
                                  {formatFieldValue(d.field, d.newValue)}
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-medium">
                                  {isNumeric ? (
                                    <span className={isPositive ? 'text-[#FF5B26]' : 'text-[#27AE60]'}>
                                      {isPositive ? '+' : ''}
                                      {formatFieldValue(d.field, numDiff)}
                                    </span>
                                  ) : (
                                    <span className="text-[#787774]">Updated</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Expanded Full Category Snapshot Table */}
                {isSnapshotExpanded && (
                  <div className="mt-3 pt-3 border-t border-[#E9E9E7] dark:border-[#2E2E2E] space-y-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#787774] block">
                      Full Budget Snapshot ({entry.categories.length} categories):
                    </span>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border border-[#E9E9E7] dark:border-[#2E2E2E] rounded-md overflow-hidden">
                        <thead className="bg-[#F7F6F3] dark:bg-[#252525] text-[#787774] text-[10px] uppercase tracking-wider">
                          <tr>
                            <th className="py-2 px-3 font-semibold">Category</th>
                            <th className="py-2 px-2 text-center font-semibold">Priority</th>
                            <th className="py-2 px-3 text-right font-semibold">Planned %</th>
                            <th className="py-2 px-3 text-right font-semibold">Planned Amount</th>
                            <th className="py-2 px-3 text-right font-semibold">Actual Spent</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E9E9E7] dark:divide-[#2E2E2E]">
                          {entry.categories.map((cat, cIdx) => (
                            <tr key={cIdx} className="hover:bg-[#F7F6F3] dark:hover:bg-[#252525]">
                              <td className="py-2 px-3 font-medium text-[#37352F] dark:text-[#D4D4D4]">
                                {cat.category}
                              </td>
                              <td className="py-2 px-2 text-center capitalize text-[10px] text-[#787774]">
                                {cat.priority}
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-[#787774]">
                                {cat.percent}%
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-medium text-[#37352F] dark:text-[#D4D4D4]">
                                {formatCurrency(cat.amount, onboarding.currency)}
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-[#FF5B26]">
                                {formatCurrency(cat.actualSpent || 0, onboarding.currency)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Card Actions Footer */}
                <div className="pt-2.5 mt-2.5 border-t border-[#E9E9E7] dark:border-[#2E2E2E] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {entry.diffs && entry.diffs.length > 0 && (
                      <button
                        onClick={() => setExpandedDiffId(isDiffExpanded ? null : entry.id)}
                        aria-expanded={isDiffExpanded}
                        aria-label={isDiffExpanded ? `Hide diffs for revision v${versionNumber}` : `View ${entry.diffs.length} diffs for revision v${versionNumber}`}
                        className="inline-flex items-center gap-1 text-xs text-[#787774] hover:text-[#37352F] dark:hover:text-white font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#FF5B26] rounded px-1"
                      >
                        {isDiffExpanded ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5" />
                            <span>Hide Diffs</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" />
                            <span>View Diffs ({entry.diffs.length})</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => setExpandedSnapshotId(isSnapshotExpanded ? null : entry.id)}
                      aria-expanded={isSnapshotExpanded}
                      aria-label={isSnapshotExpanded ? `Hide snapshot for revision v${versionNumber}` : `View full snapshot table for revision v${versionNumber}`}
                      className="inline-flex items-center gap-1 text-xs text-[#787774] hover:text-[#37352F] dark:hover:text-white font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#FF5B26] rounded px-1"
                    >
                      {isSnapshotExpanded ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span>Hide Snapshot</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" />
                          <span>View Full Snapshot</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Restore Button */}
                  {!isLatest && (
                    <button
                      onClick={() => handleRestore(entry.id)}
                      aria-label={`Restore budget to revision v${versionNumber}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium border border-[#E9E9E7] dark:border-[#2E2E2E] bg-[#FFFFFF] dark:bg-[#191919] text-[#37352F] dark:text-[#D4D4D4] hover:bg-[#EFEFED] dark:hover:bg-[#2C2C2C] hover:border-[#FF5B26] transition-colors active:scale-98 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#FF5B26]"
                      title="Restore the active budget to this revision"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#FF5B26]" />
                      <span>Restore This Version</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
