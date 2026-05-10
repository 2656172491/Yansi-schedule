<script setup>
import { computed, reactive, ref, watch, nextTick } from 'vue'
import dayjs from 'dayjs'
import { useCalendarStore } from '../../stores/calendar'
import { useScheduleStore } from '../../stores/schedule'

const calendarStore = useCalendarStore()
const scheduleStore = useScheduleStore()

const palette = [
  { label: '陶土', value: 'blue' },
  { label: '苔绿', value: 'green' },
  { label: '暮紫', value: 'purple' },
  { label: '暖橙', value: 'orange' },
  { label: '雾粉', value: 'pink' },
]

const form = reactive({
  title: '',
  date: calendarStore.selectedDate,
  startTime: '09:00',
  endTime: '10:00',
  color: 'blue',
  notes: '',
})

const errorMessage = ref('')
const activePicker = ref(null)

const startHourList = ref(null)
const startMinuteList = ref(null)
const endHourList = ref(null)
const endMinuteList = ref(null)

const editingItem = computed(() => {
  if (!calendarStore.editingScheduleId) return null
  return scheduleStore.getScheduleById(calendarStore.editingScheduleId)
})

watch(
  () => [calendarStore.dialogOpen, calendarStore.selectedDate, calendarStore.editingScheduleId],
  () => {
    if (!calendarStore.dialogOpen) return
    errorMessage.value = ''
    activePicker.value = null

    if (editingItem.value) {
      Object.assign(form, editingItem.value)
      return
    }

    const draft = calendarStore.draftSchedule
    Object.assign(form, {
      title: '',
      date: calendarStore.selectedDate,
      startTime: draft?.startTime || '09:00',
      endTime: draft?.endTime || '10:00',
      color: 'blue',
      notes: '',
    })
  },
  { immediate: true },
)

// ===== Date Picker =====
const showDatePicker = computed(() => activePicker.value === 'date')
const pickerMonth = ref(dayjs().startOf('month'))
const displayDate = computed(() => form.date ? dayjs(form.date).format('YYYY年M月D日') : '')

const pickerDays = computed(() => {
  const start = pickerMonth.value.startOf('month').startOf('isoWeek')
  const end = pickerMonth.value.endOf('month').endOf('isoWeek')
  const days = []
  let d = start
  while (d.isBefore(end) || d.isSame(end, 'day')) {
    days.push({
      date: d.format('YYYY-MM-DD'),
      day: d.date(),
      isCurrentMonth: d.month() === pickerMonth.value.month(),
      isToday: d.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD'),
      isSelected: d.format('YYYY-MM-DD') === form.date,
    })
    d = d.add(1, 'day')
  }
  return days
})

const weekHeaders = ['一', '二', '三', '四', '五', '六', '日']

function prevMonth() {
  pickerMonth.value = pickerMonth.value.subtract(1, 'month')
}

function nextMonth() {
  pickerMonth.value = pickerMonth.value.add(1, 'month')
}

function selectDate(dateStr) {
  form.date = dateStr
  activePicker.value = null
}

// ===== Time Picker =====
const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

function selectStartHour(h) {
  const m = form.startTime?.split(':')[1] || '00'
  form.startTime = `${h}:${m}`
}

function selectStartMinute(m) {
  const h = form.startTime?.split(':')[0] || '09'
  form.startTime = `${h}:${m}`
  activePicker.value = null
}

function selectEndHour(h) {
  const m = form.endTime?.split(':')[1] || '00'
  form.endTime = `${h}:${m}`
}

function selectEndMinute(m) {
  const h = form.endTime?.split(':')[0] || '10'
  form.endTime = `${h}:${m}`
  activePicker.value = null
}

function scrollToActive(containerRef) {
  nextTick(() => {
    const container = containerRef.value
    if (!container) return
    const active = container.querySelector('[data-active]')
    if (active) {
      active.scrollIntoView({ block: 'center', behavior: 'instant' })
    }
  })
}

// ===== Picker open/close =====
function openPicker(name) {
  if (activePicker.value === name) {
    activePicker.value = null
    return
  }
  activePicker.value = name

  if (name === 'date' && form.date) {
    pickerMonth.value = dayjs(form.date).startOf('month')
  }

  if (name === 'start') {
    scrollToActive(startHourList)
    scrollToActive(startMinuteList)
  }
  if (name === 'end') {
    scrollToActive(endHourList)
    scrollToActive(endMinuteList)
  }

  nextTick(() => {
    document.addEventListener('click', () => { activePicker.value = null }, { once: true })
  })
}

async function handleSubmit() {
  const payload = {
    title: form.title.trim() || '未命名日程',
    date: form.date,
    startTime: form.startTime,
    endTime: form.endTime,
    color: form.color,
    notes: form.notes.trim(),
  }

  let result
  if (editingItem.value) {
    result = await scheduleStore.updateSchedule(editingItem.value.id, payload)
  } else {
    result = await scheduleStore.addSchedule(payload)
  }

  if (!result.ok) {
    if (result.reason === 'conflict') {
      errorMessage.value = '该时间段已有安排，请调整时间后重试。'
    }
    return
  }

  calendarStore.closeDialog()
}

