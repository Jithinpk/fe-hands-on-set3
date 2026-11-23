import {
  DAY_END,
  DAY_START,
  fromMinutes,
  intervalsOverlap,
  isQuarterHour,
  timeOptions,
  toMinutes,
} from './time'

describe('toMinutes / fromMinutes', () => {
  it('round-trips common times', () => {
    expect(toMinutes('09:00')).toBe(DAY_START)
    expect(toMinutes('18:00')).toBe(DAY_END)
    expect(fromMinutes(10 * 60 + 30)).toBe('10:30')
  })

  it('rejects invalid time strings', () => {
    expect(() => toMinutes('9:00')).toThrow()
    expect(() => toMinutes('24:00')).toThrow()
    expect(() => toMinutes('10:60')).toThrow()
  })
})

describe('isQuarterHour', () => {
  it('accepts 15-minute boundaries', () => {
    expect(isQuarterHour('09:00')).toBe(true)
    expect(isQuarterHour('09:15')).toBe(true)
    expect(isQuarterHour('09:30')).toBe(true)
    expect(isQuarterHour('09:45')).toBe(true)
  })

  it('rejects off-grid times', () => {
    expect(isQuarterHour('09:10')).toBe(false)
    expect(isQuarterHour('09:01')).toBe(false)
  })
})

describe('intervalsOverlap (half-open)', () => {
  const t = toMinutes

  it('allows back-to-back bookings', () => {
    expect(intervalsOverlap(t('10:00'), t('11:00'), t('11:00'), t('12:00'))).toBe(
      false,
    )
  })

  it('detects partial overlap (acceptance: 10:30–11:30 vs 10:00–11:00)', () => {
    expect(intervalsOverlap(t('10:30'), t('11:30'), t('10:00'), t('11:00'))).toBe(
      true,
    )
  })

  it('detects complete cover (acceptance: 09:00–12:00 over 10:00–10:30)', () => {
    expect(intervalsOverlap(t('09:00'), t('12:00'), t('10:00'), t('10:30'))).toBe(
      true,
    )
  })

  it('detects being completely covered', () => {
    expect(intervalsOverlap(t('10:00'), t('10:30'), t('09:00'), t('12:00'))).toBe(
      true,
    )
  })

  it('detects identical intervals', () => {
    expect(intervalsOverlap(t('10:00'), t('11:00'), t('10:00'), t('11:00'))).toBe(
      true,
    )
  })

  it('allows non-overlapping earlier/later slots', () => {
    expect(intervalsOverlap(t('09:00'), t('10:00'), t('10:00'), t('11:00'))).toBe(
      false,
    )
    expect(intervalsOverlap(t('12:00'), t('13:00'), t('10:00'), t('11:00'))).toBe(
      false,
    )
  })
})

describe('timeOptions', () => {
  it('starts at 09:00 and ends before 18:00 for start times', () => {
    const options = timeOptions(false)
    expect(options[0]).toBe('09:00')
    expect(options.at(-1)).toBe('17:45')
  })

  it('includes 18:00 when end boundary is requested', () => {
    const options = timeOptions(true)
    expect(options.at(-1)).toBe('18:00')
  })
})
