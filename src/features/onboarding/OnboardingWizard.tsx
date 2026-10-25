import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  Wallet,
  Heart,
  Utensils,
  Globe,
  Upload,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Play,
  Search,
  Bell,
  ChevronDown,
  LayoutDashboard,
  TrendingUp,
  FileText,
  Store,
  Layers,
  AlertCircle,
  Image as ImageIcon,
  Briefcase,
  Wine,
  PartyPopper,
  X,
  CheckCircle2,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { EventPlanSchema, EventPlan } from '../../lib/schema';
import { Logo } from '../../components/Logo';

function createPlanFromInputs(onboarding: any): EventPlan {
  const city = onboarding.city?.trim() || 'Jaipur';
  const eventType = onboarding.eventType || 'Celebration';
  const totalBudget = Math.max(500, Number(onboarding.totalBudget) || 1500000);
  const guests = Math.max(1, Number(onboarding.guestCount) || 100);
  const currency = onboarding.currency || 'INR';
  const vibe = onboarding.vibe || 'Warm, memorable celebration';
  const cultural = onboarding.culturalNeeds || 'Traditional celebration';

  const budgetPercentages = [
    { cat: `${eventType} Venue & Space`, pct: 30, tip: 'Tour venues during low-traffic windows and check noise ordinances.', pri: 'must' },
    { cat: 'Catering, Beverages & Service', pct: 28, tip: 'Opt for regional chef stations and curated signature drinks.', pri: 'must' },
    { cat: 'Atmosphere, Florals & Lighting', pct: 15, tip: 'Highlight natural architecture with warm pin-spot lighting.', pri: 'must' },
    { cat: 'Photography & Highlight Video', pct: 10, tip: 'Book bundled ceremony and reception packages in advance.', pri: 'should' },
    { cat: 'Music, Sound & Entertainment', pct: 6, tip: 'Hire vetted local acoustic performers and experienced DJs.', pri: 'should' },
    { cat: 'Stationery, Signage & Welcome', pct: 3, tip: 'Use digital RSVP tracking alongside bespoke printed menus.', pri: 'nice' },
    { cat: 'Styling, Hair & Attire Accents', pct: 2, tip: 'Book trial sessions early to lock in peak-season dates.', pri: 'nice' },
    { cat: 'Contingency & Emergency Reserve', pct: 6, tip: 'Keep 5-10% uncommitted for unexpected day-of logistics.', pri: 'must' },
  ];

  const budget = budgetPercentages.map((item) => ({
    category: item.cat,
    percent: item.pct,
    amount: Math.round((totalBudget * item.pct) / 100),
    tip: item.tip,
    priority: item.pri as 'must' | 'should' | 'nice',
    actualSpent: 0,
  }));

  const timeline = [
    { weeksBefore: 24, task: `Finalize date, book prime ${city} venue, and establish payment schedules`, category: 'Venue', done: false },
    { weeksBefore: 20, task: `Select caterer, finalize tastings for ${guests} guests, and confirm dietary menus`, category: 'Catering', done: false },
    { weeksBefore: 16, task: 'Secure lead photographer and videographer with shot list guidelines', category: 'Photography', done: false },
    { weeksBefore: 12, task: `Design floral concepts and lighting scheme fitting the "${vibe}" aesthetic`, category: 'Florals & Decor', done: false },
    { weeksBefore: 8, task: `Send formal invitations, launch RSVP tracking, and confirm traditions (${cultural})`, category: 'Guests & Invitations', done: false },
    { weeksBefore: 4, task: `Lock in sound checks, timeline run-of-show, and vendor arrival permits in ${city}`, category: 'Production & AV', done: false },
    { weeksBefore: 1, task: 'Final headcount check, review weather plan, and pack day-of emergency kit', category: 'Coordination', done: false },
    { weeksBefore: 0, task: `Host and celebrate ${eventType} with guests in ${city}!`, category: 'Celebration Day', done: false },
  ];

  const vendors = [
    {
      category: 'Venue & Reception Hall',
      checklist: ['Verify maximum seated guest capacity', 'Check loading dock access times and parking availability', 'Confirm sound curfew and decor restrictions'],
      questionsToAsk: ['What is your standard power supply capacity for AV and decor?', 'Are outside catering or bar services permitted?', 'What is your inclement weather relocation policy?'],
      estimatedCost: Math.round(totalBudget * 0.30),
      booked: false,
    },
    {
      category: 'Catering & Beverages',
      checklist: ['Accommodate all requested dietary needs and allergens', 'Schedule dedicated tasting session', 'Verify staffing ratio (1 server per 10-15 guests recommended)'],
      questionsToAsk: ['Are bar packages charged on consumption or per person flat rate?', 'How do you handle specialty dietary meals on the day of?'],
      estimatedCost: Math.round(totalBudget * 0.28),
      booked: false,
    },
    {
      category: 'Photography & Cinema',
      checklist: ['Review full wedding/event gallery from start to finish', 'Agree on second shooter coverage and turnaround timeline', 'Draft must-have family and VIP portrait lists'],
      questionsToAsk: ['How many hours of continuous coverage are included?', 'What is your delivery window for teaser clips vs full edits?'],
      estimatedCost: Math.round(totalBudget * 0.10),
      booked: false,
    },
    {
      category: 'Florals & Production',
      checklist: ['Source seasonal local blooms for cost efficiency', 'Coordinate setup and strike times with venue manager', 'Inspect sample floral centerpiece or mock tablescape'],
      questionsToAsk: ['Do you provide rental hardware (vessels, pedestals, archways)?', 'Who oversees day-of strike and cleanup?'],
      estimatedCost: Math.round(totalBudget * 0.15),
      booked: false,
    },
  ];

  const ideas = [
    {
      id: `idea-${Date.now()}-1`,
      title: `Curated ${city} Welcome Experience`,
      description: `Greet arriving guests with a curated welcome tasting or artisanal favor inspired by ${city}'s distinct culinary traditions.`,
      estCost: `${currency} ${Math.round(totalBudget * 0.02).toLocaleString()}`,
      addedToPlan: true,
    },
    {
      id: `idea-${Date.now()}-2`,
      title: 'Interactive Audio Guestbook Keepsake',
      description: 'Set up an aesthetic vintage telephone station where guests record voice memories and funny toasts.',
      estCost: `${currency} ${Math.round(totalBudget * 0.015).toLocaleString()}`,
      addedToPlan: false,
    },
    {
      id: `idea-${Date.now()}-3`,
      title: 'Ambient Acoustic Twilight Hour',
      description: `Feature local live instrumentalists during golden hour to establish the "${vibe}" ambiance effortlessly.`,
      estCost: `${currency} ${Math.round(totalBudget * 0.03).toLocaleString()}`,
      addedToPlan: false,
    },
  ];

  const risks = [
    {
      risk: `Inclement weather or temperature shifts during ${city} outdoor sessions`,
      mitigation: 'Secure weather-proof canopy options or guaranteed indoor switchover arrangements 48 hours prior.',
    },
    {
      risk: 'Guest transit delays during peak evening traffic',
      mitigation: 'Provide centralized shuttle pickups or shared ride vouchers with clear schedule notifications.',
    },
    {
      risk: 'Catering dietary cross-contamination for strict guests',
      mitigation: 'Dedicated separate prep area with clearly labeled platters and allergen-trained servers.',
    },
  ];

  return {
    title: `${onboarding.eventType || 'Celebration'} in ${city}`,
    theme: vibe,
    summary: `A carefully orchestrated ${guests}-guest ${eventType} in ${city}, tailored to a total budget of ${currency} ${totalBudget.toLocaleString()} with authentic cultural honors and backward timeline sequencing.`,
    budget,
    timeline,
    vendors,
    ideas,
    risks,
  };
}

