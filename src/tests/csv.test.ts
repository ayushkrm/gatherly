import { describe, it, expect } from 'vitest';
import {
  splitCsvRow,
  parseGuestCsv,
  exportGuestsToCsv,
} from '../lib/csv';
import { Guest } from '../lib/schema';

describe('CSV Importer and Exporter', () => {
  it('correctly splits CSV rows respecting quotes and commas', () => {
    const row = 'John Doe,john@test.com,"Vegan, Gluten-free",true';
    const split = splitCsvRow(row);
    expect(split.length).toBe(4);
    expect(split[0]).toBe('John Doe');
    expect(split[2]).toBe('Vegan, Gluten-free');
  });

  it('parses standard guest CSV into Guest objects', () => {
    const csv = `Name,Email,Phone,RSVP,Dietary,Group,PlusOne
Rohan Sharma,rohan@example.com,+91 98765 43210,attending,"Vegetarian, Nut-Free",Groom Family,true
Ananya Patel,ananya@example.com,,declined,Vegan,Bride Friends,false`;

    const { guests, errors } = parseGuestCsv(csv);
    expect(errors.length).toBe(0);
    expect(guests.length).toBe(2);

    expect(guests[0].name).toBe('Rohan Sharma');
    expect(guests[0].rsvp).toBe('attending');
    expect(guests[0].plusOne).toBe(true);
    expect(guests[0].dietary).toEqual(['Vegetarian', 'Nut-Free']);

    expect(guests[1].name).toBe('Ananya Patel');
    expect(guests[1].rsvp).toBe('declined');
    expect(guests[1].plusOne).toBe(false);
  });

  it('handles missing required columns gracefully with helpful error message', () => {
    const invalidCsv = `Category,Amount,Notes\nVenue,5000,Deposit`;
    const { guests, errors } = parseGuestCsv(invalidCsv);
    expect(guests.length).toBe(0);
    expect(errors[0]).toContain('Missing required column: "Name"');
  });

  it('exports and re-imports guest list symmetrically', () => {
    const sampleGuests: Guest[] = [
      {
        id: '1',
        name: 'Kabir Khan',
        email: 'kabir@example.com',
        phone: '+91 99999 11111',
        rsvp: 'attending',
        plusOne: true,
        dietary: ['Halal'],
        group: 'Friends',
      },
    ];

    const exportedCsv = exportGuestsToCsv(sampleGuests);
    const { guests } = parseGuestCsv(exportedCsv);

    expect(guests.length).toBe(1);
    expect(guests[0].name).toBe('Kabir Khan');
    expect(guests[0].dietary).toEqual(['Halal']);
    expect(guests[0].rsvp).toBe('attending');
  });
});
