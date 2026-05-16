<script setup>
import { nextTick, reactive, ref } from 'vue'
import dayjs from 'dayjs'
import { useCalendarStore } from '../../stores/calendar'
import { useScheduleStore } from '../../stores/schedule'
import { usePaletteStore } from '../../stores/palette'

const calendarStore = useCalendarStore()
const scheduleStore = useScheduleStore()
const paletteStore = usePaletteStore()

const rows = reactive([
  createRow(),
  createRow(),
  createRow(),
])

const sharedColor = ref('blue')
const errorMessage = ref('')
const successCount = ref(0)
const activePicker = ref(null)
const dialogPanel = ref(null)
const pickerPosition = reactive({ left: 0, top: 0 })
const pickerMonth = ref(dayjs().startOf('month'))
const weekHeaders = ['一', '二', '三', '四', '五', '六', '日']
const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

function createRow() {
  return {
    title: '',
    notes: '',
    date: calendarStore.selectedDate,
    startTime: '09:00',
    endTime: '10:00',
  }
}

function addRow() {
  rows.push(createRow())
}

function removeRow(index) {
  rows.splice(index, 1)
  activePicker.value = null
}

function reset() {
  rows.splice(0, rows.length, createRow(), createRow(), createRow())
  sharedColor.value = 'blue'
  errorMessage.value = ''
  successCount.value = 0
  activePicker.value = null
  pickerMonth.value = dayjs().startOf('month')
}

function pickerKey(index, type) {
  return `${index}-${type}`
}

function isPickerOpen(index, type) {
  return activePicker.value === pickerKey(index, type)
}

function activePickerParts() {
  if (!activePicker.value) return null
  const [index, type] = activePicker.value.split('-')
  return { index: Number(index), type }
}

function activePickerType() {
  return activePickerParts()?.type
}

function activePickerRow() {
  const parts = activePickerParts()
  if (!parts) return null
  return rows[parts.index] || null
}

function displayDate(date) {
  return date ? dayjs(date).format('YYYY年M月D日') : ''
}

function pickerDays(row) {
  const start = pickerMonth.value.startOf('month').startOf('isoWeek')
  const end = pickerMonth.value.endOf('month').endOf('isoWeek')
  const days = []
  let d = start
  while (d.isBefore(end) || d.isSame(end, 'day')) {
    const date = d.format('YYYY-MM-DD')
    days.push({
      date,
      day: d.date(),
      isCurrentMonth: d.month() === pickerMonth.value.month(),
      isToday: date === dayjs().format('YYYY-MM-DD'),
      isSelected: date === row.date,
    })
    d = d.add(1, 'day')
  }
  return days
}

function prevMonth() {
  pickerMonth.value = pickerMonth.value.subtract(1, 'month')
}

function nextMonth() {
  pickerMonth.value = pickerMonth.value.add(1, 'month')
}

function scrollToActive(index, type) {
  nextTick(() => {
    const picker = document.querySelector(`[data-batch-picker="${pickerKey(index, type)}"]`)
    const active = picker?.querySelector('[data-active]')
    active?.scrollIntoView({ block: 'center', behavior: 'instant' })
  })
}

function updatePickerPosition(event, type) {
  const target = event?.currentTarget
  const panel = dialogPanel.value
  if (!target || !panel) return

  const rect = target.getBoundingClientRect()
  const panelRect = panel.getBoundingClientRect()
  const width = type === 'date' ? 280 : 200
  const height = type === 'date' ? 330 : 270
  const gap = 8
  const margin = 12
  const maxLeft = panelRect.width - width - margin
  const belowTop = rect.bottom - panelRect.top + gap
  const aboveTop = rect.top - panelRect.top - height - gap

  pickerPosition.left = Math.max(margin, Math.min(rect.left - panelRect.left, maxLeft))
  pickerPosition.top = belowTop + height <= panelRect.height - margin
    ? belowTop
    : Math.max(margin, aboveTop)
}

function openPicker(index, type, row, event) {
  const key = pickerKey(index, type)
  if (activePicker.value === key) {
    activePicker.value = null
    return
  }

  activePicker.value = key
  updatePickerPosition(event, type)
  if (type === 'date' && row.date) {
    pickerMonth.value = dayjs(row.date).startOf('month')
  }
  if (type === 'start' || type === 'end') {
    scrollToActive(index, type)
  }

  nextTick(() => {
    document.addEventListener('click', () => { activePicker.value = null }, { once: true })
  })
}

function selectDate(row, date) {
  row.date = date
  activePicker.value = null
}

