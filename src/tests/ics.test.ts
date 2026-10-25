import { describe, it, expect } from 'vitest';
import {
  formatIcsDateTime,
  calculateTaskDate,
  escapeIcsText,
  generateIcsContent,
} from '../lib/ics';
import { TimelineItem } from '../lib/schema';

describe('iCalendar (.ics) Generator', () => {
  it('formats Date into valid iCalendar UTC format', () => {
    const testDate = new Date('2026-12-25T10:30:00Z');
    const formatted = formatIcsDateTime(testDate);
    expect(formatted).toBe('20261225T103000Z');
  });

  it('calculates task date by subtracting weeks before', () => {
    const eventDate = '2026-10-20T00:00:00Z';
    const twoWeeksBefore = calculateTaskDate(eventDate, 2);
    const expectedTime = new Date('2026-10-06T10:00:00Z').getTime();
    expect(twoWeeksBefore.getTime()).toBe(expectedTime);
  });

  it('escapes special characters correctly for iCal format', () => {
    const raw = 'Meeting, with John; & family\nNotes';
    const escaped = escapeIcsText(raw);
    expect(escaped).toBe('Meeting\\, with John\\; & family\\nNotes');
  });

  it('generates standard compliant .ics text with VCALENDAR and VALARM', () => {
    const tasks: TimelineItem[] = [
      { id: '1', weeksBefore: 4, task: 'Book Wedding Caterer', category: 'Catering', done: false },
      { id: '2', weeksBefore: 0, task: 'Morning Ceremony Walkthrough', category: 'Event Day', done: true },
    ];

    const ics = generateIcsContent('Aarav & Meera Wedding', '2026-12-15', 'Jaipur', tasks);

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('PRODID:-//Gatherly//Event Planner//EN');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('SUMMARY:[Catering] Book Wedding Caterer');
    expect(ics).toContain('BEGIN:VALARM');
    expect(ics).toContain('TRIGGER:-PT12H');
    expect(ics).toContain('END:VALARM');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('END:VCALENDAR');
  });
});
