import { create } from 'zustand';
import {
  EventPlan,
  OnboardingData,
  Guest,
  MoodBoardAnalysis,
  BudgetItem,
  TimelineItem,
  IdeaItem,
  PlanBContingency,
  BudgetHistoryEntry,
  BudgetCategoryDiff,
} from '../lib/schema';
import { DEMO_PLAN, DEMO_GUESTS, DEMO_MOODBOARD } from '../lib/demoPlan';
import { rebalanceBudgetPercentages, calculateBudgetDiffs, formatCurrency } from '../lib/budget';

export type DashboardTab = 'overview' | 'budget' | 'timeline' | 'vendors' | 'ideas' | 'guests' | 'invitations';

export interface AssistantDiffEntry {
  id: string;
  timestamp: number;
  summary: string;
  previousPlan: EventPlan;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  diffSummary?: string;
  timestamp: number;
}

interface PlanStoreState {
  // Main State
  hasPlan: boolean;
  plan: EventPlan | null;
  onboarding: OnboardingData;
  guests: Guest[];
  moodBoard: MoodBoardAnalysis | null;
  activeTab: DashboardTab;
  darkMode: boolean;

  // Budget History State
  budgetHistory: BudgetHistoryEntry[];

  // AI & Async State
  isGenerating: boolean;
  generationStep: string;
  generationError: string | null;
  isChatOpen: boolean;
  chatMessages: ChatMessage[];
  diffHistory: AssistantDiffEntry[];

  // Actions
  setActiveTab: (tab: DashboardTab) => void;
  toggleDarkMode: () => void;
  setIsChatOpen: (open: boolean) => void;
  setOnboardingField: <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => void;
  setOnboardingData: (data: OnboardingData) => void;
  setPlan: (plan: EventPlan) => void;
  setIsGenerating: (isGenerating: boolean, step?: string) => void;
  setGenerationError: (err: string | null) => void;

  // Plan Edit Actions
  updateBudgetItem: (category: string, updates: Partial<BudgetItem>) => void;
  rebalanceBudgetState: () => void;
  recordBudgetChange: (entry: Omit<BudgetHistoryEntry, 'id' | 'timestamp'>) => void;
  restoreBudgetVersion: (historyId: string) => boolean;
  clearBudgetHistory: () => void;
  toggleTimelineDone: (taskIndex: number) => void;
  addTimelineItem: (task: Omit<TimelineItem, 'id'>) => void;
  toggleVendorChecklist: (category: string, checklistItemIndex: number) => void;
  toggleVendorBooked: (category: string, booked: boolean, vendorName?: string) => void;
  addVendorItem: (category: string, item: string, type: 'checklist' | 'question') => void;
  addIdeaToPlan: (ideaId: string) => void;
  removeIdea: (ideaTitle: string) => void;
  replaceIdea: (oldId: string, newIdea: IdeaItem) => void;
  setMoodBoard: (mb: MoodBoardAnalysis) => void;
  applyPlanB: (scenario: string, contingency: PlanBContingency) => void;

  // Guest Management Actions
  addGuest: (guest: Omit<Guest, 'id'>) => void;
  updateGuest: (id: string, updates: Partial<Guest>) => void;
  removeGuest: (id: string) => void;
  importGuests: (newGuests: Guest[]) => void;

  // Chat & AI Refinements
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  applyAssistantToolAction: (diffSummary: string, updatedPlan: EventPlan) => void;
  undoLastAssistantAction: () => boolean;

  // Persistence & Demo
  loadDemoPlan: () => void;
  resetAll: () => void;
  exportStateToJson: () => string;
  importStateFromJson: (jsonStr: string) => boolean;
}

const STORAGE_KEY = 'gatherly_event_plan_v1';

