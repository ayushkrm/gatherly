import React, { useState } from 'react';
import {
  Mail,
  Sparkles,
  Copy,
  Printer,
  Check,
  Globe,
  Heart,
  Scroll,
} from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore';

interface InvitationTones {
  formal: { headline: string; body: string; rsvpCallout: string };
  celebratory: { headline: string; body: string; rsvpCallout: string };
  casual: { headline: string; body: string; rsvpCallout: string };
}

export const InvitationsTab: React.FC = () => {
  const { plan, onboarding } = usePlanStore();

  const [selectedLanguage, setSelectedLanguage] = useState<'English' | 'Hindi' | 'Spanish' | 'French'>('English');
  const [selectedTone, setSelectedTone] = useState<'formal' | 'celebratory' | 'casual'>('celebratory');
  const [customHosts, setCustomHosts] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Pre-populated default invitations in English
  const [invitations, setInvitations] = useState<InvitationTones>({
    formal: {
      headline: `The Honour of Your Presence is Requested`,
      body: `Together with their families, we warmly invite you to celebrate ${plan?.title || 'our event'}.\n\nDate: ${onboarding.date}\nVenue: ${onboarding.city}\nAttire: Elegant Festive\n\nJoin us as we mark this sacred milestone under the open skies of ${onboarding.city}.`,
      rsvpCallout: `Kindly respond by ${new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toLocaleDateString()} to assist our preparations.`,
    },
    celebratory: {
      headline: `Join Our Grand Celebration! 🎉`,
      body: `With joyful hearts and cherished memories in the making, you are warmly invited to ${plan?.title || 'our celebration'}!\n\nDate: ${onboarding.date}\nLocation: ${onboarding.city}\n\nExpect an evening filled with heartfelt music, traditional delicacies, dancing, and endless laughter.`,
      rsvpCallout: `Please confirm your attendance so we can save a royal seat for you!`,
    },
    casual: {
      headline: `We're Getting Together & Celebrating! ✨`,
      body: `Pack your festive energy and dancing shoes! You're invited to celebrate with us for ${plan?.title || 'an unforgettable time'}.\n\nWhen: ${onboarding.date}\nWhere: ${onboarding.city}\n\nCome hungry, dress festive, and get ready for a memorable day!`,
      rsvpCallout: `RSVP online or ping us with your food preferences soon!`,
    },
  });

  const handleGenerateInvitations = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/invitations/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventTitle: plan?.title,
          date: onboarding.date,
          city: onboarding.city,
          language: selectedLanguage,
          vibe: onboarding.vibe,
          customNote: customHosts,
        }),
      });

      const data = await res.json();
      if (data.formal && data.celebratory && data.casual) {
        setInvitations(data);
      }
    } catch (err) {
      console.error('Failed to generate invitations', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const activeContent = invitations[selectedTone];
  const fullTextToCopy = `${activeContent.headline}\n\n${activeContent.body}\n\n${activeContent.rsvpCallout}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullTextToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#37352F] dark:text-[#D4D4D4]">
            Invitation Wording Studio
          </h2>
          <p className="text-[#787774] text-xs sm:text-sm mt-0.5">
            Generate bespoke invitation suites across 3 distinct tones and 4 languages.
          </p>
        </div>

        {/* Copy & Print Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E9E9E7] dark:border-[#2E2E2E] bg-[#FFFFFF] dark:bg-[#202020] hover:bg-[#EFEFED] dark:hover:bg-[#2C2C2C] text-[#37352F] dark:text-[#D4D4D4] text-xs font-medium transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#27AE60]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Text'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#2383E2] hover:bg-[#0B6FCC] text-white text-xs font-medium transition-colors shadow-2xs active:scale-98"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Invitation</span>
          </button>
        </div>
      </div>

      {/* Configuration Controls Bar */}
      <div className="bg-[#FFFFFF] dark:bg-[#202020] border border-[#E9E9E7] dark:border-[#2E2E2E] rounded-lg p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-end">
          {/* Language Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#37352F] dark:text-[#D4D4D4] mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#787774]" />
              Language
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as any)}
              className="w-full px-3 py-1.5 rounded-md border border-[#E9E9E7] dark:border-[#2E2E2E] bg-[#FFFFFF] dark:bg-[#191919] text-xs sm:text-sm text-[#37352F] dark:text-white font-medium focus:border-[#2383E2] focus:outline-hidden"
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi (हिन्दी)</option>
              <option value="Spanish">Spanish (Español)</option>
              <option value="French">French (Français)</option>
            </select>
          </div>

          {/* Host / Custom Details */}
          <div>
            <label className="block text-xs font-semibold text-[#37352F] dark:text-[#D4D4D4] mb-1.5 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-[#787774]" />
              Hosting Families / Custom Note
            </label>
            <input
              type="text"
              placeholder="e.g. Hosted by the Sharma & Patel Families"
              value={customHosts}
              onChange={(e) => setCustomHosts(e.target.value)}
              className="w-full px-3 py-1.5 rounded-md border border-[#E9E9E7] dark:border-[#2E2E2E] bg-[#FFFFFF] dark:bg-[#191919] text-xs sm:text-sm text-[#37352F] dark:text-white focus:border-[#2383E2] focus:outline-hidden"
            />
          </div>

          {/* Generate Button */}
          <div>
            <button
              onClick={handleGenerateInvitations}
              disabled={isGenerating}
              className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-md bg-[#2383E2] hover:bg-[#0B6FCC] text-white font-medium text-xs sm:text-sm shadow-2xs transition-colors disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Generating...' : `Generate in ${selectedLanguage}`}</span>
            </button>
          </div>
        </div>

        {/* Tone Tabs */}
        <div className="pt-3 border-t border-[#E9E9E7] dark:border-[#2E2E2E] flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-[#787774] uppercase tracking-wider mr-1">
            Tone:
          </span>
          {[
            { id: 'celebratory', label: 'Warm & Celebratory' },
            { id: 'formal', label: 'Elegant & Formal' },
            { id: 'casual', label: 'Fun & Casual' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTone(t.id as any)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                selectedTone === t.id
                  ? 'bg-[#2383E2] text-white font-semibold'
                  : 'bg-[#F7F6F3] dark:bg-[#252525] text-[#787774] hover:bg-[#EFEFED] dark:hover:bg-[#2C2C2C]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Formatted Invitation Card Preview */}
      <div className="flex justify-center">
        <div className="w-full max-w-2xl bg-[#FFFFFF] dark:bg-[#202020] border border-[#E9E9E7] dark:border-[#2E2E2E] rounded-lg p-6 sm:p-10 shadow-2xs relative text-center printable-invitation">
          <div className="border border-[#E9E9E7] dark:border-[#2E2E2E] rounded-md p-6 sm:p-8 space-y-5 bg-[#FBFBFA] dark:bg-[#191919]">
            <span className="inline-block text-[11px] uppercase tracking-wider text-[#2383E2] font-semibold">
              {selectedLanguage} • {selectedTone.toUpperCase()}
            </span>

            <h3 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-[#37352F] dark:text-[#D4D4D4] leading-tight">
              {activeContent.headline}
            </h3>

            {customHosts && (
              <p className="text-xs uppercase tracking-wider text-[#787774] font-medium">
                {customHosts}
              </p>
            )}

            <div className="w-12 h-px bg-[#E9E9E7] dark:border-[#2E2E2E] mx-auto" />

            <div className="text-[#37352F] dark:text-[#D4D4D4] text-xs sm:text-sm leading-relaxed whitespace-pre-line font-sans max-w-lg mx-auto">
              {activeContent.body}
            </div>

            <div className="w-12 h-px bg-[#E9E9E7] dark:border-[#2E2E2E] mx-auto" />

            <div className="p-3 rounded-md bg-[#F7F6F3] dark:bg-[#252525] border border-[#E9E9E7] dark:border-[#2E2E2E] text-xs font-medium text-[#37352F] dark:text-[#D4D4D4]">
              {activeContent.rsvpCallout}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
