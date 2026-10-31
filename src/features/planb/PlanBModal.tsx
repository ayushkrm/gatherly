import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CloudRain,
  UserX,
  TrendingDown,
  Sparkles,
  Check,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore';
import { PlanBContingency, PlanBResponse } from '../../lib/schema';

interface PlanBModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlanBModal: React.FC<PlanBModalProps> = ({ isOpen, onClose }) => {
  const { plan, onboarding, applyPlanB } = usePlanStore();

  const [activeScenario, setActiveScenario] = useState<'weather' | 'vendorNoShow' | 'budgetCut'>('weather');
  const [isLoading, setIsLoading] = useState(false);
  const [contingencies, setContingencies] = useState<PlanBResponse | null>(null);
  const [adoptedScenarios, setAdoptedScenarios] = useState<Record<string, boolean>>({});

  const fetchPlanB = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/plan/plan-b', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: onboarding.eventType,
          city: onboarding.city,
          date: onboarding.date,
          totalBudget: onboarding.totalBudget,
          currency: onboarding.currency,
        }),
      });
      const data = await res.json();
      if (data.weather && data.vendorNoShow && data.budgetCut) {
        setContingencies(data);
      }
    } catch (err) {
      console.error('Error generating Plan B', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !contingencies) {
      fetchPlanB();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAdopt = (scenarioKey: 'weather' | 'vendorNoShow' | 'budgetCut') => {
    if (!contingencies) return;
    const item = contingencies[scenarioKey];
    applyPlanB(item.scenario, item);
    setAdoptedScenarios((prev) => ({ ...prev, [scenarioKey]: true }));
  };

  const current = contingencies ? contingencies[activeScenario] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 overflow-y-auto">
      <div className="bg-[#FFFFFF] dark:bg-[#202020] border border-[#E9E9E7] dark:border-[#2E2E2E] rounded-lg p-6 sm:p-7 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-lg space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#FDECC8] dark:bg-[#3D331A] text-[#402C1B] dark:text-[#E2CD8C] text-xs font-medium mb-1.5">
              <ShieldAlert className="w-3 h-3 text-[#402C1B] dark:text-[#E2CD8C]" />
              <span>Contingency Planning Protocol</span>
            </div>
            <h3 className="text-xl font-serif font-bold text-[#37352F] dark:text-[#D4D4D4]">
              Plan B: Emergency Readiness
            </h3>
            <p className="text-xs text-[#787774] mt-0.5">
              Automated resilience protocols for weather storms, vendor no-shows, and 20% budget reductions.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-[#787774] hover:text-[#37352F] dark:hover:text-white p-1 rounded-md"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Scenario Switcher Tabs */}
        <div className="grid grid-cols-3 gap-1 p-0.5 rounded-md bg-[#F7F6F3] dark:bg-[#252525] border border-[#E9E9E7] dark:border-[#2E2E2E]">
          <button
            onClick={() => setActiveScenario('weather')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded text-xs font-medium transition-colors ${
              activeScenario === 'weather'
                ? 'bg-[#FFFFFF] dark:bg-[#191919] text-[#37352F] dark:text-[#D4D4D4] font-semibold shadow-2xs'
                : 'text-[#787774] hover:text-[#37352F]'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5 text-[#FF5B26]" />
            <span className="hidden sm:inline">Weather Crisis</span>
            <span className="sm:hidden">Weather</span>
          </button>

          <button
            onClick={() => setActiveScenario('vendorNoShow')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded text-xs font-medium transition-colors ${
              activeScenario === 'vendorNoShow'
                ? 'bg-[#FFFFFF] dark:bg-[#191919] text-[#37352F] dark:text-[#D4D4D4] font-semibold shadow-2xs'
                : 'text-[#787774] hover:text-[#37352F]'
            }`}
          >
            <UserX className="w-3.5 h-3.5 text-[#EB5757]" />
            <span className="hidden sm:inline">Vendor No-Show</span>
            <span className="sm:hidden">Vendor</span>
          </button>

          <button
            onClick={() => setActiveScenario('budgetCut')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded text-xs font-medium transition-colors ${
              activeScenario === 'budgetCut'
                ? 'bg-[#FFFFFF] dark:bg-[#191919] text-[#37352F] dark:text-[#D4D4D4] font-semibold shadow-2xs'
                : 'text-[#787774] hover:text-[#37352F]'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5 text-[#E89A3C]" />
            <span className="hidden sm:inline">20% Budget Cut</span>
            <span className="sm:hidden">-20% Cut</span>
          </button>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="py-10 text-center space-y-2">
            <div className="w-8 h-8 rounded-full border-2 border-[#E9E9E7] border-t-[#FF5B26] animate-spin mx-auto" />
            <p className="text-xs text-[#787774]">
              Generating contingency strategies with senior event planner AI...
            </p>
          </div>
        )}

        {/* Active Scenario Content */}
        {!isLoading && current && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-md bg-[#F7F6F3] dark:bg-[#252525] border border-[#E9E9E7] dark:border-[#2E2E2E] space-y-1">
              <span className="text-[10px] font-semibold text-[#787774] uppercase tracking-wider block">
                Scenario Impact:
              </span>
              <p className="text-xs text-[#37352F] dark:text-[#D4D4D4] leading-relaxed">
                {current.impact}
              </p>
            </div>

            {/* Action Steps */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-semibold text-[#787774] uppercase tracking-wider">
                Immediate Execution Steps:
              </h4>
              <div className="space-y-1.5">
                {current.actionSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-2.5 rounded-md bg-[#FFFFFF] dark:bg-[#191919] border border-[#E9E9E7] dark:border-[#2E2E2E] text-xs text-[#37352F] dark:text-[#D4D4D4]"
                  >
                    <span className="w-4 h-4 rounded bg-[#E3E2E0] dark:bg-[#2F2F2F] text-[#37352F] dark:text-[#D4D4D4] flex items-center justify-center font-mono text-[10px] font-semibold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Guidance */}
            {current.budgetAdjustmentSummary && (
              <div className="p-3 rounded-md bg-[#F7F6F3] dark:bg-[#252525] border border-[#E9E9E7] dark:border-[#2E2E2E] text-xs text-[#787774] space-y-0.5">
                <strong className="text-[#37352F] dark:text-[#D4D4D4] block font-semibold">
                  Financial Rebalance Guidance:
                </strong>
                <p>{current.budgetAdjustmentSummary}</p>
              </div>
            )}

            {/* Backup Alternatives */}
            {current.alternativeOptions && current.alternativeOptions.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-semibold text-[#787774] uppercase tracking-wider">
                  Backup Alternatives:
                </h4>
                <ul className="space-y-1 text-xs text-[#787774]">
                  {current.alternativeOptions.map((opt, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#FF5B26]">•</span>
                      <span>{opt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-3.5 border-t border-[#E9E9E7] dark:border-[#2E2E2E] flex items-center justify-between gap-3">
          <button
            onClick={fetchPlanB}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E9E9E7] dark:border-[#2E2E2E] text-xs font-medium text-[#787774] hover:text-[#37352F] hover:bg-[#EFEFED] dark:hover:bg-[#2C2C2C] transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Regenerate Plan B</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-[#787774] hover:bg-[#EFEFED] dark:hover:bg-[#2C2C2C] transition-colors"
            >
              Close
            </button>

            {current && (
              <button
                onClick={() => handleAdopt(activeScenario)}
                disabled={adoptedScenarios[activeScenario]}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors shadow-2xs ${
                  adoptedScenarios[activeScenario]
                    ? 'bg-[#DBEDDB] dark:bg-[#243D30] text-[#1C3829] dark:text-[#86C19F] cursor-default'
                    : 'bg-[#FF5B26] hover:bg-[#EA4B18] text-white active:scale-98'
                }`}
              >
                {adoptedScenarios[activeScenario] ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Adopted into Plan</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Adopt Protocol into Live Plan</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
