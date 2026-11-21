// Small helpers shared by the Non-GST pages.

export const inr = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const inr0 = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

export const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const PAYMENT_METHODS = [
  ['cash', 'Cash'],
  ['upi', 'UPI'],
  ['card', 'Card'],
  ['bank', 'Bank Transfer'],
  ['cheque', 'Cheque'],
  ['neft', 'NEFT'],
  ['rtgs', 'RTGS'],
]
export const methodLabel = Object.fromEntries(PAYMENT_METHODS)

/** Turn a DRF error response into one readable sentence. */
export function errorText(e, fallback = 'Something went wrong') {
  const data = e?.response?.data
  if (!data) return fallback
  if (typeof data === 'string') return data
  const first = (v) => (Array.isArray(v) ? first(v[0]) : v && typeof v === 'object' ? first(Object.values(v)[0]) : v)
  if (data.detail) return first(data.detail)
  if (data.items) return `Items: ${first(data.items)}`
  return first(data) || fallback
}
