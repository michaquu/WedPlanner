const BYTES_PER_KILOBYTE = 1024
const BYTES_PER_MEGABYTE = BYTES_PER_KILOBYTE * 1024

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 2,
  })
    .format(value)
    .replace(/[\u00a0\u202f]/g, ' ')

export const formatFileSize = (size?: number) => {
  if (size === undefined) return ''
  if (size < BYTES_PER_KILOBYTE) return `${size} B`
  if (size < BYTES_PER_MEGABYTE) return `${Math.round(size / BYTES_PER_KILOBYTE)} KB`
  return `${Math.round(size / BYTES_PER_MEGABYTE)} MB`
}
