import { ref } from 'vue'
import { defineStore } from 'pinia'

const defaultTemplates = [
  { id: 'tpl-1', label: '值班', title: '值班', color: 'blue', notes: '' },
  { id: 'tpl-2', label: '上课', title: '上课', color: 'green', notes: '' },
  { id: 'tpl-3', label: '睡觉', title: '睡觉', color: 'purple', notes: '' },
  { id: 'tpl-4', label: '吃饭', title: '吃饭', color: 'orange', notes: '' },
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
