import { toTimeNumber } from './date'

const HOUR_HEIGHT = 64
const COLLAPSED_END_HOUR = 8
const COLLAPSED_HEIGHT = 36
const COLLAPSED_RATIO = COLLAPSED_HEIGHT / (COLLAPSED_END_HOUR * HOUR_HEIGHT)

export function buildWeekEvents(schedules, options = {}) {
  const collapseEarlyHours = options.collapseEarlyHours ?? false

  return schedules.map((item) => {
    const start = toTimeNumber(item.startTime)
    const end = toTimeNumber(item.endTime)
    const duration = Math.max(end - start, 0.5)

    let top = start * HOUR_HEIGHT
    let height = duration * HOUR_HEIGHT
    let compact = false

    if (collapseEarlyHours) {
      if (end <= COLLAPSED_END_HOUR) {
        const compactTop = start * HOUR_HEIGHT * COLLAPSED_RATIO
        const compactHeight = Math.max(duration * HOUR_HEIGHT * COLLAPSED_RATIO, 18)
        top = compactTop
        height = compactHeight
        compact = true
      } else if (start < COLLAPSED_END_HOUR) {
        const overflow = end - COLLAPSED_END_HOUR
        top = 6
        height = COLLAPSED_HEIGHT - 12 + overflow * HOUR_HEIGHT
        compact = true
      } else {
        top = COLLAPSED_HEIGHT + (start - COLLAPSED_END_HOUR) * HOUR_HEIGHT
      }
    }

    return {
      ...item,
      top,
      height,
      compact,
    }
  })
}

export function getEventColor(color) {
  const palette = {
    blue: 'bg-blue-500/15 border-blue-400 text-blue-950',
    green: 'bg-emerald-500/15 border-emerald-400 text-emerald-950',
    purple: 'bg-violet-500/15 border-violet-400 text-violet-950',
    orange: 'bg-orange-500/15 border-orange-400 text-orange-950',
    pink: 'bg-pink-500/15 border-pink-400 text-pink-950',
  }

  return palette[color] ?? palette.blue
}
