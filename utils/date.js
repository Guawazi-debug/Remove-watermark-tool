function parseDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || '').trim())
  if (!match) return null

  const year = parseInt(match[1], 10)
  const month = parseInt(match[2], 10) - 1
  const day = parseInt(match[3], 10)
  const date = new Date(year, month, day)
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null
  }
  return date
}

function parseDateTime(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(String(value || '').trim())
  if (!match) return null

  const year = parseInt(match[1], 10)
  const month = parseInt(match[2], 10) - 1
  const day = parseInt(match[3], 10)
  const hour = parseInt(match[4] || '0', 10)
  const minute = parseInt(match[5] || '0', 10)
  const second = parseInt(match[6] || '0', 10)
  const date = new Date(year, month, day, hour, minute, second)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute ||
    date.getSeconds() !== second
  ) {
    return null
  }

  return date
}

function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDateTime(date) {
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  const sec = String(date.getSeconds()).padStart(2, '0')
  return `${formatDate(date)} ${h}:${min}:${sec}`
}

function diffCalendar(startDate, endDate) {
  let years = endDate.getFullYear() - startDate.getFullYear()
  let anchor = addCalendarMonths(startDate, years * 12)

  if (anchor > endDate) {
    years -= 1
    anchor = addCalendarMonths(startDate, years * 12)
  }

  let months = (endDate.getFullYear() - anchor.getFullYear()) * 12 + (endDate.getMonth() - anchor.getMonth())
  let monthAnchor = addCalendarMonths(anchor, months)

  if (monthAnchor > endDate) {
    months -= 1
    monthAnchor = addCalendarMonths(anchor, months)
  }

  const days = Math.round((stripTime(endDate) - stripTime(monthAnchor)) / 86400000)
  return { years, months, days }
}

function nextBirthdayDate(birthday, today) {
  const month = birthday.getMonth()
  const day = birthday.getDate()
  let year = today.getFullYear()
  let candidate = buildBirthday(year, month, day)
  if (candidate < stripTime(today)) {
    year += 1
    candidate = buildBirthday(year, month, day)
  }
  return candidate
}

function buildBirthday(year, month, day) {
  if (month === 1 && day === 29 && !isLeapYear(year)) {
    return new Date(year, 1, 28)
  }
  return new Date(year, month, day)
}

function addCalendarMonths(date, months) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const day = date.getDate()
  const targetMonthIndex = month + months
  const targetYear = year + Math.floor(targetMonthIndex / 12)
  const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12
  const lastDay = new Date(targetYear, normalizedMonth + 1, 0).getDate()
  return new Date(targetYear, normalizedMonth, Math.min(day, lastDay))
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

module.exports = {
  parseDate,
  parseDateTime,
  formatDate,
  formatDateTime,
  diffCalendar,
  nextBirthdayDate,
  stripTime
}
