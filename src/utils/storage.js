const STORAGE_KEY = 'schedule-planner-items'

export function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveToStorage(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}
