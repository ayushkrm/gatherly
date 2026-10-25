import { TimelineItem } from './schema';

/**
 * Formats a Date object into iCalendar UTC/Local date-time string YYYYMMDDTHHMMSSZ
 */
export function formatIcsDateTime(date: Date): string {
  const pad = (n: number) => (n < 10 ? '0' + n : String(n));
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Calculates task target date based on event date minus weeksBefore
 */
export function calculateTaskDate(eventDateStr: string, weeksBefore: number): Date {
  const base = new Date(eventDateStr || Date.now());
  if (isNaN(base.getTime())) {
    return new Date();
  }
  const taskDate = new Date(base.getTime() - weeksBefore * 7 * 24 * 60 * 60 * 1000);
  // Set default time to 10:00 AM UTC
  taskDate.setUTCHours(10, 0, 0, 0);
  return taskDate;
}

/**
 * Escapes characters for iCalendar format
 */
export function escapeIcsText(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generates an iCalendar (.ics) string with reminders (VALARM)
 */
export function generateIcsContent(
  eventTitle: string,
  eventDateStr: string,
  city: string,
  timeline: TimelineItem[]
): string {
  const now = new Date();
  const dtstamp = formatIcsDateTime(now);
  const safeEventDate = new Date(eventDateStr || Date.now());
  const mainEventStart = isNaN(safeEventDate.getTime()) ? now : safeEventDate;
  mainEventStart.setUTCHours(12, 0, 0, 0);
  const mainEventEnd = new Date(mainEventStart.getTime() + 6 * 60 * 60 * 1000); // +6 hours

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Gatherly//Event Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(eventTitle)} Planning Timeline`,
    'X-WR-TIMEZONE:UTC',
  ];

  // Main Milestone Event
  const mainUid = `gatherly-main-${Date.now()}@gatherly.app`;
  lines.push(
    'BEGIN:VEVENT',
    `UID:${mainUid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${formatIcsDateTime(mainEventStart)}`,
    `DTEND:${formatIcsDateTime(mainEventEnd)}`,
    `SUMMARY:🎉 ${escapeIcsText(eventTitle)} - EVENT DAY`,
    `DESCRIPTION:${escapeIcsText(`The big day has arrived in ${city}! Everything you planned with Gatherly.`)}`,
    `LOCATION:${escapeIcsText(city)}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: Tomorrow is ${escapeIcsText(eventTitle)}!`,
    'END:VALARM',
    'END:VEVENT'
  );

  // Timeline Tasks
  timeline.forEach((item, index) => {
    const taskDate = calculateTaskDate(eventDateStr, item.weeksBefore);
    const taskEnd = new Date(taskDate.getTime() + 60 * 60 * 1000); // 1 hour duration
    const uid = `gatherly-task-${item.id || index}-${item.weeksBefore}w@gatherly.app`;
    const leadTimeStr = item.weeksBefore === 0 ? 'Event Week' : `${item.weeksBefore} weeks before event`;

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${formatIcsDateTime(taskDate)}`,
      `DTEND:${formatIcsDateTime(taskEnd)}`,
      `SUMMARY:[${escapeIcsText(item.category)}] ${escapeIcsText(item.task)}`,
      `DESCRIPTION:${escapeIcsText(`Category: ${item.category}\nTarget: ${leadTimeStr}\nStatus: ${item.done ? 'Done' : 'Pending'}`)}`,
      `STATUS:${item.done ? 'COMPLETED' : 'CONFIRMED'}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT12H',
      'ACTION:DISPLAY',
      `DESCRIPTION:Gatherly Reminder: ${escapeIcsText(item.task)}`,
      'END:VALARM',
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Triggers client-side browser download of .ics file
 */
export function downloadIcsFile(
  eventTitle: string,
  eventDateStr: string,
  city: string,
  timeline: TimelineItem[]
): void {
  const content = generateIcsContent(eventTitle, eventDateStr, city, timeline);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeFilename = (eventTitle || 'event').toLowerCase().replace(/[^a-z0-9]/g, '-');
  a.download = `${safeFilename}-timeline.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
