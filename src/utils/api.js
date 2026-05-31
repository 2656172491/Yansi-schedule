import { isLoggedIn } from '../api/auth.js'
import * as remoteSchedules from '../api/schedules.js'

const KEY = 'schedules'

// 本地存储函数
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

// 检查是否应该使用远程 API
function useRemoteApi() {
  return isLoggedIn()
}

// 获取日程
export async function fetchSchedules() {
  if (useRemoteApi()) {
    try {
      return await remoteSchedules.fetchSchedules()
    } catch (err) {
      console.warn('远程获取失败，回退到本地:', err)
    }
  }

  // 本地存储
  if (hasChromeStorage()) {
    const result = await chrome.storage.local.get(KEY)
    return result[KEY] || []
  }
  return getLocalSchedules()
}

// 创建日程
export async function createSchedule(payload) {
  if (useRemoteApi()) {
    try {
      return await remoteSchedules.createSchedule(payload)
    } catch (err) {
      console.warn('远程创建失败，保存到本地:', err)
    }
  }

  // 本地存储
  const items = await fetchSchedules()
  items.push(payload)
  if (hasChromeStorage()) {
    await chrome.storage.local.set({ [KEY]: items })
  } else {
    setLocalSchedules(items)
  }
  return { ok: true }
}

// 替换所有日程
export async function replaceSchedules(items) {
  if (useRemoteApi()) {
    try {
      return await remoteSchedules.syncSchedules(items)
    } catch (err) {
      console.warn('远程同步失败，保存到本地:', err)
    }
  }

  // 本地存储
  if (hasChromeStorage()) {
    await chrome.storage.local.set({ [KEY]: items })
  } else {
    setLocalSchedules(items)
  }
  return { ok: true }
}

// 更新日程
export async function updateSchedule(id, payload) {
  if (useRemoteApi()) {
    try {
      return await remoteSchedules.updateSchedule(id, payload)
    } catch (err) {
      console.warn('远程更新失败，更新本地:', err)
    }
  }

  // 本地存储
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

// 删除日程
export async function deleteSchedule(id) {
  if (useRemoteApi()) {
    try {
      await remoteSchedules.deleteSchedule(id)
    } catch (err) {
      console.warn('远程删除失败，删除本地:', err)
    }
  }

  // 本地存储
  const items = await fetchSchedules()
  const filtered = items.filter((item) => item.id !== id)
  if (hasChromeStorage()) {
    await chrome.storage.local.set({ [KEY]: filtered })
  } else {
    setLocalSchedules(filtered)
  }
  return { ok: true }
}
