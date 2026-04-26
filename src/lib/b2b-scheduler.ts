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
 * Generate the meeting schedule using a round-robin algorithm.
 * 
 * Algorithm:
 * 1. For each time slot, assign as many non-conflicting A-B pairs as possible.
 * 2. Each A meets each B exactly once.
 * 3. No participant appears in two meetings in the same time slot.
 * 4. Tables are assigned incrementally per slot.
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

  // Track which pairs have been scheduled
  const scheduledPairs = new Set<string>();

  // Track which participants are busy in each slot
  const slotBusyA = new Map<number, Set<string>>();
  const slotBusyB = new Map<number, Set<string>>();

  // Initialize busy maps
  for (let i = 0; i < timeSlots.length; i++) {
    slotBusyA.set(i, new Set());
    slotBusyB.set(i, new Set());
  }

  // Build a queue of all needed pairs
  const pairsNeeded: Array<{ aId: string; bId: string }> = [];
  for (const aId of sideAIds) {
    for (const bId of sideBIds) {
      pairsNeeded.push({ aId, bId });
    }
  }

  // Shuffle pairs for more balanced distribution
  shuffleArray(pairsNeeded);

  // Assign each pair to the earliest available slot
  for (const pair of pairsNeeded) {
    const pairKey = `${pair.aId}:${pair.bId}`;
    if (scheduledPairs.has(pairKey)) continue;

    let assigned = false;

    for (let slotIdx = 0; slotIdx < timeSlots.length; slotIdx++) {
      const busyA = slotBusyA.get(slotIdx)!;
      const busyB = slotBusyB.get(slotIdx)!;

      if (!busyA.has(pair.aId) && !busyB.has(pair.bId)) {
        // Assign this pair to this slot
        const slot = timeSlots[slotIdx];
        const tableNumber = busyA.size + 1; // Table number = position in slot

        meetings.push({
          participantAId: pair.aId,
          participantBId: pair.bId,
          timeSlot: slot.start,
          endTime: slot.end,
          tableNumber,
        });

        busyA.add(pair.aId);
        busyB.add(pair.bId);
        scheduledPairs.add(pairKey);
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      return {
        success: false,
        meetings: [],
        validation,
        error: `Could not schedule meeting between participants. This may indicate a logical error in capacity validation.`,
      };
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

/**
 * Fisher-Yates shuffle for balanced distribution
 */
function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
