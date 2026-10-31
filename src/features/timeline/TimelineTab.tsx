import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Plus,
  ListFilter,
  Check,
} from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore';
import { downloadIcsFile, calculateTaskDate } from '../../lib/ics';
import { TimelineItem } from '../../lib/schema';

export const TimelineTab: React.FC = () => {
  const { plan, onboarding, toggleTimelineDone, addTimelineItem } = usePlanStore();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'completed'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('General');
  const [newTaskWeeks, setNewTaskWeeks] = useState<number>(4);

  if (!plan) return null;

  const eventDate = new Date(onboarding.date || Date.now());
  const now = new Date();
  const diffDays = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const currentWeeksBefore = Math.max(0, Math.floor(diffDays / 7));

  const isTaskOverdue = (task: TimelineItem): boolean => {
    if (task.done) return false;
    return task.weeksBefore > currentWeeksBefore;
  };

  const filteredTimeline = useMemo(() => {
    return plan.timeline.filter((task) => {
      if (filterMode === 'pending') return !task.done;
      if (filterMode === 'completed') return task.done;
      return true;
    });
  }, [plan.timeline, filterMode]);

  const groupedStages = useMemo(() => {
    const groups: { title: string; subtitle: string; tasks: { item: TimelineItem; originalIndex: number }[] }[] = [
      { title: '20+ Weeks Out', subtitle: 'Foundation & Venue Booking', tasks: [] },
      { title: '12 – 19 Weeks Out', subtitle: 'Key Vendors & Tastings', tasks: [] },
      { title: '6 – 11 Weeks Out', subtitle: 'Attire & Guest Invites', tasks: [] },
      { title: '2 – 5 Weeks Out', subtitle: 'Final Headcount & Details', tasks: [] },
      { title: 'Week of Event', subtitle: 'Rehearsals & Event Day', tasks: [] },
    ];

    plan.timeline.forEach((item, originalIndex) => {
      if (filterMode === 'pending' && item.done) return;
      if (filterMode === 'completed' && !item.done) return;

      const w = item.weeksBefore;
      if (w >= 20) {
        groups[0].tasks.push({ item, originalIndex });
      } else if (w >= 12) {
        groups[1].tasks.push({ item, originalIndex });
      } else if (w >= 6) {
        groups[2].tasks.push({ item, originalIndex });
      } else if (w >= 2) {
        groups[3].tasks.push({ item, originalIndex });
      } else {
        groups[4].tasks.push({ item, originalIndex });
      }
    });

    return groups.filter((g) => g.tasks.length > 0);
  }, [plan.timeline, filterMode]);

  const totalTasks = plan.timeline.length;
  const completedTasks = plan.timeline.filter((t) => t.done).length;
  const overdueCount = plan.timeline.filter((t) => isTaskOverdue(t)).length;

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    addTimelineItem({
      task: newTaskTitle.trim(),
      category: newTaskCategory.trim() || 'General',
      weeksBefore: Number(newTaskWeeks) || 0,
      done: false,
    });
    setNewTaskTitle('');
    setIsAddModalOpen(false);
  };

  const handleExportIcs = () => {
    downloadIcsFile(plan.title, onboarding.date, onboarding.city, plan.timeline);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#37352F] dark:text-[#D4D4D4]">
            Planning Timeline & Milestones
          </h2>
          <p className="text-[#787774] text-xs sm:text-sm mt-0.5">
            Backward lead times with reminders and iCalendar (.ics) integration.
          </p>
        </div>

        {/* Action Buttons in Notion Style */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E9E9E7] dark:border-[#2E2E2E] bg-[#FFFFFF] dark:bg-[#202020] hover:bg-[#EFEFED] dark:hover:bg-[#2C2C2C] text-[#37352F] dark:text-[#D4D4D4] text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>

          <button
            onClick={handleExportIcs}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#FF5B26] hover:bg-[#EA4B18] text-white text-xs font-medium transition-colors shadow-2xs active:scale-98"
            title="Download iCalendar (.ics) file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export .ics Calendar</span>
          </button>
        </div>
      </div>

      {/* Notion Database Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-lg bg-[#FFFFFF] dark:bg-[#202020] border border-[#E9E9E7] dark:border-[#2E2E2E] flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] text-[#787774] font-medium uppercase tracking-wider">Completion Rate</span>
            <div className="text-lg font-bold font-serif text-[#37352F] dark:text-[#D4D4D4]">
              {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
            </div>
          </div>
          <div className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-[#DBEDDB] dark:bg-[#243D30] text-[#1C3829] dark:text-[#86C19F]">
            {completedTasks}/{totalTasks}
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-[#FFFFFF] dark:bg-[#202020] border border-[#E9E9E7] dark:border-[#2E2E2E] flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] text-[#787774] font-medium uppercase tracking-wider">Current Pace</span>
            <div className="text-lg font-bold font-serif text-[#37352F] dark:text-[#D4D4D4]">
              {currentWeeksBefore} weeks out
            </div>
          </div>
          <Clock className="w-4 h-4 text-[#787774]" />
        </div>

        <div className="p-3.5 rounded-lg bg-[#FFFFFF] dark:bg-[#202020] border border-[#E9E9E7] dark:border-[#2E2E2E] flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] text-[#787774] font-medium uppercase tracking-wider">Overdue Lead Times</span>
            <div className={`text-lg font-bold font-serif ${overdueCount > 0 ? 'text-[#EB5757]' : 'text-[#37352F] dark:text-[#D4D4D4]'}`}>
              {overdueCount} {overdueCount === 1 ? 'task' : 'tasks'}
            </div>
          </div>
          <AlertCircle className={`w-4 h-4 ${overdueCount > 0 ? 'text-[#EB5757]' : 'text-[#787774]'}`} />
        </div>
      </div>

      {/* View Switcher and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#FFFFFF] dark:bg-[#202020] border border-[#E9E9E7] dark:border-[#2E2E2E] rounded-md p-2 shadow-2xs">
        <div className="flex items-center gap-1 bg-[#F7F6F3] dark:bg-[#191919] p-0.5 rounded-md">
          <button
            onClick={() => setViewMode('list')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-[#FFFFFF] dark:bg-[#2C2C2C] text-[#37352F] dark:text-white shadow-2xs font-semibold'
                : 'text-[#787774]'
            }`}
          >
            Milestone Groups
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'calendar'
                ? 'bg-[#FFFFFF] dark:bg-[#2C2C2C] text-[#37352F] dark:text-white shadow-2xs font-semibold'
                : 'text-[#787774]'
            }`}
          >
            Calendar Schedule
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1">
          <ListFilter className="w-3.5 h-3.5 text-[#787774]" />
          {(['all', 'pending', 'completed'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setFilterMode(m)}
              className={`px-2 py-0.5 rounded text-xs capitalize transition-colors ${
                filterMode === m
                  ? 'bg-[#E3E2E0] dark:bg-[#2F2F2F] text-[#37352F] dark:text-white font-semibold'
                  : 'text-[#787774] hover:bg-[#EFEFED] dark:hover:bg-[#2A2A2A]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* View: Milestone Groups */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {groupedStages.map((stage, sIdx) => (
            <div
              key={sIdx}
              className="bg-[#FFFFFF] dark:bg-[#202020] border border-[#E9E9E7] dark:border-[#2E2E2E] rounded-lg p-5 shadow-2xs"
            >
              <div className="flex items-center justify-between border-b border-[#E9E9E7] dark:border-[#2E2E2E] pb-2.5 mb-3">
                <div>
                  <h3 className="text-base font-serif font-bold text-[#37352F] dark:text-[#D4D4D4]">
                    {stage.title}
                  </h3>
                  <p className="text-xs text-[#787774]">
                    {stage.subtitle}
                  </p>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#F7F6F3] dark:bg-[#252525] border border-[#E9E9E7] dark:border-[#2E2E2E] text-[#787774]">
                  {stage.tasks.filter((t) => t.item.done).length}/{stage.tasks.length} Done
                </span>
              </div>

              {/* Tasks Checklist with Notion To-Do Feel */}
              <div className="space-y-1">
                {stage.tasks.map(({ item, originalIndex }) => {
                  const overdue = isTaskOverdue(item);
                  const taskTargetDate = calculateTaskDate(onboarding.date, item.weeksBefore);

                  return (
                    <div
                      key={item.id || originalIndex}
                      onClick={() => toggleTimelineDone(originalIndex)}
                      className={`flex items-start gap-2.5 p-2 rounded-md transition-colors cursor-pointer ${
                        item.done
                          ? 'opacity-60 bg-transparent'
                          : overdue
                          ? 'bg-[#FFE2DD]/30 dark:bg-[#4D2322]/20 hover:bg-[#FFE2DD]/50'
                          : 'hover:bg-[#F7F6F3] dark:hover:bg-[#252525]'
                      }`}
                    >
                      {/* Notion Square Checkbox */}
                      <button
                        type="button"
                        className={`w-4 h-4 rounded border flex items-center justify-center mt-0.5 transition-colors shrink-0 ${
                          item.done
                            ? 'bg-[#FF5B26] border-[#FF5B26] text-white'
                            : 'border-[#787774]/50 dark:border-[#787774] hover:border-[#37352F]'
                        }`}
                      >
                        {item.done && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-xs sm:text-sm ${
                              item.done
                                ? 'line-through text-[#787774]'
                                : 'text-[#37352F] dark:text-[#D4D4D4]'
                            }`}
                          >
                            {item.task}
                          </span>

                          {overdue && (
                            <span className="px-1.5 py-0.2 rounded bg-[#FFE2DD] dark:bg-[#4D2322] text-[#5D1715] dark:text-[#F3958F] text-[10px] font-medium uppercase tracking-wider">
                              Overdue
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#787774] mt-0.5">
                          <span className="font-medium text-[#787774]">
                            {item.category}
                          </span>
                          <span>•</span>
                          <span>
                            Target:{' '}
                            {taskTargetDate.toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <span>•</span>
                          <span>
                            {item.weeksBefore === 0
                              ? 'Event Week'
                              : `${item.weeksBefore}w before`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View: Calendar Schedule */}
      {viewMode === 'calendar' && (
        <div className="bg-[#FFFFFF] dark:bg-[#202020] border border-[#E9E9E7] dark:border-[#2E2E2E] rounded-lg p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E9E9E7] dark:border-[#2E2E2E] pb-3">
            <h3 className="text-base font-serif font-bold text-[#37352F] dark:text-[#D4D4D4]">
              Chronological Schedule
            </h3>
            <span className="text-xs text-[#787774]">
              Ordered by Target Date
            </span>
          </div>

          <div className="space-y-2">
            {filteredTimeline
              .map((item, originalIndex) => ({
                item,
                originalIndex,
                date: calculateTaskDate(onboarding.date, item.weeksBefore),
              }))
              .sort((a, b) => a.date.getTime() - b.date.getTime())
              .map(({ item, originalIndex, date }, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-md border border-[#E9E9E7] dark:border-[#2E2E2E] hover:bg-[#F7F6F3] dark:hover:bg-[#252525] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 text-center bg-[#F7F6F3] dark:bg-[#191919] p-1 rounded border border-[#E9E9E7] dark:border-[#2E2E2E]">
                      <span className="block text-[9px] uppercase font-semibold text-[#787774]">
                        {date.toLocaleDateString(undefined, { month: 'short' })}
                      </span>
                      <span className="block text-sm font-bold font-mono text-[#37352F] dark:text-[#D4D4D4]">
                        {date.getDate()}
                      </span>
                    </div>

                    <div>
                      <h4 className={`text-xs sm:text-sm font-medium ${item.done ? 'line-through text-[#787774]' : 'text-[#37352F] dark:text-[#D4D4D4]'}`}>
                        {item.task}
                      </h4>
                      <span className="text-[11px] text-[#787774]">
                        {item.category} • {item.weeksBefore === 0 ? 'Event Week' : `${item.weeksBefore}w before`}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleTimelineDone(originalIndex)}
                    className={`text-xs px-2.5 py-1 rounded transition-colors ${
                      item.done
                        ? 'bg-[#DBEDDB] dark:bg-[#243D30] text-[#1C3829] dark:text-[#86C19F]'
                        : 'bg-[#F7F6F3] dark:bg-[#252525] border border-[#E9E9E7] dark:border-[#2E2E2E] text-[#37352F] dark:text-[#D4D4D4] hover:bg-[#EFEFED]'
                    }`}
                  >
                    {item.done ? 'Completed' : 'Mark Done'}
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="bg-[#FFFFFF] dark:bg-[#202020] border border-[#E9E9E7] dark:border-[#2E2E2E] rounded-lg p-6 max-w-md w-full shadow-lg">
            <h3 className="text-lg font-serif font-bold text-[#37352F] dark:text-[#D4D4D4] mb-3">
              Add New Planning Task
            </h3>
            <form onSubmit={handleAddTask} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#787774] mb-1">
                  Task Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule venue walkthrough"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-[#E9E9E7] dark:border-[#2E2E2E] bg-[#FFFFFF] dark:bg-[#191919] text-xs sm:text-sm text-[#37352F] dark:text-white focus:border-[#FF5B26] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-[#787774] mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-[#E9E9E7] dark:border-[#2E2E2E] bg-[#FFFFFF] dark:bg-[#191919] text-xs text-[#37352F] dark:text-white focus:border-[#FF5B26] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#787774] mb-1">
                    Weeks Prior
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="52"
                    value={newTaskWeeks}
                    onChange={(e) => setNewTaskWeeks(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-1.5 rounded-md border border-[#E9E9E7] dark:border-[#2E2E2E] bg-[#FFFFFF] dark:bg-[#191919] text-xs text-[#37352F] dark:text-white focus:border-[#FF5B26] focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E9E9E7] dark:border-[#2E2E2E]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-[#787774] hover:bg-[#EFEFED] dark:hover:bg-[#2C2C2C]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-[#FF5B26] hover:bg-[#EA4B18] text-white text-xs font-medium shadow-2xs"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
