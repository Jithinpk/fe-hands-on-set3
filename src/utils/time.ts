/** Business hours in minutes from midnight. */
export const DAY_START = 9 * 60 // 09:00
export const DAY_END = 18 * 60 // 18:00
export const SLOT_MINUTES = 15
export const MAX_DURATION_MINUTES = 4 * 60

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/

/** Convert "HH:MM" to minutes since midnight. Throws on invalid format. */
export function toMinutes(time: string): number {
  if (!TIME_RE.test(time)) {
    throw new Error(`Invalid time: ${time}`)
  }
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/** Format minutes since midnight as "HH:MM". */
export function fromMinutes(total: number): string {
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

/** True when time is a valid HH:MM on a 15-minute boundary. */
export function isQuarterHour(time: string): boolean {
  if (!TIME_RE.test(time)) return false
  return toMinutes(time) % SLOT_MINUTES === 0
}

/**
 * Half-open interval overlap: [aStart, aEnd) overlaps [bStart, bEnd).
 * Back-to-back bookings (one ends when the next starts) do not overlap.
 */
export function intervalsOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd
}

/** Generate selectable times from day start through day end (inclusive of end for end-time pickers). */
export function timeOptions(includeEndBoundary = false): string[] {
  const options: string[] = []
  const last = includeEndBoundary ? DAY_END : DAY_END - SLOT_MINUTES
  for (let m = DAY_START; m <= last; m += SLOT_MINUTES) {
    options.push(fromMinutes(m))
  }
  return options
}

/** Today's date as YYYY-MM-DD in local time. */
export function todayISO(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
