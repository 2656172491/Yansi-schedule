const KEY = 'schedules'

function getLocalSchedules() {
  const raw = localStorage.getItem(KEY)
  return raw ? JSON.parse(raw) : []
}

function setLocalSchedules(items) {
  localStorage.setItem(KEY, JSON.stringify(items))
}

function hasChromeStorage() {
  return typeof chrome !== 'undefined' && Boolean(chrome.storage?.local)
}

export async function fetchSchedules() {
  if (hasChromeStorage()) {
    const result = await chrome.storage.local.get(KEY)
    return result[KEY] || []
  }
  return getLocalSchedules()
}

export async function createSchedule(payload) {
  const items = await fetchSchedules()
  items.push(payload)
  if (hasChromeStorage()) {
    await chrome.storage.local.set({ [KEY]: items })
  } else {
    setLocalSchedules(items)
  }
  return { ok: true }
}

export async function replaceSchedules(items) {
  if (hasChromeStorage()) {
    await chrome.storage.local.set({ [KEY]: items })
  } else {
    setLocalSchedules(items)
  }
  return { ok: true }
}

export async function updateSchedule(id, payload) {
  const items = await fetchSchedules()
  const index = items.findIndex((item) => item.id === id)
  if (index !== -1) {
    items[index] = { ...items[index], ...payload }
    if (hasChromeStorage()) {
      await chrome.storage.local.set({ [KEY]: items })
    } else {
      setLocalSchedules(items)
    }
  }
  return { ok: true }
}

export async function deleteSchedule(id) {
  const items = await fetchSchedules()
  const filtered = items.filter((item) => item.id !== id)
  if (hasChromeStorage()) {
    await chrome.storage.local.set({ [KEY]: filtered })
  } else {
    setLocalSchedules(filtered)
  }
  return { ok: true }
}
