import React, { useState } from 'react';
import {
  LayoutDashboard,
  Wallet,
  Calendar,
  Store,
  Lightbulb,
  Users,
  Mail,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Printer,
  Sparkles,
} from 'lucide-react';
import { usePlanStore, DashboardTab } from '../store/usePlanStore';
import { Logo, LogoMark } from './Logo';

interface DashboardSidebarProps {
  onOpenPlanB?: () => void;
  onOpenPrintModal?: () => void;
  onNavigateHome: () => boolean;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  onOpenPlanB,
  onOpenPrintModal,
  onNavigateHome,
}) => {
  const { activeTab, setActiveTab, plan, isChatOpen, setIsChatOpen, darkMode } = usePlanStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const navItems: { id: DashboardTab; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      id: 'budget',
      label: 'Budget',
      icon: <Wallet className="w-4 h-4" />,
      badge: plan?.budget?.length ? `${plan.budget.length}` : undefined,
    },
    {
      id: 'timeline',
      label: 'Timeline',
      icon: <Calendar className="w-4 h-4" />,
      badge: plan?.timeline?.filter((t) => !t.done)?.length ? `${plan.timeline.filter((t) => !t.done).length}` : undefined,
    },
    {
      id: 'vendors',
      label: 'Vendors',
      icon: <Store className="w-4 h-4" />,
      badge: plan?.vendors?.length ? `${plan.vendors.length}` : undefined,
    },
    { id: 'ideas', label: 'Ideas', icon: <Lightbulb className="w-4 h-4" /> },
    { id: 'guests', label: 'Guests', icon: <Users className="w-4 h-4" /> },
    { id: 'invitations', label: 'Invitations', icon: <Mail className="w-4 h-4" /> },
  ];

  return (
    <aside
      aria-label="Dashboard sidebar"
      className={`hidden lg:flex flex-col justify-between shrink-0 bg-[#FBFBFA] dark:bg-[#1E1E1E] border-r border-[#E9E9E7] dark:border-[#2E2E2E] text-[#37352F] dark:text-[#D4D4D4] transition-all duration-200 z-20 select-none ${
        isExpanded ? 'w-60' : 'w-16'
      }`}
    >
      {/* Top Header with Logo */}
      <div className="flex flex-col">
        <div
          className={`flex items-center border-b border-[#E9E9E7] dark:border-[#2E2E2E] h-14 ${
            isExpanded ? 'justify-between px-4' : 'justify-center px-2'
          }`}
          style={{
            paddingLeft: '16px',
            paddingRight: '16px',
          }}
        >
          {isExpanded ? (
            <Logo
              size={32}
              theme={darkMode ? 'dark' : 'light'}
              outline={darkMode}
              asLink
              href="/"
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                onNavigateHome();
              }}
            />
          ) : (
            <LogoMark
              size={32}
              outline={darkMode}
              asLink
              href="/"
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                onNavigateHome();
              }}
              aria-label="Gatherly home"
            />
          )}

          {/* Toggle Expand Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1 rounded-md text-[#787774] hover:text-[#37352F] dark:hover:text-white hover:bg-[#EFEFED] dark:hover:bg-[#2C2C2C] transition ${
              isExpanded ? '' : 'hidden'
            }`}
            aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Collapsed expand toggle button */}
        {!isExpanded && (
          <div className="flex justify-center py-1.5 border-b border-[#E9E9E7] dark:border-[#2E2E2E]">
            <button
              onClick={() => setIsExpanded(true)}
              className="p-1 rounded-md text-[#787774] hover:text-[#37352F] dark:hover:text-white hover:bg-[#EFEFED] dark:hover:bg-[#2C2C2C] transition"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Section label when expanded */}
        {isExpanded && (
          <div className="px-4 pt-3 pb-1 text-[11px] font-semibold tracking-wider text-[#787774] uppercase">
            Workspace
          </div>
        )}

        {/* Navigation Tabs */}
        <nav className="p-2 space-y-0.5">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center rounded-md transition-colors text-sm ${
                  isExpanded ? 'px-2.5 py-1.5 gap-2.5' : 'p-2 justify-center'
                } ${
                  active
                    ? 'bg-[#EFEFED] dark:bg-[#2C2C2C] text-[#37352F] dark:text-white font-semibold'
                    : 'text-[#37352F] dark:text-[#A4A4A4] hover:bg-[#EFEFED] dark:hover:bg-[#2C2C2C]'
                }`}
                title={!isExpanded ? item.label : undefined}
                aria-label={item.label}
              >
                <div className={`shrink-0 ${active ? 'text-[#FF5B26]' : 'text-[#787774]'}`}>
                  {item.icon}
                </div>
                {isExpanded && (
                  <div className="flex items-center justify-between w-full">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.2 rounded text-[11px] font-mono bg-[#E3E2E0] dark:bg-[#2F2F2F] text-[#37352F] dark:text-[#D4D4D4]">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions Area */}
      <div className="p-2 border-t border-[#E9E9E7] dark:border-[#2E2E2E] space-y-0.5">
        {onOpenPlanB && (
          <button
            onClick={onOpenPlanB}
            className={`w-full flex items-center rounded-md text-xs font-medium text-[#787774] hover:text-[#37352F] dark:hover:text-white hover:bg-[#EFEFED] dark:hover:bg-[#2C2C2C] transition ${
              isExpanded ? 'px-2.5 py-1.5 gap-2.5' : 'p-2 justify-center'
            }`}
            title="Plan B Contingency"
            aria-label="Plan B Contingency"
          >
            <ShieldAlert className="w-4 h-4 text-[#787774] shrink-0" />
            {isExpanded && <span className="truncate">Plan B Contingency</span>}
          </button>
        )}

        {onOpenPrintModal && (
          <button
            onClick={onOpenPrintModal}
            className={`w-full flex items-center rounded-md text-xs font-medium text-[#787774] hover:text-[#37352F] dark:hover:text-white hover:bg-[#EFEFED] dark:hover:bg-[#2C2C2C] transition ${
              isExpanded ? 'px-2.5 py-1.5 gap-2.5' : 'p-2 justify-center'
            }`}
            title="Print Summary"
            aria-label="Print Summary"
          >
            <Printer className="w-4 h-4 text-[#787774] shrink-0" />
            {isExpanded && <span className="truncate">Print Brief</span>}
          </button>
        )}

        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`w-full flex items-center rounded-md text-xs font-medium transition ${
            isExpanded ? 'px-2.5 py-1.5 gap-2.5' : 'p-2 justify-center'
          } ${
            isChatOpen
              ? 'bg-[#FF5B26] text-white font-semibold'
              : 'text-[#37352F] dark:text-[#D4D4D4] hover:bg-[#EFEFED] dark:hover:bg-[#2C2C2C]'
          }`}
          title="Assistant"
          aria-label="Assistant"
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          {isExpanded && <span className="truncate">Assistant</span>}
        </button>
      </div>
    </aside>
  );
};
