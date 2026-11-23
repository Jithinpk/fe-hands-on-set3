import type { Booking, FieldErrors } from '../types'
import {
  DAY_END,
  DAY_START,
  MAX_DURATION_MINUTES,
  intervalsOverlap,
  isQuarterHour,
  toMinutes,
} from './time'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i

export type BookingFormValues = {
  title: string
  start: string
  end: string
  attendees: string[]
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim())
}

/**
 * Validate booking form values against business rules and existing bookings.
 * Returns field-keyed errors; empty object means valid.
 */
export function validateBooking(
  values: BookingFormValues,
  existing: Booking[],
  excludeBookingId?: string,
): FieldErrors {
  const errors: FieldErrors = {}
  const title = values.title.trim()

  if (!title) {
    errors.title = 'Title is required.'
  }

  let startMins: number | null = null
  let endMins: number | null = null

  if (!values.start) {
    errors.start = 'Start time is required.'
  } else if (!isQuarterHour(values.start)) {
    errors.start = 'Start must be on a 15-minute step.'
  } else {
    startMins = toMinutes(values.start)
    if (startMins < DAY_START || startMins >= DAY_END) {
      errors.start = 'Start must be between 09:00 and 17:45.'
    }
  }

  if (!values.end) {
    errors.end = 'End time is required.'
  } else if (!isQuarterHour(values.end)) {
    errors.end = 'End must be on a 15-minute step.'
  } else {
    endMins = toMinutes(values.end)
    if (endMins <= DAY_START || endMins > DAY_END) {
      errors.end = 'End must be between 09:15 and 18:00.'
    }
  }

  if (startMins !== null && endMins !== null && !errors.start && !errors.end) {
    if (startMins >= endMins) {
      errors.end = 'End must be after start.'
    } else if (endMins - startMins > MAX_DURATION_MINUTES) {
      errors.end = 'Booking cannot exceed 4 hours.'
    } else {
      const conflict = existing.find((booking) => {
        if (excludeBookingId && booking.id === excludeBookingId) return false
        return intervalsOverlap(
          startMins,
          endMins,
          toMinutes(booking.start),
          toMinutes(booking.end),
        )
      })
      if (conflict) {
        errors.start = `Conflicts with “${conflict.title}” (${conflict.start}–${conflict.end}).`
      }
    }
  }

  const emails = values.attendees.map((e) => e.trim().toLowerCase())
  if (emails.length === 0) {
    errors.attendees = 'Add at least one attendee email.'
  } else {
    const invalid = emails.find((e) => !isValidEmail(e))
    if (invalid !== undefined) {
      errors.attendees = `"${invalid || '(empty)'}" is not a valid email.`
    } else {
      const seen = new Set<string>()
      for (const email of emails) {
        if (seen.has(email)) {
          errors.attendees = 'Attendee emails must be unique.'
          break
        }
        seen.add(email)
      }
    }
  }

  return errors
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0
}
