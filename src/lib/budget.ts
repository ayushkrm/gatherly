import { BudgetItem, BudgetCategoryDiff } from './schema';

export interface BudgetSummary {
  totalPlanned: number;
  totalActual: number;
  remainingPlanned: number;
  isOverBudget: boolean;
  overBudgetAmount: number;
  overBudgetPercent: number;
  overspentCategories: { category: string; planned: number; actual: number; diff: number }[];
  contingencyAmount: number;
  contingencyPercent: number;
}

/**
 * Calculates complete budget summary statistics
 */
export function calculateBudgetSummary(
  items: BudgetItem[],
  totalBudgetLimit: number
): BudgetSummary {
  const totalPlanned = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalActual = items.reduce((sum, item) => sum + (Number(item.actualSpent) || 0), 0);
  
  // Find contingency category if present
  const contingencyItem = items.find((i) =>
    i.category.toLowerCase().includes('contingency') || i.category.toLowerCase().includes('emergency')
  );
  const contingencyAmount = contingencyItem ? Number(contingencyItem.amount) || 0 : 0;
  const contingencyPercent = contingencyItem ? Number(contingencyItem.percent) || 0 : 0;

  const baseline = totalBudgetLimit > 0 ? totalBudgetLimit : totalPlanned;
  const isOverBudget = totalActual > baseline;
  const overBudgetAmount = isOverBudget ? totalActual - baseline : 0;
  const overBudgetPercent = baseline > 0 ? Math.round((overBudgetAmount / baseline) * 100) : 0;
  const remainingPlanned = baseline - totalActual;

  const overspentCategories = items
    .filter((item) => (Number(item.actualSpent) || 0) > (Number(item.amount) || 0))
    .map((item) => ({
      category: item.category,
      planned: Number(item.amount) || 0,
      actual: Number(item.actualSpent) || 0,
      diff: (Number(item.actualSpent) || 0) - (Number(item.amount) || 0),
    }));

  return {
    totalPlanned,
    totalActual,
    remainingPlanned,
    isOverBudget,
    overBudgetAmount,
    overBudgetPercent,
    overspentCategories,
    contingencyAmount,
    contingencyPercent,
  };
}

/**
 * Calculates per-head metrics based on confirmed/total guest counts
 */
export function calculatePerHeadMetrics(
  totalBudget: number,
  totalActual: number,
  confirmedGuests: number,
  totalGuestCount: number
) {
  const activeCount = confirmedGuests > 0 ? confirmedGuests : (totalGuestCount > 0 ? totalGuestCount : 1);
  const plannedPerHead = Math.round(totalBudget / activeCount);
  const actualPerHead = Math.round(totalActual / activeCount);

  return {
    activeGuestCount: activeCount,
    plannedPerHead,
    actualPerHead,
  };
}

/**
 * Helper to rebalance remaining budget percentages so they sum to 100%
 */
export function rebalanceBudgetPercentages(items: BudgetItem[]): BudgetItem[] {
  if (!items || items.length === 0) return [];
  const currentTotal = items.reduce((acc, it) => acc + (Number(it.percent) || 0), 0);
  if (currentTotal === 0) {
    const equalShare = Number((100 / items.length).toFixed(1));
    return items.map((it) => ({ ...it, percent: equalShare }));
  }

  // Normalize so total equals 100%
  let runningPercent = 0;
  const rebalanced = items.map((it, idx) => {
    if (idx === items.length - 1) {
      const finalPercent = Math.max(1, Number((100 - runningPercent).toFixed(1)));
      return { ...it, percent: finalPercent };
    }
    const scaled = Number(((it.percent / currentTotal) * 100).toFixed(1));
    runningPercent += scaled;
    return { ...it, percent: scaled };
  });

  return rebalanced;
}

/**
 * Formats currency values cleanly with locale commas
 */
export function formatCurrency(amount: number, currencyCode: string = 'USD'): string {
  const safeAmount = isNaN(amount) ? 0 : Math.round(amount);
  
  const symbolMap: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    CAD: 'CA$',
    AUD: 'A$',
  };

  const symbol = symbolMap[currencyCode.toUpperCase()] || `${currencyCode} `;
  return `${symbol}${safeAmount.toLocaleString()}`;
}

/**
 * Computes category-level diffs between two budget versions
 */
export function calculateBudgetDiffs(
  oldItems: BudgetItem[],
  newItems: BudgetItem[]
): BudgetCategoryDiff[] {
  const diffs: BudgetCategoryDiff[] = [];
  const oldMap = new Map(oldItems.map((item) => [item.category.toLowerCase(), item]));

  newItems.forEach((newItem) => {
    const oldItem = oldMap.get(newItem.category.toLowerCase());
    if (!oldItem) {
      diffs.push({
        category: newItem.category,
        field: 'amount',
        oldValue: 0,
        newValue: newItem.amount,
      });
      return;
    }

    // Check planned amount
    if (Math.round(oldItem.amount) !== Math.round(newItem.amount)) {
      diffs.push({
        category: newItem.category,
        field: 'amount',
        oldValue: oldItem.amount,
        newValue: newItem.amount,
      });
    }

    // Check percent
    if (Number(oldItem.percent) !== Number(newItem.percent)) {
      diffs.push({
        category: newItem.category,
        field: 'percent',
        oldValue: oldItem.percent,
        newValue: newItem.percent,
      });
    }

    // Check actualSpent
    const oldActual = Number(oldItem.actualSpent) || 0;
    const newActual = Number(newItem.actualSpent) || 0;
    if (oldActual !== newActual) {
      diffs.push({
        category: newItem.category,
        field: 'actualSpent',
        oldValue: oldActual,
        newValue: newActual,
      });
    }

    // Check priority
    if (oldItem.priority !== newItem.priority) {
      diffs.push({
        category: newItem.category,
        field: 'priority',
        oldValue: oldItem.priority,
        newValue: newItem.priority,
      });
    }
  });

  return diffs;
}
