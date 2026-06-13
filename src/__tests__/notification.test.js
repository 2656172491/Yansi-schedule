import { describe, it, expect, vi, beforeEach } from 'vitest'

// 提取浏览器通知权限检查逻辑
async function checkBrowserNotificationPermission() {
  if ('Notification' in globalThis) {
    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied') return false
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }
  return false
}

describe('浏览器通知权限检查', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('已授权时返回 true', async () => {
    globalThis.Notification = { permission: 'granted' }
    const result = await checkBrowserNotificationPermission()
    expect(result).toBe(true)
  })

  it('已拒绝时返回 false', async () => {
    globalThis.Notification = { permission: 'denied' }
    const result = await checkBrowserNotificationPermission()
    expect(result).toBe(false)
  })

  it('待定时请求权限并返回授权结果', async () => {
    globalThis.Notification = {
      permission: 'default',
      requestPermission: vi.fn().mockResolvedValue('granted')
    }
    const result = await checkBrowserNotificationPermission()
    expect(result).toBe(true)
    expect(globalThis.Notification.requestPermission).toHaveBeenCalled()
  })

  it('待定时请求权限并返回拒绝结果', async () => {
    globalThis.Notification = {
      permission: 'default',
      requestPermission: vi.fn().mockResolvedValue('denied')
    }
    const result = await checkBrowserNotificationPermission()
    expect(result).toBe(false)
  })

  it('不支持 Notification API 时返回 false', async () => {
    delete globalThis.Notification
    const result = await checkBrowserNotificationPermission()
    expect(result).toBe(false)
  })
})
