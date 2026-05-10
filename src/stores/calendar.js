import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import dayjs from 'dayjs'

export const useCalendarStore = defineStore('calendar', () => {
  const viewMode = ref('week')
  const currentDate = ref(dayjs().format('YYYY-MM-DD'))
  const selectedDate = ref(dayjs().format('YYYY-MM-DD'))
  const dialogOpen = ref(false)
  const editingScheduleId = ref(null)
  const draftSchedule = ref(null)

  const currentDay = computed(() => dayjs(currentDate.value))

  function setViewMode(mode) {
    viewMode.value = mode
  }

  function goToToday() {
    const today = dayjs().format('YYYY-MM-DD')
    currentDate.value = today
    selectedDate.value = today
  }

  function movePeriod(step) {
    const unit = viewMode.value === 'week' ? 'week' : 'month'
    currentDate.value = dayjs(currentDate.value).add(step, unit).format('YYYY-MM-DD')
  }

  function setSelectedDate(date) {
    selectedDate.value = date
  }

  function openCreateDialog(date = selectedDate.value, draft = null) {
    selectedDate.value = date
    editingScheduleId.value = null
    draftSchedule.value = draft
    dialogOpen.value = true
  }

  function openEditDialog(id) {
    editingScheduleId.value = id
    draftSchedule.value = null
    dialogOpen.value = true
  }

  function closeDialog() {
    dialogOpen.value = false
    editingScheduleId.value = null
    draftSchedule.value = null
  }

  return {
    viewMode,
    currentDate,
    selectedDate,
    dialogOpen,
    editingScheduleId,
    draftSchedule,
    currentDay,
    setViewMode,
    goToToday,
    movePeriod,
    setSelectedDate,
    openCreateDialog,
    openEditDialog,
    closeDialog,
  }
})
