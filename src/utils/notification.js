import dayjs from 'dayjs'

const NOTIFICATION_ADVANCE_MINUTES = 60 // 提前 60 分钟通知
const CHECK_INTERVAL = 60 * 1000 // 每分钟检查一次
const NOTIFIED_KEY = 'notified_schedule_ids'

let checkTimer = null
let isSupported = false
let channelCreated = false

// 检查是否在 Tauri 环境
function isTauri() {
  return window.__TAURI_INTERNALS__ !== undefined
}

// 获取已通知的日程 ID 列表
function getNotifiedIds() {
  try {
    const raw = localStorage.getItem(NOTIFIED_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// 标记日程已通知
function markNotified(scheduleId) {
  const ids = getNotifiedIds()
  if (!ids.includes(scheduleId)) {
    ids.push(scheduleId)
    // 只保留最近 100 条记录
    if (ids.length > 100) {
      ids.splice(0, ids.length - 100)
    }
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(ids))
  }
}

// 检查日程是否已通知
function isNotified(scheduleId) {
  return getNotifiedIds().includes(scheduleId)
}

// 清除过期的通知记录（清除昨天及以前的）
function cleanupNotifiedIds() {
  const ids = getNotifiedIds()
  // 简单清理：只保留最近 50 条
  if (ids.length > 50) {
    const recent = ids.slice(-50)
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(recent))
  }
}

// 发送系统通知
async function sendNotification(title, body) {
  if (!isTauri()) {
    // 浏览器环境使用 Web Notification API
    if ('Notification' in window) {
      let granted = Notification.permission === 'granted'
      if (!granted && Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission()
        granted = permission === 'granted'
      }
      if (granted) {
        new Notification(title, { body })
      }
    } else {
      console.log('[通知]', title, body)
      alert(`${title}\n${body}`)
    }
    return
  }

  try {
    const notification = await import('@tauri-apps/plugin-notification')

    let granted = await notification.isPermissionGranted()
    console.log('[通知] 权限状态:', granted)

    if (!granted) {
      const permission = await notification.requestPermission()
      console.log('[通知] 请求权限结果:', permission)
      granted = permission === 'granted'
    }

    if (granted) {
      const channelId = 'schedule-reminder'

      if (!channelCreated) {
        await notification.createChannel({
          id: channelId,
          name: '日程提醒',
          description: '日程即将开始的提醒通知',
          importance: notification.Importance.High,
          visibility: notification.Visibility.Public,
          lights: true,
          vibration: true,
          sound: 'default',
        })
        channelCreated = true
        console.log('[通知] 渠道已创建:', channelId)
      }

      notification.sendNotification({
        title,
        body,
        icon: 'ic_notification',
        channelId: channelId,
        autoCancel: true,
        sound: 'default',
      })
      console.log('[通知] 已发送')
    } else {
      console.log('[通知] 权限未授权')
    }
  } catch (err) {
    console.error('[通知] 发送失败:', err)
  }
}

// 检查即将开始的日程
async function checkUpcomingSchedules(schedules) {
  const now = dayjs()
  const notifyTime = now.add(NOTIFICATION_ADVANCE_MINUTES, 'minute')

  for (const schedule of schedules) {
    const scheduleDateTime = dayjs(`${schedule.date} ${schedule.startTime}`)

    // 检查是否在未来 60 分钟内开始
    const diffMinutes = scheduleDateTime.diff(now, 'minute')

    if (diffMinutes > 0 && diffMinutes <= NOTIFICATION_ADVANCE_MINUTES && !isNotified(schedule.id)) {
      await sendNotification(
        '日程即将开始',
        `「${schedule.title}」将在 ${diffMinutes} 分钟后开始\n时间：${schedule.startTime} - ${schedule.endTime}`
      )
      markNotified(schedule.id)
    }
  }
}

// 启动通知检查
export function startNotificationCheck(getSchedulesFn) {
  if (checkTimer) {
    clearInterval(checkTimer)
  }

  // 清理旧记录
  cleanupNotifiedIds()

  // 立即检查一次
  const schedules = getSchedulesFn()
  checkUpcomingSchedules(schedules)

  // 定时检查
  checkTimer = setInterval(() => {
    const schedules = getSchedulesFn()
    checkUpcomingSchedules(schedules)
  }, CHECK_INTERVAL)

  isSupported = true
  console.log('[通知] 已启动日程提醒检查')
}

// 停止通知检查
export function stopNotificationCheck() {
  if (checkTimer) {
    clearInterval(checkTimer)
    checkTimer = null
  }
  isSupported = false
  console.log('[通知] 已停止日程提醒检查')
}

// 手动测试通知
export async function testNotification() {
  await sendNotification('测试通知', '这是一条测试通知，通知功能正常工作')
}

// 请求通知权限
export async function requestNotificationPermission() {
  if (!isTauri()) {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') return true
      if (Notification.permission === 'denied') return false
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return false
  }

  try {
    const { isPermissionGranted, requestPermission } = await import('@tauri-apps/plugin-notification')

    let granted = await isPermissionGranted()
    if (!granted) {
      const permission = await requestPermission()
      granted = permission === 'granted'
    }

    return granted
  } catch (err) {
    console.error('请求通知权限失败:', err)
    return false
  }
}
