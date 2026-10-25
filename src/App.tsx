/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { usePlanStore } from './store/usePlanStore';
import { Navbar } from './components/Navbar';
import { DashboardSidebar } from './components/DashboardSidebar';
import { Logo } from './components/Logo';
import { OnboardingWizard } from './features/onboarding/OnboardingWizard';
import { OverviewTab } from './features/overview/OverviewTab';
import { BudgetTab } from './features/budget/BudgetTab';
import { TimelineTab } from './features/timeline/TimelineTab';
import { VendorsTab } from './features/vendors/VendorsTab';
import { IdeasTab } from './features/ideas/IdeasTab';
import { GuestsTab } from './features/guests/GuestsTab';
import { InvitationsTab } from './features/invitations/InvitationsTab';
import { RefineChatPanel } from './features/chat/RefineChatPanel';
import { PlanBModal } from './features/planb/PlanBModal';
import { PrintableSummary } from './components/PrintableSummary';

export default function App() {
  const { hasPlan, activeTab, darkMode, generationStep, setActiveTab } = usePlanStore();
  const [isPlanBOpen, setIsPlanBOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Sync dark mode class with HTML element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] dark:bg-[#07080B] text-[#18181B] dark:text-[#EDEDED] transition-colors">
      {/* Screen-reader Live Announcer for Async States */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {generationStep}
      </div>

      {/* Main Navbar */}
      <Navbar onOpenPrintModal={() => setIsPrintModalOpen(true)} />

      {/* Main Body with Dashboard Sidebar on larger screens */}
      <div className="flex-1 flex w-full">
        {hasPlan && (
          <DashboardSidebar
            onOpenPlanB={() => setIsPlanBOpen(true)}
            onOpenPrintModal={() => setIsPrintModalOpen(true)}
          />
        )}

        <main className={`flex-1 w-full mx-auto ${hasPlan ? 'max-w-6xl px-4 sm:px-8 py-6 sm:py-8' : 'w-full'}`}>
          {!hasPlan ? (
            <OnboardingWizard />
          ) : (
            <div>
              {activeTab === 'overview' && (
                <OverviewTab onOpenPlanB={() => setIsPlanBOpen(true)} />
              )}
              {activeTab === 'budget' && <BudgetTab />}
              {activeTab === 'timeline' && <TimelineTab />}
              {activeTab === 'vendors' && <VendorsTab />}
              {activeTab === 'ideas' && <IdeasTab />}
              {activeTab === 'guests' && <GuestsTab />}
              {activeTab === 'invitations' && <InvitationsTab />}
            </div>
          )}
        </main>
      </div>

      {/* Dashboard Footer (shown when plan is active) */}
      {hasPlan && (
        <footer className="bg-[#F7F6F3] dark:bg-[#191919] border-t border-[#E9E9E7] dark:border-[#2E2E2E] py-8 px-4 sm:px-8 no-print transition-colors">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo with clear space equal to half icon width (size 40 / 2 = 20px) */}
          <div style={{ padding: '20px' }}>
            <Logo
              size={40}
              theme={darkMode ? 'dark' : 'light'}
              outline={darkMode}
              href="/"
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                if (hasPlan) setActiveTab('overview');
              }}
            />
          </div>

          <div className="text-center sm:text-right text-xs text-[#787774] space-y-0.5">
            <p className="font-medium text-[#37352F] dark:text-[#D4D4D4]">
              Gatherly • Plan Events Effortlessly
            </p>
            <p className="text-[11px] text-[#787774]">
              Intelligent budgeting, backward timelines, and vendor coordination.
            </p>
          </div>
        </div>
      </footer>
      )}

      {/* Persistent Refine Chat Panel */}
      <RefineChatPanel />

      {/* Plan B Contingency Modal */}
      <PlanBModal isOpen={isPlanBOpen} onClose={() => setIsPlanBOpen(false)} />

      {/* Printable Summary Modal */}
      <PrintableSummary
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
      />
    </div>
  );
}
