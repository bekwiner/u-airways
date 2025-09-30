import { format } from 'date-fns'

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)

export const formatDateTime = (value: string | Date) => {
  try {
    return format(new Date(value), 'dd MMM yyyy, HH:mm')
  } catch (error) {
    return '-'
  }
}

export const formatDate = (value: string | Date) => {
  try {
    return format(new Date(value), 'dd MMM yyyy')
  } catch (error) {
    return '-'
  }
}
