import { readRoomDateFromUrl } from './urlState'

describe('readRoomDateFromUrl', () => {
  it('reads room and date from the query string', () => {
    expect(readRoomDateFromUrl('?room=beta&date=2026-11-23', 'alpha')).toEqual({
      roomId: 'beta',
      date: '2026-11-23',
    })
  })

  it('falls back to the default room when missing', () => {
    const result = readRoomDateFromUrl('?date=2026-11-23', 'alpha')
    expect(result.roomId).toBe('alpha')
    expect(result.date).toBe('2026-11-23')
  })

  it('falls back to today when date is invalid', () => {
    const result = readRoomDateFromUrl('?room=alpha&date=not-a-date', 'alpha')
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
