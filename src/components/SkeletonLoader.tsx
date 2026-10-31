import React from 'react';
import { LogoMark } from './Logo';

interface SkeletonLoaderProps {
  message?: string;
  subMessage?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  message = 'Designing your bespoke event plan...',
  subMessage = 'Gatherly is calculating budget allocations, timeline milestones, and vendor checklists.',
}) => {
  return (
    <div className="w-full max-w-3xl mx-auto py-12 px-4">
      <div className="bg-[#FFFFFF] dark:bg-[#202020] border border-[#E9E9E7] dark:border-[#2E2E2E] rounded-lg p-8 sm:p-10 text-center relative">
        <div className="flex flex-col items-center">
          {/* Animated Spinner with LogoMark */}
          <div className="relative mb-5">
            <div className="w-12 h-12 rounded-full border-2 border-[#E9E9E7] dark:border-[#2E2E2E] border-t-[#FF5B26] animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <LogoMark size={20} />
            </div>
          </div>

          <h3 className="text-xl font-serif font-semibold text-[#37352F] dark:text-[#D4D4D4] mb-1.5">
            {message}
          </h3>
          <p className="text-[#787774] text-xs max-w-md mx-auto mb-6 leading-relaxed">
            {subMessage}
          </p>

          {/* Notion Minimal Skeleton Blocks */}
          <div className="w-full space-y-3 max-w-xl text-left">
            <div className="h-4 bg-[#EFEFED] dark:bg-[#2A2A2A] rounded w-3/4 animate-pulse" />
            <div className="grid grid-cols-3 gap-2.5">
              <div className="h-16 bg-[#F7F6F3] dark:bg-[#252525] border border-[#E9E9E7] dark:border-[#2E2E2E] rounded-md animate-pulse" />
              <div className="h-16 bg-[#F7F6F3] dark:bg-[#252525] border border-[#E9E9E7] dark:border-[#2E2E2E] rounded-md animate-pulse delay-75" />
              <div className="h-16 bg-[#F7F6F3] dark:bg-[#252525] border border-[#E9E9E7] dark:border-[#2E2E2E] rounded-md animate-pulse delay-150" />
            </div>
            <div className="h-3 bg-[#EFEFED] dark:bg-[#2A2A2A] rounded w-5/6 animate-pulse" />
            <div className="h-3 bg-[#EFEFED] dark:bg-[#2A2A2A] rounded w-2/3 animate-pulse" />
          </div>

          {/* Disclaimer badge */}
          <div className="mt-6 inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] bg-[#F7F6F3] dark:bg-[#2C2C2C] text-[#787774] border border-[#E9E9E7] dark:border-[#2E2E2E]">
            <span>Estimates are calibrated to local market averages.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
