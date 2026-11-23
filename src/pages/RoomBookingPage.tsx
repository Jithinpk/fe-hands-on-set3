import { useEffect, useState } from 'react'
import {
  cancelBooking,
  createBooking,
  getBookings,
  getRooms,
} from '../api/mockApi'
import { BookingForm } from '../components/BookingForm'
import { BookingList } from '../components/BookingList'
import { useRoomDate } from '../hooks/useRoomDate'
import type { Booking, Room } from '../types'
import type { BookingFormValues } from '../utils/validation'

export function RoomBookingPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [roomsError, setRoomsError] = useState<string | null>(null)
  const [roomsLoaded, setRoomsLoaded] = useState(false)

  const { roomId, date, selectRoom, selectDate } = useRoomDate(rooms)

  const [bookings, setBookings] = useState<Booking[]>([])
  const [bookingsKey, setBookingsKey] = useState<string | null>(null)
  const [bookingsError, setBookingsError] = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [cancelError, setCancelError] = useState<string | null>(null)

  const roomsLoading = !roomsLoaded
  const scheduleKey = `${roomId}|${date}`
  const bookingsLoading = Boolean(roomId && date) && bookingsKey !== scheduleKey

  useEffect(() => {
    let cancelled = false
    getRooms()
      .then((data) => {
        if (!cancelled) {
          setRooms(data)
          setRoomsError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setRoomsError(
            err instanceof Error ? err.message : 'Failed to load rooms.',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setRoomsLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!roomId || !date) return
    let cancelled = false

    getBookings(roomId, date)
      .then((data) => {
        if (cancelled) return
        setBookings(data)
        setBookingsError(null)
        setCancelError(null)
        setCreateError(null)
        setBookingsKey(`${roomId}|${date}`)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setBookings([])
        setBookingsError(
          err instanceof Error ? err.message : 'Failed to load bookings.',
        )
        setBookingsKey(`${roomId}|${date}`)
      })

    return () => {
      cancelled = true
    }
  }, [roomId, date])

  async function handleCreate(values: BookingFormValues) {
    setSubmitting(true)
    setCreateError(null)
    try {
      const created = await createBooking({
        roomId,
        date,
        title: values.title,
        start: values.start,
        end: values.end,
        attendees: values.attendees,
      })
      setBookings((prev) =>
        [...prev, created].sort((a, b) => a.start.localeCompare(b.start)),
      )
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create booking.'
      setCreateError(message)
      throw err
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCancel(booking: Booking) {
    const confirmed = window.confirm(
      `Cancel “${booking.title}” (${booking.start}–${booking.end})?`,
    )
    if (!confirmed) return

    setCancelError(null)
    setCancellingId(booking.id)
    setBookings((prev) => prev.filter((b) => b.id !== booking.id))

    try {
      await cancelBooking(booking.id)
    } catch (err: unknown) {
      setBookings((prev) =>
        [...prev, booking].sort((a, b) => a.start.localeCompare(b.start)),
      )
      setCancelError(
        err instanceof Error ? err.message : 'Failed to cancel booking.',
      )
    } finally {
      setCancellingId(null)
    }
  }

  const selectedRoom = rooms.find((r) => r.id === roomId)

  return (
    <div className="page">
      <header className="page-header">
        <h1>Room Booking</h1>
        <p className="lede">
          Pick a room and date to view the day&apos;s schedule (09:00–18:00) and
          book a meeting.
        </p>
      </header>

      <section className="controls" aria-label="Room and date">
        <div className="field">
          <label htmlFor="room">Room</label>
          <select
            id="room"
            value={roomId}
            onChange={(e) => selectRoom(e.target.value)}
            disabled={roomsLoading || rooms.length === 0}
          >
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name} (cap. {room.capacity})
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="date">Date</label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => selectDate(e.target.value)}
          />
        </div>
      </section>

      {roomsError ? (
        <p className="banner error" role="alert">
          {roomsError}
        </p>
      ) : null}

      <div className="layout">
        <section className="panel" aria-labelledby="schedule-heading">
          <div className="panel-heading">
            <h2 id="schedule-heading">
              Schedule
              {selectedRoom ? ` — ${selectedRoom.name}` : ''}
            </h2>
            <p className="muted">{date}</p>
          </div>

          {bookingsLoading ? (
            <p className="muted">Loading bookings…</p>
          ) : bookingsError ? (
            <p className="banner error" role="alert">
              {bookingsError}
            </p>
          ) : (
            <BookingList
              bookings={bookings}
              cancellingId={cancellingId}
              error={cancelError}
              onCancel={handleCancel}
            />
          )}
        </section>

        <section className="panel" aria-label="Booking form">
          <BookingForm
            existing={bookingsLoading ? [] : bookings}
            submitting={submitting || bookingsLoading}
            apiError={createError}
            onSubmit={handleCreate}
          />
        </section>
      </div>
    </div>
  )
}
