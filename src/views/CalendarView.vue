<script setup>
import { computed, onMounted, onUnmounted, ref, reactive, watch } from 'vue'
import dayjs from 'dayjs'
import CalendarToolbar from '../components/calendar/CalendarToolbar.vue'
import WeekCalendar from '../components/calendar/WeekCalendar.vue'
import MonthCalendar from '../components/calendar/MonthCalendar.vue'
import ScheduleDialog from '../components/schedule/ScheduleDialog.vue'
import BatchScheduleDialog from '../components/schedule/BatchScheduleDialog.vue'
import { useCalendarStore } from '../stores/calendar'
import { useScheduleStore } from '../stores/schedule'
import { useTemplateStore } from '../stores/templates'
import { usePaletteStore, paletteOptions, getColorHex } from '../stores/palette'
import { getEventColor } from '../utils/calendar'
import { replaceSchedules } from '../utils/api'
import { exportSchedules } from '../utils/export'
import { isLoggedIn, logout, getCurrentUser, initAuth } from '../api/auth.js'
import { useRouter } from 'vue-router'
import { startNotificationCheck, stopNotificationCheck, testNotification } from '../utils/notification.js'

const router = useRouter()

const calendarStore = useCalendarStore()
const scheduleStore = useScheduleStore()
const templateStore = useTemplateStore()
const paletteStore = usePaletteStore()

onMounted(async () => {
  await initAuth()
  scheduleStore.load()
  templateStore.load()
  paletteStore.load()

  // 启动通知检查
  startNotificationCheck(() => scheduleStore.schedules)
})

onUnmounted(() => {
  stopNotificationCheck()
  unlockBodyScroll()
})
const newTpl = reactive({ label: '', title: '', color: 'blue', notes: '' })

const showTemplateForm = ref(false)
const showPaletteForm = ref(false)
const newPalette = reactive({ label: '', color: 'blue', hexInput: '' })
const showMobileManagement = ref(false)
const activeManagementPanel = ref('menu')
const exportStatus = ref('idle')
const exportMessage = ref('')
const exportJson = ref('')
let lockedScrollY = 0
let isBodyScrollLocked = false

const managementItems = computed(() => [
  { key: 'palette', title: '色签管理', desc: `${paletteStore.palettes.length} 个色签`, tone: 'palette' },
  { key: 'templates', title: '模板管理', desc: `${templateStore.templates.length} 个模板`, tone: 'template' },
  { key: 'data', title: '数据管理', desc: '导入、导出备份', tone: 'data' },
  { key: 'account', title: isLoggedIn.value ? '账号管理' : '登录同步', desc: isLoggedIn.value ? '已登录，数据已同步' : '登录后可多端同步', tone: 'account' },
])

function handleAccountAction() {
  if (isLoggedIn.value) {
    logout()
    window.location.reload()
  } else {
    router.push('/login')
  }
}

function getDisplayName() {
  if (isLoggedIn.value) {
    const user = getCurrentUser()
    return user ? user.username : '已登录'
  }
  return '游客'
}

const syncing = ref(false)
const syncWarning = ref('')

async function handleSync() {
  if (syncing.value) return
  syncing.value = true
  syncWarning.value = ''
  const startTime = Date.now()
  try {
    await Promise.all([
      scheduleStore.load(),
      templateStore.load(),
      paletteStore.load(),
    ])
    // 确保动画至少显示 1 秒
    const elapsed = Date.now() - startTime
    if (elapsed < 1000) {
      await new Promise(resolve => setTimeout(resolve, 1000 - elapsed))
    }
  } catch (err) {
    syncWarning.value = '同步失败，已使用本地数据'
  } finally {
    syncing.value = false
  }
}

function openMobileManagement(panel = 'menu') {
  activeManagementPanel.value = panel
  showMobileManagement.value = true
}

function closeMobileManagement() {
  showMobileManagement.value = false
  activeManagementPanel.value = 'menu'
}

