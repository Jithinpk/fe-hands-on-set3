import { useState, type FormEvent } from 'react'
import type { Booking, FieldErrors } from '../types'
import { timeOptions } from '../utils/time'
import {
  hasErrors,
  validateBooking,
  type BookingFormValues,
} from '../utils/validation'

type Props = {
  existing: Booking[]
  submitting: boolean
  apiError: string | null
  onSubmit: (values: BookingFormValues) => Promise<void>
}

const START_OPTIONS = timeOptions(false)
const END_OPTIONS = timeOptions(true)

const emptyValues = (): BookingFormValues => ({
  title: '',
  start: '09:00',
  end: '09:30',
  attendees: [],
})

export function BookingForm({
  existing,
  submitting,
  apiError,
  onSubmit,
}: Props) {
  const [values, setValues] = useState<BookingFormValues>(emptyValues)
  const [emailDraft, setEmailDraft] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})

  function updateField<K extends keyof BookingFormValues>(
    key: K,
    value: BookingFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function addAttendee() {
    const email = emailDraft.trim()
    if (!email) return
    updateField('attendees', [...values.attendees, email])
    setEmailDraft('')
    setErrors((prev) => {
      const next = { ...prev }
      delete next.attendees
      return next
    })
  }

  function removeAttendee(index: number) {
    updateField(
      'attendees',
      values.attendees.filter((_, i) => i !== index),
    )
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const nextErrors = validateBooking(values, existing)
    setErrors(nextErrors)
    if (hasErrors(nextErrors)) return

    try {
      await onSubmit(values)
      setValues(emptyValues())
      setEmailDraft('')
      setErrors({})
    } catch {
      // Parent keeps apiError; form values are preserved.
    }
  }

  return (
    <form className="booking-form" onSubmit={handleSubmit} noValidate>
      <h2>Book a meeting</h2>

      {apiError ? (
        <p className="banner error" role="alert">
          {apiError}
        </p>
      ) : null}

      <div className="field">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          type="text"
          value={values.title}
          onChange={(e) => updateField('title', e.target.value)}
          disabled={submitting}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? 'title-error' : undefined}
        />
        {errors.title ? (
          <span id="title-error" className="field-error">
            {errors.title}
          </span>
        ) : null}
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="start">Start</label>
          <select
            id="start"
            name="start"
            value={values.start}
            onChange={(e) => updateField('start', e.target.value)}
            disabled={submitting}
            aria-invalid={Boolean(errors.start)}
            aria-describedby={errors.start ? 'start-error' : undefined}
          >
            {START_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {errors.start ? (
            <span id="start-error" className="field-error">
              {errors.start}
            </span>
          ) : null}
        </div>

        <div className="field">
          <label htmlFor="end">End</label>
          <select
            id="end"
            name="end"
            value={values.end}
            onChange={(e) => updateField('end', e.target.value)}
            disabled={submitting}
            aria-invalid={Boolean(errors.end)}
            aria-describedby={errors.end ? 'end-error' : undefined}
          >
            {END_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {errors.end ? (
            <span id="end-error" className="field-error">
              {errors.end}
            </span>
          ) : null}
        </div>
      </div>

      <div className="field">
        <label htmlFor="attendee-email">Attendees</label>
        <div className="attendee-input">
          <input
            id="attendee-email"
            type="email"
            placeholder="name@example.com"
            value={emailDraft}
            onChange={(e) => setEmailDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addAttendee()
              }
            }}
            disabled={submitting}
            aria-invalid={Boolean(errors.attendees)}
            aria-describedby={errors.attendees ? 'attendees-error' : undefined}
          />
          <button
            type="button"
            className="btn secondary"
            onClick={addAttendee}
            disabled={submitting || !emailDraft.trim()}
          >
            Add
          </button>
        </div>
        {values.attendees.length > 0 ? (
          <ul className="attendee-chips">
            {values.attendees.map((email, index) => (
              <li key={`${email}-${index}`}>
                <span>{email}</span>
                <button
                  type="button"
                  className="chip-remove"
                  aria-label={`Remove ${email}`}
                  onClick={() => removeAttendee(index)}
                  disabled={submitting}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {errors.attendees ? (
          <span id="attendees-error" className="field-error">
            {errors.attendees}
          </span>
        ) : null}
      </div>

      <button type="submit" className="btn primary" disabled={submitting}>
        {submitting ? 'Booking…' : 'Book room'}
      </button>
    </form>
  )
}
