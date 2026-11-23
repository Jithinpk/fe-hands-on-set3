import type { Booking } from '../types'
import { validateBooking, isValidEmail } from './validation'

const existing: Booking[] = [
  {
    id: 'b1',
    roomId: 'alpha',
    date: '2026-11-23',
    title: 'Stand-up',
    start: '10:00',
    end: '11:00',
    attendees: ['alex@example.com'],
  },
]

function base(overrides: Partial<Parameters<typeof validateBooking>[0]> = {}) {
  return {
    title: 'Planning',
    start: '11:00',
    end: '12:00',
    attendees: ['pat@example.com'],
    ...overrides,
  }
}

describe('isValidEmail', () => {
  it('accepts normal emails', () => {
    expect(isValidEmail('a@b.co')).toBe(true)
    expect(isValidEmail('Name.Last+tag@example.com')).toBe(true)
  })

  it('rejects incomplete emails', () => {
    expect(isValidEmail('')).toBe(false)
    expect(isValidEmail('not-an-email')).toBe(false)
    expect(isValidEmail('a@b')).toBe(false)
    expect(isValidEmail('@example.com')).toBe(false)
  })
})

describe('validateBooking', () => {
  it('passes a valid back-to-back booking after an existing one', () => {
    // Acceptance: 11:00–12:00 allowed when 10:00–11:00 is booked
    expect(validateBooking(base({ start: '11:00', end: '12:00' }), existing)).toEqual(
      {},
    )
  })

  it('blocks partial overlap with a clear start-field message', () => {
    // Acceptance: 10:30–11:30 blocked when 10:00–11:00 is booked
    const errors = validateBooking(
      base({ start: '10:30', end: '11:30' }),
      existing,
    )
    expect(errors.start).toMatch(/Conflicts with/)
    expect(errors.start).toMatch(/10:00–11:00/)
  })

  it('blocks a booking that completely covers an existing one', () => {
    // Acceptance: 09:00–12:00 over 10:00–10:30 (here 10:00–11:00)
    const errors = validateBooking(
      base({ start: '09:00', end: '12:00' }),
      existing,
    )
    expect(errors.start).toMatch(/Conflicts with/)
  })

  it('blocks identical time range', () => {
    const errors = validateBooking(
      base({ start: '10:00', end: '11:00' }),
      existing,
    )
    expect(errors.start).toBeDefined()
  })

  it('requires a title', () => {
    expect(validateBooking(base({ title: '   ' }), existing).title).toMatch(
      /required/i,
    )
  })

  it('requires start before end', () => {
    expect(
      validateBooking(base({ start: '12:00', end: '11:00' }), existing).end,
    ).toMatch(/after start/i)
  })

  it('rejects equal start and end', () => {
    expect(
      validateBooking(base({ start: '11:00', end: '11:00' }), existing).end,
    ).toMatch(/after start/i)
  })

  it('rejects bookings longer than 4 hours', () => {
    expect(
      validateBooking(base({ start: '09:00', end: '13:15' }), existing).end,
    ).toMatch(/4 hours/i)
  })

  it('allows exactly 4 hours when free', () => {
    expect(
      validateBooking(base({ start: '12:00', end: '16:00' }), existing),
    ).toEqual({})
  })

  it('rejects start outside business hours', () => {
    // 08:00 is valid quarter-hour format but before day start — select may not offer it,
    // still validate defensively via direct values.
    const errors = validateBooking(base({ start: '08:00', end: '09:00' }), [])
    expect(errors.start).toMatch(/09:00/)
  })

  it('rejects end after 18:00', () => {
    const errors = validateBooking(base({ start: '17:00', end: '18:15' }), [])
    expect(errors.end).toBeDefined()
  })

  it('requires at least one attendee', () => {
    expect(validateBooking(base({ attendees: [] }), existing).attendees).toMatch(
      /at least one/i,
    )
  })

  it('rejects invalid attendee emails', () => {
    expect(
      validateBooking(base({ attendees: ['bad'] }), existing).attendees,
    ).toMatch(/not a valid email/i)
  })

  it('rejects duplicate attendee emails (case-insensitive)', () => {
    expect(
      validateBooking(
        base({ attendees: ['A@Example.com', 'a@example.com'] }),
        existing,
      ).attendees,
    ).toMatch(/unique/i)
  })

  it('allows booking immediately before an existing one', () => {
    expect(
      validateBooking(base({ start: '09:00', end: '10:00' }), existing),
    ).toEqual({})
  })

  it('ignores a booking id when excludeBookingId is set', () => {
    expect(
      validateBooking(
        base({ start: '10:00', end: '11:00' }),
        existing,
        'b1',
      ),
    ).toEqual({})
  })
})