function lockBodyScroll() {
  if (isBodyScrollLocked) return
  lockedScrollY = window.scrollY || document.documentElement.scrollTop || 0
  document.body.style.position = 'fixed'
  document.body.style.top = `-${lockedScrollY}px`
  document.body.style.left = '0'
  document.body.style.right = '0'
  document.body.style.width = '100%'
  document.body.style.overflow = 'hidden'
  isBodyScrollLocked = true
}

function unlockBodyScroll() {
  if (!isBodyScrollLocked) return
  document.body.style.position = ''
  document.body.style.top = ''
  document.body.style.left = ''
  document.body.style.right = ''
  document.body.style.width = ''
  document.body.style.overflow = ''
  window.scrollTo(0, lockedScrollY)
  isBodyScrollLocked = false
}

watch(showMobileManagement, (visible) => {
  if (visible) {
    lockBodyScroll()
    return
  }
  unlockBodyScroll()
})

function addTemplate() {
  if (!newTpl.label.trim() || !newTpl.title.trim()) return
  templateStore.addTemplate({
    label: newTpl.label.trim(),
    title: newTpl.title.trim(),
    color: newTpl.color,
    notes: newTpl.notes.trim(),
  })
  newTpl.label = ''
  newTpl.title = ''
  newTpl.notes = ''
  newTpl.color = 'blue'
  showTemplateForm.value = false
}

function addPalette() {
  if (!newPalette.label.trim()) return
  const color = newPalette.hexInput.trim().startsWith('#') ? newPalette.hexInput.trim() : newPalette.color
  paletteStore.addPalette({
    label: newPalette.label.trim(),
    color,
  })
  newPalette.label = ''
  newPalette.color = 'blue'
  newPalette.hexInput = ''
  showPaletteForm.value = false
}

async function exportData() {
  const data = scheduleStore.schedules
  const result = await exportSchedules(data)
  if (result.ok) {
    exportStatus.value = 'success'
    exportMessage.value = '备份已生成'
    exportJson.value = result.json
  } else {
    exportStatus.value = 'error'
    exportMessage.value = result.error || '导出失败，请重试'
    exportJson.value = ''
  }
  setTimeout(() => {
    if (exportStatus.value !== 'idle') {
      exportStatus.value = 'idle'
      exportMessage.value = ''
    }
  }, 4000)
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
    await replaceSchedules(data)
    await scheduleStore.load()
    event.target.value = ''
  } catch (err) {
    alert('导入失败：' + err.message)
  }
}
</script>

