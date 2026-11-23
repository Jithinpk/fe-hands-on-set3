import { todayISO } from './time'

export type RoomDateParams = {
  roomId: string
  date: string
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function readRoomDateFromUrl(
  search: string,
  fallbackRoomId: string,
): RoomDateParams {
  const params = new URLSearchParams(search)
  const roomId = params.get('room')?.trim() || fallbackRoomId
  const rawDate = params.get('date')?.trim() ?? ''
  const date = DATE_RE.test(rawDate) ? rawDate : todayISO()
  return { roomId, date }
}

export function writeRoomDateToUrl({ roomId, date }: RoomDateParams): void {
  const params = new URLSearchParams(window.location.search)
  params.set('room', roomId)
  params.set('date', date)
  const next = `${window.location.pathname}?${params.toString()}`
  window.history.replaceState(null, '', next)
}