function handleDelete() {
  if (!editingItem.value) return
  scheduleStore.deleteSchedule(editingItem.value.id)
  calendarStore.closeDialog()
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="calendarStore.dialogOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(36,25,15,0.28)] px-4 backdrop-blur-md"
      @click.self="calendarStore.closeDialog()"
    >
      <section class="paper-panel w-full max-w-2xl rounded-[36px] p-7">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-[11px] uppercase tracking-[0.3em] text-[var(--accent-deep)]">{{ editingItem ? '编辑日程' : '新建日程' }}</p>
            <h2 class="display-serif mt-3 text-4xl leading-none text-[var(--ink)]">{{ editingItem ? form.title : '安排一段留给自己的时间' }}</h2>
          </div>
          <button class="rounded-full border border-[var(--line)] bg-white/50 px-4 py-2 text-sm text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent-deep)]" @click="calendarStore.closeDialog()">关闭</button>
        </div>

        <p v-if="errorMessage" class="mt-4 rounded-[20px] border border-[rgba(152,74,44,0.2)] bg-[rgba(176,90,43,0.1)] px-4 py-3 text-sm text-[var(--accent-deep)]">{{ errorMessage }}</p>

        <form class="mt-7 space-y-5" @submit.prevent="handleSubmit">
          <div>
            <label class="mb-2 block text-sm font-medium text-[var(--muted)]">标题</label>
            <input v-model="form.title" class="w-full rounded-[24px] border border-[var(--line)] px-4 py-3 outline-none transition focus:border-[var(--accent)] focus:bg-white" placeholder="例如：深度工作、健身、约会" />
          </div>

          <div class="grid grid-cols-3 gap-3">
            <!-- Date -->
            <div class="relative min-w-0">
              <label class="mb-2 block text-sm font-medium text-[var(--muted)]">日期</label>
              <div
                class="flex w-full cursor-pointer items-center justify-between rounded-[24px] border border-[var(--line)] bg-white/55 px-4 py-3 transition hover:border-[var(--accent)]"
                :class="{ 'border-[var(--accent)] ring-1 ring-[var(--accent-soft)]': activePicker === 'date' }"
                @click.stop="openPicker('date')"
              >
                <span :class="form.date ? 'text-[var(--ink)]' : 'text-[var(--muted)]'">
                  {{ displayDate || '选择日期' }}
                </span>
                <svg class="h-4 w-4 text-[var(--muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>

              <div
                v-if="showDatePicker"
                class="paper-panel !absolute left-0 top-full z-50 mt-2 w-[280px] rounded-[24px] p-4 shadow-[0_20px_60px_rgba(36,25,15,0.18)]"
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
                    v-for="d in pickerDays"
                    :key="d.date"
                    type="button"
                    class="rounded-xl py-1.5 text-sm transition"
                    :class="{
                      'bg-[var(--accent-deep)] text-white font-medium shadow-sm': d.isSelected,
                      'text-[var(--ink)] hover:bg-[var(--accent-soft)]': d.isCurrentMonth && !d.isSelected,
                      'text-[var(--muted)] opacity-40 hover:bg-[var(--accent-soft)]/40': !d.isCurrentMonth && !d.isSelected,
                      'ring-1 ring-[var(--accent-deep)] ring-offset-1 ring-offset-white/60': d.isToday && !d.isSelected,
                    }"
                    @click="selectDate(d.date)"
                  >
                    {{ d.day }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Start Time -->
            <div class="relative min-w-0">
              <label class="mb-2 block text-sm font-medium text-[var(--muted)]">开始时间</label>
              <div
                class="flex w-full cursor-pointer items-center justify-between rounded-[24px] border border-[var(--line)] bg-white/55 px-4 py-3 transition hover:border-[var(--accent)]"
                :class="{ 'border-[var(--accent)] ring-1 ring-[var(--accent-soft)]': activePicker === 'start' }"
                @click.stop="openPicker('start')"
              >
                <span class="text-[var(--ink)]">{{ form.startTime }}</span>
                <svg class="h-4 w-4 text-[var(--muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>

              <div
                v-if="activePicker === 'start'"
                class="paper-panel !absolute left-0 top-full z-50 mt-2 w-[200px] rounded-[24px] p-3 shadow-[0_20px_60px_rgba(36,25,15,0.18)]"
                @click.stop
              >
                <div class="flex h-[240px] gap-2">
                  <div ref="startHourList" class="flex-1 overflow-y-auto">
                    <div class="space-y-1 pr-1">
                      <button
                        v-for="h in hours"
                        :key="h"
                        type="button"
                        class="w-full rounded-xl py-1.5 text-center text-sm transition"
                        :class="form.startTime?.startsWith(h + ':') ? 'bg-[var(--accent-deep)] text-white font-medium shadow-sm' : 'text-[var(--ink)] hover:bg-[var(--accent-soft)]'"
                        :data-active="form.startTime?.startsWith(h + ':') || undefined"
                        @click="selectStartHour(h)"
                      >
                        {{ h }}
                      </button>
                    </div>
                  </div>
                  <div class="w-px bg-[var(--line)]"></div>
                  <div ref="startMinuteList" class="flex-1 overflow-y-auto">
                    <div class="space-y-1 pr-1">
                      <button
                        v-for="m in minutes"
                        :key="m"
                        type="button"
                        class="w-full rounded-xl py-1.5 text-center text-sm transition"
                        :class="form.startTime?.endsWith(':' + m) ? 'bg-[var(--accent-deep)] text-white font-medium shadow-sm' : 'text-[var(--ink)] hover:bg-[var(--accent-soft)]'"
                        :data-active="form.startTime?.endsWith(':' + m) || undefined"
                        @click="selectStartMinute(m)"
                      >
                        {{ m }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- End Time -->
            <div class="relative min-w-0">
              <label class="mb-2 block text-sm font-medium text-[var(--muted)]">结束时间</label>
              <div
                class="flex w-full cursor-pointer items-center justify-between rounded-[24px] border border-[var(--line)] bg-white/55 px-4 py-3 transition hover:border-[var(--accent)]"
                :class="{ 'border-[var(--accent)] ring-1 ring-[var(--accent-soft)]': activePicker === 'end' }"
                @click.stop="openPicker('end')"
              >
                <span class="text-[var(--ink)]">{{ form.endTime }}</span>
                <svg class="h-4 w-4 text-[var(--muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>

              <div
                v-if="activePicker === 'end'"
                class="paper-panel !absolute left-0 top-full z-50 mt-2 w-[200px] rounded-[24px] p-3 shadow-[0_20px_60px_rgba(36,25,15,0.18)]"
                @click.stop
              >
                <div class="flex h-[240px] gap-2">
                  <div ref="endHourList" class="flex-1 overflow-y-auto">
                    <div class="space-y-1 pr-1">
                      <button
                        v-for="h in hours"
                        :key="h"
                        type="button"
                        class="w-full rounded-xl py-1.5 text-center text-sm transition"
                        :class="form.endTime?.startsWith(h + ':') ? 'bg-[var(--accent-deep)] text-white font-medium shadow-sm' : 'text-[var(--ink)] hover:bg-[var(--accent-soft)]'"
                        :data-active="form.endTime?.startsWith(h + ':') || undefined"
                        @click="selectEndHour(h)"
                      >
                        {{ h }}
                      </button>
                    </div>
                  </div>
                  <div class="w-px bg-[var(--line)]"></div>
                  <div ref="endMinuteList" class="flex-1 overflow-y-auto">
                    <div class="space-y-1 pr-1">
                      <button
                        v-for="m in minutes"
                        :key="m"
                        type="button"
                        class="w-full rounded-xl py-1.5 text-center text-sm transition"
                        :class="form.endTime?.endsWith(':' + m) ? 'bg-[var(--accent-deep)] text-white font-medium shadow-sm' : 'text-[var(--ink)] hover:bg-[var(--accent-soft)]'"
                        :data-active="form.endTime?.endsWith(':' + m) || undefined"
                        @click="selectEndMinute(m)"
                      >
                        {{ m }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-[var(--muted)]">色签</label>
            <div class="flex flex-wrap gap-3">
              <button
                v-for="item in palette"
                :key="item.value"
                type="button"
                class="rounded-full border px-4 py-2 text-sm transition"
                :class="form.color === item.value ? 'border-[var(--accent-deep)] bg-[var(--accent-deep)] text-[#fff6ef]' : 'border-[var(--line)] bg-white/55 text-[var(--muted)] hover:border-[var(--accent)]'"
                @click="form.color = item.value"
              >
                {{ item.label }}
              </button>
            </div>
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-[var(--muted)]">备注</label>
            <textarea v-model="form.notes" rows="4" class="w-full rounded-[24px] border border-[var(--line)] px-4 py-3 outline-none transition focus:border-[var(--accent)] focus:bg-white" placeholder="写点提醒、目标或这段时间的情绪关键字"></textarea>
          </div>

          <div class="flex items-center justify-between pt-2">
            <button
              v-if="editingItem"
              type="button"
              class="rounded-full border border-[rgba(152,74,44,0.18)] px-4 py-2 text-sm font-medium text-[var(--accent-deep)] transition hover:bg-[rgba(176,90,43,0.08)]"
              @click="handleDelete()"
            >
              删除
            </button>
            <div v-else></div>

            <div class="flex gap-3">
              <button type="button" class="rounded-full border border-[var(--line)] bg-white/55 px-4 py-2 text-sm font-medium text-[var(--muted)]" @click="calendarStore.closeDialog()">
                取消
              </button>
              <button type="submit" class="rounded-full bg-[var(--accent-deep)] px-5 py-2 text-sm font-medium text-[#fff6ef] shadow-[0_14px_32px_rgba(111,47,22,0.22)] transition hover:-translate-y-0.5 hover:bg-[var(--accent)]">
                保存
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  </Teleport>
</template>
