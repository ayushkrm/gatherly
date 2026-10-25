import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquareText,
  X,
  Send,
  Sparkles,
  Undo2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore';
import { EventPlan } from '../../lib/schema';
import { LogoMark } from '../../components/Logo';

export const RefineChatPanel: React.FC = () => {
  const {
    plan,
    isChatOpen,
    setIsChatOpen,
    chatMessages,
    addChatMessage,
    applyAssistantToolAction,
    undoLastAssistantAction,
    diffHistory,
  } = usePlanStore();

  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isChatOpen) {
      scrollToBottom();
    }
  }, [chatMessages, isChatOpen]);

  if (!isChatOpen) return null;

  const quickPrompts = [
    'Add $500 to Catering for live chaat counter',
    'Add task: Book bridal makeup trial 6 weeks prior',
    'Add vendor checklist to Venue: check noise curfew',
    'Remove the first idea card',
  ];

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || !plan) return;

    // Add user message to store
    addChatMessage({
      role: 'user',
      content: textToSend,
    });
    setInput('');
    setIsSending(true);

    try {
      // Send concise plan summary to optimize efficiency
      const planSummary = {
        title: plan.title,
        budgetCategories: plan.budget.map((b) => ({ category: b.category, amount: b.amount, percent: b.percent })),
        timelineCount: plan.timeline.length,
        vendorCategories: plan.vendors.map((v) => v.category),
        ideas: plan.ideas.map((i) => i.title),
      };

      const res = await fetch('/api/chat/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          planSummary,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Assistant failed to respond');
      }

      // Check for tool calls
      if (data.toolCalls && data.toolCalls.length > 0) {
        let currentPlan: EventPlan = JSON.parse(JSON.stringify(plan));
        const diffSummaries: string[] = [];

        for (const tc of data.toolCalls) {
          if (tc.name === 'updateBudget') {
            const { category, newAmount, reason } = tc.args;
            let found = false;
            currentPlan.budget = currentPlan.budget.map((b) => {
              if (b.category.toLowerCase().includes(category.toLowerCase())) {
                found = true;
                const oldAmt = b.amount;
                diffSummaries.push(`Updated ${b.category} budget from ${oldAmt} to ${newAmount}${reason ? ` (${reason})` : ''}`);
                return { ...b, amount: Number(newAmount) || b.amount };
              }
              return b;
            });
            if (!found) {
              currentPlan.budget.push({
                category,
                amount: Number(newAmount) || 1000,
                percent: 5,
                priority: 'should',
                tip: reason || '',
                actualSpent: 0,
              });
              diffSummaries.push(`Added new budget category: ${category} (${newAmount})`);
            }
          } else if (tc.name === 'addTimelineTask') {
            const { task, weeksBefore, category } = tc.args;
            currentPlan.timeline.push({
              id: `t-chat-${Date.now()}`,
              task,
              weeksBefore: Number(weeksBefore) || 0,
              category: category || 'General',
              done: false,
            });
            currentPlan.timeline.sort((a, b) => b.weeksBefore - a.weeksBefore);
            diffSummaries.push(`Added timeline milestone: "${task}" (${weeksBefore}w before event)`);
          } else if (tc.name === 'addVendorItem') {
            const { category, item, type } = tc.args;
            let matched = false;
            currentPlan.vendors = currentPlan.vendors.map((v) => {
              if (v.category.toLowerCase().includes(category.toLowerCase())) {
                matched = true;
                if (type === 'question') {
                  return { ...v, questionsToAsk: [...v.questionsToAsk, item] };
                } else {
                  return { ...v, checklist: [...v.checklist, item] };
                }
              }
              return v;
            });
            if (!matched) {
              currentPlan.vendors.push({
                category,
                checklist: type === 'checklist' ? [item] : [],
                questionsToAsk: type === 'question' ? [item] : [],
                estimatedCost: 0,
                booked: false,
              });
            }
            diffSummaries.push(`Added ${type || 'item'} to ${category}: "${item}"`);
          } else if (tc.name === 'removeIdea') {
            const { ideaTitle } = tc.args;
            currentPlan.ideas = currentPlan.ideas.filter(
              (i) => !i.title.toLowerCase().includes(ideaTitle.toLowerCase())
            );
            diffSummaries.push(`Removed idea: "${ideaTitle}"`);
          }
        }

        const combinedDiff = diffSummaries.join('; ');
        applyAssistantToolAction(combinedDiff, currentPlan);
      } else if (data.reply) {
        addChatMessage({
          role: 'assistant',
          content: data.reply,
        });
      }
    } catch (err: any) {
      console.error(err);
      addChatMessage({
        role: 'system',
        content: `Error: ${err.message || 'Could not process request.'}`,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-[#FFFFFF] dark:bg-[#1E1E1E] border-l border-[#E9E9E7] dark:border-[#2E2E2E] shadow-xl flex flex-col transition-all duration-300">
      {/* Top Header */}
      <div className="p-3.5 border-b border-[#E9E9E7] dark:border-[#2E2E2E] flex items-center justify-between bg-[#FBFBFA] dark:bg-[#1E1E1E]">
        <div className="flex items-center gap-2">
          <LogoMark size={24} />
          <div>
            <h3 className="text-xs font-serif font-bold text-[#37352F] dark:text-[#D4D4D4]">
              Gatherly Assistant
            </h3>
            <span className="text-[10px] text-[#27AE60] font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#27AE60] animate-pulse" />
              Live Function Calling
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {diffHistory.length > 0 && (
            <button
              onClick={() => undoLastAssistantAction()}
              className="p-1 rounded-md text-[#787774] hover:bg-[#EFEFED] dark:hover:bg-[#2C2C2C] text-xs flex items-center gap-1 font-medium"
              title="Undo last assistant state edit"
            >
              <Undo2 className="w-3.5 h-3.5 text-[#EB5757]" />
              <span className="text-[10px]">Undo</span>
            </button>
          )}

          <button
            onClick={() => setIsChatOpen(false)}
            className="p-1 rounded-md text-[#787774] hover:text-[#37352F] dark:hover:text-white hover:bg-[#EFEFED] dark:hover:bg-[#2C2C2C]"
            aria-label="Close Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[88%] rounded-md p-3 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#2383E2] text-white font-medium'
                  : msg.role === 'system'
                  ? 'bg-[#FFE2DD] dark:bg-[#4D2322] text-[#49201C] dark:text-[#F3958F] border border-[#F3958F]'
                  : 'bg-[#F7F6F3] dark:bg-[#252525] text-[#37352F] dark:text-[#D4D4D4] border border-[#E9E9E7] dark:border-[#2E2E2E]'
              }`}
            >
              {msg.diffSummary && (
                <div className="mb-2 p-1.5 rounded bg-[#DBEDDB] dark:bg-[#243D30] border border-[#86C19F] text-[#1C3829] dark:text-[#86C19F] text-[11px] font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#27AE60] shrink-0" />
                  <span>State Modified: {msg.diffSummary}</span>
                </div>
              )}
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
            <span className="text-[10px] text-[#787774] mt-1 px-1 font-mono">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {isSending && (
          <div className="flex items-center gap-2 text-[#787774] text-xs italic p-1">
            <div className="w-3.5 h-3.5 border-2 border-[#2383E2] border-t-transparent rounded-full animate-spin" />
            <span>Assistant is evaluating function calling tools...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggested Prompts */}
      <div className="p-2.5 border-t border-[#E9E9E7] dark:border-[#2E2E2E] bg-[#FBFBFA] dark:bg-[#1E1E1E]">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#787774] block mb-1">
          Suggested Actions:
        </span>
        <div className="flex flex-wrap gap-1">
          {quickPrompts.map((qp, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(qp)}
              className="px-2 py-0.5 rounded bg-[#FFFFFF] dark:bg-[#252525] border border-[#E9E9E7] dark:border-[#2E2E2E] text-[11px] text-[#37352F] dark:text-[#D4D4D4] hover:bg-[#EFEFED] dark:hover:bg-[#2C2C2C] transition text-left truncate max-w-[260px]"
            >
              {qp}
            </button>
          ))}
        </div>
      </div>

      {/* Input Bar */}
      <div className="p-2.5 border-t border-[#E9E9E7] dark:border-[#2E2E2E]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-1.5"
        >
          <input
            type="text"
            placeholder="Tell assistant to adjust plan..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isSending}
            className="flex-1 px-3 py-1.5 rounded-md border border-[#E9E9E7] dark:border-[#2E2E2E] bg-[#FFFFFF] dark:bg-[#191919] text-xs text-[#37352F] dark:text-white focus:border-[#2383E2] focus:outline-hidden"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="p-2 rounded-md bg-[#2383E2] hover:bg-[#0B6FCC] text-white disabled:opacity-40 transition-colors shadow-2xs"
            aria-label="Send message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
