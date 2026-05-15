<script setup>
import { computed } from 'vue'
import dayjs from 'dayjs'
import { useCalendarStore } from '../../stores/calendar'
import { formatDisplayDate, getWeekRange } from '../../utils/date'

const calendarStore = useCalendarStore()
const emit = defineEmits(['open-management'])

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
  <header class="paper-panel rounded-[28px] px-4 py-3 lg:rounded-[36px] lg:px-5">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
      <div class="grid min-w-0 grid-cols-[64px_minmax(0,1fr)_64px] items-center gap-2 lg:flex lg:justify-start lg:gap-4">
        <div class="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-[var(--accent-deep)]">
          <span class="rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5">言寺日程</span>
        </div>
        <h1 class="display-serif min-w-0 truncate text-center text-2xl leading-none text-[var(--ink)] sm:text-3xl lg:text-left">{{ title }}</h1>
        <button
          type="button"
          class="justify-self-end rounded-full border border-[rgba(111,47,22,0.28)] bg-[var(--accent-deep)] px-2.5 py-1.5 text-xs font-semibold text-[#fff6ef] shadow-[0_10px_22px_rgba(73,44,24,0.22)] lg:hidden"
          aria-label="打开管理设置"
          @click="emit('open-management')"
        >
          ⋯ 管理
        </button>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <div class="order-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-[var(--muted)] lg:order-none">
          <span>{{ dayjs().format('YYYY') }}</span>
          <span class="h-1 w-1 rounded-full bg-[var(--accent)]"></span>
          <span>{{ dayjs().format('M月D日') }}</span>
        </div>

        <button
          class="rounded-full border border-[var(--line)] bg-white/60 px-3 py-1.5 text-xs font-medium text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent-deep)]"
          @click="calendarStore.goToToday()"
        >
          今天
        </button>
        <button
          class="rounded-full border border-[var(--line)] bg-white/60 px-3 py-1.5 text-xs font-medium text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent-deep)]"
          @click="calendarStore.movePeriod(-1)"
        >
          上一个
        </button>
        <button
          class="rounded-full border border-[var(--line)] bg-white/60 px-3 py-1.5 text-xs font-medium text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent-deep)]"
          @click="calendarStore.movePeriod(1)"
        >
          下一个
        </button>

        <div class="order-1 flex rounded-full border border-[rgba(107,79,52,0.12)] bg-[rgba(255,249,240,0.76)] p-0.5 soft-ring lg:order-none">
          <button
            class="rounded-full px-3 py-1.5 text-xs font-medium transition"
            :class="calendarStore.viewMode === 'week' ? 'bg-[var(--ink)] text-[#fff8ef]' : 'text-[var(--muted)]'"
            @click="calendarStore.setViewMode('week')"
          >
            周视图
          </button>
          <button
            class="rounded-full px-3 py-1.5 text-xs font-medium transition"
            :class="calendarStore.viewMode === 'month' ? 'bg-[var(--ink)] text-[#fff8ef]' : 'text-[var(--muted)]'"
            @click="calendarStore.setViewMode('month')"
          >
            月视图
          </button>
        </div>

        <button
          class="hidden rounded-full bg-[var(--accent-deep)] px-4 py-2 text-xs font-medium text-[#fff6ef] shadow-[0_10px_24px_rgba(111,47,22,0.18)] transition hover:bg-[var(--accent)] lg:inline-flex"
          @click="calendarStore.openCreateDialog()"
        >
          添加日程
        </button>
        <button
          class="hidden rounded-full border border-[var(--accent-deep)] px-4 py-2 text-xs font-medium text-[var(--accent-deep)] transition hover:bg-[var(--accent-deep)] hover:text-[#fff6ef] lg:inline-flex"
          @click="calendarStore.openBatchDialog()"
        >
          批量添加
        </button>
      </div>
    </div>
  </header>
</template>
