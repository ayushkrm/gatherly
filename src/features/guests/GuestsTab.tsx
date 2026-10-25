import React, { useState, useMemo, useRef } from 'react';
import {
  Users,
  UserPlus,
  Upload,
  Download,
  Utensils,
  CheckCircle2,
  Clock,
  XCircle,
  Trash2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore';
import { formatCurrency } from '../../lib/budget';
import { parseGuestCsv, exportGuestsToCsv, getSampleGuestCsv } from '../../lib/csv';
import { Guest, GuestRsvpStatus } from '../../lib/schema';

export const GuestsTab: React.FC = () => {
  const {
    guests,
    onboarding,
    plan,
    addGuest,
    updateGuest,
    removeGuest,
    importGuests,
  } = usePlanStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  // New Guest Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [rsvp, setRsvp] = useState<GuestRsvpStatus>('pending');
  const [plusOne, setPlusOne] = useState(false);
  const [dietaryInput, setDietaryInput] = useState('');
  const [group, setGroup] = useState('General');

  // CSV Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvPreview, setCsvPreview] = useState<Guest[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);

  // RSVP breakdown
  const attendingCount = guests.filter((g) => g.rsvp === 'attending').length;
  const pendingCount = guests.filter((g) => g.rsvp === 'pending').length;
  const declinedCount = guests.filter((g) => g.rsvp === 'declined').length;
  const plusOneCount = guests.filter((g) => g.plusOne && g.rsvp === 'attending').length;
  const totalAttendingSeats = attendingCount + plusOneCount;

  // Headcount vs budget per-head live calculation
  const totalBudget = onboarding.totalBudget || (plan ? plan.budget.reduce((a, b) => a + b.amount, 0) : 0);
  const totalActual = plan ? plan.budget.reduce((a, b) => a + (Number(b.actualSpent) || 0), 0) : 0;
  const activeCount = totalAttendingSeats > 0 ? totalAttendingSeats : (onboarding.guestCount || 1);
  const plannedPerHead = Math.round(totalBudget / activeCount);
  const actualPerHead = Math.round(totalActual / activeCount);

  // Dietary tags summary count
  const dietarySummary = useMemo(() => {
    const counts: Record<string, number> = {};
    guests
      .filter((g) => g.rsvp === 'attending' || g.rsvp === 'pending')
      .forEach((g) => {
        (g.dietary || []).forEach((d) => {
          counts[d] = (counts[d] || 0) + 1;
        });
      });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [guests]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const dietary = dietaryInput
      .split(',')
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    addGuest({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      rsvp,
      plusOne,
      dietary,
      group: group.trim() || 'General',
    });

    // Reset
    setName('');
    setEmail('');
    setPhone('');
    setRsvp('pending');
    setPlusOne(false);
    setDietaryInput('');
    setGroup('General');
    setIsAddModalOpen(false);
  };

  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const { guests: parsed, errors } = parseGuestCsv(text);
      setCsvPreview(parsed);
      setCsvErrors(errors);
    };
    reader.readAsText(file);
  };

  const handleConfirmCsvImport = () => {
    if (csvPreview.length > 0) {
      importGuests(csvPreview);
      setCsvPreview([]);
      setCsvErrors([]);
      setIsCsvModalOpen(false);
    }
  };

  const handleDownloadSampleCsv = () => {
    const sample = getSampleGuestCsv();
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gatherly-guest-sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const csvContent = exportGuestsToCsv(guests);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gatherly-guests-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#37352F] dark:text-[#D4D4D4]">
            Guest List & Catering Requirements
          </h2>
          <p className="text-[#787774] text-xs sm:text-sm mt-0.5">
            RSVP management, live per-head budget allocation, and dietary restriction tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Export CSV */}
          {guests.length > 0 && (
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E9E9E7] dark:border-[#2E2E2E] bg-[#FFFFFF] dark:bg-[#202020] hover:bg-[#EFEFED] dark:hover:bg-[#2C2C2C] text-[#37352F] dark:text-[#D4D4D4] text-xs font-medium transition-colors"
              title="Download CSV file of all guests"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}

          {/* Import CSV */}
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E9E9E7] dark:border-[#2E2E2E] bg-[#FFFFFF] dark:bg-[#202020] hover:bg-[#EFEFED] dark:hover:bg-[#2C2C2C] text-[#37352F] dark:text-[#D4D4D4] text-xs font-medium transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>

          {/* Add Guest Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#2383E2] hover:bg-[#0B6FCC] text-white text-xs font-medium transition-colors shadow-2xs active:scale-98"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Guest</span>
          </button>
        </div>
      </div>

      {/* Headcount vs Budget Per-Head Live Calculation */}
      <div className="bg-[#FFFFFF] dark:bg-[#202020] border border-[#E9E9E7] dark:border-[#2E2E2E] rounded-lg p-5 sm:p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-3.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#787774]">
            Live Headcount & Per-Head Economics
          </span>
          <span className="text-xs text-[#787774]">
            Target: <strong className="text-[#37352F] dark:text-[#D4D4D4] font-mono">{onboarding.guestCount}</strong> guests
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-md bg-[#F7F6F3] dark:bg-[#252525] border border-[#E9E9E7] dark:border-[#2E2E2E]">
            <span className="text-[11px] text-[#787774] block">Confirmed Seats</span>
            <span className="text-xl font-bold font-serif text-[#37352F] dark:text-[#D4D4D4]">
              {totalAttendingSeats}
            </span>
            <span className="text-[10px] text-[#787774] mt-0.5 block">
              {attendingCount} primaries + {plusOneCount} plus-ones
            </span>
          </div>

          <div className="p-3.5 rounded-md bg-[#F7F6F3] dark:bg-[#252525] border border-[#E9E9E7] dark:border-[#2E2E2E]">
            <span className="text-[11px] text-[#787774] block">Pending RSVPs</span>
            <span className="text-xl font-bold font-serif text-[#E89A3C]">
              {pendingCount}
            </span>
            <span className="text-[10px] text-[#787774] mt-0.5 block">
              Awaiting confirmation
            </span>
          </div>

          <div className="p-3.5 rounded-md bg-[#F7F6F3] dark:bg-[#252525] border border-[#E9E9E7] dark:border-[#2E2E2E]">
            <span className="text-[11px] text-[#787774] block">Planned Spend / Head</span>
            <span className="text-xl font-bold font-serif text-[#37352F] dark:text-[#D4D4D4]">
              {formatCurrency(plannedPerHead, onboarding.currency)}
            </span>
            <span className="text-[10px] text-[#787774] mt-0.5 block">
              Based on {activeCount} seats
            </span>
          </div>

          <div className="p-3.5 rounded-md bg-[#F7F6F3] dark:bg-[#252525] border border-[#E9E9E7] dark:border-[#2E2E2E]">
            <span className="text-[11px] text-[#787774] block">Actual Spend / Head</span>
            <span className="text-xl font-bold font-serif text-[#2383E2]">
              {formatCurrency(actualPerHead, onboarding.currency)}
            </span>
            <span className="text-[10px] text-[#787774] mt-0.5 block">
              Committed so far
            </span>
          </div>
        </div>
      </div>

      {/* Dietary Tags Summary Breakdown */}
      {dietarySummary.length > 0 && (
        <div className="bg-[#FFFFFF] dark:bg-[#202020] border border-[#E9E9E7] dark:border-[#2E2E2E] rounded-lg p-5 shadow-2xs">
          <div className="flex items-center gap-2 mb-3">
            <Utensils className="w-3.5 h-3.5 text-[#787774]" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#787774]">
              Dietary Restrictions Breakdown (For Caterer Dispatch)
            </h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {dietarySummary.map(([diet, count]) => (
              <span
                key={diet}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-[#E3E2E0] dark:bg-[#2F2F2F] text-[#37352F] dark:text-[#D4D4D4]"
              >
                <span>{diet}</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-[#FFFFFF] dark:bg-[#1E1E1E] text-[#37352F] dark:text-[#D4D4D4] border border-[#E9E9E7] dark:border-[#2E2E2E]">
                  {count}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Guests Table */}
      <div className="bg-[#FFFFFF] dark:bg-[#202020] border border-[#E9E9E7] dark:border-[#2E2E2E] rounded-lg p-5 sm:p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-serif font-bold text-[#37352F] dark:text-[#D4D4D4]">
            Guest Roster ({guests.length})
          </h3>
          <span className="text-xs text-[#787774]">
            Click RSVP to update status
          </span>
        </div>

        {guests.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <Users className="w-8 h-8 text-[#787774] mx-auto opacity-50" />
            <p className="text-xs text-[#787774]">No guests added yet.</p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs text-[#2383E2] font-medium hover:underline"
            >
              Add your first guest or import a CSV
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border border-[#E9E9E7] dark:border-[#2E2E2E] rounded-md overflow-hidden">
              <thead className="bg-[#F7F6F3] dark:bg-[#252525] border-b border-[#E9E9E7] dark:border-[#2E2E2E] text-[#787774] text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Guest</th>
                  <th className="py-2.5 px-3 font-semibold">Group</th>
                  <th className="py-2.5 px-3 font-semibold">RSVP Status</th>
                  <th className="py-2.5 px-3 font-semibold">Dietary Tags</th>
                  <th className="py-2.5 px-2 text-center font-semibold">+1</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E9E7] dark:divide-[#2E2E2E]">
                {guests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-[#F7F6F3] dark:hover:bg-[#252525] transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-[#37352F] dark:text-[#D4D4D4]">
                        {guest.name}
                      </div>
                      {(guest.email || guest.phone) && (
                        <div className="text-[11px] text-[#787774] font-mono">
                          {guest.email || guest.phone}
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-[#787774] text-xs">
                      {guest.group || 'General'}
                    </td>

                    <td className="py-2.5 px-3">
                      <select
                        value={guest.rsvp}
                        onChange={(e) =>
                          updateGuest(guest.id, { rsvp: e.target.value as GuestRsvpStatus })
                        }
                        className={`px-2 py-0.5 rounded text-xs font-medium border-0 cursor-pointer focus:outline-hidden ${
                          guest.rsvp === 'attending'
                            ? 'bg-[#DBEDDB] dark:bg-[#243D30] text-[#1C3829] dark:text-[#86C19F]'
                            : guest.rsvp === 'declined'
                            ? 'bg-[#FFE2DD] dark:bg-[#4D2322] text-[#49201C] dark:text-[#F3958F]'
                            : 'bg-[#FDECC8] dark:bg-[#3D331A] text-[#402C1B] dark:text-[#E2CD8C]'
                        }`}
                      >
                        <option value="attending">Attending</option>
                        <option value="pending">Pending</option>
                        <option value="declined">Declined</option>
                      </select>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        {guest.dietary && guest.dietary.length > 0 ? (
                          guest.dietary.map((d, dIdx) => (
                            <span
                              key={dIdx}
                              className="px-1.5 py-0.5 rounded bg-[#E3E2E0] dark:bg-[#2F2F2F] text-[10px] font-medium text-[#37352F] dark:text-[#D4D4D4]"
                            >
                              {d}
                            </span>
                          ))
                        ) : (
                          <span className="text-[#787774] text-xs">Standard</span>
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-2 text-center">
                      <button
                        onClick={() => updateGuest(guest.id, { plusOne: !guest.plusOne })}
                        className={`text-xs px-2 py-0.5 rounded font-medium transition-colors ${
                          guest.plusOne
                            ? 'bg-[#D3E5EF] dark:bg-[#1C2E3D] text-[#183347] dark:text-[#9BC2DD]'
                            : 'text-[#787774] hover:text-[#37352F]'
                        }`}
                      >
                        {guest.plusOne ? 'Yes' : 'No'}
                      </button>
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => removeGuest(guest.id)}
                        className="text-[#787774] hover:text-[#EB5757] p-1 transition-colors"
                        title="Remove guest"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Guest Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="bg-[#FFFFFF] dark:bg-[#202020] border border-[#E9E9E7] dark:border-[#2E2E2E] rounded-lg p-6 max-w-md w-full shadow-lg">
            <h3 className="text-lg font-serif font-bold text-[#37352F] dark:text-[#D4D4D4] mb-4">
              Add New Guest
            </h3>
            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#37352F] dark:text-[#D4D4D4] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Krishnan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-[#E9E9E7] dark:border-[#2E2E2E] bg-[#FFFFFF] dark:bg-[#191919] text-xs sm:text-sm text-[#37352F] dark:text-white focus:border-[#2383E2] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#37352F] dark:text-[#D4D4D4] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="maya@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-[#E9E9E7] dark:border-[#2E2E2E] bg-[#FFFFFF] dark:bg-[#191919] text-xs text-[#37352F] dark:text-white focus:border-[#2383E2] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#37352F] dark:text-[#D4D4D4] mb-1">
                    Phone / Mobile
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 555-0192"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-[#E9E9E7] dark:border-[#2E2E2E] bg-[#FFFFFF] dark:bg-[#191919] text-xs text-[#37352F] dark:text-white focus:border-[#2383E2] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#37352F] dark:text-[#D4D4D4] mb-1">
                    RSVP Status
                  </label>
                  <select
                    value={rsvp}
                    onChange={(e) => setRsvp(e.target.value as GuestRsvpStatus)}
                    className="w-full px-3 py-1.5 rounded-md border border-[#E9E9E7] dark:border-[#2E2E2E] bg-[#FFFFFF] dark:bg-[#191919] text-xs text-[#37352F] dark:text-white focus:border-[#2383E2] focus:outline-hidden"
                  >
                    <option value="pending">Pending</option>
                    <option value="attending">Attending</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#37352F] dark:text-[#D4D4D4] mb-1">
                    Group / Affiliation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Friends"
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-[#E9E9E7] dark:border-[#2E2E2E] bg-[#FFFFFF] dark:bg-[#191919] text-xs text-[#37352F] dark:text-white focus:border-[#2383E2] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#37352F] dark:text-[#D4D4D4] mb-1">
                  Dietary Restrictions (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vegan, Nut-Free, Jain"
                  value={dietaryInput}
                  onChange={(e) => setDietaryInput(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-[#E9E9E7] dark:border-[#2E2E2E] bg-[#FFFFFF] dark:bg-[#191919] text-xs text-[#37352F] dark:text-white focus:border-[#2383E2] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="plusOne"
                  checked={plusOne}
                  onChange={(e) => setPlusOne(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-[#E9E9E7] text-[#2383E2] focus:ring-[#2383E2]"
                />
                <label htmlFor="plusOne" className="text-xs text-[#37352F] dark:text-[#D4D4D4]">
                  Allow / Include +1 Guest Seat
                </label>
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
                  className="px-4 py-1.5 rounded-md bg-[#2383E2] hover:bg-[#0B6FCC] text-white text-xs font-medium transition-colors shadow-2xs"
                >
                  Save Guest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="bg-[#FFFFFF] dark:bg-[#202020] border border-[#E9E9E7] dark:border-[#2E2E2E] rounded-lg p-6 max-w-lg w-full shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-serif font-bold text-[#37352F] dark:text-[#D4D4D4]">
                Import Guest CSV
              </h3>
              <button
                onClick={() => setIsCsvModalOpen(false)}
                className="text-[#787774] hover:text-[#37352F] text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#787774]">
              Upload a spreadsheet CSV with headers: <code>Name, Email, Phone, RSVP, Dietary, Group, PlusOne</code>.
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadSampleCsv}
                className="text-xs text-[#2383E2] font-medium hover:underline inline-flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample CSV Template</span>
              </button>
            </div>

            <div className="border border-dashed border-[#E9E9E7] dark:border-[#2E2E2E] rounded-md p-6 text-center bg-[#F7F6F3] dark:bg-[#252525]">
              <FileSpreadsheet className="w-6 h-6 text-[#787774] mx-auto mb-2" />
              <label className="cursor-pointer inline-flex items-center px-3 py-1.5 rounded-md bg-[#FFFFFF] dark:bg-[#191919] border border-[#E9E9E7] dark:border-[#2E2E2E] text-xs font-medium text-[#37352F] dark:text-[#D4D4D4] hover:bg-[#EFEFED]">
                <span>Select CSV File</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,text/csv"
                  onChange={handleCsvFile}
                  className="hidden"
                />
              </label>
            </div>

            {csvErrors.length > 0 && (
              <div className="p-3 rounded-md bg-[#FFE2DD] dark:bg-[#4D2322] border border-[#F3958F] text-[#49201C] dark:text-[#F3958F] text-xs space-y-1">
                {csvErrors.map((err, i) => (
                  <div key={i}>{err}</div>
                ))}
              </div>
            )}

            {csvPreview.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-[#27AE60]">
                  Ready to import {csvPreview.length} guests!
                </span>
                <div className="max-h-36 overflow-y-auto divide-y divide-[#E9E9E7] dark:divide-[#2E2E2E] text-xs p-2 rounded-md bg-[#F7F6F3] dark:bg-[#252525] border border-[#E9E9E7] dark:border-[#2E2E2E]">
                  {csvPreview.slice(0, 5).map((g, i) => (
                    <div key={i} className="py-1">
                      <strong>{g.name}</strong> • {g.rsvp} • {g.dietary.join(', ') || 'No restrictions'}
                    </div>
                  ))}
                  {csvPreview.length > 5 && (
                    <div className="text-[#787774] pt-1">
                      ...and {csvPreview.length - 5} more
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E9E9E7] dark:border-[#2E2E2E]">
              <button
                type="button"
                onClick={() => setIsCsvModalOpen(false)}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-[#787774] hover:bg-[#EFEFED] dark:hover:bg-[#2C2C2C]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={csvPreview.length === 0}
                onClick={handleConfirmCsvImport}
                className="px-4 py-1.5 rounded-md bg-[#2383E2] hover:bg-[#0B6FCC] text-white font-medium text-xs disabled:opacity-40 shadow-2xs"
              >
                Import {csvPreview.length > 0 ? `${csvPreview.length} Guests` : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