export const OnboardingWizard: React.FC = () => {
  const {
    onboarding,
    setOnboardingField,
    setPlan,
    isGenerating,
    setIsGenerating,
    generationStep,
    loadDemoPlan,
  } = usePlanStore();

  const [step, setStep] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    onboarding.moodBoardImageBase64 || null
  );
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [sidebarActiveTab, setSidebarActiveTab] = useState<'dashboard' | 'budget' | 'timeline' | 'vendors'>('dashboard');

  const eventTypes: { type: string; icon: React.ReactNode; desc: string }[] = [
    { type: 'Wedding', icon: <Heart className="w-4 h-4" />, desc: 'Multi-day or single day nuptials' },
    { type: 'Milestone Birthday', icon: <PartyPopper className="w-4 h-4" />, desc: 'Festive celebrations & toasting' },
    { type: 'Community Festival', icon: <Globe className="w-4 h-4" />, desc: 'Large gatherings & culture' },
    { type: 'Anniversary', icon: <Wine className="w-4 h-4" />, desc: 'Cherished memories & milestones' },
    { type: 'Intimate Dinner Party', icon: <Utensils className="w-4 h-4" />, desc: 'Curated courses & wine pairing' },
    { type: 'Corporate Gala', icon: <Briefcase className="w-4 h-4" />, desc: 'Award galas & summit banquets' },
  ];

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  ];

  const popularCities = ['Jaipur', 'New York', 'London', 'Paris', 'Mumbai', 'Austin', 'Florence'];
  const guestPresets = [25, 60, 120, 250, 500];

  const commonDietary = [
    'Vegetarian',
    'Vegan',
    'Jain (No Root Veg)',
    'Halal',
    'Gluten-Free',
    'Nut-Free',
    'Kosher',
    'Dairy-Free',
  ];

  const vibeInspirations = [
    'Candlelit regal courtyard',
    'Modern minimalist luxury',
    'Euphoric music & dancing',
    'Bohemian sunset picnic',
    'Timeless black-tie elegance',
    'Traditional heritage warmth',
  ];

  const traditionPresets = [
    'Sangeet & Mehendi',
    'Traditional Haldi',
    'Chuppah & Hora',
    'Tea Ceremony',
    'Keynote & Toasting',
  ];

  const handleDietaryToggle = (item: string) => {
    const current = onboarding.dietary || [];
    if (current.includes(item)) {
      setOnboardingField('dietary', current.filter((d) => d !== item));
    } else {
      setOnboardingField('dietary', [...current, item]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg('Image size should be under 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64Str = uploadEvent.target?.result as string;
      setImagePreview(base64Str);
      setOnboardingField('moodBoardImageBase64', base64Str);
      setOnboardingField('moodBoardMimeType', file.type || 'image/jpeg');
    };
    reader.readAsDataURL(file);
  };

  const validateStep = (currentStep: number): boolean => {
    setErrorMsg(null);
    if (currentStep === 1) {
      if (!onboarding.eventType) {
        setErrorMsg('Please select an event category.');
        return false;
      }
      if (!onboarding.city || onboarding.city.trim().length < 2) {
        setErrorMsg('Please enter a host city.');
        return false;
      }
      if (!onboarding.date) {
        setErrorMsg('Please choose a target event date.');
        return false;
      }
    } else if (currentStep === 2) {
      if (!onboarding.guestCount || onboarding.guestCount < 1) {
        setErrorMsg('Guest count must be at least 1.');
        return false;
      }
      if (!onboarding.totalBudget || onboarding.totalBudget < 50) {
        setErrorMsg('Please enter a valid event budget.');
        return false;
      }
    } else if (currentStep === 3) {
      if (!onboarding.vibe || onboarding.vibe.trim().length < 3) {
        setErrorMsg('Please describe your aesthetic vision or select inspirations.');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, 4));
    }
  };

  const prevStep = () => {
    setErrorMsg(null);
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleStepClick = (targetStep: number) => {
    if (targetStep > step) {
      if (!validateStep(step)) return;
    }
    setErrorMsg(null);
    setStep(targetStep);
  };

  const handleGeneratePlan = async () => {
    if (!validateStep(4)) return;

    setIsGenerating(true, 'Consulting AI Event Architect (Gemini 2.5 Flash)...');
    setErrorMsg(null);

    try {
      setTimeout(() => setIsGenerating(true, 'Calculating 100% budget allocation with reserve...'), 800);
      setTimeout(() => setIsGenerating(true, 'Constructing backward timeline milestones...'), 1600);
      setTimeout(() => setIsGenerating(true, 'Curating vendor questions and local ideas...'), 2400);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 18000);

      try {
        const res = await fetch('/api/plan/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(onboarding),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const parsed = EventPlanSchema.safeParse(data.plan);
          if (parsed.success) {
            setPlan(parsed.data);
            if (onboarding.moodBoardImageBase64) {
              fetch('/api/moodboard/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  imageBase64: onboarding.moodBoardImageBase64,
                  mimeType: onboarding.moodBoardMimeType,
                }),
              }).catch(() => {});
            }
            return;
          }
        }
      } catch (fetchErr) {
        console.warn('AI endpoint timed out or failed, assembling customized plan locally...', fetchErr);
      }

      const customPlan = createPlanFromInputs(onboarding);
      setPlan(customPlan);
    } catch (err: any) {
      console.error(err);
      const fallbackPlan = createPlanFromInputs(onboarding);
      setPlan(fallbackPlan);
    } finally {
      setIsGenerating(false);
    }
  };

  const scrollToPlanner = () => {
    const el = document.getElementById('planner');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (isGenerating) {
    return <SkeletonLoader message="Designing your bespoke event architecture..." subMessage={generationStep} />;
  }

  const perGuestCost =
    onboarding.guestCount > 0 ? Math.round(onboarding.totalBudget / onboarding.guestCount) : 0;

  return (
    <div className="w-full min-h-screen bg-[#FAF9F6] dark:bg-[#07080B] text-[#18181B] dark:text-[#EDEDED] transition-colors relative overflow-hidden">
      {/* Subtle Starry / Ambient Cosmic Background Gradient in Dark Mode */}
      <div className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-700 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,40,10,0.15),rgba(255,255,255,0))]" />
      <div className="absolute inset-0 pointer-events-none opacity-100 dark:opacity-0 transition-opacity duration-700 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,91,38,0.06),rgba(255,255,255,0))]" />

      {/* ------------------------------------------------------------------ */}
      {/* 1. HERO SECTION (Exact Vetra Design from Reference Image)           */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative pt-12 sm:pt-16 pb-16 px-4 text-center z-10">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          {/* Top Announcement Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-md shadow-xs mb-8 transition-transform hover:scale-[1.02] cursor-pointer">
            <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              New version is out! Read more
            </span>
            <span className="w-5 h-5 rounded-full bg-[#FF5B26] text-white flex items-center justify-center text-[10px] font-bold">
              →
            </span>
          </div>

          {/* Monumental Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-neutral-900 dark:text-white leading-[1.08] max-w-3xl">
            Accelerate Your Events With AI
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-sm sm:text-base md:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed font-normal">
            AI-driven event architecture & insights. Empower your team, book top venues, and orchestrate memorable celebrations effortlessly.
          </p>

          {/* Action Pill Buttons Pair */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <button
              type="button"
              onClick={() => setIsDemoModalOpen(true)}
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-black/15 dark:border-white/20 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-neutral-900 dark:text-white font-medium text-xs sm:text-sm backdrop-blur-md transition-all active:scale-98 cursor-pointer shadow-xs"
            >
              <div className="w-5 h-5 rounded-full bg-white dark:bg-white text-black flex items-center justify-center shadow-xs">
                <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
              </div>
              <span>Watch Demo</span>
            </button>

            <button
              type="button"
              onClick={scrollToPlanner}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-[#FF5B26] hover:bg-[#EA4B18] text-white font-semibold text-xs sm:text-sm shadow-[0_10px_25px_rgba(255,91,38,0.35)] transition-all active:scale-98 cursor-pointer"
            >
              Get started for free
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 2. PLANETARY GLOWING ARC ("ECLIPSE HORIZON") & SOCIAL PROOF        */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative w-full overflow-hidden pt-8 pb-4">
        {/* The Glowing Curved Horizon Arc */}
        <div className="relative max-w-6xl mx-auto px-4">
          {/* Radial light flare centered on the curve */}
          <div className="absolute left-1/2 -top-12 -translate-x-1/2 w-[800px] h-[300px] bg-gradient-to-b from-[#FF5B26]/30 dark:from-[#FF5B26]/45 via-[#FF5B26]/10 to-transparent blur-3xl pointer-events-none rounded-[100%]" />

          {/* The Curved Arc Outline */}
          <div className="relative w-full h-20 sm:h-28 overflow-hidden flex items-end justify-center">
            <div className="w-[180%] sm:w-[130%] h-[500px] rounded-[50%] border-t-2 border-[#FF5B26]/70 dark:border-[#FF5B26] shadow-[0_-15px_50px_rgba(255,91,38,0.35)] dark:shadow-[0_-25px_70px_rgba(255,91,38,0.55)] bg-gradient-to-b from-black/5 dark:from-[#0B0C10] to-[#FAF9F6] dark:to-[#07080B]" />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. PEEKING FUTURISTIC STUDIO DASHBOARD (Exact Vetra Frame)         */}
      {/* ------------------------------------------------------------------ */}
      <section id="planner" className="relative max-w-6xl mx-auto px-4 sm:px-6 pb-24 z-20 scroll-mt-20">
        <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0E1015] shadow-2xl shadow-orange-500/5 dark:shadow-[0_25px_80px_rgba(0,0,0,0.8)] overflow-hidden transition-all backdrop-blur-xl">
          {/* Top Bar inside the Vetra Frame */}
          <div className="px-5 py-3.5 border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Vetra-style Slash Logo icon */}
              <div className="w-7 h-7 rounded-lg bg-[#FF5B26] flex items-center justify-center text-white shadow-xs">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 6h10l-2 4H2z" />
                  <path d="M10 14h10l-2 4H8z" />
                </svg>
              </div>
              <span className="font-bold text-sm text-neutral-900 dark:text-white tracking-tight">
                Gatherly Studio
              </span>
            </div>

            {/* Central Search Bar */}
            <div className="relative max-w-md w-full hidden sm:block">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search events, venues, vendors..."
                className="w-full pl-8 pr-4 py-1.5 rounded-full text-xs bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 outline-none focus:border-[#FF5B26]/50 transition-colors"
                readOnly
              />
            </div>

            {/* User Avatar & Notifications */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="p-1.5 rounded-full text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white transition-colors"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
              </button>
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                JD
              </div>
            </div>
          </div>

          {/* Main Dashboard Layout: Sidebar + Architect Workspace */}
          <div className="flex flex-col lg:flex-row">
            {/* Left Sidebar (Desktop) */}
            <div className="w-full lg:w-56 p-4 border-b lg:border-b-0 lg:border-r border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01] flex lg:flex-col justify-between gap-4">
              <div className="space-y-1 w-full flex lg:flex-col gap-1 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setSidebarActiveTab('dashboard')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    sidebarActiveTab === 'dashboard'
                      ? 'bg-[#FF5B26] text-white shadow-xs font-semibold'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">Event Architect</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSidebarActiveTab('budget')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    sidebarActiveTab === 'budget'
                      ? 'bg-[#FF5B26] text-white shadow-xs font-semibold'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">Budget Trajectory</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSidebarActiveTab('timeline')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    sidebarActiveTab === 'timeline'
                      ? 'bg-[#FF5B26] text-white shadow-xs font-semibold'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">Milestones</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSidebarActiveTab('vendors')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    sidebarActiveTab === 'vendors'
                      ? 'bg-[#FF5B26] text-white shadow-xs font-semibold'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Store className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">Vendors</span>
                </button>
              </div>

              {/* Sidebar Mini Metrics */}
              <div className="hidden lg:block p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 dark:text-neutral-400 block">
                  Studio Engine
                </span>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  <span className="w-2 h-2 rounded-full bg-[#FF5B26] animate-pulse" />
                  <span>Gemini 2.5 Flash</span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                  Adaptive budgeting & backward run of show active.
                </p>
              </div>
            </div>

            {/* Right Main Content Pane */}
            <div className="flex-1 p-5 sm:p-8">
              {sidebarActiveTab === 'dashboard' && (
                <div>
                  {/* Stepper Progress Bar */}
                  <div className="mb-8">
                    <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-4">
                      {[
                        { n: 1, label: 'Basics', detail: 'Type & Date' },
                        { n: 2, label: 'Scale & Budget', detail: 'Guests & Spend' },
                        { n: 3, label: 'Vibe & Culture', detail: 'Tone & Traditions' },
                        { n: 4, label: 'Synthesize', detail: 'Launch Plan' },
                      ].map((item) => {
                        const isActive = step === item.n;
                        const isCompleted = step > item.n;

                        return (
                          <button
                            key={item.n}
                            type="button"
                            onClick={() => handleStepClick(item.n)}
                            className={`text-left p-3 rounded-2xl border transition-all cursor-pointer group focus:outline-hidden ${
                              isActive
                                ? 'bg-orange-500/10 border-[#FF5B26] text-[#FF5B26] shadow-sm'
                                : isCompleted
                                ? 'bg-black/[0.02] dark:bg-white/[0.04] border-black/10 dark:border-white/10 text-neutral-700 dark:text-neutral-300'
                                : 'bg-transparent border-black/5 dark:border-white/5 text-neutral-400 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors ${
                                  isActive
                                    ? 'bg-[#FF5B26] text-white shadow-xs'
                                    : isCompleted
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-black/10 dark:bg-white/10 text-neutral-500'
                                }`}
                              >
                                {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : item.n}
                              </div>
                              <span className="text-xs font-semibold truncate">
                                {item.label}
                              </span>
                            </div>
                            <span className="hidden sm:block text-[11px] text-neutral-500 dark:text-neutral-400 pl-7 truncate">
                              {item.detail}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Progress Track */}
                    <div className="w-full bg-black/5 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#FF5B26] h-full transition-all duration-300 ease-out"
                        style={{ width: `${(step / 4) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Error Notification */}
                  {errorMsg && (
                    <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs sm:text-sm flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                      <span className="font-medium">{errorMsg}</span>
                    </div>
                  )}

                  {/* STEP 1: BASICS */}
                  {step === 1 && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">
                          Select Event Category
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {eventTypes.map((item) => {
                            const isSelected = onboarding.eventType === item.type;
                            return (
                              <button
                                key={item.type}
                                type="button"
                                onClick={() => setOnboardingField('eventType', item.type)}
                                className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer group ${
                                  isSelected
                                    ? 'border-[#FF5B26] bg-[#FF5B26]/10 text-neutral-900 dark:text-white shadow-xs'
                                    : 'border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] hover:border-black/20 dark:hover:border-white/20 text-neutral-700 dark:text-neutral-300'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div
                                    className={`p-2 rounded-xl ${
                                      isSelected
                                        ? 'bg-[#FF5B26] text-white'
                                        : 'bg-black/5 dark:bg-white/10 text-neutral-500 dark:text-neutral-400'
                                    }`}
                                  >
                                    {item.icon}
                                  </div>
                                  {isSelected && <div className="w-2 h-2 rounded-full bg-[#FF5B26]" />}
                                </div>
                                <div className="text-xs sm:text-sm font-semibold truncate">
                                  {item.type}
                                </div>
                                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug">
                                  {item.desc}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-2 flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-[#FF5B26]" />
                            <span>Target Event Date</span>
                          </label>
                          <input
                            type="date"
                            value={onboarding.date}
                            onChange={(e) => setOnboardingField('date', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/5 text-neutral-900 dark:text-white text-sm outline-none focus:border-[#FF5B26] transition-all font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-2 flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-[#FF5B26]" />
                            <span>Host City & Destination</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Jaipur, India or Austin, TX"
                            value={onboarding.city}
                            onChange={(e) => setOnboardingField('city', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/5 text-neutral-900 dark:text-white text-sm outline-none focus:border-[#FF5B26] transition-all font-medium"
                          />
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <span className="text-[11px] text-neutral-500">Popular:</span>
                            {popularCities.map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setOnboardingField('city', c)}
                                className={`text-[11px] px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                                  onboarding.city === c
                                    ? 'bg-[#FF5B26] text-white font-medium'
                                    : 'bg-black/5 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:bg-black/10'
                                }`}
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: GUESTS & BUDGET */}
                  {step === 2 && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                              <Users className="w-4 h-4 text-[#FF5B26]" />
                              <span>Estimated Guest Count</span>
                            </label>
                            <span className="font-mono text-xs font-bold text-[#FF5B26]">
                              {onboarding.guestCount || 0} guests
                            </span>
                          </div>

                          <input
                            type="number"
                            min="1"
                            max="5000"
                            value={onboarding.guestCount}
                            onChange={(e) => setOnboardingField('guestCount', parseInt(e.target.value, 10) || 0)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/5 text-neutral-900 dark:text-white text-base font-semibold outline-none focus:border-[#FF5B26] font-mono"
                          />

                          <input
                            type="range"
                            min="10"
                            max="600"
                            step="5"
                            value={Math.min(onboarding.guestCount, 600)}
                            onChange={(e) => setOnboardingField('guestCount', parseInt(e.target.value, 10))}
                            className="w-full accent-[#FF5B26] cursor-pointer"
                          />

                          <div className="flex flex-wrap gap-1.5">
                            {guestPresets.map((cnt) => (
                              <button
                                key={cnt}
                                type="button"
                                onClick={() => setOnboardingField('guestCount', cnt)}
                                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                                  onboarding.guestCount === cnt
                                    ? 'border-[#FF5B26] bg-[#FF5B26] text-white font-medium'
                                    : 'border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:bg-black/5'
                                }`}
                              >
                                {cnt}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                            <Wallet className="w-4 h-4 text-[#FF5B26]" />
                            <span>Currency</span>
                          </label>

                          <select
                            value={onboarding.currency}
                            onChange={(e) => setOnboardingField('currency', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/5 text-neutral-900 dark:text-white text-sm outline-none focus:border-[#FF5B26] font-medium"
                          >
                            {currencies.map((c) => (
                              <option key={c.code} value={c.code} className="bg-neutral-900 text-white">
                                {c.code} ({c.symbol}) — {c.name}
                              </option>
                            ))}
                          </select>
                          <p className="text-[11px] text-neutral-500 leading-relaxed">
                            Zero-residual calculation dynamically scales across all vendor categories.
                          </p>
                        </div>
                      </div>

                      {/* Total Financial Budget Card */}
                      <div className="p-5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-[#FF5B26]" />
                            <span>Total Financial Budget</span>
                          </label>
                          <span className="text-xs text-neutral-500">
                            Active Currency: <strong className="text-neutral-900 dark:text-white">{onboarding.currency}</strong>
                          </span>
                        </div>

                        <div className="relative flex items-center">
                          <span className="absolute left-4 font-mono font-bold text-lg text-neutral-500">
                            {currencies.find((c) => c.code === onboarding.currency)?.symbol || onboarding.currency}
                          </span>
                          <input
                            type="number"
                            step="500"
                            min="100"
                            value={onboarding.totalBudget}
                            onChange={(e) => setOnboardingField('totalBudget', parseFloat(e.target.value) || 0)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#14151B] text-neutral-900 dark:text-white text-xl font-bold font-mono outline-none focus:border-[#FF5B26] transition-all"
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-black/5 dark:border-white/5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-500">Per guest allocation:</span>
                            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/5 text-neutral-800 dark:text-neutral-200">
                              {onboarding.currency} {perGuestCost.toLocaleString()}
                            </span>
                          </div>
                          <div className="text-xs text-neutral-500 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>Includes automated 6% emergency reserve</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: VIBE & CULTURE */}
                  {step === 3 && (
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                            <Heart className="w-4 h-4 text-[#FF5B26]" />
                            <span>Aesthetic Vision & Atmosphere</span>
                          </label>
                          <span className="text-[11px] text-neutral-500">Tone & experience</span>
                        </div>
                        <textarea
                          rows={3}
                          placeholder="e.g. Candlelit regal courtyard, relaxed luxury, joyful family dancing, warm sunset cocktails"
                          value={onboarding.vibe}
                          onChange={(e) => setOnboardingField('vibe', e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/5 text-neutral-900 dark:text-white text-sm outline-none focus:border-[#FF5B26] leading-relaxed transition-all"
                        />

                        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                          <span className="text-[11px] text-neutral-500 mr-1">Inspirations:</span>
                          {vibeInspirations.map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => {
                                const current = onboarding.vibe ? `${onboarding.vibe}, ${v}` : v;
                                setOnboardingField('vibe', current);
                              }}
                              className="text-[11px] px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 hover:bg-[#FF5B26]/10 hover:text-[#FF5B26] transition-colors cursor-pointer"
                            >
                              + {v}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-2.5 flex items-center gap-1.5">
                          <Utensils className="w-4 h-4 text-[#FF5B26]" />
                          <span>Dietary & Catering Accommodations</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {commonDietary.map((d) => {
                            const active = (onboarding.dietary || []).includes(d);
                            return (
                              <button
                                key={d}
                                type="button"
                                onClick={() => handleDietaryToggle(d)}
                                className={`px-3 py-2 rounded-xl text-xs font-medium border text-left flex items-center justify-between transition-all cursor-pointer ${
                                  active
                                    ? 'border-[#FF5B26] bg-[#FF5B26]/10 text-[#FF5B26] font-semibold'
                                    : 'border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/5 text-neutral-700 dark:text-neutral-300 hover:bg-black/5'
                                }`}
                              >
                                <span className="truncate">{d}</span>
                                <div
                                  className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ml-1.5 ${
                                    active ? 'bg-[#FF5B26] text-white' : 'border border-neutral-400'
                                  }`}
                                >
                                  {active && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-2 flex items-center gap-1.5">
                          <Globe className="w-4 h-4 text-[#FF5B26]" />
                          <span>Cultural Traditions & Ceremonies</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Sangeet, Mehendi, Chuppah, Tea Ceremony, Traditional Speeches"
                          value={onboarding.culturalNeeds}
                          onChange={(e) => setOnboardingField('culturalNeeds', e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/5 text-neutral-900 dark:text-white text-sm outline-none focus:border-[#FF5B26] transition-all"
                        />
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <span className="text-[11px] text-neutral-500 mr-1">Suggested:</span>
                          {traditionPresets.map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => {
                                const cur = onboarding.culturalNeeds ? `${onboarding.culturalNeeds}, ${t}` : t;
                                setOnboardingField('culturalNeeds', cur);
                              }}
                              className="text-[11px] px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 hover:bg-[#FF5B26]/10 hover:text-[#FF5B26] transition-colors cursor-pointer"
                            >
                              + {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 4: REVIEW & LAUNCH */}
                  {step === 4 && (
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-[#FF5B26]" />
                            <span>Event Specification Summary</span>
                          </h3>
                          <span className="text-xs text-[#FF5B26] font-semibold">Ready to synthesize</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/10 dark:border-white/10">
                            <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold block mb-1">
                              Event & Date
                            </span>
                            <div className="font-semibold text-sm text-neutral-900 dark:text-white">
                              {onboarding.eventType}
                            </div>
                            <div className="text-xs text-neutral-500 mt-0.5">
                              {onboarding.date ? new Date(onboarding.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' }) : 'Date not set'}
                            </div>
                          </div>

                          <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/10 dark:border-white/10">
                            <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold block mb-1">
                              Location & Scale
                            </span>
                            <div className="font-semibold text-sm text-neutral-900 dark:text-white">
                              {onboarding.city || 'Jaipur'}
                            </div>
                            <div className="text-xs text-neutral-500 mt-0.5">
                              {onboarding.guestCount} confirmed attendees
                            </div>
                          </div>

                          <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/10 dark:border-white/10">
                            <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold block mb-1">
                              Budget Allocation
                            </span>
                            <div className="font-semibold text-sm font-mono text-neutral-900 dark:text-white">
                              {onboarding.currency} {onboarding.totalBudget.toLocaleString()}
                            </div>
                            <div className="text-xs text-neutral-500 mt-0.5">
                              ~{onboarding.currency} {perGuestCost.toLocaleString()} per attendee
                            </div>
                          </div>

                          <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/10 dark:border-white/10">
                            <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold block mb-1">
                              Atmosphere & Traditions
                            </span>
                            <div className="font-semibold text-sm text-neutral-900 dark:text-white truncate">
                              {onboarding.vibe || 'Warm celebration'}
                            </div>
                            <div className="text-xs text-neutral-500 mt-0.5 truncate">
                              {onboarding.culturalNeeds || 'Traditional celebration'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Moodboard / Inspiration Photo */}
                      <div>
                        <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5 flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4 text-[#FF5B26]" />
                          <span>Optional: Moodboard or Venue Photo</span>
                        </label>

                        <div className="border border-dashed border-black/15 dark:border-white/15 rounded-2xl p-5 text-center bg-black/[0.01] dark:bg-white/[0.02] hover:border-[#FF5B26]/50 transition-colors">
                          {imagePreview ? (
                            <div className="flex flex-col items-center">
                              <img
                                src={imagePreview}
                                alt="Mood Board Preview"
                                className="max-h-40 rounded-xl object-contain mb-3 border border-black/10 dark:border-white/10"
                              />
                              <div className="flex items-center gap-3">
                                <label className="cursor-pointer text-xs text-[#FF5B26] hover:underline font-semibold">
                                  Replace photo
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                  />
                                </label>
                                <span className="text-neutral-400">·</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setImagePreview(null);
                                    setOnboardingField('moodBoardImageBase64', undefined);
                                    setOnboardingField('moodBoardMimeType', undefined);
                                  }}
                                  className="text-xs text-red-500 hover:underline font-semibold cursor-pointer"
                                >
                                  Remove photo
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="py-2">
                              <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center mx-auto mb-2 text-[#FF5B26]">
                                <Upload className="w-5 h-5" />
                              </div>
                              <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-black/10 transition-all shadow-xs">
                                <span>Upload Inspiration Photo</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleImageUpload}
                                  className="hidden"
                                />
                              </label>
                              <p className="text-[11px] text-neutral-500 mt-2">
                                PNG, JPG, or WEBP up to 8MB
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* AI Guarantee Badge */}
                      <div className="p-3.5 rounded-2xl bg-orange-500/10 border border-[#FF5B26]/20 text-xs text-neutral-800 dark:text-neutral-200 flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-[#FF5B26] shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-semibold block mb-0.5 text-[#FF5B26]">
                            AI-Powered Event Synthesis
                          </strong>
                          Generates 8-tier budget precision, backward run-of-show timeline, and tailored vendor negotiation questions in seconds.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Wizard Bottom Controls */}
                  <div className="flex items-center justify-between pt-6 mt-8 border-t border-black/5 dark:border-white/5">
                    {step > 1 ? (
                      <button
                        type="button"
                        onClick={prevStep}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-black/10 dark:border-white/10 text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={loadDemoPlan}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 border border-black/5 dark:border-white/10 hover:bg-black/10 transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#FF5B26]" />
                        <span>Quick Demo (Jaipur Wedding)</span>
                      </button>
                    )}

                    {step < 4 ? (
                      <button
                        type="button"
                        onClick={nextStep}
                        className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#FF5B26] hover:bg-[#EA4B18] text-white text-xs sm:text-sm font-semibold shadow-md shadow-orange-500/20 active:scale-98 transition-all cursor-pointer"
                      >
                        <span>Continue</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleGeneratePlan}
                        className="inline-flex items-center gap-2 px-7 py-2.5 rounded-full bg-[#FF5B26] hover:bg-[#EA4B18] text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 active:scale-98 transition-all cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-white" />
                        <span>Launch Event Architecture</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* BUDGET TRAJECTORY TAB PREVIEW */}
              {sidebarActiveTab === 'budget' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                        Projected Budget Trajectory
                      </h3>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Dynamic 100% allocation for {onboarding.currency} {onboarding.totalBudget.toLocaleString()}
                      </p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">
                      Zero Residual
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
                      <span className="text-[11px] text-neutral-500 font-semibold block mb-1">Venue & Staging</span>
                      <div className="text-base font-bold font-mono text-neutral-900 dark:text-white">
                        {onboarding.currency} {Math.round(onboarding.totalBudget * 0.3).toLocaleString()}
                      </div>
                      <span className="text-[11px] text-[#FF5B26]">30% allocation</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
                      <span className="text-[11px] text-neutral-500 font-semibold block mb-1">Catering & Service</span>
                      <div className="text-base font-bold font-mono text-neutral-900 dark:text-white">
                        {onboarding.currency} {Math.round(onboarding.totalBudget * 0.28).toLocaleString()}
                      </div>
                      <span className="text-[11px] text-[#FF5B26]">28% allocation</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
                      <span className="text-[11px] text-neutral-500 font-semibold block mb-1">Emergency Reserve</span>
                      <div className="text-base font-bold font-mono text-neutral-900 dark:text-white">
                        {onboarding.currency} {Math.round(onboarding.totalBudget * 0.06).toLocaleString()}
                      </div>
                      <span className="text-[11px] text-emerald-500">6% contingency</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSidebarActiveTab('dashboard')}
                    className="text-xs text-[#FF5B26] hover:underline font-semibold inline-flex items-center gap-1"
                  >
                    ← Return to Architect Wizard to adjust values
                  </button>
                </div>
              )}

              {/* TIMELINE TAB PREVIEW */}
              {sidebarActiveTab === 'timeline' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                      Backward Milestone Run-of-Show
                    </h3>
                    <span className="text-xs text-neutral-500">Target: {onboarding.date || 'TBD'}</span>
                  </div>

                  <div className="space-y-2">
                    {[
                      { weeks: 'W-24', task: `Finalize venue contract & deposit in ${onboarding.city || 'target city'}` },
                      { weeks: 'W-16', task: 'Lock in master caterer & custom signature tasting' },
                      { weeks: 'W-12', task: 'Secure lead photo/video team and shot lists' },
                      { weeks: 'W-08', task: 'Send bespoke digital & print RSVP invitations' },
                      { weeks: 'W-01', task: 'Day-of logistics alignment & weather contingency protocol' },
                    ].map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-[#FF5B26]">{item.weeks}</span>
                          <span className="text-neutral-800 dark:text-neutral-200">{item.task}</span>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-neutral-400" />
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSidebarActiveTab('dashboard')}
                    className="text-xs text-[#FF5B26] hover:underline font-semibold inline-flex items-center gap-1"
                  >
                    ← Return to Architect Wizard
                  </button>
                </div>
              )}

              {/* VENDORS TAB PREVIEW */}
              {sidebarActiveTab === 'vendors' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                      Pre-Curated Vendor Negotiation Cards
                    </h3>
                    <span className="text-xs text-neutral-500">4 Categories</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {['Venue & Staging', 'Catering & Cocktails', 'Photography & Cinema', 'Florals & Production'].map((name, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold text-neutral-900 dark:text-white">
                          <span>{name}</span>
                          <span className="text-[#FF5B26]">3 Questions</span>
                        </div>
                        <p className="text-[11px] text-neutral-500">
                          Tailored checklists & day-of strike contracts ready upon generation.
                        </p>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSidebarActiveTab('dashboard')}
                    className="text-xs text-[#FF5B26] hover:underline font-semibold inline-flex items-center gap-1"
                  >
                    ← Return to Architect Wizard
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 4. THREE PRODUCT CAPABILITY SHOWCASES (Vetra-Styled)               */}
      {/* ------------------------------------------------------------------ */}
      <section id="features" className="py-20 px-4 sm:px-6 max-w-5xl mx-auto space-y-24">
        {/* Capability 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-14 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF5B26]">
              01. Zero-Residual Budgeting
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Every single dollar accounted for, down to the last cent
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              No guesswork or unexpected bills. Gatherly automatically partitions your event budget across 8 realistic tiers, always reserving an uncommitted 6% contingency cushion.
            </p>
            <div className="pt-2 flex items-center gap-4 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#FF5B26]" />
                <span>Dynamic currency scaling</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#FF5B26]" />
                <span>Live variance alerts</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-[#0E1015] border border-black/10 dark:border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
              <span className="text-xs font-bold text-neutral-900 dark:text-white">Budget Allocation Simulation</span>
              <span className="font-mono text-xs font-bold text-[#FF5B26]">100% Balanced</span>
            </div>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Venue & Production (30%)</span>
                <span className="text-neutral-800 dark:text-neutral-200">$45,000</span>
              </div>
              <div className="w-full bg-black/5 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                <div className="bg-[#FF5B26] h-full w-[30%]" />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-neutral-500">Catering & Cocktails (28%)</span>
                <span className="text-neutral-800 dark:text-neutral-200">$42,000</span>
              </div>
              <div className="w-full bg-black/5 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full w-[28%]" />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-neutral-500">Emergency Reserve (6%)</span>
                <span className="text-emerald-500 font-bold">$9,000</span>
              </div>
              <div className="w-full bg-black/5 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[6%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Capability 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-14 items-center">
          <div className="order-2 md:order-1 p-6 rounded-3xl bg-white dark:bg-[#0E1015] border border-black/10 dark:border-white/10 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
              <span className="text-xs font-bold text-neutral-900 dark:text-white">Run-of-Show Protocol</span>
              <span className="text-xs text-neutral-500">Target Date: Nov 14</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-orange-500/10 border border-[#FF5B26]/20 flex items-center justify-between">
                <span className="font-semibold text-[#FF5B26]">T-minus 8 Weeks: Formal Invitations</span>
                <Check className="w-4 h-4 text-[#FF5B26]" />
              </div>
              <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                <span>T-minus 4 Weeks: AV Soundcheck & Curfew Permits</span>
                <Clock className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                <span>Day-of 08:00: Strike Vendor Load-in Window</span>
                <Clock className="w-4 h-4 text-neutral-400" />
              </div>
            </div>
          </div>

          <div className="order-1 md:order-2 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF5B26]">
              02. Backward Milestones
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Schedules structured backwards from your celebration
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Standard to-do lists cause last-minute panic. Gatherly starts from the exact moment guests arrive and works backward week by week, ensuring vendor deadlines and permits fall into place naturally.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 5. PRICING & FAQ SECTION                                           */}
      {/* ------------------------------------------------------------------ */}
      <section id="pricing" className="py-16 px-4 sm:px-6 max-w-4xl mx-auto border-t border-black/5 dark:border-white/5">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FF5B26] block mb-2">
            Transparent Pricing
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Free to build, scale as you celebrate
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 mt-2">
            All AI architecture plans are free to synthesize and share with collaborators.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0E1015] border border-black/10 dark:border-white/10 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-neutral-900 dark:text-white">Personal Host</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold">Free Forever</span>
            </div>
            <div className="text-3xl font-bold text-neutral-900 dark:text-white font-mono">
              $0
            </div>
            <p className="text-xs text-neutral-500">
              For couples, milestone hosts, and intimate dinner party organizers.
            </p>
            <ul className="space-y-2 text-xs text-neutral-700 dark:text-neutral-300 pt-2 border-t border-black/5 dark:border-white/5">
              <li className="flex items-center gap-2">✔ Full 8-tier budget allocation</li>
              <li className="flex items-center gap-2">✔ Backward milestone scheduler</li>
              <li className="flex items-center gap-2">✔ Vetted vendor questions & scripts</li>
              <li className="flex items-center gap-2">✔ One-click printable PDF summary</li>
            </ul>
            <button
              type="button"
              onClick={scrollToPlanner}
              className="w-full py-2.5 rounded-full bg-black/5 dark:bg-white/10 text-neutral-900 dark:text-white hover:bg-black/10 text-xs font-semibold transition-all cursor-pointer"
            >
              Start Free Plan
            </button>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-[#0E1015] border-2 border-[#FF5B26] shadow-xl relative space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-neutral-900 dark:text-white">Professional Studio</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FF5B26] text-white font-bold">Most Popular</span>
            </div>
            <div className="text-3xl font-bold text-neutral-900 dark:text-white font-mono">
              $29 <span className="text-xs text-neutral-500 font-normal">/ month</span>
            </div>
            <p className="text-xs text-neutral-500">
              For event planners, wedding agencies, and corporate coordinators.
            </p>
            <ul className="space-y-2 text-xs text-neutral-700 dark:text-neutral-300 pt-2 border-t border-black/5 dark:border-white/5">
              <li className="flex items-center gap-2">✔ Unlimited active event plans</li>
              <li className="flex items-center gap-2">✔ Live client collaboration links</li>
              <li className="flex items-center gap-2">✔ Custom branding & PDF exports</li>
              <li className="flex items-center gap-2">✔ Priority Gemini 2.5 Flash pipeline</li>
            </ul>
            <button
              type="button"
              onClick={scrollToPlanner}
              className="w-full py-2.5 rounded-full bg-[#FF5B26] hover:bg-[#EA4B18] text-white text-xs font-semibold shadow-md shadow-orange-500/25 transition-all cursor-pointer"
            >
              Get Started with Studio
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 6. BOTTOM CTA HORIZON MONOLITH                                     */}
      {/* ------------------------------------------------------------------ */}
      <section id="contact" className="py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-b from-[#14151B] to-[#07080B] border border-white/10 p-8 sm:p-14 text-white shadow-2xl relative overflow-hidden text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-[#FF5B26]/20 blur-[100px] pointer-events-none rounded-full" />
          
          <div className="relative z-10 max-w-xl">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">
              Ready to orchestrate your next unforgettable event?
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-neutral-400">
              Join thousands of creators turning ideas into polished, coordinated celebrations.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={scrollToPlanner}
              className="px-6 py-3 rounded-full bg-[#FF5B26] hover:bg-[#EA4B18] text-white font-semibold text-xs sm:text-sm shadow-lg shadow-orange-500/30 active:scale-98 transition-all cursor-pointer whitespace-nowrap"
            >
              Get started for free
            </button>
            <button
              type="button"
              onClick={loadDemoPlan}
              className="px-5 py-3 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-white font-medium text-xs sm:text-sm backdrop-blur-md transition-all cursor-pointer whitespace-nowrap"
            >
              Load Demo Plan
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 7. MINIMALIST FOOTER                                               */}
      {/* ------------------------------------------------------------------ */}
      <footer className="py-10 px-4 sm:px-8 border-t border-black/5 dark:border-white/5 text-xs text-neutral-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <Logo size={24} />
            <span className="font-bold text-neutral-900 dark:text-white text-sm">Gatherly</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <a href="#features" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Pricing</a>
            <a href="#contact" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Contact</a>
            <button
              type="button"
              onClick={loadDemoPlan}
              className="hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Demo Event
            </button>
          </div>

          <div className="text-[11px] text-neutral-400">
            © 2026 Gatherly Inc. · All rights reserved.
          </div>
        </div>
      </footer>

      {/* ------------------------------------------------------------------ */}
      {/* 8. INTERACTIVE DEMO MODAL                                          */}
      {/* ------------------------------------------------------------------ */}
      {isDemoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#0E1015] border border-black/10 dark:border-white/10 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#FF5B26] text-white flex items-center justify-center text-xs font-bold">
                  ▶
                </div>
                <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                  Gatherly Studio Walkthrough
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDemoModalOpen(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition-colors"
                aria-label="Close demo modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-neutral-600 dark:text-neutral-300">
              <p>
                Experience an end-to-end event plan created with Gatherly’s AI architecture engine.
              </p>
              <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-2">
                <div className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FF5B26]" />
                  <span>Sample: Royal Jaipur Destination Wedding</span>
                </div>
                <div className="text-[11px] text-neutral-500">
                  Includes 150 guests, ₹1,500,000 budget, 8 vendor contracts, Sangeet & Mehendi rituals, and backward timeline.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/5 dark:border-white/5">
              <button
                type="button"
                onClick={() => setIsDemoModalOpen(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDemoModalOpen(false);
                  loadDemoPlan();
                }}
                className="px-5 py-2 rounded-full bg-[#FF5B26] hover:bg-[#EA4B18] text-white text-xs font-semibold shadow-md shadow-orange-500/25 transition-all cursor-pointer"
              >
                Launch Jaipur Demo Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
