<script setup>
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import { useCalendarStore } from '../../stores/calendar'
import { useScheduleStore } from '../../stores/schedule'
import { buildWeekEvents, getEventColor, getEventStyle } from '../../utils/calendar'
import { getWeekDays, hourLabels, toDateKey } from '../../utils/date'

const calendarStore = useCalendarStore()
const scheduleStore = useScheduleStore()

const collapsedEarlyHours = ref(true)
const collapsedHours = hourLabels.slice(0, 8)
const visibleHours = hourLabels.slice(8)
const CELL_HEIGHT = 40
const expandedGridHeight = `${36 + hourLabels.length * CELL_HEIGHT}px`
const collapsedGridHeight = `${36 + visibleHours.length * CELL_HEIGHT}px`

const weekDays = computed(() => getWeekDays(calendarStore.currentDate))

const schedulesByDay = computed(() => {
  return weekDays.value.map((day) => {
    const dateKey = toDateKey(day)
    const items = scheduleStore.getSchedulesByDate(dateKey)
    return {
      dateKey,
      day,
      isToday: dateKey === dayjs().format('YYYY-MM-DD'),
      isSelected: dateKey === calendarStore.selectedDate,
      items: buildWeekEvents(items, { collapseEarlyHours: collapsedEarlyHours.value }),
    }
  })
})

function openDay(dateKey, event) {
  calendarStore.setSelectedDate(dateKey)
  const rect = event.currentTarget.getBoundingClientRect()
  const y = event.clientY - rect.top
  const gridY = y - 36
  if (gridY < 0) {
    calendarStore.openCreateDialog(dateKey, { startTime: '00:00', endTime: '01:00' })
    return
  }
  let hour
  if (collapsedEarlyHours.value) {
    hour = 8 + Math.floor(gridY / CELL_HEIGHT)
  } else {
    hour = Math.floor(gridY / CELL_HEIGHT)
  }
  hour = Math.max(0, Math.min(hour, 23))
  const start = String(hour).padStart(2, '0') + ':00'
  const end = String(Math.min(hour + 1, 23)).padStart(2, '0') + ':00'
  calendarStore.openCreateDialog(dateKey, { startTime: start, endTime: end })
}

function selectDay(dateKey) {
  calendarStore.setSelectedDate(dateKey)
}
</script>

