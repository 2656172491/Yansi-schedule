const KEY = 'schedules'

export async function fetchSchedules() {
  const result = await chrome.storage.local.get(KEY)
  return result[KEY] || []
}

export async function createSchedule(payload) {
  const items = await fetchSchedules()
  items.push(payload)
  await chrome.storage.local.set({ [KEY]: items })
  return { ok: true }
}

export async function updateSchedule(id, payload) {
  const items = await fetchSchedules()
  const index = items.findIndex((item) => item.id === id)
  if (index !== -1) {
    items[index] = { ...items[index], ...payload }
    await chrome.storage.local.set({ [KEY]: items })
  }
  return { ok: true }
}

export async function deleteSchedule(id) {
  const items = await fetchSchedules()
  const filtered = items.filter((item) => item.id !== id)
  await chrome.storage.local.set({ [KEY]: filtered })
  return { ok: true }
}
