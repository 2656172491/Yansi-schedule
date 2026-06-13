import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import dayjs from 'dayjs'
import { fetchSchedules, createSchedule, updateSchedule as apiUpdate, deleteSchedule as apiDelete } from '../utils/api'

const defaultSchedules = [
  {
    id: 'sample-1',
    title: '产品梳理',
    date: dayjs().format('YYYY-MM-DD'),
    startTime: '09:00',
    endTime: '10:30',
    color: 'blue',
    notes: '整理本周目标和重点事项',
  },
  {
    id: 'sample-2',
    title: '运动',
    date: dayjs().add(1, 'day').format('YYYY-MM-DD'),
    startTime: '19:00',
    endTime: '20:00',
    color: 'green',
    notes: '慢跑 5 公里',
  },
]

export const useScheduleStore = defineStore('schedule', () => {
  const schedules = ref([])
  const loaded = ref(false)

  async function load() {
    try {
      const items = await fetchSchedules()
      schedules.value = items.length ? items : defaultSchedules
    } catch {
      schedules.value = defaultSchedules
    }
    loaded.value = true
  }

  const sortedSchedules = computed(() => {
    return [...schedules.value].sort((left, right) => {
      const leftValue = `${left.date} ${left.startTime}`
      const rightValue = `${right.date} ${right.startTime}`
      return leftValue.localeCompare(rightValue)
    })
  })

  function hasTimeConflict(payload, excludeId = null) {
    return schedules.value.some((item) => {
      if (item.date !== payload.date || item.id === excludeId) {
        return false
      }
      return payload.startTime < item.endTime && payload.endTime > item.startTime
    })
  }

  async function addSchedule(payload) {
    if (hasTimeConflict(payload)) {
      return { ok: false, reason: 'conflict' }
    }
    const item = { id: crypto.randomUUID(), ...payload }
    try {
      await createSchedule(item)
      schedules.value.push(item)
      return { ok: true }
    } catch (err) {
      return { ok: false, reason: 'network', error: err.message }
    }
  }

  async function updateSchedule(id, payload) {
    const index = schedules.value.findIndex((item) => item.id === id)
    if (index === -1) {
      return { ok: false, reason: 'missing' }
    }
    if (hasTimeConflict(payload, id)) {
      return { ok: false, reason: 'conflict' }
    }
    try {
      await apiUpdate(id, payload)
      schedules.value[index] = { ...schedules.value[index], ...payload }
      return { ok: true }
    } catch (err) {
      return { ok: false, reason: 'network', error: err.message }
    }
  }

  async function deleteSchedule(id) {
    try {
      await apiDelete(id)
      schedules.value = schedules.value.filter((item) => item.id !== id)
      return { ok: true }
    } catch (err) {
      return { ok: false, reason: 'network', error: err.message }
    }
  }

  function getScheduleById(id) {
    return schedules.value.find((item) => item.id === id) ?? null
  }

  const schedulesByDate = computed(() => {
    const map = new Map()
    for (const item of sortedSchedules.value) {
      if (!map.has(item.date)) map.set(item.date, [])
      map.get(item.date).push(item)
    }
    return map
  })

  function getSchedulesByDate(date) {
    return schedulesByDate.value.get(date) || []
  }

  function getSchedulesByRange(startDate, endDate) {
    return sortedSchedules.value.filter((item) => item.date >= startDate && item.date <= endDate)
  }

  return {
    schedules,
    sortedSchedules,
    loaded,
    load,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    getScheduleById,
    getSchedulesByDate,
    getSchedulesByRange,
    hasTimeConflict,
  }
})