<template>
  <section class="paper-panel rounded-[36px] overflow-hidden">
    <div class="grid grid-cols-[76px_repeat(7,minmax(0,1fr))] border-b border-[var(--line)] bg-[rgba(255,248,239,0.68)]">
      <div class="border-r border-[var(--line)] px-3 py-3"></div>
      <button
        v-for="item in schedulesByDay"
        :key="item.dateKey"
        class="relative border-r border-[var(--line)] px-4 py-3 text-left last:border-r-0"
        :class="item.isSelected ? 'bg-[rgba(176,90,43,0.1)]' : 'hover:bg-white/45'"
        @click="selectDay(item.dateKey)"
      >
        <p class="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
          {{ item.day.format('ddd') }}
        </p>
        <div class="mt-2 flex items-end justify-between gap-3">
          <p class="display-serif text-2xl leading-none text-[var(--ink)]">
            {{ item.day.format('D') }}
          </p>
          <span v-if="item.isToday" class="rounded-full bg-[var(--accent-deep)] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-[#fff4eb]">
            今天
          </span>
        </div>
        <p class="mt-2 text-xs text-[var(--muted)]">{{ item.day.format('M月') }}</p>
      </button>
    </div>

    <div class="grid grid-cols-[76px_repeat(7,minmax(0,1fr))]">
      <div class="border-r border-[var(--line)] bg-[rgba(255,248,239,0.62)]">
        <button
          v-if="collapsedEarlyHours"
          type="button"
          class="flex h-9 w-full items-center justify-between gap-1 border-b border-[var(--line)] px-3 text-left text-[10px] uppercase tracking-[0.18em] text-[var(--accent-deep)] transition hover:bg-white/40"
          @click="collapsedEarlyHours = false"
        >
          <span class="shrink-0">00–08</span>
          <span class="shrink-0 rounded-full border border-[var(--line)] bg-white/75 px-2 py-0.5 text-[9px] tracking-[0.14em] text-[var(--muted)]">展开</span>
        </button>
        <button
          v-else
          type="button"
          class="flex h-9 w-full items-center justify-between gap-1 border-b border-[var(--line)] bg-[rgba(176,90,43,0.06)] px-3 text-left text-[10px] uppercase tracking-[0.18em] text-[var(--accent-deep)] transition hover:bg-[rgba(176,90,43,0.1)]"
          @click="collapsedEarlyHours = true"
        >
          <span class="shrink-0">凌晨时段</span>
          <span class="shrink-0 rounded-full border border-[var(--line)] bg-white/75 px-2 py-0.5 text-[9px] tracking-[0.14em] text-[var(--muted)]">收起</span>
        </button>

        <template v-if="collapsedEarlyHours">
          <div
            v-for="hour in visibleHours"
            :key="hour"
            class="flex h-10 items-start justify-end border-b border-[var(--line)] px-3 pt-1 text-[11px] tracking-[0.12em] text-[var(--muted)]"
          >
            {{ hour }}
          </div>
        </template>
        <template v-else>
          <div
            v-for="hour in hourLabels"
            :key="hour"
            class="flex h-10 items-start justify-end border-b border-[var(--line)] px-3 pt-1 text-[11px] tracking-[0.12em] text-[var(--muted)]"
          >
            {{ hour }}
          </div>
        </template>
      </div>

      <div
        v-for="item in schedulesByDay"
        :key="item.dateKey"
        class="relative border-r border-[var(--line)] last:border-r-0"
        :class="item.isSelected ? 'bg-[linear-gradient(180deg,rgba(176,90,43,0.05),transparent_28%)]' : 'bg-transparent'"
        :style="{ height: collapsedEarlyHours ? collapsedGridHeight : expandedGridHeight }"
      >
        <button
          class="absolute inset-0 z-0 h-full w-full"
          @click="openDay(item.dateKey, $event)"
        />

        <template v-if="collapsedEarlyHours">
          <div class="h-9 border-b border-[var(--line)] bg-[linear-gradient(90deg,rgba(176,90,43,0.03),rgba(255,255,255,0.28),rgba(176,90,43,0.03))]"></div>
          <div
            v-for="hour in visibleHours"
            :key="`${item.dateKey}-${hour}`"
            class="h-10 border-b border-[var(--line)]"
          ></div>
        </template>
        <template v-else>
          <div class="h-9 border-b border-[var(--line)]"></div>
          <div
            v-for="hour in hourLabels"
            :key="`${item.dateKey}-${hour}`"
            class="h-10 border-b border-[var(--line)]"
          ></div>
        </template>

        <article
          v-for="event in item.items"
          :key="event.id"
          class="absolute left-2 right-2 z-10 overflow-hidden rounded-[24px] border px-3 py-3 text-left shadow-[0_14px_28px_rgba(84,56,33,0.1)] transition hover:-translate-y-0.5"
          :class="[getEventColor(event.color), event.compact ? 'rounded-[18px] px-3 py-2' : '']"
          :style="{ ...getEventStyle(event.color), top: `${event.top}px`, height: `${event.height}px` }"
          @click.stop="calendarStore.openEditDialog(event.id)"
        >
          <p class="text-sm font-semibold">{{ event.title }}</p>
          <p class="mt-1 text-[11px] uppercase tracking-[0.18em] opacity-70">{{ event.startTime }} — {{ event.endTime }}</p>
          <p v-if="event.notes && !event.compact" class="mt-3 line-clamp-3 text-xs leading-6 opacity-70">{{ event.notes }}</p>
        </article>
      </div>
    </div>
  </section>
</template>
