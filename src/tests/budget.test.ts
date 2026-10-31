import { describe, it, expect } from 'vitest';
import {
  calculateBudgetSummary,
  calculatePerHeadMetrics,
  rebalanceBudgetPercentages,
  formatCurrency,
  calculateBudgetDiffs,
} from '../lib/budget';
import { BudgetItem } from '../lib/schema';

describe('Budget Math & Summary Calculations', () => {
  const sampleBudget: BudgetItem[] = [
    { category: 'Venue', percent: 40, amount: 40000, tip: '', priority: 'must', actualSpent: 38000 },
    { category: 'Catering', percent: 30, amount: 30000, tip: '', priority: 'must', actualSpent: 35000 },
    { category: 'Photography', percent: 15, amount: 15000, tip: '', priority: 'should', actualSpent: 15000 },
    { category: 'Decor', percent: 8, amount: 8000, tip: '', priority: 'should', actualSpent: 10000 },
    { category: 'Contingency Reserve', percent: 7, amount: 7000, tip: '', priority: 'must', actualSpent: 0 },
  ];

  it('calculates total planned and total actual correctly', () => {
    const summary = calculateBudgetSummary(sampleBudget, 100000);
    expect(summary.totalPlanned).toBe(100000);
    expect(summary.totalActual).toBe(98000);
    expect(summary.isOverBudget).toBe(false);
    expect(summary.remainingPlanned).toBe(2000);
  });

  it('detects over-budget conditions accurately', () => {
    const overBudgetList: BudgetItem[] = [
      { category: 'Venue', percent: 50, amount: 50000, tip: '', priority: 'must', actualSpent: 65000 },
      { category: 'Catering', percent: 50, amount: 50000, tip: '', priority: 'must', actualSpent: 55000 },
    ];
    const summary = calculateBudgetSummary(overBudgetList, 100000);
    expect(summary.isOverBudget).toBe(true);
    expect(summary.overBudgetAmount).toBe(20000);
    expect(summary.overBudgetPercent).toBe(20);
    expect(summary.overspentCategories.length).toBe(2);
  });

  it('identifies contingency fund amount and percent', () => {
    const summary = calculateBudgetSummary(sampleBudget, 100000);
    expect(summary.contingencyAmount).toBe(7000);
    expect(summary.contingencyPercent).toBe(7);
  });

  it('computes live per-head metrics correctly', () => {
    const metrics = calculatePerHeadMetrics(100000, 80000, 50, 100);
    expect(metrics.activeGuestCount).toBe(50);
    expect(metrics.plannedPerHead).toBe(2000);
    expect(metrics.actualPerHead).toBe(1600);
  });

  it('rebalances budget percentages to sum to 100%', () => {
    const unbalanced: BudgetItem[] = [
      { category: 'Venue', percent: 30, amount: 3000, tip: '', priority: 'must', actualSpent: 0 },
      { category: 'Food', percent: 30, amount: 3000, tip: '', priority: 'must', actualSpent: 0 },
    ];
    const rebalanced = rebalanceBudgetPercentages(unbalanced);
    const sum = rebalanced.reduce((a, b) => a + b.percent, 0);
    expect(Math.round(sum)).toBe(100);
  });

  it('formats various currencies properly', () => {
    expect(formatCurrency(1500000, 'INR')).toBe('₹15,00,000');
    expect(formatCurrency(2500, 'USD')).toBe('$2,500');
    expect(formatCurrency(3000, 'EUR')).toBe('€3,000');
    expect(formatCurrency(1200, 'GBP')).toBe('£1,200');
  });

  it('calculates category-level budget diffs between revisions', () => {
    const v1: BudgetItem[] = [
      { category: 'Venue', percent: 40, amount: 40000, tip: '', priority: 'must', actualSpent: 0 },
      { category: 'Catering', percent: 30, amount: 30000, tip: '', priority: 'must', actualSpent: 0 },
      { category: 'Decor', percent: 30, amount: 30000, tip: '', priority: 'should', actualSpent: 0 },
    ];

    const v2: BudgetItem[] = [
      { category: 'Venue', percent: 35, amount: 35000, tip: '', priority: 'must', actualSpent: 36000 },
      { category: 'Catering', percent: 35, amount: 35000, tip: '', priority: 'must', actualSpent: 0 },
      { category: 'Decor', percent: 30, amount: 30000, tip: '', priority: 'should', actualSpent: 0 },
    ];

    const diffs = calculateBudgetDiffs(v1, v2);
    expect(diffs.length).toBeGreaterThan(0);

    const venueAmountDiff = diffs.find((d) => d.category === 'Venue' && d.field === 'amount');
    expect(venueAmountDiff).toBeDefined();
    expect(venueAmountDiff?.oldValue).toBe(40000);
    expect(venueAmountDiff?.newValue).toBe(35000);

    const venueActualDiff = diffs.find((d) => d.category === 'Venue' && d.field === 'actualSpent');
    expect(venueActualDiff).toBeDefined();
    expect(venueActualDiff?.oldValue).toBe(0);
    expect(venueActualDiff?.newValue).toBe(36000);

    const cateringPercentDiff = diffs.find((d) => d.category === 'Catering' && d.field === 'percent');
    expect(cateringPercentDiff).toBeDefined();
    expect(cateringPercentDiff?.oldValue).toBe(30);
    expect(cateringPercentDiff?.newValue).toBe(35);
  });
});
