import { useCallback, useEffect, useState } from 'react'
import type { Room } from '../types'
import { readRoomDateFromUrl, writeRoomDateToUrl } from '../utils/urlState'
import { todayISO } from '../utils/time'

/**
 * Keeps room + date in React state and the URL query string in sync.
 */
export function useRoomDate(rooms: Room[]) {
  const fallbackRoomId = rooms[0]?.id ?? 'alpha'
  const [roomId, setRoomId] = useState(() =>
    readRoomDateFromUrl(window.location.search, fallbackRoomId).roomId,
  )
  const [date, setDate] = useState(() =>
    readRoomDateFromUrl(window.location.search, fallbackRoomId).date,
  )

  const effectiveRoomId =
    rooms.length === 0 || rooms.some((r) => r.id === roomId)
      ? roomId
      : rooms[0].id

  useEffect(() => {
    writeRoomDateToUrl({ roomId: effectiveRoomId, date })
  }, [effectiveRoomId, date])

  const selectRoom = useCallback((id: string) => setRoomId(id), [])
  const selectDate = useCallback((next: string) => {
    setDate(next || todayISO())
  }, [])

  return { roomId: effectiveRoomId, date, selectRoom, selectDate }
}
