<script setup>
import { computed } from 'vue'
import dayjs from 'dayjs'
import { useCalendarStore } from '../../stores/calendar'
import { formatDisplayDate, getWeekRange } from '../../utils/date'

const calendarStore = useCalendarStore()

const title = computed(() => {
  if (calendarStore.viewMode === 'week') {
    const { start, end } = getWeekRange(calendarStore.currentDate)
    return `${formatDisplayDate(start, 'M月D日')} — ${formatDisplayDate(end, 'M月D日')}`
  }

  return dayjs(calendarStore.currentDate).format('YYYY年M月')
})

const subtitle = computed(() => {
  return calendarStore.viewMode === 'week'
    ? '像在纸质周历上排版一样安排你的整周节奏'
    : '用整月视角回看密度、留白与重点事项'
})
</script>

<template>
  <header class="paper-panel rounded-[36px] px-7 py-7">
    <div class="flex items-start justify-between gap-6">
      <div class="max-w-2xl">
        <div class="flex items-center gap-3 text-[11px] uppercase tracking-[0.38em] text-[var(--accent-deep)]">
          <span class="rounded-full bg-[var(--accent-soft)] px-3 py-1">手作周历</span>
          <span class="h-px w-14 bg-[rgba(111,47,22,0.22)]"></span>
          <span>第 01 期</span>
        </div>
        <h1 class="display-serif mt-4 text-5xl leading-none text-[var(--ink)]">{{ title }}</h1>
        <p class="mt-3 max-w-xl text-sm leading-7 text-[var(--muted)]">{{ subtitle }}</p>
      </div>

      <div class="flex flex-col items-end gap-4">
        <div class="flex items-center gap-3 text-xs uppercase tracking-[0.32em] text-[var(--muted)]">
          <span>{{ dayjs().format('YYYY') }}</span>
          <span class="h-1.5 w-1.5 rounded-full bg-[var(--accent)]"></span>
          <span>{{ dayjs().format('M月D日') }}</span>
        </div>

        <div class="flex flex-wrap items-center justify-end gap-3">
          <button
            class="rounded-full border border-[var(--line)] bg-white/60 px-4 py-2 text-sm font-medium text-[var(--muted)] transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-[var(--accent-deep)]"
            @click="calendarStore.goToToday()"
          >
            今天
          </button>
          <button
            class="rounded-full border border-[var(--line)] bg-white/60 px-4 py-2 text-sm font-medium text-[var(--muted)] transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-[var(--accent-deep)]"
            @click="calendarStore.movePeriod(-1)"
          >
            上一个
          </button>
          <button
            class="rounded-full border border-[var(--line)] bg-white/60 px-4 py-2 text-sm font-medium text-[var(--muted)] transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-[var(--accent-deep)]"
            @click="calendarStore.movePeriod(1)"
          >
            下一个
          </button>

          <div class="flex rounded-full border border-[rgba(107,79,52,0.12)] bg-[rgba(255,249,240,0.76)] p-1 soft-ring">
            <button
              class="rounded-full px-4 py-2 text-sm font-medium transition"
              :class="calendarStore.viewMode === 'week' ? 'bg-[var(--ink)] text-[#fff8ef]' : 'text-[var(--muted)]'"
              @click="calendarStore.setViewMode('week')"
            >
              周视图
            </button>
            <button
              class="rounded-full px-4 py-2 text-sm font-medium transition"
              :class="calendarStore.viewMode === 'month' ? 'bg-[var(--ink)] text-[#fff8ef]' : 'text-[var(--muted)]'"
              @click="calendarStore.setViewMode('month')"
            >
              月视图
            </button>
          </div>

          <button
            class="rounded-full bg-[var(--accent-deep)] px-5 py-2.5 text-sm font-medium text-[#fff6ef] shadow-[0_14px_32px_rgba(111,47,22,0.22)] transition hover:-translate-y-0.5 hover:bg-[var(--accent)]"
            @click="calendarStore.openCreateDialog()"
          >
            添加日程
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