function selectHour(row, field, hour) {
  const minute = row[field]?.split(':')[1] || '00'
  row[field] = `${hour}:${minute}`
}

function selectMinute(row, field, minute) {
  const fallbackHour = field === 'startTime' ? '09' : '10'
  const hour = row[field]?.split(':')[0] || fallbackHour
  row[field] = `${hour}:${minute}`
  activePicker.value = null
}

async function handleSubmit() {
  errorMessage.value = ''
  successCount.value = 0

  const validRows = rows.filter((r) => r.title.trim())
  if (validRows.length === 0) {
    errorMessage.value = '请至少填写一条日程标题。'
    return
  }

  for (const row of validRows) {
    const payload = {
      title: row.title.trim(),
      date: row.date,
      startTime: row.startTime,
      endTime: row.endTime,
      color: sharedColor.value,
      notes: row.notes.trim(),
    }

    const result = await scheduleStore.addSchedule(payload)
    if (!result.ok && result.reason === 'conflict') {
      errorMessage.value = `「${payload.title}」与已有安排冲突，请调整时间。`
      return
    }
    if (result.ok) {
      successCount.value++
    }
  }

  calendarStore.closeBatchDialog()
  reset()
}

function handleClose() {
  calendarStore.closeBatchDialog()
  reset()
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="calendarStore.batchDialogOpen"
      class="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(36,25,15,0.28)] px-3 pb-0 pt-12 backdrop-blur-md sm:px-4 lg:items-center lg:p-4"
      @click.self="handleClose()"
    >
      <section ref="dialogPanel" class="paper-panel bottom-sheet flex max-h-[calc(100dvh-48px)] w-full max-w-4xl flex-col rounded-t-[30px] p-5 lg:rounded-[36px] lg:p-7" style="max-height: calc(100vh - 80px);">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <p class="text-[11px] uppercase tracking-[0.3em] text-[var(--accent-deep)]">批量添加</p>
            <h2 class="display-serif mt-3 text-3xl leading-none text-[var(--ink)]">一次安排多段时间</h2>
          </div>
          <button
            class="shrink-0 rounded-full border border-[var(--line)] bg-white/50 px-4 py-2 text-sm text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent-deep)]"
            @click="handleClose()"
          >
            关闭
          </button>
        </div>

        <p v-if="errorMessage" class="mt-4 rounded-[20px] border border-[rgba(152,74,44,0.2)] bg-[rgba(176,90,43,0.1)] px-4 py-3 text-sm text-[var(--accent-deep)]">
          {{ errorMessage }}
        </p>

        <div class="mt-5 overflow-y-auto pr-1" @scroll="activePicker = null">
          <div class="space-y-3">
            <div
              v-for="(row, index) in rows"
              :key="index"
              class="grid grid-cols-[minmax(0,1fr)_40px] gap-3 rounded-[24px] border border-[var(--line)] bg-white/35 p-3 lg:grid-cols-[minmax(112px,0.7fr)_minmax(160px,1fr)_158px_104px_104px_40px] lg:items-end lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0"
            >
              <div class="min-w-0">
                <label class="mb-1 block text-xs font-medium text-[var(--muted)]">标题</label>
                <input
                  v-model="row.title"
                  class="w-full rounded-[20px] border border-[var(--line)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)] focus:bg-white"
                  placeholder="例如：健身"
                />
              </div>
              <button
                type="button"
                class="mt-5 flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[rgba(176,90,43,0.08)] hover:text-[var(--accent-deep)] lg:hidden"
                @click="removeRow(index)"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              <div class="col-span-2 min-w-0 lg:col-span-1">
                <label class="mb-1 block text-xs font-medium text-[var(--muted)]">备注</label>
                <input
                  v-model="row.notes"
                  class="w-full rounded-[20px] border border-[var(--line)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)] focus:bg-white"
                  placeholder="可选"
                />
              </div>
              <div class="relative col-span-2 lg:col-span-1">
                <label class="mb-1 block text-xs font-medium text-[var(--muted)]">日期</label>
                <div
                  class="flex w-full cursor-pointer items-center justify-between gap-2 rounded-[20px] border border-[var(--line)] bg-white/55 px-3 py-2 text-sm transition hover:border-[var(--accent)]"
                  :class="{ 'border-[var(--accent)] ring-1 ring-[var(--accent-soft)]': isPickerOpen(index, 'date') }"
                  @click.stop="openPicker(index, 'date', row, $event)"
                >
                  <span class="whitespace-nowrap" :class="row.date ? 'text-[var(--ink)]' : 'text-[var(--muted)]'">{{ displayDate(row.date) || '选择日期' }}</span>
                  <svg class="h-4 w-4 shrink-0 text-[var(--muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>

              </div>
              <div class="relative">
                <label class="mb-1 block text-xs font-medium text-[var(--muted)]">开始</label>
                <div
                  class="flex w-full cursor-pointer items-center justify-between gap-2 rounded-[20px] border border-[var(--line)] bg-white/55 px-3 py-2 text-sm transition hover:border-[var(--accent)]"
                  :class="{ 'border-[var(--accent)] ring-1 ring-[var(--accent-soft)]': isPickerOpen(index, 'start') }"
                  @click.stop="openPicker(index, 'start', row, $event)"
                >
                  <span class="text-[var(--ink)]">{{ row.startTime }}</span>
                  <svg class="h-4 w-4 shrink-0 text-[var(--muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>

              </div>
              <div class="relative">
                <label class="mb-1 block text-xs font-medium text-[var(--muted)]">结束</label>
                <div
                  class="flex w-full cursor-pointer items-center justify-between gap-2 rounded-[20px] border border-[var(--line)] bg-white/55 px-3 py-2 text-sm transition hover:border-[var(--accent)]"
                  :class="{ 'border-[var(--accent)] ring-1 ring-[var(--accent-soft)]': isPickerOpen(index, 'end') }"
                  @click.stop="openPicker(index, 'end', row, $event)"
                >
                  <span class="text-[var(--ink)]">{{ row.endTime }}</span>
                  <svg class="h-4 w-4 shrink-0 text-[var(--muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>

              </div>
              <button
                type="button"
                class="mb-0.5 hidden h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[rgba(176,90,43,0.08)] hover:text-[var(--accent-deep)] lg:flex"
                @click="removeRow(index)"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>

          <button
            type="button"
            class="mt-3 flex items-center gap-2 rounded-full border border-dashed border-[var(--line)] px-4 py-2 text-sm text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent-deep)]"
            @click="addRow"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            添加一行
          </button>
        </div>

        <div
          v-if="activePickerType() === 'date' && activePickerRow()"
          class="paper-panel !absolute z-[60] w-[280px] max-w-[calc(100%_-_24px)] rounded-[24px] p-4 shadow-[0_20px_60px_rgba(36,25,15,0.18)]"
          :data-batch-picker="activePicker"
          :style="{ left: `${pickerPosition.left}px`, top: `${pickerPosition.top}px` }"
          @click.stop
        >
          <div class="flex items-center justify-between px-1 pb-3">
            <button type="button" class="rounded-full p-1 transition hover:bg-[var(--accent-soft)]" @click="prevMonth">
              <svg class="h-4 w-4 text-[var(--muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <span class="text-sm font-medium text-[var(--ink)]">{{ pickerMonth.format('YYYY年M月') }}</span>
            <button type="button" class="rounded-full p-1 transition hover:bg-[var(--accent-soft)]" @click="nextMonth">
              <svg class="h-4 w-4 text-[var(--muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
          <div class="grid grid-cols-7 gap-1 text-center">
            <div v-for="h in weekHeaders" :key="h" class="py-1 text-[11px] font-medium uppercase tracking-wider text-[var(--muted)]">{{ h }}</div>
            <button
              v-for="d in pickerDays(activePickerRow())"
              :key="d.date"
              type="button"
              class="rounded-xl py-1.5 text-sm transition"
              :class="{
                'bg-[var(--accent-deep)] text-white font-medium shadow-sm': d.isSelected,
                'text-[var(--ink)] hover:bg-[var(--accent-soft)]': d.isCurrentMonth && !d.isSelected,
                'text-[var(--muted)] opacity-40 hover:bg-[var(--accent-soft)]/40': !d.isCurrentMonth && !d.isSelected,
                'ring-1 ring-[var(--accent-deep)] ring-offset-1 ring-offset-white/60': d.isToday && !d.isSelected,
              }"
              @click="selectDate(activePickerRow(), d.date)"
            >
              {{ d.day }}
            </button>
          </div>
        </div>

        <div
          v-if="activePickerType() === 'start' && activePickerRow()"
          class="paper-panel !absolute z-[60] w-[200px] rounded-[24px] p-3 shadow-[0_20px_60px_rgba(36,25,15,0.18)]"
          :data-batch-picker="activePicker"
          :style="{ left: `${pickerPosition.left}px`, top: `${pickerPosition.top}px` }"
          @click.stop
        >
          <div class="flex h-[240px] gap-2">
            <div class="flex-1 overflow-y-auto">
              <div class="space-y-1 pr-1">
                <button
                  v-for="h in hours"
                  :key="h"
                  type="button"
                  class="w-full rounded-xl py-1.5 text-center text-sm transition"
                  :class="activePickerRow().startTime?.startsWith(h + ':') ? 'bg-[var(--accent-deep)] text-white font-medium shadow-sm' : 'text-[var(--ink)] hover:bg-[var(--accent-soft)]'"
                  :data-active="activePickerRow().startTime?.startsWith(h + ':') || undefined"
                  @click="selectHour(activePickerRow(), 'startTime', h)"
                >
                  {{ h }}
                </button>
              </div>
            </div>
            <div class="w-px bg-[var(--line)]"></div>
            <div class="flex-1 overflow-y-auto">
              <div class="space-y-1 pr-1">
                <button
                  v-for="m in minutes"
                  :key="m"
                  type="button"
                  class="w-full rounded-xl py-1.5 text-center text-sm transition"
                  :class="activePickerRow().startTime?.endsWith(':' + m) ? 'bg-[var(--accent-deep)] text-white font-medium shadow-sm' : 'text-[var(--ink)] hover:bg-[var(--accent-soft)]'"
                  :data-active="activePickerRow().startTime?.endsWith(':' + m) || undefined"
                  @click="selectMinute(activePickerRow(), 'startTime', m)"
                >
                  {{ m }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="activePickerType() === 'end' && activePickerRow()"
          class="paper-panel !absolute z-[60] w-[200px] rounded-[24px] p-3 shadow-[0_20px_60px_rgba(36,25,15,0.18)]"
          :data-batch-picker="activePicker"
          :style="{ left: `${pickerPosition.left}px`, top: `${pickerPosition.top}px` }"
          @click.stop
        >
          <div class="flex h-[240px] gap-2">
            <div class="flex-1 overflow-y-auto">
              <div class="space-y-1 pr-1">
                <button
                  v-for="h in hours"
                  :key="h"
                  type="button"
                  class="w-full rounded-xl py-1.5 text-center text-sm transition"
                  :class="activePickerRow().endTime?.startsWith(h + ':') ? 'bg-[var(--accent-deep)] text-white font-medium shadow-sm' : 'text-[var(--ink)] hover:bg-[var(--accent-soft)]'"
                  :data-active="activePickerRow().endTime?.startsWith(h + ':') || undefined"
                  @click="selectHour(activePickerRow(), 'endTime', h)"
                >
                  {{ h }}
                </button>
              </div>
            </div>
            <div class="w-px bg-[var(--line)]"></div>
            <div class="flex-1 overflow-y-auto">
              <div class="space-y-1 pr-1">
                <button
                  v-for="m in minutes"
                  :key="m"
                  type="button"
                  class="w-full rounded-xl py-1.5 text-center text-sm transition"
                  :class="activePickerRow().endTime?.endsWith(':' + m) ? 'bg-[var(--accent-deep)] text-white font-medium shadow-sm' : 'text-[var(--ink)] hover:bg-[var(--accent-soft)]'"
                  :data-active="activePickerRow().endTime?.endsWith(':' + m) || undefined"
                  @click="selectMinute(activePickerRow(), 'endTime', m)"
                >
                  {{ m }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-5">
          <label class="mb-2 block text-sm font-medium text-[var(--muted)]">统一色签</label>
          <div class="flex flex-wrap gap-3">
            <button
              v-for="item in paletteStore.palettes"
              :key="item.value"
              type="button"
              class="rounded-full border px-4 py-2 text-sm transition"
              :class="sharedColor === item.color ? 'border-[var(--accent-deep)] bg-[var(--accent-deep)] text-[#fff6ef]' : 'border-[var(--line)] bg-white/55 text-[var(--muted)] hover:border-[var(--accent)]'"
              @click="sharedColor = item.color"
            >
              {{ item.label }}
            </button>
          </div>
        </div>

        <div class="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            class="rounded-full border border-[var(--line)] bg-white/55 px-5 py-2 text-sm font-medium text-[var(--muted)]"
            @click="handleClose()"
          >
            取消
          </button>
          <button
            type="button"
            class="rounded-full bg-[var(--accent-deep)] px-6 py-2 text-sm font-medium text-[#fff6ef] shadow-[0_14px_32px_rgba(111,47,22,0.22)] transition hover:-translate-y-0.5 hover:bg-[var(--accent)]"
            @click="handleSubmit"
          >
            保存全部
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>
