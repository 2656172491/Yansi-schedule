import { ref } from 'vue'
import { defineStore } from 'pinia'

export const paletteOptions = [
  { value: 'blue', hex: '#60a5fa' },
  { value: 'green', hex: '#34d399' },
  { value: 'purple', hex: '#a78bfa' },
  { value: 'orange', hex: '#fb923c' },
  { value: 'pink', hex: '#f472b6' },
  { value: 'red', hex: '#f87171' },
  { value: 'yellow', hex: '#facc15' },
  { value: 'cyan', hex: '#22d3ee' },
  { value: 'slate', hex: '#94a3b8' },
  { value: 'rose', hex: '#fb7185' },
]

export const paletteClasses = {
  blue: 'bg-blue-500/15 border-blue-400 text-blue-950',
  green: 'bg-emerald-500/15 border-emerald-400 text-emerald-950',
  purple: 'bg-violet-500/15 border-violet-400 text-violet-950',
  orange: 'bg-orange-500/15 border-orange-400 text-orange-950',
  pink: 'bg-pink-500/15 border-pink-400 text-pink-950',
  red: 'bg-red-500/15 border-red-400 text-red-950',
  yellow: 'bg-yellow-500/15 border-yellow-400 text-yellow-950',
  cyan: 'bg-cyan-500/15 border-cyan-400 text-cyan-950',
  slate: 'bg-slate-500/15 border-slate-400 text-slate-950',
  rose: 'bg-rose-500/15 border-rose-400 text-rose-950',
}

const STORAGE_KEY = 'schedule_palettes'

const defaultPalettes = [
  { label: '陶土', value: 'blue', color: 'blue' },
  { label: '苔绿', value: 'green', color: 'green' },
  { label: '暮紫', value: 'purple', color: 'purple' },
  { label: '暖橙', value: 'orange', color: 'orange' },
  { label: '雾粉', value: 'pink', color: 'pink' },
]

export function getColorHex(color) {
  if (!color) return '#94a3b8'
  if (color.startsWith('#')) return color
  const found = paletteOptions.find((c) => c.value === color)
  return found?.hex || '#94a3b8'
}

export const usePaletteStore = defineStore('palette', () => {
  const palettes = ref([])

  async function load() {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEY)
      palettes.value = result[STORAGE_KEY]?.length ? result[STORAGE_KEY] : defaultPalettes
    } catch {
      palettes.value = defaultPalettes
    }
  }

  async function save() {
    try {
      await chrome.storage.local.set({ [STORAGE_KEY]: palettes.value })
    } catch {
      // silent
    }
  }

  async function addPalette(payload) {
    const value = payload.value || `${payload.color}_${Date.now()}`
    const item = { value, label: payload.label, color: payload.color }
    palettes.value.push(item)
    await save()
  }

  async function removePalette(value) {
    palettes.value = palettes.value.filter((p) => p.value !== value)
    await save()
  }

  return {
    palettes,
    load,
    addPalette,
    removePalette,
  }
})
