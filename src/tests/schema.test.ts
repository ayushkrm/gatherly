import { describe, it, expect } from 'vitest';
import {
  EventPlanSchema,
  BudgetItemSchema,
  TimelineItemSchema,
  GuestSchema,
} from '../lib/schema';

describe('Zod Schema Validation', () => {
  it('validates a complete event plan correctly', () => {
    const validPlan = {
      title: 'Grand Birthday Bash',
      theme: 'Retro Disco Night',
      summary: 'A 70s-inspired disco evening with live music and cocktails.',
      budget: [
        { category: 'Venue', percent: 50, amount: 5000, tip: 'Ask for weekday rate', priority: 'must' },
        { category: 'Food & Drinks', percent: 40, amount: 4000, tip: 'Set menu options', priority: 'must' },
        { category: 'Contingency', percent: 10, amount: 1000, tip: 'Emergency funds', priority: 'must' },
      ],
      timeline: [
        { weeksBefore: 6, task: 'Secure venue', category: 'Venue', done: true },
        { weeksBefore: 0, task: 'Party day!', category: 'Event', done: false },
      ],
      vendors: [
        {
          category: 'Catering',
          checklist: ['Check allergy options', 'Confirm bar tender'],
          questionsToAsk: ['Are napkins provided?'],
          estimatedCost: 4000,
        },
      ],
      ideas: [
        { title: 'Vinyl Guestbook', description: 'Guests sign real vinyl records', estCost: '$50' },
      ],
      risks: [
        { risk: 'Power outage', mitigation: 'Check venue generator' },
      ],
    };

    const result = EventPlanSchema.safeParse(validPlan);
    expect(result.success).toBe(true);
  });

  it('rejects invalid budget items with negative amounts', () => {
    const invalidBudget = {
      category: 'Venue',
      percent: 50,
      amount: -500, // Invalid negative
      tip: '',
      priority: 'must',
    };
    const result = BudgetItemSchema.safeParse(invalidBudget);
    expect(result.success).toBe(false);
  });

  it('enforces priority enum values (must, should, nice)', () => {
    const validItem = {
      category: 'Decor',
      percent: 10,
      amount: 1000,
      tip: '',
      priority: 'nice',
    };
    expect(BudgetItemSchema.safeParse(validItem).success).toBe(true);

    const invalidItem = {
      ...validItem,
      priority: 'unknown-priority',
    };
    expect(BudgetItemSchema.safeParse(invalidItem).success).toBe(false);
  });

  it('validates guest records and dietary preferences', () => {
    const guest = {
      id: 'g-1',
      name: 'Priya Sharma',
      email: 'priya@example.com',
      rsvp: 'attending',
      plusOne: true,
      dietary: ['Jain', 'Nut-Free'],
      group: 'Family',
    };
    const parsed = GuestSchema.safeParse(guest);
    expect(parsed.success).toBe(true);
  });
});
