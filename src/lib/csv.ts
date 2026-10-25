import { Guest, GuestRsvpStatus } from './schema';

/**
 * Splits a single CSV row handling quoted fields with internal commas
 */
export function splitCsvRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parses CSV string into an array of Guest objects
 */
export function parseGuestCsv(csvText: string): { guests: Guest[]; errors: string[] } {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return { guests: [], errors: ['CSV must contain a header row and at least one guest entry.'] };
  }

  const rawHeaders = splitCsvRow(lines[0]);
  const headers = rawHeaders.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

  const nameIdx = headers.findIndex((h) => h.includes('name'));
  const emailIdx = headers.findIndex((h) => h.includes('email'));
  const phoneIdx = headers.findIndex((h) => h.includes('phone') || h.includes('mobile'));
  const rsvpIdx = headers.findIndex((h) => h.includes('rsvp') || h.includes('status'));
  const dietaryIdx = headers.findIndex((h) => h.includes('diet') || h.includes('food') || h.includes('allergy'));
  const groupIdx = headers.findIndex((h) => h.includes('group') || h.includes('side') || h.includes('table'));
  const plusOneIdx = headers.findIndex((h) => h.includes('plus') || h.includes('guest'));

  if (nameIdx === -1) {
    return { guests: [], errors: ['Missing required column: "Name" (e.g., Name, Full Name).'] };
  }

  const guests: Guest[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitCsvRow(lines[i]);
    const name = values[nameIdx];
    if (!name) {
      continue; // Skip blank guest rows
    }

    const email = emailIdx !== -1 && values[emailIdx] ? values[emailIdx] : '';
    const phone = phoneIdx !== -1 && values[phoneIdx] ? values[phoneIdx] : '';
    
    // Parse RSVP status
    let rsvp: GuestRsvpStatus = 'pending';
    if (rsvpIdx !== -1 && values[rsvpIdx]) {
      const val = values[rsvpIdx].toLowerCase();
      if (val.includes('yes') || val.includes('attend') || val.includes('confirm')) {
        rsvp = 'attending';
      } else if (val.includes('no') || val.includes('decline') || val.includes('reject')) {
        rsvp = 'declined';
      }
    }

    // Parse dietary tags
    let dietary: string[] = [];
    if (dietaryIdx !== -1 && values[dietaryIdx]) {
      dietary = values[dietaryIdx]
        .split(/[,;/]/)
        .map((d) => d.trim())
        .filter((d) => d.length > 0 && d.toLowerCase() !== 'none' && d.toLowerCase() !== 'n/a');
    }

    // Parse plus one
    let plusOne = false;
    if (plusOneIdx !== -1 && values[plusOneIdx]) {
      const pVal = values[plusOneIdx].toLowerCase();
      plusOne = pVal === 'true' || pVal === '1' || pVal === 'yes' || pVal === '+1';
    }

    const group = groupIdx !== -1 && values[groupIdx] ? values[groupIdx] : 'General';

    guests.push({
      id: `guest-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      email,
      phone,
      rsvp,
      plusOne,
      dietary,
      group,
    });
  }

  return { guests, errors };
}

/**
 * Generates sample CSV template string
 */
export function getSampleGuestCsv(): string {
  return [
    'Name,Email,Phone,RSVP,Dietary,Group,PlusOne',
    'Rohan Sharma,rohan@example.com,+91 98765 43210,attending,"Vegetarian, Nut-Free",Groom Family,true',
    'Ananya Patel,ananya@example.com,+91 98765 43211,attending,Vegan,Bride Friends,false',
    'Vikram Mehta,vikram@example.com,,pending,Jain,College Friends,true',
    'Pooja Nair,pooja@example.com,+91 98765 43212,declined,Gluten-free,Work Colleagues,false',
  ].join('\n');
}

/**
 * Exports current guests list into CSV format
 */
export function exportGuestsToCsv(guests: Guest[]): string {
  const header = ['Name', 'Email', 'Phone', 'RSVP', 'Dietary', 'Group', 'PlusOne'];
  const rows = guests.map((g) => {
    const dietaryFormatted = `"${(g.dietary || []).join(', ')}"`;
    return [
      `"${g.name.replace(/"/g, '""')}"`,
      `"${(g.email || '').replace(/"/g, '""')}"`,
      `"${(g.phone || '').replace(/"/g, '""')}"`,
      g.rsvp,
      dietaryFormatted,
      `"${(g.group || 'General').replace(/"/g, '""')}"`,
      g.plusOne ? 'true' : 'false',
    ].join(',');
  });
  return [header.join(','), ...rows].join('\n');
}
