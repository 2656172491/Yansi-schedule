<script setup>
import { reactive, ref } from 'vue'
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

function createRow() {
  return {
    title: '',
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
}

function reset() {
  rows.splice(0, rows.length, createRow(), createRow(), createRow())
  sharedColor.value = 'blue'
  errorMessage.value = ''
  successCount.value = 0
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
      notes: '',
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
      class="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(36,25,15,0.28)] px-4 backdrop-blur-md"
      @click.self="handleClose()"
    >
      <section class="paper-panel flex w-full max-w-3xl flex-col rounded-[36px] p-7" style="max-height: calc(100vh - 80px);">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-[11px] uppercase tracking-[0.3em] text-[var(--accent-deep)]">批量添加</p>
            <h2 class="display-serif mt-3 text-3xl leading-none text-[var(--ink)]">一次安排多段时间</h2>
          </div>
          <button
            class="rounded-full border border-[var(--line)] bg-white/50 px-4 py-2 text-sm text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent-deep)]"
            @click="handleClose()"
          >
            关闭
          </button>
        </div>

        <p v-if="errorMessage" class="mt-4 rounded-[20px] border border-[rgba(152,74,44,0.2)] bg-[rgba(176,90,43,0.1)] px-4 py-3 text-sm text-[var(--accent-deep)]">
          {{ errorMessage }}
        </p>

        <div class="mt-5 overflow-y-auto pr-1">
          <div class="space-y-3">
            <div
              v-for="(row, index) in rows"
              :key="index"
              class="grid grid-cols-[1fr_140px_100px_100px_40px] items-end gap-3"
            >
              <div>
                <label class="mb-1 block text-xs font-medium text-[var(--muted)]">标题</label>
                <input
                  v-model="row.title"
                  class="w-full rounded-[20px] border border-[var(--line)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)] focus:bg-white"
                  placeholder="例如：健身"
                />
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-[var(--muted)]">日期</label>
                <input
                  v-model="row.date"
                  type="date"
                  class="w-full rounded-[20px] border border-[var(--line)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)] focus:bg-white"
                />
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-[var(--muted)]">开始</label>
                <input
                  v-model="row.startTime"
                  type="time"
                  class="w-full rounded-[20px] border border-[var(--line)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)] focus:bg-white"
                />
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-[var(--muted)]">结束</label>
                <input
                  v-model="row.endTime"
                  type="time"
                  class="w-full rounded-[20px] border border-[var(--line)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)] focus:bg-white"
                />
              </div>
              <button
                type="button"
                class="mb-0.5 flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[rgba(176,90,43,0.08)] hover:text-[var(--accent-deep)]"
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
