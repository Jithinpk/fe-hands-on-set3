import {
  __getBookingsSnapshot,
  __resetBookings,
  __setFailureRate,
  __setLatencyEnabled,
  cancelBooking,
  createBooking,
  getBookings,
  getRooms,
} from './mockApi'

beforeEach(() => {
  __setLatencyEnabled(false)
  __setFailureRate(0)
  __resetBookings([])
})

describe('mockApi', () => {
  it('returns rooms', async () => {
    const rooms = await getRooms()
    expect(rooms.length).toBeGreaterThan(0)
    expect(rooms[0]).toEqual(
      expect.objectContaining({ id: expect.any(String), name: expect.any(String) }),
    )
  })

  it('creates a booking and lists it sorted by start time', async () => {
    await createBooking({
      roomId: 'alpha',
      date: '2026-11-23',
      title: 'Later',
      start: '14:00',
      end: '15:00',
      attendees: ['a@example.com'],
    })
    await createBooking({
      roomId: 'alpha',
      date: '2026-11-23',
      title: 'Earlier',
      start: '09:00',
      end: '09:30',
      attendees: ['b@example.com'],
    })

    const list = await getBookings('alpha', '2026-11-23')
    expect(list.map((b) => b.title)).toEqual(['Earlier', 'Later'])
  })

  it('rejects overlapping create even when client validation is bypassed', async () => {
    await createBooking({
      roomId: 'alpha',
      date: '2026-11-23',
      title: 'Stand-up',
      start: '10:00',
      end: '11:00',
      attendees: ['a@example.com'],
    })

    await expect(
      createBooking({
        roomId: 'alpha',
        date: '2026-11-23',
        title: 'Overlap',
        start: '10:30',
        end: '11:30',
        attendees: ['b@example.com'],
      }),
    ).rejects.toThrow(/already booked/i)
  })

  it('allows back-to-back create on the server', async () => {
    await createBooking({
      roomId: 'alpha',
      date: '2026-11-23',
      title: 'First',
      start: '10:00',
      end: '11:00',
      attendees: ['a@example.com'],
    })

    await expect(
      createBooking({
        roomId: 'alpha',
        date: '2026-11-23',
        title: 'Second',
        start: '11:00',
        end: '12:00',
        attendees: ['b@example.com'],
      }),
    ).resolves.toEqual(expect.objectContaining({ title: 'Second' }))
  })

  it('cancels a booking', async () => {
    const created = await createBooking({
      roomId: 'alpha',
      date: '2026-11-23',
      title: 'Temp',
      start: '09:00',
      end: '09:30',
      attendees: ['a@example.com'],
    })
    await cancelBooking(created.id)
    expect(await getBookings('alpha', '2026-11-23')).toEqual([])
  })

  it('fails create when failure rate is forced', async () => {
    __setFailureRate(1)
    await expect(
      createBooking({
        roomId: 'alpha',
        date: '2026-11-23',
        title: 'Will fail',
        start: '09:00',
        end: '09:30',
        attendees: ['a@example.com'],
      }),
    ).rejects.toThrow(/failed to create/i)
    expect(__getBookingsSnapshot()).toEqual([])
  })

  it('fails cancel when failure rate is forced', async () => {
    const created = await createBooking({
      roomId: 'alpha',
      date: '2026-11-23',
      title: 'Keep me',
      start: '09:00',
      end: '09:30',
      attendees: ['a@example.com'],
    })
    __setFailureRate(1)
    await expect(cancelBooking(created.id)).rejects.toThrow(/failed to cancel/i)
    expect(__getBookingsSnapshot()).toHaveLength(1)
  })

  it('scopes bookings by room and date', async () => {
    await createBooking({
      roomId: 'alpha',
      date: '2026-11-23',
      title: 'A',
      start: '09:00',
      end: '09:30',
      attendees: ['a@example.com'],
    })
    await createBooking({
      roomId: 'beta',
      date: '2026-11-23',
      title: 'B',
      start: '09:00',
      end: '09:30',
      attendees: ['b@example.com'],
    })

    expect(await getBookings('alpha', '2026-11-23')).toHaveLength(1)
    expect(await getBookings('alpha', '2026-11-24')).toHaveLength(0)
    expect(await getBookings('beta', '2026-11-23')).toHaveLength(1)
  })
})
