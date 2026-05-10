<script setup>
import { computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import CalendarToolbar from '../components/calendar/CalendarToolbar.vue'
import WeekCalendar from '../components/calendar/WeekCalendar.vue'
import MonthCalendar from '../components/calendar/MonthCalendar.vue'
import ScheduleDialog from '../components/schedule/ScheduleDialog.vue'
import { useCalendarStore } from '../stores/calendar'
import { useScheduleStore } from '../stores/schedule'
import { getEventColor } from '../utils/calendar'

const calendarStore = useCalendarStore()
const scheduleStore = useScheduleStore()

onMounted(() => {
  scheduleStore.load()
})

const selectedSchedules = computed(() => {
  return scheduleStore.getSchedulesByDate(calendarStore.selectedDate)
})

const overview = computed(() => {
  return {
    total: scheduleStore.schedules.length,
    today: selectedSchedules.value.length,
    month: scheduleStore.getSchedulesByRange(
      dayjs(calendarStore.currentDate).startOf('month').format('YYYY-MM-DD'),
      dayjs(calendarStore.currentDate).endOf('month').format('YYYY-MM-DD'),
    ).length,
  }
})

const nowDate = dayjs().format('YYYY-MM-DD')
const nowTime = dayjs().format('HH:mm')

const upcoming = computed(() => {
  return scheduleStore.sortedSchedules.filter((item) => {
    if (item.date > nowDate) return true
    if (item.date === nowDate) return item.endTime > nowTime
    return false
  })
})

const selectedDateLabel = computed(() => dayjs(calendarStore.selectedDate).format('YYYY年M月D日'))

function exportData() {
  const data = scheduleStore.schedules
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `schedules-${dayjs().format('YYYY-MM-DD')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

async function importData(event) {
  const file = event.target.files[0]
  if (!file) return
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    if (!Array.isArray(data)) throw new Error('格式错误：应为数组')
    for (const item of data) {
      if (!item.id || !item.date || !item.startTime || !item.endTime) {
        throw new Error('数据字段不完整')
      }
    }
    await chrome.storage.local.set({ schedules: data })
    await scheduleStore.load()
    event.target.value = ''
  } catch (err) {
    alert('导入失败：' + err.message)
  }
}
</script>

<template>
  <main class="min-h-screen px-6 py-6 text-[var(--ink)]">
    <div class="mx-auto max-w-[1460px] space-y-6">
      <CalendarToolbar />

      <section class="grid grid-cols-[320px_minmax(0,1fr)] gap-6">
        <aside class="space-y-6">
          <div class="paper-panel rounded-[34px] p-6">
            <p class="text-[11px] uppercase tracking-[0.3em] text-[var(--accent-deep)]">today memo</p>
            <h2 class="display-serif mt-3 text-4xl leading-none">{{ overview.today }} 条安排</h2>
            <p class="mt-3 text-sm leading-7 text-[var(--muted)]">今天的节奏会跟着你选中的日期变化。先在周视图里排时间块，再用月视图检查留白是否足够。</p>

            <div class="mt-6 grid grid-cols-2 gap-3">
              <div class="rounded-[26px] border border-[var(--line)] bg-white/55 p-4">
                <p class="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">本月</p>
                <p class="mt-3 text-3xl font-semibold">{{ overview.month }}</p>
              </div>
              <div class="rounded-[26px] border border-[var(--line)] bg-[var(--accent-soft)] p-4">
                <p class="text-xs uppercase tracking-[0.24em] text-[var(--accent-deep)]">全部</p>
                <p class="mt-3 text-3xl font-semibold text-[var(--accent-deep)]">{{ overview.total }}</p>
              </div>
            </div>
          </div>

          <div class="paper-panel rounded-[34px] p-6">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <p class="text-[11px] uppercase tracking-[0.3em] text-[var(--accent-deep)]">focus day</p>
                <div class="rounded-full border border-[var(--line)] bg-white/50 px-3 py-1 text-xs text-[var(--muted)]">
                  {{ calendarStore.viewMode === 'week' ? '周视图' : '月视图' }}
                </div>
              </div>
              <h3 class="display-serif text-3xl leading-tight">{{ selectedDateLabel }}</h3>
            </div>
            <p class="mt-3 text-sm leading-7 text-[var(--muted)]">点击日历中的空白区域可以快速新增日程，点击已有事项即可继续编辑。</p>

            <div class="mt-5 space-y-3">
              <article
                v-for="item in selectedSchedules"
                :key="item.id"
                class="rounded-[24px] border border-[var(--line)] bg-white/58 px-4 py-4 transition hover:-translate-y-0.5"
                @click="calendarStore.openEditDialog(item.id)"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="inline-flex h-2.5 w-2.5 rounded-full border border-white/70" :class="getEventColor(item.color)"></span>
                      <p class="truncate font-medium">{{ item.title }}</p>
                    </div>
                    <p class="mt-2 text-sm text-[var(--muted)]">{{ item.startTime }} — {{ item.endTime }}</p>
                  </div>
                  <button
                    type="button"
                    class="rounded-full border border-[var(--line)] bg-white/70 px-3 py-1 text-xs text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent-deep)]"
                    @click.stop="calendarStore.openEditDialog(item.id)"
                  >
                    编辑
                  </button>
                </div>
                <p v-if="item.notes" class="mt-3 text-sm leading-6 text-[var(--muted)]">{{ item.notes }}</p>
              </article>

              <p v-if="!selectedSchedules.length" class="rounded-[24px] border border-dashed border-[var(--line)] px-4 py-5 text-sm text-[var(--muted)]">
                这一天还是空白，适合预留深度工作、运动或休息时间。
              </p>
            </div>
          </div>

          <div class="paper-panel rounded-[34px] p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-[11px] uppercase tracking-[0.3em] text-[var(--accent-deep)]">up next</p>
                <h3 class="display-serif mt-2 text-3xl">接下来</h3>
              </div>
              <span class="text-xs text-[var(--muted)]">共 {{ upcoming.length }} 条</span>
            </div>

            <div class="mt-5 space-y-3">
              <article
                v-for="item in upcoming"
                :key="item.id"
                class="rounded-[24px] border border-[var(--line)] bg-white/55 px-4 py-4"
              >
                <div class="flex items-center justify-between gap-3">
                  <p class="font-medium">{{ item.title }}</p>
                  <span class="text-xs text-[var(--muted)]">{{ item.startTime }}</span>
                </div>
                <p class="mt-2 text-sm text-[var(--muted)]">{{ item.date }}</p>
              </article>

              <p v-if="!upcoming.length" class="rounded-[24px] border border-dashed border-[var(--line)] px-4 py-5 text-sm text-[var(--muted)]">
                还没有未来日程，适合先添加你的第一段固定时间块。
              </p>
            </div>
          </div>

          <div class="paper-panel rounded-[34px] p-6">
            <p class="text-[11px] uppercase tracking-[0.3em] text-[var(--accent-deep)]">data</p>
            <h3 class="display-serif mt-2 text-2xl">数据管理</h3>
            <p class="mt-2 text-sm leading-6 text-[var(--muted)]">导出 JSON 备份到本地，或从备份文件恢复数据。chrome.storage.local 无法跨设备同步。 </p>
            <div class="mt-4 flex gap-3">
              <button
                type="button"
                class="rounded-full border border-[var(--line)] bg-white/55 px-4 py-2 text-sm font-medium text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent-deep)]"
                @click="exportData"
              >
                导出备份
              </button>
              <label class="cursor-pointer rounded-full border border-[var(--line)] bg-white/55 px-4 py-2 text-sm font-medium text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent-deep)]">
                <input type="file" accept=".json" class="hidden" @change="importData" />
                导入恢复
              </label>
            </div>
          </div>
        </aside>

        <component :is="calendarStore.viewMode === 'week' ? WeekCalendar : MonthCalendar" />
      </section>
    </div>

    <ScheduleDialog />
  </main>
</template>
