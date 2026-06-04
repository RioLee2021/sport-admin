/**
 * 将时间戳转换为格式化字符串
 * @param {number|string} timestamp 时间戳（秒或毫秒）
 * @param {string} format 格式，默认 'yyyy-MM-dd HH:mm:ss'
 * @returns {string} 格式化后的时间字符串
 */
export const formatTimestamp = (timestamp, format = 'yyyy-MM-dd HH:mm:ss') => {
  if (!timestamp && timestamp !== 0) return '-'

  // 如果是秒级时间戳（10位），转换为毫秒级（13位）
  let ts = Number(timestamp)
  if (ts.toString().length === 10) {
    ts = ts * 1000
  }

  const date = new Date(ts)

  // 检查日期是否有效
  if (isNaN(date.getTime())) return '-'

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return format
    .replace('yyyy', year)
    .replace('MM', month)
    .replace('dd', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 格式化日期（仅日期部分）
 * @param {number|string} timestamp
 * @returns {string} yyyy-MM-dd
 */
export const formatDate = (timestamp) => {
  return formatTimestamp(timestamp, 'yyyy-MM-dd')
}

/**
 * 格式化日期时间（带秒）
 * @param {number|string} timestamp
 * @returns {string} yyyy-MM-dd HH:mm:ss
 */
export const formatDateTime = (timestamp) => {
  return formatTimestamp(timestamp, 'yyyy-MM-dd HH:mm:ss')
}

/**
 * 格式化相对时间（如：刚刚、5分钟前、2小时前）
 * @param {number|string} timestamp
 * @returns {string}
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '-'

  let ts = Number(timestamp)
  if (ts.toString().length === 10) ts = ts * 1000

  const now = Date.now()
  const diff = now - ts

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  if (minutes > 0) return `${minutes}分钟前`
  if (seconds >= 0) return '刚刚'

  return formatDateTime(timestamp)
}

// 将日期选择器的值转为 10 位时间戳
export const toTimestamp = (dateStr) => dateStr ? Math.floor(new Date(dateStr).getTime() / 1000) : undefined
