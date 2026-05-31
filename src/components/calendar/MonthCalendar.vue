<script setup>
import { computed } from 'vue'
import dayjs from 'dayjs'
import { useCalendarStore } from '../../stores/calendar'
import { useScheduleStore } from '../../stores/schedule'
import { getMonthDays, isSameMonth, toDateKey } from '../../utils/date'
import { getEventColor, getEventStyle } from '../../utils/calendar'

const calendarStore = useCalendarStore()
const scheduleStore = useScheduleStore()

const monthDays = computed(() => {
  return getMonthDays(calendarStore.currentDate).map((day) => {
    const dateKey = toDateKey(day)
    return {
      day,
      dateKey,
      isCurrentMonth: isSameMonth(day, calendarStore.currentDate),
      isToday: dayjs(dateKey).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD'),
      isSelected: dateKey === calendarStore.selectedDate,
      items: scheduleStore.getSchedulesByDate(dateKey),
    }
  })
})

const selectedDay = computed(() => {
  return monthDays.value.find((item) => item.dateKey === calendarStore.selectedDate) || monthDays.value[0]
})

const weekTitles = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

function openDay(dateKey) {
  calendarStore.setSelectedDate(dateKey)
  calendarStore.openCreateDialog(dateKey)
}

function selectDay(dateKey) {
  calendarStore.setSelectedDate(dateKey)
}
</script>

<template>
  <section class="paper-panel grid grid-rows-[auto_auto] overflow-hidden rounded-[28px] lg:h-[calc(100vh-152px)] lg:min-h-[560px] lg:grid-rows-[auto_minmax(0,1fr)] lg:rounded-[36px]">
    <div class="grid grid-cols-7 border-b border-[var(--line)] bg-[rgba(255,248,239,0.68)]">
      <div v-for="title in weekTitles" :key="title" class="px-2 py-2 text-center text-[10px] uppercase tracking-[0.12em] text-[var(--muted)] lg:px-4 lg:py-3 lg:text-left lg:text-[11px] lg:tracking-[0.28em]">
        {{ title }}
      </div>
    </div>

    <div class="grid grid-cols-7 grid-rows-6 lg:min-h-0">
      <button
        v-for="item in monthDays"
        :key="item.dateKey"
        class="flex min-h-[58px] flex-col overflow-hidden border-r border-b border-[var(--line)] p-1.5 text-left align-top transition last:border-r-0 hover:bg-white/45 lg:min-h-0 lg:p-3"
        :class="[
          item.isCurrentMonth ? 'bg-white/42 text-[var(--ink)]' : 'bg-[rgba(230,218,198,0.38)] text-[rgba(77,58,42,0.42)]',
          item.isSelected ? 'bg-[rgba(176,90,43,0.08)] ring-1 ring-[rgba(111,47,22,0.18)]' : '',
        ]"
        @click="selectDay(item.dateKey)"
        @dblclick="openDay(item.dateKey)"
      >
        <div class="shrink-0">
          <div class="flex items-center justify-between gap-2">
            <div class="flex flex-col items-start">
              <span
                class="daily-number text-xl font-semibold leading-none lg:text-2xl"
                :class="item.isToday ? 'text-[var(--accent-deep)]' : ''"
              >{{ item.day.format('D') }}</span>
              <span
                v-if="item.isToday"
                class="mt-0.5 block h-1 w-1 rounded-full bg-[var(--accent)] lg:hidden"
              ></span>
            </div>
            <span
              v-if="item.isToday"
              class="hidden rounded-full border border-[rgba(111,47,22,0.18)] bg-[rgba(176,90,43,0.12)] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--accent-deep)] lg:inline"
            >
              今天
            </span>
          </div>

          <p class="mt-1 hidden text-[10px] uppercase tracking-[0.2em] text-[var(--muted)] lg:block">{{ item.day.format('MMM') }}</p>
        </div>

        <div class="mt-auto flex flex-wrap gap-1 pt-1 lg:hidden">
          <span
            v-for="event in item.items.slice(0, 4)"
            :key="event.id"
            class="h-2 w-2 rounded-full bg-[var(--accent)]"
            :style="getEventStyle(event.color) || undefined"
          ></span>
        </div>

        <div class="hidden-scrollbar mt-2 hidden min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1 lg:block">
          <article
            v-for="event in item.items"
            :key="event.id"
            class="rounded-[16px] border px-2.5 py-1.5 text-xs shadow-[0_8px_18px_rgba(84,56,33,0.06)]"
            :class="getEventColor(event.color)"
            :style="getEventStyle(event.color)"
            @click.stop="calendarStore.openEditDialog(event.id)"
          >
            <p class="truncate font-semibold">{{ event.title }}</p>
            <p class="mt-0.5 text-[10px] uppercase tracking-[0.12em] opacity-70">{{ event.startTime }}</p>
          </article>
        </div>
      </button>
    </div>

    <div class="space-y-2 border-t border-[var(--line)] p-4 lg:hidden">
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="text-[11px] uppercase tracking-[0.28em] text-[var(--accent-deep)]">selected</p>
          <h2 class="daily-number mt-1 text-3xl font-semibold leading-none text-[var(--ink)]">{{ selectedDay.day.format('M月D日') }}</h2>
        </div>
        <button
          type="button"
          class="mobile-card-press rounded-full border border-[var(--line)] bg-white/60 px-3 py-2 text-xs font-medium text-[var(--muted)]"
          @click="openDay(selectedDay.dateKey)"
        >
          新建
        </button>
      </div>

      <div v-if="selectedDay.items.length" class="space-y-2">
        <article
          v-for="event in selectedDay.items"
          :key="event.id"
          class="mobile-card mobile-card-press rounded-[22px] px-4 py-3 text-sm"
          :class="getEventColor(event.color)"
          :style="getEventStyle(event.color)"
          @click="calendarStore.openEditDialog(event.id)"
        >
          <div class="flex items-center justify-between gap-3">
            <p class="truncate font-semibold">{{ event.title }}</p>
            <p class="shrink-0 text-[11px] uppercase tracking-[0.14em] opacity-70">{{ event.startTime }}</p>
          </div>
        </article>
      </div>
      <button
        v-else
        type="button"
        class="mobile-empty-state mobile-card-press w-full rounded-[24px] px-4 py-8 text-sm text-[var(--muted)]"
        @click="openDay(selectedDay.dateKey)"
      >
        这一天还没有安排，点这里添加
      </button>
    </div>
  </section>
</template>
