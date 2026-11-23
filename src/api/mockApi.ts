import type { Booking, CreateBookingInput, Room } from '../types'
import {
  DAY_END,
  DAY_START,
  MAX_DURATION_MINUTES,
  intervalsOverlap,
  todayISO,
  toMinutes,
} from '../utils/time'

let failureRate = 0.1
let latencyEnabled = true

const rooms: Room[] = [
  { id: 'alpha', name: 'Alpha', capacity: 6 },
  { id: 'beta', name: 'Beta', capacity: 10 },
  { id: 'gamma', name: 'Gamma', capacity: 4 },
]

/** In-memory booking store (mutated by create/cancel). */
let bookings: Booking[] = seedBookings()

function seedBookings(): Booking[] {
  const today = todayISO()
  return [
    {
      id: 'b1',
      roomId: 'alpha',
      date: today,
      title: 'Stand-up',
      start: '10:00',
      end: '11:00',
      attendees: ['alex@example.com', 'sam@example.com'],
    },
    {
      id: 'b2',
      roomId: 'alpha',
      date: today,
      title: 'Design sync',
      start: '14:00',
      end: '15:00',
      attendees: ['jordan@example.com'],
    },
    {
      id: 'b3',
      roomId: 'beta',
      date: today,
      title: 'Client call',
      start: '09:00',
      end: '10:30',
      attendees: ['pat@example.com', 'casey@example.com'],
    },
  ]
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function randomLatency(): Promise<void> {
  if (!latencyEnabled) return Promise.resolve()
  const ms = 300 + Math.floor(Math.random() * 501) // 300–800
  return delay(ms)
}

function shouldFail(): boolean {
  return Math.random() < failureRate
}

function nextId(): string {
  return `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export async function getRooms(): Promise<Room[]> {
  await randomLatency()
  return rooms.map((r) => ({ ...r }))
}

export async function getBookings(
  roomId: string,
  date: string,
): Promise<Booking[]> {
  await randomLatency()
  return bookings
    .filter((b) => b.roomId === roomId && b.date === date)
    .map((b) => ({ ...b, attendees: [...b.attendees] }))
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
}

export async function createBooking(
  input: CreateBookingInput,
): Promise<Booking> {
  await randomLatency()

  if (shouldFail()) {
    throw new Error('Server error: failed to create booking. Please try again.')
  }

  const start = toMinutes(input.start)
  const end = toMinutes(input.end)

  if (start < DAY_START || end > DAY_END || start >= end) {
    throw new Error('Booking must be within 09:00–18:00 with start before end.')
  }
  if (end - start > MAX_DURATION_MINUTES) {
    throw new Error('Booking cannot exceed 4 hours.')
  }

  const conflict = bookings.find(
    (b) =>
      b.roomId === input.roomId &&
      b.date === input.date &&
      intervalsOverlap(start, end, toMinutes(b.start), toMinutes(b.end)),
  )
  if (conflict) {
    throw new Error(
      `Room already booked for ${conflict.start}–${conflict.end} (${conflict.title}).`,
    )
  }

  const booking: Booking = {
    id: nextId(),
    roomId: input.roomId,
    date: input.date,
    title: input.title.trim(),
    start: input.start,
    end: input.end,
    attendees: input.attendees.map((e) => e.trim().toLowerCase()),
  }
  bookings = [...bookings, booking]
  return { ...booking, attendees: [...booking.attendees] }
}

export async function cancelBooking(id: string): Promise<void> {
  await randomLatency()

  if (shouldFail()) {
    throw new Error('Server error: failed to cancel booking. Please try again.')
  }

  const exists = bookings.some((b) => b.id === id)
  if (!exists) {
    throw new Error('Booking not found.')
  }
  bookings = bookings.filter((b) => b.id !== id)
}

/** Test helper: replace store (used by unit tests). */
export function __resetBookings(next: Booking[] = seedBookings()): void {
  bookings = next.map((b) => ({ ...b, attendees: [...b.attendees] }))
}

/** Test helper: read store snapshot. */
export function __getBookingsSnapshot(): Booking[] {
  return bookings.map((b) => ({ ...b, attendees: [...b.attendees] }))
}

/** Test helper: disable network latency. */
export function __setLatencyEnabled(enabled: boolean): void {
  latencyEnabled = enabled
}

/** Test helper: set create/cancel failure probability (0–1). */
export function __setFailureRate(rate: number): void {
  failureRate = rate
}
