import { ref } from 'vue'
import { defineStore } from 'pinia'

const defaultTemplates = [
  { id: 'tpl-1', label: '深度工作', title: '深度工作', color: 'blue', notes: '关闭通知，专注核心任务。' },
  { id: 'tpl-2', label: '健身', title: '健身', color: 'green', notes: '保持规律运动节奏。' },
  { id: 'tpl-3', label: '会议', title: '会议', color: 'purple', notes: '提前准备议程。' },
  { id: 'tpl-4', label: '阅读', title: '阅读', color: 'orange', notes: '沉浸阅读，记录灵感。' },
  { id: 'tpl-5', label: '休息', title: '休息', color: 'pink', notes: '放松恢复，调整状态。' },
]

const STORAGE_KEY = 'schedule_templates'

export const useTemplateStore = defineStore('templates', () => {
  const templates = ref([])

  async function load() {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEY)
      templates.value = result[STORAGE_KEY]?.length ? result[STORAGE_KEY] : defaultTemplates
    } catch {
      templates.value = defaultTemplates
    }
  }

  async function save() {
    try {
      await chrome.storage.local.set({ [STORAGE_KEY]: templates.value })
    } catch {
      // silent
    }
  }

  async function addTemplate(payload) {
    const item = { id: crypto.randomUUID(), ...payload }
    templates.value.push(item)
    await save()
    return item
  }

  async function updateTemplate(id, payload) {
    const index = templates.value.findIndex((t) => t.id === id)
    if (index === -1) return false
    templates.value[index] = { ...templates.value[index], ...payload }
    await save()
    return true
  }

  async function deleteTemplate(id) {
    templates.value = templates.value.filter((t) => t.id !== id)
    await save()
  }

  return {
    templates,
    load,
    addTemplate,
    updateTemplate,
    deleteTemplate,
  }
})