<template>
  <main class="app-shell min-h-screen px-3 text-[var(--ink)] sm:px-4 lg:px-6">
    <div class="mx-auto max-w-[1460px] space-y-4 lg:space-y-6">
      <CalendarToolbar @open-management="openMobileManagement()" />

      <div v-if="syncWarning" class="rounded-[16px] border border-[rgba(176,90,43,0.25)] bg-[rgba(176,90,43,0.08)] px-4 py-2 text-sm text-[var(--accent-deep)] flex items-center justify-between">
        <span>{{ syncWarning }}</span>
        <button type="button" class="ml-2 text-xs opacity-60 hover:opacity-100" @click="syncWarning = ''">×</button>
      </div>

      <section class="grid grid-cols-1 items-start gap-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-6">
        <component :is="calendarStore.viewMode === 'week' ? WeekCalendar : MonthCalendar" />

        <aside class="space-y-4 lg:order-first">
          <div class="hidden rounded-[26px] p-4 lg:block lg:rounded-[34px] paper-panel">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-[11px] uppercase tracking-[0.3em] text-[var(--accent-deep)]">palette</p>
                <h3 class="display-serif mt-2 text-2xl">色签</h3>
              </div>
              <button
                type="button"
                class="rounded-full border border-[var(--line)] bg-white/55 px-3 py-1 text-xs text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent-deep)]"
                @click="showPaletteForm = !showPaletteForm"
              >
                {{ showPaletteForm ? '取消' : '新建' }}
              </button>
            </div>

            <div v-if="showPaletteForm" class="mt-4 space-y-3">
              <input v-model="newPalette.label" class="w-full rounded-[20px] border border-[var(--line)] px-3 py-2 text-sm outline-none" placeholder="标签，如：靛蓝" />
              <div class="flex gap-2">
                <button
                  v-for="c in paletteOptions"
                  :key="c.value"
                  type="button"
                  class="h-6 w-6 rounded-full border-2 transition"
                  :class="newPalette.color === c.value ? 'border-[var(--accent-deep)] scale-110' : 'border-transparent'"
                  :style="{ backgroundColor: c.hex }"
                  @click="newPalette.color = c.value; newPalette.hexInput = ''"
                />
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-[var(--muted)]">或 HEX</span>
                <input
                  v-model="newPalette.hexInput"
                  class="flex-1 rounded-[20px] border border-[var(--line)] px-3 py-2 text-sm font-mono outline-none transition focus:border-[var(--accent)] focus:bg-white"
                  placeholder="#b05a2b"
                />
                <span
                  class="inline-block h-5 w-5 shrink-0 rounded-full border border-[var(--line)]"
                  :style="{ backgroundColor: newPalette.hexInput.trim().startsWith('#') ? newPalette.hexInput.trim() : getColorHex(newPalette.color) }"
                ></span>
              </div>
              <button
                type="button"
                class="w-full rounded-full bg-[var(--accent-deep)] py-2 text-sm font-medium text-[#fff6ef] transition hover:bg-[var(--accent)]"
                @click="addPalette"
              >
                添加色签
              </button>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <div
                v-for="p in paletteStore.palettes"
                :key="p.value"
                class="group relative flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/55 px-3 py-1.5 text-xs"
              >
                <span class="inline-block h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: getColorHex(p.color) }"></span>
                <span class="whitespace-nowrap">{{ p.label }}</span>
                <button
                  type="button"
                  class="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-[var(--line)] bg-[#fffaf2] text-[var(--muted)] opacity-0 shadow-sm transition hover:bg-[rgba(176,90,43,0.1)] hover:text-[var(--accent-deep)] group-hover:opacity-100"
                  aria-label="删除色签"
                  @click="paletteStore.removePalette(p.value)"
                >
                  <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
          </div>

          <div class="hidden rounded-[26px] p-4 lg:block lg:rounded-[34px] paper-panel">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-[11px] uppercase tracking-[0.3em] text-[var(--accent-deep)]">templates</p>
                <h3 class="display-serif mt-2 text-2xl">模板</h3>
              </div>
              <button
                type="button"
                class="rounded-full border border-[var(--line)] bg-white/55 px-3 py-1 text-xs text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent-deep)]"
                @click="showTemplateForm = !showTemplateForm"
              >
                {{ showTemplateForm ? '取消' : '新建' }}
              </button>
            </div>

            <div v-if="showTemplateForm" class="mt-4 space-y-3">
              <input v-model="newTpl.label" class="w-full rounded-[20px] border border-[var(--line)] px-3 py-2 text-sm outline-none" placeholder="标签，如：晨读" />
              <input v-model="newTpl.title" class="w-full rounded-[20px] border border-[var(--line)] px-3 py-2 text-sm outline-none" placeholder="标题，如：阅读时光" />
              <input v-model="newTpl.notes" class="w-full rounded-[20px] border border-[var(--line)] px-3 py-2 text-sm outline-none" placeholder="备注（可选）" />
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="c in paletteStore.palettes"
                  :key="c.value"
                  type="button"
                  class="rounded-full border px-2.5 py-1 text-xs transition"
                  :class="newTpl.color === c.color ? 'border-[var(--accent-deep)] bg-[var(--accent-deep)] text-[#fff6ef]' : 'border-[var(--line)] bg-white/55 text-[var(--muted)]'"
                  @click="newTpl.color = c.color"
                >
                  {{ c.label }}
                </button>
              </div>
              <button
                type="button"
                class="w-full rounded-full bg-[var(--accent-deep)] py-2 text-sm font-medium text-[#fff6ef] transition hover:bg-[var(--accent)]"
                @click="addTemplate"
              >
                添加模板
              </button>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <div
                v-for="t in templateStore.templates"
                :key="t.id"
                class="group relative flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-white/55 px-3 py-1.5 text-xs text-[var(--muted)]"
              >
                <span class="inline-block h-2 w-2 rounded-full" :style="{ backgroundColor: getColorHex(t.color) }"></span>
                <span class="whitespace-nowrap">{{ t.label }}</span>
                <button
                  type="button"
                  class="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-[var(--line)] bg-[#fffaf2] text-[var(--muted)] opacity-0 shadow-sm transition hover:bg-[rgba(176,90,43,0.1)] hover:text-[var(--accent-deep)] group-hover:opacity-100"
                  aria-label="删除模板"
                  @click="templateStore.deleteTemplate(t.id)"
                >
                  <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
          </div>

          <div class="hidden rounded-[26px] p-4 lg:block lg:rounded-[34px] paper-panel">
            <p class="text-[11px] uppercase tracking-[0.3em] text-[var(--accent-deep)]">data</p>
            <h3 class="display-serif mt-2 text-2xl">数据管理</h3>
            <div class="mt-4 flex flex-wrap gap-3">
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
            <div v-if="exportStatus === 'success'" class="mt-3 rounded-[20px] border border-[rgba(109,119,87,0.3)] bg-[rgba(109,119,87,0.1)] px-4 py-2 text-sm text-[var(--olive)]">
              {{ exportMessage }}
            </div>
            <div v-if="exportStatus === 'error'" class="mt-3 rounded-[20px] border border-[rgba(152,74,44,0.2)] bg-[rgba(176,90,43,0.1)] px-4 py-2 text-sm text-[var(--accent-deep)]">
              {{ exportMessage }}
            </div>
          </div>

          <div class="hidden rounded-[26px] p-4 lg:block lg:rounded-[34px] paper-panel">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-[11px] uppercase tracking-[0.3em] text-[var(--accent-deep)]">account</p>
                <h3 class="display-serif mt-2 text-2xl">{{ getDisplayName() }}</h3>
              </div>
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] bg-white/55 text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent-deep)] disabled:opacity-50"
                :disabled="syncing"
                @click="handleSync"
                title="刷新同步"
              >
                <svg class="h-4 w-4" :class="{ 'animate-spin': syncing }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
              </button>
            </div>
            <p class="mt-2 text-sm text-[var(--muted)]">
              {{ isLoggedIn ? '数据自动同步' : '登录后可多端同步日程' }}
            </p>
            <button
              type="button"
              class="mt-4 w-full rounded-full py-2.5 text-sm font-semibold transition"
              :class="isLoggedIn ? 'border border-[var(--line)] bg-white/55 text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent-deep)]' : 'bg-[var(--accent-deep)] text-[#fff6ef] hover:bg-[var(--accent)]'"
              @click="handleAccountAction"
            >
              {{ isLoggedIn ? '退出登录' : '去登录' }}
            </button>
          </div>
        </aside>
      </section>
    </div>

    <div class="mobile-action-bar fixed left-3 right-3 z-40 grid grid-cols-[1fr_auto_auto] gap-2 lg:hidden">
      <button
        type="button"
        class="mobile-card-press rounded-full bg-[var(--accent-deep)] px-5 py-3 text-sm font-semibold text-[#fff6ef] shadow-[0_16px_34px_rgba(111,47,22,0.28)]"
        @click="calendarStore.openCreateDialog()"
      >
        添加日程
      </button>
      <button
        type="button"
        class="mobile-card-press rounded-full border border-[var(--accent-deep)] bg-[rgba(255,248,238,0.92)] px-4 py-3 text-sm font-semibold text-[var(--accent-deep)] shadow-[0_12px_26px_rgba(84,56,33,0.12)]"
        @click="calendarStore.openBatchDialog()"
      >
        批量
      </button>
      <button
        type="button"
        class="mobile-card-press flex h-[46px] w-[46px] items-center justify-center rounded-full border border-[var(--accent-deep)] bg-[rgba(255,248,238,0.92)] text-[var(--accent-deep)] shadow-[0_12px_26px_rgba(84,56,33,0.12)] disabled:opacity-50"
        :disabled="syncing"
        @click="handleSync"
      >
        <svg class="h-5 w-5" :class="{ 'animate-spin': syncing }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12a9 9 0 11-6.219-8.56" />
        </svg>
      </button>
    </div>

    <div v-if="showMobileManagement" class="fixed inset-0 z-50 flex items-center justify-center px-4 lg:hidden">
      <button
        type="button"
        class="mobile-management-backdrop absolute inset-0 h-full w-full"
        aria-label="关闭管理设置"
        @click="closeMobileManagement"
      ></button>

      <section class="mobile-management-sheet relative z-10 max-h-[78vh] w-full max-w-[380px] overflow-y-auto rounded-[28px] px-4 py-4">
        <div class="mb-4 flex items-center justify-between gap-3">
          <div>
            <p class="text-[11px] uppercase tracking-[0.28em] text-[var(--accent-deep)]">
              {{ activeManagementPanel === 'menu' ? 'settings' : 'manage' }}
            </p>
            <h3 class="display-serif mt-1 text-2xl">
              {{ activeManagementPanel === 'menu' ? '管理' : activeManagementPanel === 'palette' ? '色签管理' : activeManagementPanel === 'templates' ? '模板管理' : activeManagementPanel === 'data' ? '数据管理' : '账号管理' }}
            </h3>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="activeManagementPanel !== 'menu'"
              type="button"
              class="rounded-full border border-[var(--line)] bg-white/55 px-3 py-1.5 text-xs font-medium text-[var(--muted)]"
              @click="activeManagementPanel = 'menu'"
            >
              返回
            </button>
            <button
              type="button"
              class="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] bg-white/55 text-[var(--muted)]"
              aria-label="关闭"
              @click="closeMobileManagement"
            >
              ×
            </button>
          </div>
        </div>

        <div v-if="activeManagementPanel === 'menu'" class="space-y-3">
          <button
            v-for="item in managementItems"
            :key="item.key"
            type="button"
            class="mobile-card-press flex w-full items-center justify-between rounded-[24px] border border-[var(--line)] bg-white/55 p-4 text-left transition"
            @click="activeManagementPanel = item.key"
          >
            <span>
              <span class="display-serif block text-xl text-[var(--ink)]">{{ item.title }}</span>
              <span class="mt-1 block text-xs text-[var(--muted)]">{{ item.desc }}</span>
            </span>
            <span
              class="flex h-10 w-10 items-center justify-center rounded-full text-lg"
              :class="item.tone === 'palette' ? 'bg-[rgba(176,90,43,0.14)] text-[var(--accent-deep)]' : item.tone === 'template' ? 'bg-[rgba(109,119,87,0.16)] text-[var(--olive)]' : item.tone === 'account' ? 'bg-[rgba(88,126,255,0.12)] text-blue-600' : 'bg-white text-[var(--muted)]'"
            >
              ›
            </span>
          </button>
        </div>

        <div v-else-if="activeManagementPanel === 'palette'" class="space-y-4">
          <div class="flex items-center justify-between">
            <p class="text-sm text-[var(--muted)]">用于日程和模板的颜色标记。</p>
            <button
              type="button"
              class="rounded-full border border-[var(--line)] bg-white/55 px-3 py-1.5 text-xs text-[var(--muted)]"
              @click="showPaletteForm = !showPaletteForm"
            >
              {{ showPaletteForm ? '取消' : '新建' }}
            </button>
          </div>

          <div v-if="showPaletteForm" class="space-y-3 rounded-[24px] border border-[var(--line)] bg-white/45 p-3">
            <input v-model="newPalette.label" class="w-full rounded-[18px] border border-[var(--line)] px-3 py-2 text-sm outline-none" placeholder="标签，如：靛蓝" />
            <div class="flex gap-2">
              <button
                v-for="c in paletteOptions"
                :key="c.value"
                type="button"
                class="h-7 w-7 rounded-full border-2 transition"
                :class="newPalette.color === c.value ? 'scale-110 border-[var(--accent-deep)]' : 'border-transparent'"
                :style="{ backgroundColor: c.hex }"
                @click="newPalette.color = c.value; newPalette.hexInput = ''"
              />
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-[var(--muted)]">HEX</span>
              <input v-model="newPalette.hexInput" class="min-w-0 flex-1 rounded-[18px] border border-[var(--line)] px-3 py-2 text-sm font-mono outline-none" placeholder="#b05a2b" />
              <span class="inline-block h-6 w-6 shrink-0 rounded-full border border-[var(--line)]" :style="{ backgroundColor: newPalette.hexInput.trim().startsWith('#') ? newPalette.hexInput.trim() : getColorHex(newPalette.color) }"></span>
            </div>
            <button type="button" class="w-full rounded-full bg-[var(--accent-deep)] py-2.5 text-sm font-medium text-[#fff6ef]" @click="addPalette">
              添加色签
            </button>
          </div>

          <div class="flex flex-wrap gap-2">
            <div v-for="p in paletteStore.palettes" :key="p.value" class="flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/55 px-3 py-2 text-xs">
              <span class="inline-block h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: getColorHex(p.color) }"></span>
              <span>{{ p.label }}</span>
              <button type="button" class="ml-1 text-[var(--muted)]" aria-label="删除色签" @click="paletteStore.removePalette(p.value)">×</button>
            </div>
          </div>
        </div>

        <div v-else-if="activeManagementPanel === 'templates'" class="space-y-4">
          <div class="flex items-center justify-between">
            <p class="text-sm text-[var(--muted)]">保存常用日程内容。</p>
            <button
              type="button"
              class="rounded-full border border-[var(--line)] bg-white/55 px-3 py-1.5 text-xs text-[var(--muted)]"
              @click="showTemplateForm = !showTemplateForm"
            >
              {{ showTemplateForm ? '取消' : '新建' }}
            </button>
          </div>

          <div v-if="showTemplateForm" class="space-y-3 rounded-[24px] border border-[var(--line)] bg-white/45 p-3">
            <input v-model="newTpl.label" class="w-full rounded-[18px] border border-[var(--line)] px-3 py-2 text-sm outline-none" placeholder="标签，如：晨读" />
            <input v-model="newTpl.title" class="w-full rounded-[18px] border border-[var(--line)] px-3 py-2 text-sm outline-none" placeholder="标题，如：阅读时光" />
            <input v-model="newTpl.notes" class="w-full rounded-[18px] border border-[var(--line)] px-3 py-2 text-sm outline-none" placeholder="备注（可选）" />
            <div class="flex flex-wrap gap-2">
              <button
                v-for="c in paletteStore.palettes"
                :key="c.value"
                type="button"
                class="rounded-full border px-2.5 py-1 text-xs transition"
                :class="newTpl.color === c.color ? 'border-[var(--accent-deep)] bg-[var(--accent-deep)] text-[#fff6ef]' : 'border-[var(--line)] bg-white/55 text-[var(--muted)]'"
                @click="newTpl.color = c.color"
              >
                {{ c.label }}
              </button>
            </div>
            <button type="button" class="w-full rounded-full bg-[var(--accent-deep)] py-2.5 text-sm font-medium text-[#fff6ef]" @click="addTemplate">
              添加模板
            </button>
          </div>

          <div class="flex flex-wrap gap-2">
            <div v-for="t in templateStore.templates" :key="t.id" class="flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-white/55 px-3 py-2 text-xs text-[var(--muted)]">
              <span class="inline-block h-2 w-2 rounded-full" :style="{ backgroundColor: getColorHex(t.color) }"></span>
              <span>{{ t.label }}</span>
              <button type="button" class="ml-1 text-[var(--muted)]" aria-label="删除模板" @click="templateStore.deleteTemplate(t.id)">×</button>
            </div>
          </div>
        </div>

        <div v-else-if="activeManagementPanel === 'data'" class="space-y-3">
          <p class="text-sm leading-6 text-[var(--muted)]">备份文件仅包含日程数据，可用于迁移或恢复。</p>
          <button
            type="button"
            class="w-full rounded-full border border-[var(--line)] bg-white/60 px-4 py-3 text-sm font-semibold text-[var(--accent-deep)]"
            @click="exportData"
          >
            导出备份
          </button>
          <div v-if="exportStatus === 'success'" class="rounded-[20px] border border-[rgba(109,119,87,0.3)] bg-[rgba(109,119,87,0.1)] px-4 py-3 text-sm text-[var(--olive)]">
            {{ exportMessage }}
          </div>
          <div v-if="exportStatus === 'error'" class="rounded-[20px] border border-[rgba(152,74,44,0.2)] bg-[rgba(176,90,43,0.1)] px-4 py-3 text-sm text-[var(--accent-deep)]">
            {{ exportMessage }}
          </div>
          <label class="block w-full cursor-pointer rounded-full bg-[var(--accent-deep)] px-4 py-3 text-center text-sm font-semibold text-[#fff6ef]">
            <input type="file" accept=".json" class="hidden" @change="importData" />
            导入恢复
          </label>
        </div>

        <div v-else-if="activeManagementPanel === 'account'" class="space-y-4">
          <div class="rounded-[20px] border border-[var(--line)] bg-white/45 p-4">
            <p class="text-xs text-[var(--muted)]">当前身份</p>
            <p class="mt-1 text-lg font-medium">{{ getDisplayName() }}</p>
          </div>
          <button
            type="button"
            class="flex w-full items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-white/60 px-4 py-3 text-sm font-semibold text-[var(--accent-deep)] transition hover:bg-white disabled:opacity-50"
            :disabled="syncing"
            @click="handleSync"
          >
            <svg class="h-4 w-4" :class="{ 'animate-spin': syncing }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
            {{ syncing ? '同步中...' : '刷新同步' }}
          </button>
          <button
            type="button"
            class="w-full rounded-full border border-[var(--line)] bg-white/60 px-4 py-3 text-sm font-semibold text-[var(--muted)] transition hover:bg-white"
            @click="testNotification"
          >
            测试通知
          </button>
          <p class="text-sm text-[var(--muted)]">
            {{ isLoggedIn ? '日程数据会自动同步到云端。' : '登录后可在多个设备间同步日程数据。' }}
          </p>
          <button
            type="button"
            class="w-full rounded-full py-3 text-sm font-semibold transition"
            :class="isLoggedIn ? 'border border-[var(--line)] bg-white/60 text-[var(--muted)]' : 'bg-[var(--accent-deep)] text-[#fff6ef]'"
            @click="handleAccountAction"
          >
            {{ isLoggedIn ? '退出登录' : '去登录' }}
          </button>
        </div>
      </section>
    </div>

    <ScheduleDialog />
    <BatchScheduleDialog />
  </main>
</template>
