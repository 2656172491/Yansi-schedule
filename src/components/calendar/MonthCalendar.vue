<script setup>
import { computed } from 'vue'
import dayjs from 'dayjs'
import { useCalendarStore } from '../../stores/calendar'
import { useScheduleStore } from '../../stores/schedule'
import { getMonthDays, isSameMonth, toDateKey } from '../../utils/date'
import { getEventColor } from '../../utils/calendar'

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
  <section class="paper-panel rounded-[36px]">
    <div class="grid grid-cols-7 border-b border-[var(--line)] bg-[rgba(255,248,239,0.68)]">
      <div v-for="title in weekTitles" :key="title" class="px-4 py-4 text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
        {{ title }}
      </div>
    </div>

    <div class="grid grid-cols-7">
      <button
        v-for="item in monthDays"
        :key="item.dateKey"
        class="min-h-[172px] border-r border-b border-[var(--line)] p-4 text-left align-top transition last:border-r-0 hover:bg-white/45"
        :class="[
          item.isCurrentMonth ? 'bg-white/42 text-[var(--ink)]' : 'bg-[rgba(230,218,198,0.38)] text-[rgba(77,58,42,0.42)]',
          item.isSelected ? 'bg-[rgba(176,90,43,0.08)] ring-1 ring-[rgba(111,47,22,0.18)]' : '',
        ]"
        @click="selectDay(item.dateKey)"
        @dblclick="openDay(item.dateKey)"
      >
        <div class="flex items-center justify-between gap-2">
          <span class="display-serif text-3xl leading-none">{{ item.day.format('D') }}</span>
          <span
            v-if="item.isToday"
            class="rounded-full border border-[rgba(111,47,22,0.18)] bg-[rgba(176,90,43,0.12)] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--accent-deep)]"
          >
            今天
          </span>
        </div>

        <p class="mt-2 text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">{{ item.day.format('MMM') }}</p>

        <div class="mt-4 space-y-2">
          <article
            v-for="event in item.items.slice(0, 3)"
            :key="event.id"
            class="rounded-[20px] border px-3 py-2 text-xs shadow-[0_8px_18px_rgba(84,56,33,0.06)]"
            :class="getEventColor(event.color)"
            @click.stop="calendarStore.openEditDialog(event.id)"
          >
            <p class="truncate font-semibold">{{ event.title }}</p>
            <p class="mt-1 text-[11px] uppercase tracking-[0.14em] opacity-70">{{ event.startTime }}</p>
          </article>

          <p v-if="item.items.length > 3" class="pt-1 text-xs font-medium text-[var(--muted)]">
            + {{ item.items.length - 3 }} 条更多日程
          </p>
        </div>
      </button>
    </div>
  </section>
</template>
