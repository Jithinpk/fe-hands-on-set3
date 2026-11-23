import type { Booking } from '../types'

type Props = {
  bookings: Booking[]
  cancellingId: string | null
  error: string | null
  onCancel: (booking: Booking) => void
}

export function BookingList({
  bookings,
  cancellingId,
  error,
  onCancel,
}: Props) {
  if (bookings.length === 0) {
    return (
      <p className="muted empty-schedule">No bookings for this room and date.</p>
    )
  }

  return (
    <div className="booking-list">
      {error ? (
        <p className="banner error" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="schedule">
        {bookings.map((booking) => (
          <li key={booking.id} className="schedule-item">
            <div className="schedule-time">
              <time>{booking.start}</time>
              <span aria-hidden="true">–</span>
              <time>{booking.end}</time>
            </div>
            <div className="schedule-body">
              <h3>{booking.title}</h3>
              <p className="attendees">
                {booking.attendees.join(', ')}
              </p>
            </div>
            <button
              type="button"
              className="btn danger"
              disabled={cancellingId === booking.id}
              onClick={() => onCancel(booking)}
            >
              {cancellingId === booking.id ? 'Cancelling…' : 'Cancel'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
