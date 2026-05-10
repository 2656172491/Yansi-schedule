import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import weekday from 'dayjs/plugin/weekday'
import localeData from 'dayjs/plugin/localeData'
import 'dayjs/locale/zh-cn'

dayjs.extend(isoWeek)
dayjs.extend(weekOfYear)
dayjs.extend(weekday)
dayjs.extend(localeData)
dayjs.locale('zh-cn')

export const hourLabels = Array.from({ length: 24 }, (_, index) => `${String(index).padStart(2, '0')}:00`)

export function formatDisplayDate(date, format = 'YYYY年M月D日') {
  return dayjs(date).format(format)
}

export function getWeekRange(date) {
  const current = dayjs(date)
  return {
    start: current.startOf('isoWeek'),
    end: current.startOf('isoWeek').add(6, 'day'),
  }
}

export function getWeekDays(date) {
  const { start } = getWeekRange(date)
  return Array.from({ length: 7 }, (_, index) => start.add(index, 'day'))
}

export function getMonthDays(date) {
  const current = dayjs(date)
  const start = current.startOf('month').startOf('isoWeek')
  return Array.from({ length: 42 }, (_, index) => start.add(index, 'day'))
}

export function toDateKey(value) {
  return dayjs(value).format('YYYY-MM-DD')
}

export function toTimeNumber(value) {
  const [hours, minutes] = value.split(':').map(Number)
  return hours + minutes / 60
}

export function toTimeString(value) {
  const hours = Math.floor(value)
  const minutes = Math.round((value - hours) * 60)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function isSameMonth(left, right) {
  return dayjs(left).format('YYYY-MM') === dayjs(right).format('YYYY-MM')
}
