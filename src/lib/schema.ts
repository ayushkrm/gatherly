import { z } from 'zod';

export const BudgetPrioritySchema = z.enum(['must', 'should', 'nice']);
export type BudgetPriority = z.infer<typeof BudgetPrioritySchema>;

export const BudgetItemSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  percent: z.number().min(0).max(100),
  amount: z.number().nonnegative(),
  tip: z.string().default(''),
  priority: BudgetPrioritySchema.default('must'),
  actualSpent: z.number().nonnegative().optional().default(0),
});
export type BudgetItem = z.infer<typeof BudgetItemSchema>;

export interface BudgetCategoryDiff {
  category: string;
  field: 'amount' | 'percent' | 'actualSpent' | 'priority';
  oldValue: number | string;
  newValue: number | string;
}

export type BudgetHistoryChangeType = 'initial' | 'ai_rebalance' | 'manual_edit' | 'assistant_edit' | 'restored';

export interface BudgetHistoryEntry {
  id: string;
  timestamp: number;
  changeType: BudgetHistoryChangeType;
  title: string;
  description: string;
  totalPlanned: number;
  totalActual: number;
  categories: BudgetItem[];
  diffs?: BudgetCategoryDiff[];
}

export const TimelineItemSchema = z.object({
  id: z.string().optional(),
  weeksBefore: z.number().int().min(0),
  task: z.string().min(1, 'Task description is required'),
  category: z.string().min(1, 'Category is required'),
  done: z.boolean().default(false),
});
export type TimelineItem = z.infer<typeof TimelineItemSchema>;

export const VendorCategorySchema = z.object({
  category: z.string().min(1),
  checklist: z.array(z.string()).default([]),
  questionsToAsk: z.array(z.string()).default([]),
  estimatedCost: z.number().nonnegative().default(0),
  booked: z.boolean().default(false),
  bookedVendorName: z.string().optional(),
  notes: z.string().optional(),
});
export type VendorCategory = z.infer<typeof VendorCategorySchema>;

export const IdeaItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  estCost: z.string().or(z.number()),
  addedToPlan: z.boolean().optional().default(false),
});
export type IdeaItem = z.infer<typeof IdeaItemSchema>;

export const RiskItemSchema = z.object({
  risk: z.string().min(1),
  mitigation: z.string().min(1),
});
export type RiskItem = z.infer<typeof RiskItemSchema>;

export const EventPlanSchema = z.object({
  title: z.string().min(1),
  theme: z.string().min(1),
  summary: z.string().min(1),
  budget: z.array(BudgetItemSchema).min(1),
  timeline: z.array(TimelineItemSchema).min(1),
  vendors: z.array(VendorCategorySchema).min(1),
  ideas: z.array(IdeaItemSchema).default([]),
  risks: z.array(RiskItemSchema).default([]),
});
export type EventPlan = z.infer<typeof EventPlanSchema>;

export const GuestRsvpStatusSchema = z.enum(['attending', 'declined', 'pending']);
export type GuestRsvpStatus = z.infer<typeof GuestRsvpStatusSchema>;

export const GuestSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.string().email().or(z.literal('')).optional(),
  phone: z.string().optional(),
  rsvp: GuestRsvpStatusSchema.default('pending'),
  plusOne: z.boolean().default(false),
  dietary: z.array(z.string()).default([]),
  group: z.string().optional().default('General'),
  notes: z.string().optional(),
});
export type Guest = z.infer<typeof GuestSchema>;

export const MoodBoardAnalysisSchema = z.object({
  palette: z.array(
    z.object({
      hex: z.string(),
      name: z.string(),
      role: z.string(), // e.g. Primary, Accent, Neutral
    })
  ),
  styleDescriptor: z.string(),
  keywords: z.array(z.string()),
  decorSuggestions: z.array(z.string()),
});
export type MoodBoardAnalysis = z.infer<typeof MoodBoardAnalysisSchema>;

export const PlanBContingencySchema = z.object({
  scenario: z.string(), // "Weather Emergency", "Key Vendor No-Show", "20% Budget Cut"
  impact: z.string(),
  actionSteps: z.array(z.string()),
  budgetAdjustmentSummary: z.string().optional(),
  alternativeOptions: z.array(z.string()).optional(),
});
export type PlanBContingency = z.infer<typeof PlanBContingencySchema>;

export const PlanBResponseSchema = z.object({
  weather: PlanBContingencySchema,
  vendorNoShow: PlanBContingencySchema,
  budgetCut: PlanBContingencySchema,
});
export type PlanBResponse = z.infer<typeof PlanBResponseSchema>;

export interface GroundedVendorResult {
  title: string;
  category: string;
  description: string;
  estimatedPriceRange?: string;
  sourceUrl?: string;
  sourceDomain?: string;
}

export interface OnboardingData {
  eventType: string;
  customEventType?: string;
  date: string;
  city: string;
  guestCount: number;
  totalBudget: number;
  currency: string;
  vibe: string;
  interests: string;
  dietary: string[];
  culturalNeeds: string;
  moodBoardImageBase64?: string;
  moodBoardMimeType?: string;
}
