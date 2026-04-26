/**
 * B2B Matchmaking Scheduler
 * 
 * Generates meeting schedules between Side A (Universities) and Side B (Agents/Schools/Companies)
 * using a round-robin algorithm with constraint validation.
 * 
 * Constraints:
 * - No duplicate meetings (each A meets each B exactly once)
 * - No overlapping meetings (no participant in two meetings at same time)
 * - Respects break times (e.g., lunch)
 * - Balanced distribution across time slots
 */

export interface TimeSlot {
  start: Date;
  end: Date;
  index: number;
}

export interface MeetingAssignment {
  participantAId: string;
  participantBId: string;
  timeSlot: Date;
  endTime: Date;
  tableNumber: number;
}

export interface ScheduleValidation {
  isValid: boolean;
  totalSlots: number;
  totalMeetingsNeeded: number;
  maxMeetingsPerSlot: number;
  slotsNeeded: number;
  message: string;
}

export interface ScheduleResult {
  success: boolean;
  meetings: MeetingAssignment[];
  validation: ScheduleValidation;
  error?: string;
}

/**
 * Parse "HH:mm" time string into hours and minutes
 */
function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return { hours, minutes };
}

/**
 * Generate all available time slots for a B2B event
 */
export function generateTimeSlots(
  eventDate: Date,
  startTime: string,
  endTime: string,
  slotDurationMinutes: number,
  breakStart?: string | null,
  breakEnd?: string | null
): TimeSlot[] {
  const slots: TimeSlot[] = [];

  const start = parseTime(startTime);
  const end = parseTime(endTime);
  const breakStartParsed = breakStart ? parseTime(breakStart) : null;
  const breakEndParsed = breakEnd ? parseTime(breakEnd) : null;

  // Start from event start time
  let currentMinutes = start.hours * 60 + start.minutes;
  const endMinutes = end.hours * 60 + end.minutes;
  const breakStartMinutes = breakStartParsed
    ? breakStartParsed.hours * 60 + breakStartParsed.minutes
    : null;
  const breakEndMinutes = breakEndParsed
    ? breakEndParsed.hours * 60 + breakEndParsed.minutes
    : null;

  let slotIndex = 0;

  while (currentMinutes + slotDurationMinutes <= endMinutes) {
    const slotEndMinutes = currentMinutes + slotDurationMinutes;

    // Check if this slot overlaps with break time
    if (
      breakStartMinutes !== null &&
      breakEndMinutes !== null &&
      currentMinutes < breakEndMinutes &&
      slotEndMinutes > breakStartMinutes
    ) {
      // Skip to end of break
      currentMinutes = breakEndMinutes;
      continue;
    }

    const slotStart = new Date(eventDate);
    slotStart.setUTCHours(Math.floor(currentMinutes / 60), currentMinutes % 60, 0, 0);

    const slotEnd = new Date(eventDate);
    slotEnd.setUTCHours(Math.floor(slotEndMinutes / 60), slotEndMinutes % 60, 0, 0);

    slots.push({
      start: slotStart,
      end: slotEnd,
      index: slotIndex++,
    });

    currentMinutes = slotEndMinutes;
  }

  return slots;
}

/**
 * Validate whether a schedule can be generated with the given parameters
 */
export function validateCapacity(
  sideACount: number,
  sideBCount: number,
  totalSlots: number
): ScheduleValidation {
  const totalMeetingsNeeded = sideACount * sideBCount;
  const maxMeetingsPerSlot = Math.min(sideACount, sideBCount);
  const slotsNeeded = Math.ceil(totalMeetingsNeeded / maxMeetingsPerSlot);

  const isValid = totalSlots >= slotsNeeded;

  let message: string;
  if (sideACount === 0 || sideBCount === 0) {
    message = "Both sides need at least one participant.";
  } else if (!isValid) {
    message = `Not enough time slots. Need ${slotsNeeded} slots but only have ${totalSlots}. ` +
      `Add more time, reduce slot duration, or reduce participants.`;
  } else {
    message = `Schedule is feasible. ${totalMeetingsNeeded} meetings across ${totalSlots} available slots.`;
  }

  return {
    isValid: isValid && sideACount > 0 && sideBCount > 0,
    totalSlots,
    totalMeetingsNeeded,
    maxMeetingsPerSlot,
    slotsNeeded,
    message,
  };
}

/**
 * Generate the meeting schedule using a deterministic round-robin algorithm.
 * 
 * Formula: In time slot `s`, Side A participant `a` meets Side B participant
 * at index `(s + a) % sideBCount`. This guarantees:
 * - Each A meets each B exactly once
 * - No participant appears in two meetings in the same time slot
 * - Complete coverage with exactly max(sideA, sideB) slots
 */
export function generateSchedule(
  sideAIds: string[],
  sideBIds: string[],
  timeSlots: TimeSlot[]
): ScheduleResult {
  const validation = validateCapacity(sideAIds.length, sideBIds.length, timeSlots.length);

  if (!validation.isValid) {
    return {
      success: false,
      meetings: [],
      validation,
      error: validation.message,
    };
  }

  const meetings: MeetingAssignment[] = [];
  const N = sideAIds.length;
  const M = sideBIds.length;

  // Determine which side is larger for the round-robin rotation
  if (N <= M) {
    // More Side B than Side A (typical: few universities, many agents)
    // Each slot: N meetings (one per university)
    // Total slots needed: M (each Side B gets matched with all universities)
    for (let s = 0; s < M; s++) {
      if (s >= timeSlots.length) break; // safety
      const slot = timeSlots[s];

      for (let a = 0; a < N; a++) {
        const bIndex = (s + a) % M;

        meetings.push({
          participantAId: sideAIds[a],
          participantBId: sideBIds[bIndex],
          timeSlot: slot.start,
          endTime: slot.end,
          tableNumber: a + 1,
        });
      }
    }
  } else {
    // More Side A than Side B (rare: many universities, few agents)
    // Each slot: M meetings (one per Side B)
    // Total slots needed: N
    for (let s = 0; s < N; s++) {
      if (s >= timeSlots.length) break;
      const slot = timeSlots[s];

      for (let b = 0; b < M; b++) {
        const aIndex = (s + b) % N;

        meetings.push({
          participantAId: sideAIds[aIndex],
          participantBId: sideBIds[b],
          timeSlot: slot.start,
          endTime: slot.end,
          tableNumber: b + 1,
        });
      }
    }
  }

  // Sort meetings by time slot, then by table number
  meetings.sort((a, b) => {
    const timeDiff = a.timeSlot.getTime() - b.timeSlot.getTime();
    if (timeDiff !== 0) return timeDiff;
    return (a.tableNumber || 0) - (b.tableNumber || 0);
  });

  return {
    success: true,
    meetings,
    validation,
  };
}