const defaultOnboarding: OnboardingData = {
  eventType: 'Wedding',
  date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 months in future
  city: 'Jaipur, India',
  guestCount: 100,
  totalBudget: 1500000,
  currency: 'INR',
  vibe: 'Regal, warm, vibrant heritage celebration with evening candlelit courtyard dinner',
  interests: 'Rajasthani folk music, live artisanal chaat counters, candid photography',
  dietary: ['Vegetarian', 'Jain', 'Vegan', 'Nut-Free'],
  culturalNeeds: 'Traditional Hindu Marwar wedding, Sangeet night, Sunset Pheras Mandap',
};

// Safe localStorage loader
function loadInitialState() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    return null;
  }
}

const saved = loadInitialState();

function getInitialBudgetHistory(savedState: any): BudgetHistoryEntry[] {
  if (savedState?.budgetHistory && Array.isArray(savedState.budgetHistory) && savedState.budgetHistory.length > 0) {
    return savedState.budgetHistory;
  }
  if (savedState?.plan?.budget && Array.isArray(savedState.plan.budget) && savedState.plan.budget.length > 0) {
    const totalPlanned = savedState.plan.budget.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
    const totalActual = savedState.plan.budget.reduce((s: number, i: any) => s + (Number(i.actualSpent) || 0), 0);
    return [
      {
        id: `bh-initial-${Date.now()}`,
        timestamp: Date.now() - 3600000,
        changeType: 'initial',
        title: 'Initial Budget Baseline',
        description: `Baseline budget allocations generated for ${savedState.plan.title || 'event'}.`,
        totalPlanned,
        totalActual,
        categories: savedState.plan.budget.map((b: any) => ({ ...b })),
      },
    ];
  }
  return [];
}

function getInitialDarkMode(): boolean {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('gatherly_dark_mode');
    if (stored !== null) return stored === 'true';
    if (saved?.darkMode !== undefined) return Boolean(saved.darkMode);
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
}

