import React, { useRef, useState } from 'react';
import {
  Moon,
  Sun,
  Printer,
  Download,
  Upload,
  PlusCircle,
  MessageSquareText,
  Menu,
  X,
  LayoutDashboard,
  Wallet,
  Calendar,
  Store,
  Lightbulb,
  Users,
  Mail,
  ChevronRight,
} from 'lucide-react';
import { usePlanStore, DashboardTab } from '../store/usePlanStore';
import { Logo, LogoMark } from './Logo';

interface NavbarProps {
  onOpenPrintModal: () => void;
  onOpenSidebar?: () => void;
  onNavigateHome: () => boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenPrintModal, onNavigateHome }) => {
  const {
    hasPlan,
    plan,
    activeTab,
    setActiveTab,
    darkMode,
    toggleDarkMode,
    isChatOpen,
    setIsChatOpen,
    loadDemoPlan,
    resetAll,
    exportStateToJson,
    importStateFromJson,
    diffHistory,
  } = usePlanStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs: { id: DashboardTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { id: 'budget', label: 'Budget', icon: <Wallet className="w-3.5 h-3.5" /> },
    { id: 'timeline', label: 'Timeline', icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'vendors', label: 'Vendors', icon: <Store className="w-3.5 h-3.5" /> },
    { id: 'ideas', label: 'Ideas', icon: <Lightbulb className="w-3.5 h-3.5" /> },
    { id: 'guests', label: 'Guests', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'invitations', label: 'Invitations', icon: <Mail className="w-3.5 h-3.5" /> },
  ];

  const handleExportJson = () => {
    const jsonStr = exportStateToJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gatherly-plan-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importStateFromJson(content);
        if (!ok) {
          alert('Invalid Gatherly JSON file format.');
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLandingNav = (e: React.MouseEvent): boolean => {
    e.preventDefault();
    return onNavigateHome();
  };

  return (
    <header className="sticky top-0 z-40 border-b-2 border-[#26231F] bg-[#FFFDF7]/95 backdrop-blur-md transition-colors dark:border-white/10 dark:bg-[#07080B]/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Breadcrumbs */}
          <div className="flex items-center min-w-0">
            <Logo
              size={36}
              theme={darkMode ? 'dark' : 'light'}
              outline={darkMode}
              href="/"
              onClick={handleLandingNav}
            />

            {hasPlan && plan && (
              <div className="flex items-center gap-1.5 ml-3 pl-3 border-l border-[#E8E6DF] dark:border-white/10 min-w-0">
                <ChevronRight className="w-3.5 h-3.5 text-[#71717A] shrink-0 hidden sm:inline" />
                <span className="text-xs text-[#18181B] dark:text-[#EDEDED] font-medium truncate max-w-[200px] sm:max-w-[280px]">
                  {plan.title}
                </span>
              </div>
            )}
          </div>

          {/* Vetra-Style Center Nav Links (when !hasPlan) */}
          {!hasPlan && (
            <nav className="hidden md:flex items-center gap-7 text-xs sm:text-[13px] font-medium text-[#71717A] dark:text-[#A1A1AA]">
              <a
                href="#planner"
                className="hover:text-[#18181B] dark:hover:text-white transition-colors flex items-center gap-1"
              >
                <span>Planner</span>
                <span className="text-[10px] opacity-70">▾</span>
              </a>
              <a
                href="#features"
                className="hover:text-[#18181B] dark:hover:text-white transition-colors flex items-center gap-1"
              >
                <span>Features</span>
                <span className="text-[10px] opacity-70">▾</span>
              </a>
              <a
                href="#pricing"
                className="hover:text-[#18181B] dark:hover:text-white transition-colors"
              >
                Pricing
              </a>
              <a
                href="#contact"
                className="hover:text-[#18181B] dark:hover:text-white transition-colors"
              >
                Contact
              </a>
            </nav>
          )}

          {/* Quick Actions (Right) */}
          <div className="flex items-center gap-2.5">
            {/* Demo Button */}
            <button
              onClick={loadDemoPlan}
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#26231F] bg-white px-3 py-1.5 text-xs font-bold text-[#26231F] shadow-[2px_2px_0_#26231F] transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#26231F] dark:bg-[#202020] dark:text-white"
              title="Load sample plan (Jaipur Wedding)"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5B26]" />
              <span>Demo Plan</span>
            </button>

            {/* Vetra-style Get Started button (when !hasPlan) */}
            {!hasPlan && (
              <a
                href="#planner"
                className="playful-cta hidden items-center justify-center whitespace-nowrap px-4.5 py-1.5 text-xs sm:inline-flex"
              >
                Get started
              </a>
            )}

            {hasPlan && (
              <>
                {/* Printable Summary */}
                <button
                  onClick={onOpenPrintModal}
                  className="p-1.5 rounded-md text-[#787774] hover:text-[#37352F] dark:hover:text-white hover:bg-[#EFEFED] dark:hover:bg-[#2C2C2C] transition-colors"
                  title="Print summary brief"
                  aria-label="Print event summary"
                >
                  <Printer className="w-4 h-4" />
                </button>

                {/* Export JSON */}
                <button
                  onClick={handleExportJson}
                  className="p-1.5 rounded-md text-[#787774] hover:text-[#37352F] dark:hover:text-white hover:bg-[#EFEFED] dark:hover:bg-[#2C2C2C] transition-colors hidden sm:inline-flex"
                  title="Export Plan JSON"
                  aria-label="Export Plan JSON"
                >
                  <Download className="w-4 h-4" />
                </button>

                {/* Import JSON */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 rounded-md text-[#787774] hover:text-[#37352F] dark:hover:text-white hover:bg-[#EFEFED] dark:hover:bg-[#2C2C2C] transition-colors hidden sm:inline-flex"
                  title="Import Plan JSON"
                  aria-label="Import Plan JSON"
                >
                  <Upload className="w-4 h-4" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json"
                  className="hidden"
                />

                {/* New Plan / Reset */}
                <button
                  onClick={() => {
                    if (confirm('Start a new event plan? Your current plan will be cleared.')) {
                      resetAll();
                    }
                  }}
                  className="p-1.5 rounded-md text-[#787774] hover:text-[#37352F] dark:hover:text-white hover:bg-[#EFEFED] dark:hover:bg-[#2C2C2C] transition-colors hidden sm:inline-flex"
                  title="Start New Plan"
                  aria-label="Start New Plan"
                >
                  <PlusCircle className="w-4 h-4" />
                </button>

                {/* Refine Assistant Chat button */}
                <button
                  onClick={() => setIsChatOpen(!isChatOpen)}
                  className={`relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    isChatOpen
                      ? 'bg-[#FF5B26] text-white shadow-2xs'
                      : 'bg-[#F7F6F3] dark:bg-[#202020] text-[#37352F] dark:text-[#D4D4D4] border border-[#E9E9E7] dark:border-[#2E2E2E] hover:bg-[#EFEFED] dark:hover:bg-[#2C2C2C]'
                  }`}
                  title="Toggle Assistant"
                  aria-label="Toggle Event Assistant"
                >
                  <MessageSquareText className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Assistant</span>
                  {diffHistory.length > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF5B26]" />
                  )}
                </button>
              </>
            )}

            {/* Theme Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold border border-[#E4E4E7] dark:border-[#2E303B] bg-[#F4F4F5] dark:bg-[#1E1F26] text-[#52525B] dark:text-[#D4D4D8] hover:text-[#18181B] dark:hover:text-white hover:bg-[#EBEBEF] dark:hover:bg-[#282933] transition-all cursor-pointer shadow-2xs"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px] font-semibold text-amber-300">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#52525B]" />
                  <span className="text-[11px] font-semibold text-[#52525B]">Dark</span>
                </>
              )}
            </button>

            {/* Mobile Nav Sheet Button */}
            {hasPlan && (
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-1.5 rounded-md text-[#787774] hover:text-[#37352F] dark:hover:text-white hover:bg-[#EFEFED] dark:hover:bg-[#2C2C2C] transition-colors lg:hidden"
                aria-label="Open mobile navigation"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Desktop Dashboard Tabs Bar (when plan exists) */}
        {hasPlan && (
          <nav
            className="hidden md:flex lg:hidden space-x-1 overflow-x-auto py-1 border-t border-[#E9E9E7] dark:border-[#2E2E2E] no-scrollbar"
            aria-label="Dashboard Tabs"
          >
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    active
                      ? 'bg-[#EFEFED] dark:bg-[#2C2C2C] text-[#37352F] dark:text-white font-semibold'
                      : 'text-[#787774] hover:text-[#37352F] dark:hover:text-white hover:bg-[#EFEFED] dark:hover:bg-[#2C2C2C]'
                  }`}
                >
                  <span className={active ? 'text-[#FF5B26]' : 'text-[#787774]'}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        )}
      </div>

      {/* Mobile Nav Sheet with LogoMark at size 32 */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-2xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Sheet Drawer */}
          <div className="relative ml-auto w-full max-w-xs bg-[#FFFFFF] dark:bg-[#191919] border-l border-[#E9E9E7] dark:border-[#2E2E2E] h-full shadow-lg p-5 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              {/* Sheet Header with LogoMark at size 32 */}
              <div className="flex items-center justify-between border-b border-[#E9E9E7] dark:border-[#2E2E2E] pb-3">
                <div className="flex items-center gap-2.5" style={{ paddingLeft: '8px' }}>
                  <LogoMark
                    size={32}
                    outline={darkMode}
                    asLink
                    href="/"
                    onClick={(e: React.MouseEvent) => {
                      if (handleLandingNav(e)) setMobileMenuOpen(false);
                    }}
                    aria-label="Gatherly home"
                  />
                  <span
                    className="font-serif font-[800] text-base text-[#37352F] dark:text-[#D4D4D4]"
                    style={{ letterSpacing: '-0.02em' }}
                  >
                    Gatherly<span style={{ color: '#ff6a3d' }}>.</span>
                  </span>
                </div>

                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-md text-[#787774] hover:text-[#37352F] hover:bg-[#EFEFED] dark:hover:bg-[#2C2C2C]"
                  aria-label="Close navigation"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold tracking-wider text-[#787774] px-2.5 block mb-1.5 uppercase">
                  Workspace
                </span>
                {tabs.map((tab) => {
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        active
                          ? 'bg-[#EFEFED] dark:bg-[#2C2C2C] text-[#37352F] dark:text-white font-semibold'
                          : 'text-[#37352F] dark:text-[#D4D4D4] hover:bg-[#EFEFED] dark:hover:bg-[#2C2C2C]'
                      }`}
                    >
                      <span className={active ? 'text-[#FF5B26]' : 'text-[#787774]'}>
                        {tab.icon}
                      </span>
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Additional Actions */}
              <div className="pt-3 border-t border-[#E9E9E7] dark:border-[#2E2E2E] space-y-1">
                <button
                  onClick={() => {
                    handleExportJson();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#37352F] dark:text-[#D4D4D4] hover:bg-[#EFEFED] dark:hover:bg-[#2C2C2C]"
                >
                  <Download className="w-3.5 h-3.5 text-[#787774]" />
                  <span>Export JSON</span>
                </button>
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#37352F] dark:text-[#D4D4D4] hover:bg-[#EFEFED] dark:hover:bg-[#2C2C2C]"
                >
                  <Upload className="w-3.5 h-3.5 text-[#787774]" />
                  <span>Import JSON</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm('Start a new event plan? Your current plan will be cleared.')) {
                      resetAll();
                      setMobileMenuOpen(false);
                    }
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#EB5757] hover:bg-[#FFE2DD] dark:hover:bg-[#4D2322]"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Start New Plan</span>
                </button>
              </div>
            </div>

            {/* Bottom Brand notice */}
            <div className="pt-4 border-t border-[#E9E9E7] dark:border-[#2E2E2E] text-[11px] text-[#787774] text-center">
              Gatherly • Plan Events Effortlessly
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
