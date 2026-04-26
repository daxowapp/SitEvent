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
  adjusted?: string;
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
 * Generate the meeting schedule with arrival time support.
 * 
 * When Side B participants have arrival times, the scheduler only assigns
 * them to time slots that start at or after their arrival. Most constrained
 * participants (fewest available slots) are scheduled first.
 */
export function generateSchedule(
  sideAIds: string[],
  sideBIds: string[],
  timeSlots: TimeSlot[],
  arrivalTimes?: Map<string, string | null> // participantId → "HH:mm" or null
): ScheduleResult {
  const validation = validateCapacity(sideAIds.length, sideBIds.length, timeSlots.length);

  // Skip strict validation when arrival times are set (slots needed may differ)
  if (!validation.isValid && !arrivalTimes) {
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

  // Calculate available slot indices for each Side B participant
  const bAvailableSlots = new Map<string, number[]>();
  for (const bId of sideBIds) {
    const arrival = arrivalTimes?.get(bId);
    if (arrival) {
      const arrivalMinutes = parseTime(arrival);
      const totalArrivalMinutes = arrivalMinutes.hours * 60 + arrivalMinutes.minutes;
      const available = timeSlots
        .filter((slot) => {
          const slotMinutes = slot.start.getUTCHours() * 60 + slot.start.getUTCMinutes();
          return slotMinutes >= totalArrivalMinutes;
        })
        .map((s) => s.index);
      bAvailableSlots.set(bId, available);
    } else {
      bAvailableSlots.set(bId, timeSlots.map((s) => s.index));
    }
  }

  // Track busy participants per slot
  const slotBusyA = new Map<number, Set<string>>();
  const slotBusyB = new Map<number, Set<string>>();
  for (let i = 0; i < timeSlots.length; i++) {
    slotBusyA.set(i, new Set());
    slotBusyB.set(i, new Set());
  }

  // Build all needed pairs, sorted by most constrained B first
  const pairsNeeded: Array<{ aId: string; bId: string; availableCount: number }> = [];
  for (const bId of sideBIds) {
    const availCount = bAvailableSlots.get(bId)!.length;
    for (const aId of sideAIds) {
      pairsNeeded.push({ aId, bId, availableCount: availCount });
    }
  }
  // Most constrained first (fewest available slots), then by A index for stability
  pairsNeeded.sort((a, b) => a.availableCount - b.availableCount);

  // Greedy assignment: for each pair, find earliest available slot
  let unscheduled = 0;
  for (const pair of pairsNeeded) {
    const availableSlots = bAvailableSlots.get(pair.bId)!;
    let assigned = false;

    for (const slotIdx of availableSlots) {
      const busyA = slotBusyA.get(slotIdx)!;
      const busyB = slotBusyB.get(slotIdx)!;

      if (!busyA.has(pair.aId) && !busyB.has(pair.bId)) {
        const slot = timeSlots[slotIdx];
        meetings.push({
          participantAId: pair.aId,
          participantBId: pair.bId,
          timeSlot: slot.start,
          endTime: slot.end,
          tableNumber: busyA.size + 1,
        });
        busyA.add(pair.aId);
        busyB.add(pair.bId);
        assigned = true;
        break;
      }
    }

    if (!assigned) unscheduled++;
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
    adjusted: unscheduled > 0
      ? `${unscheduled} meetings skipped — some participants arrive too late to meet all universities. They'll have fewer meetings.`
      : undefined,
  };
}