if (typeof document !== 'undefined') {
  if (getInitialDarkMode()) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export const usePlanStore = create<PlanStoreState>((set, get) => ({
  hasPlan: saved?.hasPlan || false,
  plan: saved?.plan || null,
  onboarding: saved?.onboarding || defaultOnboarding,
  guests: saved?.guests || [],
  moodBoard: saved?.moodBoard || null,
  activeTab: 'overview',
  darkMode: getInitialDarkMode(),

  // Budget History
  budgetHistory: getInitialBudgetHistory(saved),

  isGenerating: false,
  generationStep: '',
  generationError: null,
  isChatOpen: false,
  chatMessages: [
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: 'Hello! I am your Gatherly event planning assistant. Ask me to adjust budget categories, add timeline milestones, find vendor questions, or refine ideas anytime!',
      timestamp: Date.now(),
    },
  ],
  diffHistory: [],

  setActiveTab: (tab) => set({ activeTab: tab }),

  toggleDarkMode: () => {
    set((state) => {
      const next = !state.darkMode;
      if (typeof document !== 'undefined') {
        if (next) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        try {
          localStorage.setItem('gatherly_dark_mode', String(next));
        } catch {}
      }
      return { darkMode: next };
    });
  },

  setIsChatOpen: (open) => set({ isChatOpen: open }),

  setOnboardingField: (field, value) => {
    set((state) => ({
      onboarding: { ...state.onboarding, [field]: value },
    }));
  },

  setOnboardingData: (data) => set({ onboarding: data }),

  setPlan: (plan) => {
    set((state) => {
      let budgetHistory = [...state.budgetHistory];
      // If history is empty, record the baseline snapshot
      if (budgetHistory.length === 0 && plan.budget && plan.budget.length > 0) {
        const totalPlanned = plan.budget.reduce((s, i) => s + (Number(i.amount) || 0), 0);
        const totalActual = plan.budget.reduce((s, i) => s + (Number(i.actualSpent) || 0), 0);
        budgetHistory = [
          {
            id: `bh-initial-${Date.now()}`,
            timestamp: Date.now(),
            changeType: 'initial',
            title: 'Initial Budget Baseline',
            description: `Baseline budget allocations generated for ${plan.title}.`,
            totalPlanned,
            totalActual,
            categories: plan.budget.map((b) => ({ ...b })),
          },
        ];
      }

      const nextState = { plan, hasPlan: true, budgetHistory };
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            hasPlan: true,
            plan,
            onboarding: state.onboarding,
            guests: state.guests,
            moodBoard: state.moodBoard,
            darkMode: state.darkMode,
            budgetHistory,
          })
        );
      } catch {}

      return nextState;
    });
  },

  setIsGenerating: (isGenerating, step = '') => set({ isGenerating, generationStep: step }),

  setGenerationError: (err) => set({ generationError: err }),

  updateBudgetItem: (category, updates) => {
    set((state) => {
      if (!state.plan) return state;
      const oldItem = state.plan.budget.find(
        (i) => i.category.toLowerCase() === category.toLowerCase()
      );
      if (!oldItem) return state;

      const updatedItem = { ...oldItem, ...updates };
      const budget = state.plan.budget.map((item) => {
        if (item.category.toLowerCase() === category.toLowerCase()) {
          return updatedItem;
        }
        return item;
      });

      // Calculate category diffs
      const diffs: BudgetCategoryDiff[] = [];
      if (updates.actualSpent !== undefined && updates.actualSpent !== oldItem.actualSpent) {
        diffs.push({
          category,
          field: 'actualSpent',
          oldValue: oldItem.actualSpent || 0,
          newValue: updates.actualSpent,
        });
      }
      if (updates.amount !== undefined && Math.round(updates.amount) !== Math.round(oldItem.amount)) {
        diffs.push({
          category,
          field: 'amount',
          oldValue: oldItem.amount,
          newValue: updates.amount,
        });
      }
      if (updates.percent !== undefined && Number(updates.percent) !== Number(oldItem.percent)) {
        diffs.push({
          category,
          field: 'percent',
          oldValue: oldItem.percent,
          newValue: updates.percent,
        });
      }
      if (updates.priority !== undefined && updates.priority !== oldItem.priority) {
        diffs.push({
          category,
          field: 'priority',
          oldValue: oldItem.priority,
          newValue: updates.priority,
        });
      }

      const totalPlanned = budget.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
      const totalActual = budget.reduce((sum, i) => sum + (Number(i.actualSpent) || 0), 0);

      let historyTitle = `Manual Edit: ${category}`;
      let historyDescription = `Adjusted ${category} details.`;
      if (updates.actualSpent !== undefined) {
        historyTitle = `Actual Spend Updated: ${category}`;
        historyDescription = `Updated actual spend to ${formatCurrency(updates.actualSpent, state.onboarding.currency)}.`;
      } else if (updates.amount !== undefined || updates.percent !== undefined) {
        historyTitle = `Allocation Adjusted: ${category}`;
        historyDescription = `Planned allocation modified to ${formatCurrency(updates.amount || oldItem.amount, state.onboarding.currency)} (${updates.percent || oldItem.percent}%).`;
      }

      let budgetHistory = [...state.budgetHistory];
      if (diffs.length > 0) {
        const newHistoryEntry: BudgetHistoryEntry = {
          id: `bh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: Date.now(),
          changeType: 'manual_edit',
          title: historyTitle,
          description: historyDescription,
          totalPlanned,
          totalActual,
          categories: budget.map((b) => ({ ...b })),
          diffs,
        };
        budgetHistory = [newHistoryEntry, ...budgetHistory];
      }

      const updatedPlan = { ...state.plan, budget };
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            hasPlan: true,
            plan: updatedPlan,
            onboarding: state.onboarding,
            guests: state.guests,
            moodBoard: state.moodBoard,
            darkMode: state.darkMode,
            budgetHistory,
          })
        );
      } catch {}

      return { plan: updatedPlan, budgetHistory };
    });
  },

  rebalanceBudgetState: () => {
    set((state) => {
      if (!state.plan) return state;
      const rebalanced = rebalanceBudgetPercentages(state.plan.budget);
      const diffs = calculateBudgetDiffs(state.plan.budget, rebalanced);
      const totalPlanned = rebalanced.reduce((s, i) => s + (Number(i.amount) || 0), 0);
      const totalActual = rebalanced.reduce((s, i) => s + (Number(i.actualSpent) || 0), 0);

      const rebalanceEntry: BudgetHistoryEntry = {
        id: `bh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: Date.now(),
        changeType: 'ai_rebalance',
        title: 'Budget Normalization Rebalance',
        description: 'Rebalanced category percentages to normalize exact 100% distribution.',
        totalPlanned,
        totalActual,
        categories: rebalanced.map((b) => ({ ...b })),
        diffs,
      };

      const budgetHistory = [rebalanceEntry, ...state.budgetHistory];
      const updatedPlan = { ...state.plan, budget: rebalanced };

      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            hasPlan: true,
            plan: updatedPlan,
            onboarding: state.onboarding,
            guests: state.guests,
            moodBoard: state.moodBoard,
            darkMode: state.darkMode,
            budgetHistory,
          })
        );
      } catch {}

      return { plan: updatedPlan, budgetHistory };
    });
  },

  recordBudgetChange: (entry) => {
    set((state) => {
      const newEntry: BudgetHistoryEntry = {
        ...entry,
        id: `bh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: Date.now(),
      };
      const budgetHistory = [newEntry, ...state.budgetHistory];
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            hasPlan: state.hasPlan,
            plan: state.plan,
            onboarding: state.onboarding,
            guests: state.guests,
            moodBoard: state.moodBoard,
            darkMode: state.darkMode,
            budgetHistory,
          })
        );
      } catch {}
      return { budgetHistory };
    });
  },

  restoreBudgetVersion: (historyId) => {
    const state = get();
    if (!state.plan) return false;
    const targetEntry = state.budgetHistory.find((h) => h.id === historyId);
    if (!targetEntry || !targetEntry.categories || targetEntry.categories.length === 0) return false;

    const restoredBudget = targetEntry.categories.map((c) => ({ ...c }));
    const diffs = calculateBudgetDiffs(state.plan.budget, restoredBudget);
    const totalPlanned = restoredBudget.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const totalActual = restoredBudget.reduce((s, i) => s + (Number(i.actualSpent) || 0), 0);

    const restoreLogEntry: BudgetHistoryEntry = {
      id: `bh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      changeType: 'restored',
      title: `Restored Version: ${targetEntry.title}`,
      description: `Reverted active budget back to revision from ${new Date(targetEntry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      totalPlanned,
      totalActual,
      categories: restoredBudget.map((b) => ({ ...b })),
      diffs,
    };

    const updatedPlan = { ...state.plan, budget: restoredBudget };
    const budgetHistory = [restoreLogEntry, ...state.budgetHistory];

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          hasPlan: true,
          plan: updatedPlan,
          onboarding: state.onboarding,
          guests: state.guests,
          moodBoard: state.moodBoard,
          darkMode: state.darkMode,
          budgetHistory,
        })
      );
    } catch {}

    set({ plan: updatedPlan, budgetHistory });
    return true;
  },

  clearBudgetHistory: () => {
    set((state) => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            hasPlan: state.hasPlan,
            plan: state.plan,
            onboarding: state.onboarding,
            guests: state.guests,
            moodBoard: state.moodBoard,
            darkMode: state.darkMode,
            budgetHistory: [],
          })
        );
      } catch {}
      return { budgetHistory: [] };
    });
  },

  toggleTimelineDone: (taskIndex) => {
    set((state) => {
      if (!state.plan) return state;
      const timeline = [...state.plan.timeline];
      if (timeline[taskIndex]) {
        timeline[taskIndex] = {
          ...timeline[taskIndex],
          done: !timeline[taskIndex].done,
        };
      }
      return { plan: { ...state.plan, timeline } };
    });
  },

  addTimelineItem: (task) => {
    set((state) => {
      if (!state.plan) return state;
      const newItem: TimelineItem = {
        ...task,
        id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        done: false,
      };
      // Keep sorted by weeksBefore descending
      const timeline = [...state.plan.timeline, newItem].sort((a, b) => b.weeksBefore - a.weeksBefore);
      return { plan: { ...state.plan, timeline } };
    });
  },

  toggleVendorChecklist: (_category, _itemIndex) => {
    // Kept reactive if needed
  },

  toggleVendorBooked: (category, booked, vendorName) => {
    set((state) => {
      if (!state.plan) return state;
      const vendors = state.plan.vendors.map((v) => {
        if (v.category.toLowerCase() === category.toLowerCase()) {
          return {
            ...v,
            booked,
            bookedVendorName: booked ? (vendorName || v.bookedVendorName || 'Selected Vendor') : undefined,
          };
        }
        return v;
      });
      return { plan: { ...state.plan, vendors } };
    });
  },

  addVendorItem: (category, item, type) => {
    set((state) => {
      if (!state.plan) return state;
      let matched = false;
      const vendors = state.plan.vendors.map((v) => {
        if (v.category.toLowerCase().includes(category.toLowerCase()) || category.toLowerCase().includes(v.category.toLowerCase())) {
          matched = true;
          if (type === 'checklist') {
            return { ...v, checklist: [...v.checklist, item] };
          } else {
            return { ...v, questionsToAsk: [...v.questionsToAsk, item] };
          }
        }
        return v;
      });

      // If category wasn't found, append new category
      if (!matched) {
        vendors.push({
          category,
          checklist: type === 'checklist' ? [item] : [],
          questionsToAsk: type === 'question' ? [item] : [],
          estimatedCost: 0,
          booked: false,
        });
      }

      return { plan: { ...state.plan, vendors } };
    });
  },

  addIdeaToPlan: (ideaId) => {
    set((state) => {
      if (!state.plan) return state;
      const target = state.plan.ideas.find((i) => i.id === ideaId || i.title === ideaId);
      if (!target) return state;

      // Mark added
      const ideas = state.plan.ideas.map((i) =>
        i.id === target.id ? { ...i, addedToPlan: true } : i
      );

      // Add to timeline
      const newTimelineItem: TimelineItem = {
        id: `idea-task-${Date.now()}`,
        task: `Implement Idea: ${target.title}`,
        category: 'Ideas & Special Touches',
        weeksBefore: 4,
        done: false,
      };

      const timeline = [...state.plan.timeline, newTimelineItem].sort((a, b) => b.weeksBefore - a.weeksBefore);

      return { plan: { ...state.plan, ideas, timeline } };
    });
  },

  removeIdea: (ideaTitle) => {
    set((state) => {
      if (!state.plan) return state;
      const ideas = state.plan.ideas.filter(
        (i) => i.title.toLowerCase() !== ideaTitle.toLowerCase() && i.id !== ideaTitle
      );
      return { plan: { ...state.plan, ideas } };
    });
  },

  replaceIdea: (oldId, newIdea) => {
    set((state) => {
      if (!state.plan) return state;
      const ideas = state.plan.ideas.map((i) => (i.id === oldId ? newIdea : i));
      return { plan: { ...state.plan, ideas } };
    });
  },

  setMoodBoard: (mb) => set({ moodBoard: mb }),

  applyPlanB: (scenario, contingency) => {
    set((state) => {
      if (!state.plan) return state;
      // Append risk mitigation
      const newRisk = {
        risk: `Plan B Activated: ${scenario} (${contingency.scenario})`,
        mitigation: contingency.actionSteps.join('; '),
      };

      // Add immediate timeline action steps
      const newTasks: TimelineItem[] = contingency.actionSteps.slice(0, 3).map((step, idx) => ({
        id: `plan-b-${Date.now()}-${idx}`,
        task: `[Emergency Protocol] ${step}`,
        category: 'Contingency / Plan B',
        weeksBefore: 0,
        done: false,
      }));

      const timeline = [...state.plan.timeline, ...newTasks].sort((a, b) => b.weeksBefore - a.weeksBefore);
      const risks = [newRisk, ...state.plan.risks];

      return { plan: { ...state.plan, risks, timeline } };
    });
  },

  addGuest: (guestData) => {
    set((state) => {
      const newGuest: Guest = {
        ...guestData,
        id: `g-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      };
      return { guests: [...state.guests, newGuest] };
    });
  },

  updateGuest: (id, updates) => {
    set((state) => ({
      guests: state.guests.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    }));
  },

  removeGuest: (id) => {
    set((state) => ({
      guests: state.guests.filter((g) => g.id !== id),
    }));
  },

  importGuests: (newGuests) => {
    set((state) => ({
      guests: [...state.guests, ...newGuests],
    }));
  },

  addChatMessage: (msg) => {
    set((state) => ({
      chatMessages: [
        ...state.chatMessages,
        {
          ...msg,
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: Date.now(),
        },
      ],
    }));
  },

  applyAssistantToolAction: (diffSummary, updatedPlan) => {
    set((state) => {
      if (!state.plan) return state;
      const historyEntry: AssistantDiffEntry = {
        id: `diff-${Date.now()}`,
        timestamp: Date.now(),
        summary: diffSummary,
        previousPlan: JSON.parse(JSON.stringify(state.plan)),
      };

      let budgetHistory = [...state.budgetHistory];
      if (updatedPlan.budget && state.plan.budget) {
        const diffs = calculateBudgetDiffs(state.plan.budget, updatedPlan.budget);
        if (diffs.length > 0) {
          const totalPlanned = updatedPlan.budget.reduce((s, i) => s + (Number(i.amount) || 0), 0);
          const totalActual = updatedPlan.budget.reduce((s, i) => s + (Number(i.actualSpent) || 0), 0);
          const newEntry: BudgetHistoryEntry = {
            id: `bh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: Date.now(),
            changeType: 'assistant_edit',
            title: `Assistant Action: ${diffSummary}`,
            description: `Budget adjustments applied via Gatherly Assistant.`,
            totalPlanned,
            totalActual,
            categories: updatedPlan.budget.map((b) => ({ ...b })),
            diffs,
          };
          budgetHistory = [newEntry, ...budgetHistory];
        }
      }

      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            hasPlan: true,
            plan: updatedPlan,
            onboarding: state.onboarding,
            guests: state.guests,
            moodBoard: state.moodBoard,
            darkMode: state.darkMode,
            budgetHistory,
          })
        );
      } catch {}

      return {
        plan: updatedPlan,
        budgetHistory,
        diffHistory: [historyEntry, ...state.diffHistory],
        chatMessages: [
          ...state.chatMessages,
          {
            id: `msg-diff-${Date.now()}`,
            role: 'assistant',
            content: `✨ Action applied: ${diffSummary}`,
            diffSummary,
            timestamp: Date.now(),
          },
        ],
      };
    });
  },

  undoLastAssistantAction: () => {
    const state = get();
    if (state.diffHistory.length === 0) return false;
    const [latest, ...restHistory] = state.diffHistory;
    set({
      plan: latest.previousPlan,
      diffHistory: restHistory,
      chatMessages: [
        ...state.chatMessages,
        {
          id: `undo-msg-${Date.now()}`,
          role: 'system',
          content: `↩️ Undone: Reverted "${latest.summary}"`,
          timestamp: Date.now(),
        },
      ],
    });
    return true;
  },

  loadDemoPlan: () => {
    const now = Date.now();
    const demoBudgetHistory: BudgetHistoryEntry[] = [
      {
        id: 'bh-demo-3',
        timestamp: now - 18 * 60 * 1000, // 18 mins ago
        changeType: 'ai_rebalance',
        title: 'AI Rebalanced: Contingency Safety Reserve',
        description: 'Rebalanced category percentages and allocated ₹1,05,000 (7%) into Contingency Reserve for palace courtyard illumination and power generators.',
        totalPlanned: 1500000,
        totalActual: 1060000,
        categories: DEMO_PLAN.budget.map((b) => ({ ...b })),
        diffs: [
          { category: 'Contingency Reserve', field: 'percent', oldValue: 0, newValue: 7 },
          { category: 'Decor & Production', field: 'percent', oldValue: 22, newValue: 20 },
          { category: 'Venue & Heritage Palace', field: 'percent', oldValue: 32, newValue: 30 },
        ],
      },
      {
        id: 'bh-demo-2',
        timestamp: now - 95 * 60 * 1000, // 1h 35m ago
        changeType: 'manual_edit',
        title: 'Actual Spend Updated: Catering & Banquets',
        description: 'Committed ₹3,80,000 advance booking deposit for Royal Marwar Banquet with live artisanal chaat stations.',
        totalPlanned: 1500000,
        totalActual: 840000,
        categories: DEMO_PLAN.budget.map((b) => ({
          ...b,
          actualSpent: b.category === 'Catering & Banquets' ? 380000 : 0,
        })),
        diffs: [
          { category: 'Catering & Banquets', field: 'actualSpent', oldValue: 0, newValue: 380000 },
        ],
      },
      {
        id: 'bh-demo-1',
        timestamp: now - 4 * 3600 * 1000, // 4 hours ago
        changeType: 'initial',
        title: 'Initial Budget Baseline',
        description: 'Baseline AI budget plan generated with ₹15,00,000 across 8 primary categories for 100 guests.',
        totalPlanned: 1500000,
        totalActual: 0,
        categories: DEMO_PLAN.budget.map((b) => ({ ...b, actualSpent: 0 })),
      },
    ];

    set({
      hasPlan: true,
      plan: DEMO_PLAN,
      onboarding: {
        eventType: 'Indian Wedding',
        date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        city: 'Jaipur, Rajasthan',
        guestCount: 100,
        totalBudget: 1500000,
        currency: 'INR',
        vibe: 'Heritage Marwar Radiance & Sunset Palace Grandeur',
        interests: 'Live Manganiyar Troupe, Sanganeri block printing favors, royal Dal Baati Churma',
        dietary: ['Vegetarian', 'Jain', 'Halal', 'Nut-Free'],
        culturalNeeds: 'Traditional Hindu Marwar ceremonies, Sangeet choreography, Sunset Pheras',
      },
      guests: DEMO_GUESTS,
      moodBoard: DEMO_MOODBOARD,
      activeTab: 'overview',
      budgetHistory: demoBudgetHistory,
    });
  },

  resetAll: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    set({
      hasPlan: false,
      plan: null,
      guests: [],
      moodBoard: null,
      activeTab: 'overview',
      chatMessages: [],
      diffHistory: [],
      budgetHistory: [],
    });
  },

  exportStateToJson: () => {
    const state = get();
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      onboarding: state.onboarding,
      plan: state.plan,
      guests: state.guests,
      moodBoard: state.moodBoard,
      budgetHistory: state.budgetHistory,
    };
    return JSON.stringify(data, null, 2);
  },

  importStateFromJson: (jsonStr) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.plan || !parsed.plan.title) return false;
      set({
        hasPlan: true,
        plan: parsed.plan,
        onboarding: parsed.onboarding || defaultOnboarding,
        guests: parsed.guests || [],
        moodBoard: parsed.moodBoard || null,
        activeTab: 'overview',
        budgetHistory: parsed.budgetHistory || [],
      });
      return true;
    } catch {
      return false;
    }
  },
}));
