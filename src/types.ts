export type Room = {
  id: string
  name: string
  capacity: number
}

export type Booking = {
  id: string
  roomId: string
  date: string // YYYY-MM-DD
  title: string
  start: string // HH:MM
  end: string // HH:MM
  attendees: string[]
}

export type CreateBookingInput = {
  roomId: string
  date: string
  title: string
  start: string
  end: string
  attendees: string[]
}

export type FieldErrors = {
  title?: string
  start?: string
  end?: string
  attendees?: string
  form?: string
}
