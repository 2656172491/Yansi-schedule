import { describe, it, expect } from 'vitest'

// 提取冲突检测逻辑
function hasTimeConflict(schedules, payload, excludeId = null) {
  return schedules.some((item) => {
    if (item.date !== payload.date || item.id === excludeId) {
      return false
    }
    return payload.startTime < item.endTime && payload.endTime > item.startTime
  })
}

describe('hasTimeConflict', () => {
  const existing = [
    { id: '1', date: '2026-06-13', startTime: '09:00', endTime: '10:00' },
    { id: '2', date: '2026-06-13', startTime: '14:00', endTime: '15:30' },
    { id: '3', date: '2026-06-14', startTime: '09:00', endTime: '10:00' },
  ]

  it('检测完全重叠的时间段', () => {
    const result = hasTimeConflict(existing, {
      date: '2026-06-13', startTime: '09:00', endTime: '10:00'
    })
    expect(result).toBe(true)
  })

  it('检测部分重叠（新日程开始在已有日程内）', () => {
    const result = hasTimeConflict(existing, {
      date: '2026-06-13', startTime: '09:30', endTime: '10:30'
    })
    expect(result).toBe(true)
  })

  it('检测部分重叠（新日程结束在已有日程内）', () => {
    const result = hasTimeConflict(existing, {
      date: '2026-06-13', startTime: '08:30', endTime: '09:30'
    })
    expect(result).toBe(true)
  })

  it('不冲突：相邻时间段（前）', () => {
    const result = hasTimeConflict(existing, {
      date: '2026-06-13', startTime: '08:00', endTime: '09:00'
    })
    expect(result).toBe(false)
  })

  it('不冲突：相邻时间段（后）', () => {
    const result = hasTimeConflict(existing, {
      date: '2026-06-13', startTime: '10:00', endTime: '11:00'
    })
    expect(result).toBe(false)
  })

  it('不冲突：不同日期', () => {
    const result = hasTimeConflict(existing, {
      date: '2026-06-15', startTime: '09:00', endTime: '10:00'
    })
    expect(result).toBe(false)
  })

  it('排除自身 ID 后不冲突', () => {
    const result = hasTimeConflict(existing, {
      date: '2026-06-13', startTime: '09:00', endTime: '10:00'
    }, '1')
    expect(result).toBe(false)
  })

  it('检测包含关系（新日程完全包含已有日程）', () => {
    const result = hasTimeConflict(existing, {
      date: '2026-06-13', startTime: '08:00', endTime: '11:00'
    })
    expect(result).toBe(true)
  })
})
