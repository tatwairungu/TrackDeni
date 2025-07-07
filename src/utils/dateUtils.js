import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

// Extend dayjs with plugins
dayjs.extend(relativeTime)

export const formatDate = (date) => {
  return dayjs(date).format('MMM DD, YYYY')
}

export const formatDateShort = (date) => {
  return dayjs(date).format('DD/MM/YYYY')
}

export const getRelativeTime = (date) => {
  return dayjs(date).fromNow()
}

export const isOverdue = (dueDate) => {
  return dayjs(dueDate).isBefore(dayjs(), 'day')
}

export const isDueSoon = (dueDate, days = 3) => {
  const due = dayjs(dueDate)
  const now = dayjs()
  return due.isAfter(now) && due.diff(now, 'day') <= days
}

export const getDaysUntilDue = (dueDate) => {
  return dayjs(dueDate).diff(dayjs(), 'day')
}

export const getDebtStatus = (dueDate, isPaid = false) => {
  if (isPaid) return 'paid'
  if (isOverdue(dueDate)) return 'overdue'
  if (isDueSoon(dueDate)) return 'due-soon'
  return 'active'
}

export const getStatusColor = (status) => {
  switch (status) {
    case 'paid':
      return 'success'
    case 'overdue':
      return 'danger'
    case 'due-soon':
      return 'accent'
    default:
      return 'primary'
  }
}

export const getStatusText = (dueDate, isPaid = false) => {
  if (isPaid) return 'Paid'
  
  const today = dayjs()
  const due = dayjs(dueDate)
  
  // Check if due date is today
  if (due.format('YYYY-MM-DD') === today.format('YYYY-MM-DD')) return 'Due today'
  
  // Check if due date is tomorrow
  if (due.format('YYYY-MM-DD') === today.add(1, 'day').format('YYYY-MM-DD')) return 'Due tomorrow'
  
  if (isOverdue(dueDate)) {
    const days = Math.abs(getDaysUntilDue(dueDate))
    return `${days} day${days > 1 ? 's' : ''} overdue`
  }
  if (isDueSoon(dueDate)) {
    const days = getDaysUntilDue(dueDate)
    return `Due in ${days} day${days > 1 ? 's' : ''}`
  }
  
  return formatDate(dueDate)
}

export const getTodayDate = () => {
  return dayjs().format('YYYY-MM-DD')
}

export const addDays = (date, days) => {
  return dayjs(date).add(days, 'day').format('YYYY-MM-DD')
} 