import React from 'react';
import { Calendar, CheckCircle2, ShieldAlert, MessageSquareText } from 'lucide-react';
import { usePlanStore } from '../store/usePlanStore';

interface HeroCountdownProps {
  onOpenPlanB?: () => void;
}

export const HeroCountdown: React.FC<HeroCountdownProps> = ({ onOpenPlanB }) => {
  const { plan, onboarding, setIsChatOpen } = usePlanStore();

  if (!plan) return null;

  // Date calculation
  const targetDate = new Date(onboarding.date || Date.now());
  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();
  const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const diffWeeks = Math.floor(diffDays / 7);
  const remainingDays = diffDays % 7;

  // Progress Calculation
  const totalTasks = plan.timeline.length;
  const completedTasks = plan.timeline.filter((t) => t.done).length;
  const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const totalVendors = plan.vendors.length;
  const bookedVendors = plan.vendors.filter((v) => v.booked).length;
  const vendorProgress = totalVendors > 0 ? (bookedVendors / totalVendors) * 100 : 0;

  // Overall Plan Readiness Percentage
  const overallReadiness = Math.round(taskProgress * 0.6 + vendorProgress * 0.4);

  return (
    <div className="paper-card relative rounded-lg bg-[#F4EFFF] p-6 transition-colors dark:bg-[#202020] sm:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Event Title & Tone */}
        <div className="lg:col-span-7 space-y-3">
          {/* Notion-style Pastel Tag */}
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-[#D3E5EF] dark:bg-[#21374A] text-[#183347] dark:text-[#85B7DC]">
            <span>{onboarding.eventType || 'Event'}</span>
            <span>•</span>
            <span>{onboarding.city}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold tracking-tight text-[#37352F] dark:text-white leading-tight">
            {plan.title}
          </h1>

          <p className="text-sm text-[#787774] dark:text-[#A4A4A4] leading-relaxed line-clamp-2">
            {plan.summary}
          </p>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              onClick={() => setIsChatOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#FF5B26] hover:bg-[#EA4B18] text-white font-medium text-xs sm:text-sm transition-colors shadow-2xs active:scale-98"
            >
              <MessageSquareText className="w-3.5 h-3.5" />
              <span>Planning Assistant</span>
            </button>

            {onOpenPlanB && (
              <button
                onClick={onOpenPlanB}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#FFFFFF] dark:bg-[#2C2C2C] border border-[#E9E9E7] dark:border-[#383838] hover:bg-[#EFEFED] text-[#37352F] dark:text-[#D4D4D4] font-medium text-xs sm:text-sm transition-colors active:scale-98"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-[#787774]" />
                <span>Plan B Contingencies</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Notion-style Stat Blocks & Progress Ring */}
        <div className="lg:col-span-5 flex flex-col sm:flex-row items-center justify-around gap-5 bg-[#FFFFFF] dark:bg-[#191919] border border-[#E9E9E7] dark:border-[#2E2E2E] rounded-md p-5">
          {/* Time Remaining */}
          <div className="text-center sm:text-left space-y-0.5">
            <span className="text-[11px] uppercase tracking-wider text-[#787774] font-semibold flex items-center gap-1.5 justify-center sm:justify-start">
              <Calendar className="w-3 h-3 text-[#787774]" />
              Countdown
            </span>
            <div className="flex items-baseline gap-1.5 justify-center sm:justify-start">
              <span className="text-3xl sm:text-4xl font-serif font-bold text-[#37352F] dark:text-white">
                {diffWeeks}
              </span>
              <span className="text-xs text-[#787774] font-medium">weeks</span>
              <span className="text-2xl sm:text-3xl font-serif font-bold text-[#37352F] dark:text-white ml-1">
                {remainingDays}
              </span>
              <span className="text-xs text-[#787774] font-medium">days</span>
            </div>
            <p className="text-[11px] text-[#787774]">
              Target: {new Date(onboarding.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
            </p>
          </div>

          <div className="h-10 w-px bg-[#E9E9E7] dark:bg-[#2E2E2E] hidden sm:block" />

          {/* Plan Readiness Ring in Notion Blue */}
          <div className="flex flex-col items-center">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                <path
                  className="text-[#E9E9E7] dark:text-[#2E2E2E]"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#FF5B26] transition-all duration-700 ease-out"
                  strokeDasharray={`${overallReadiness}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-base font-bold font-serif text-[#37352F] dark:text-white">{overallReadiness}%</span>
                <span className="text-[9px] uppercase tracking-wider text-[#787774]">Done</span>
              </div>
            </div>
            <div className="mt-1 text-[11px] text-[#787774] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#FF5B26]" />
              <span>{completedTasks}/{totalTasks} tasks</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
