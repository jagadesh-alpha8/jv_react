import axios from 'axios'

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Token ${token}`
  }
  return config
}, (error) => Promise.reject(error))

// A saved token that no longer works (deleted, or the user was removed) gets a 401
// on every call. Drop it and go back to the login page instead of leaving every
// page broken until the user logs out by hand.
api.interceptors.response.use((res) => res, (error) => {
  const url = error.config?.url || ''
  if (error.response?.status === 401 && !url.includes('/login/') && localStorage.getItem('token')) {
    localStorage.removeItem('token')
    if (window.location.pathname !== '/login') window.location.assign('/login')
  }
  return Promise.reject(error)
})

export default api

// ── Company ──
export const companyApi = {
  get: () => api.get('/company/me/'),
  update: (data) => api.patch('/company/me/', data),
}

// ── Customers ──
export const customersApi = {
  list: (params) => api.get('/customers/', { params }),
  get: (id) => api.get(`/customers/${id}/`),
  create: (data) => api.post('/customers/', data),
  update: (id, data) => api.patch(`/customers/${id}/`, data),
  remove: (id) => api.delete(`/customers/${id}/`),
  ledger: (id) => api.get(`/customers/${id}/ledger/`),
  hide: (id) => api.post(`/customers/${id}/hide/`),
  restore: (id) => api.post(`/customers/${id}/restore/`),
}

// ── Products ──
export const productsApi = {
  list: (params) => api.get('/products/', { params }),
  get: (id) => api.get(`/products/${id}/`),
  create: (data) => api.post('/products/', data),
  update: (id, data) => api.patch(`/products/${id}/`, data),
  remove: (id) => api.delete(`/products/${id}/`),
  // Live duplicate lookup while typing a product name.
  checkName: (name, excludeId, config) =>
    api.get('/products/check-name/', { params: { name, exclude: excludeId || undefined }, ...config }),
}

// PDF endpoints require the auth token, so a plain <a href> can't be used —
// the browser won't attach the Authorization header. Fetch as a blob instead.
async function fetchPdfObjectUrl(id) {
  const res = await api.get(`/invoices/${id}/pdf/`, { responseType: 'blob' })
  return URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
}

// ── Invoices ──
export const invoicesApi = {
  list: (params) => api.get('/invoices/', { params }),
  get: (id) => api.get(`/invoices/${id}/`),
  create: (data) => api.post('/invoices/', data),
  update: (id, data) => api.patch(`/invoices/${id}/`, data),
  remove: (id) => api.delete(`/invoices/${id}/`),
  last: () => api.get('/invoices/last/'),
  addPayment: (id, data) => api.post(`/invoices/${id}/add_payment/`, data),
  printView: (id) => api.get(`/invoices/${id}/print_view/`),
  financialYears: () => api.get('/invoices/financial_years/'),
  downloadPdf: async (id, filename) => {
    const url = await fetchPdfObjectUrl(id)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `Invoice_${id}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 30000)
  },
  openPdf: async (id) => {
    const url = await fetchPdfObjectUrl(id)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  },
}

// ── Payments ──
export const paymentsApi = {
  list: (params) => api.get('/payments/', { params }),
  update: (id, data) => api.patch(`/payments/${id}/`, data),
  remove: (id) => api.delete(`/payments/${id}/`),
}

// ── Dashboard ──
export const dashboardApi = {
  get: (params) => api.get('/dashboard/', { params }),
}


// ── Non-GST billing (separate ledger; shares customers and products) ──
async function fetchNonGstPdfUrl(id) {
  const res = await api.get(`/nongst/bills/${id}/pdf/`, { responseType: 'blob' })
  return URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
}

export const nongstApi = {
  bills: (params) => api.get('/nongst/bills/', { params }),
  bill: (id) => api.get(`/nongst/bills/${id}/`),
  createBill: (data) => api.post('/nongst/bills/', data),
  updateBill: (id, data) => api.patch(`/nongst/bills/${id}/`, data),
  removeBill: (id) => api.delete(`/nongst/bills/${id}/`),
  lastBill: () => api.get('/nongst/bills/last/'),
  financialYears: () => api.get('/nongst/bills/financial_years/'),
  payments: (params) => api.get('/nongst/payments/', { params }),
  createPayment: (data) => api.post('/nongst/payments/', data),
  updatePayment: (id, data) => api.patch(`/nongst/payments/${id}/`, data),
  removePayment: (id) => api.delete(`/nongst/payments/${id}/`),
  balances: (params) => api.get('/nongst/balances/', { params }),
  dashboard: (params) => api.get('/nongst/dashboard/', { params }),
  openPdf: async (id) => {
    const url = await fetchNonGstPdfUrl(id)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  },
  downloadPdf: async (id, filename) => {
    const url = await fetchNonGstPdfUrl(id)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `Bill_${id}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 30000)
  },
}

// ── Customer statements (ledger for a date range); kind = 'gst' | 'nongst', kept separate ──
export const statementsApi = {
  get: (kind, params) => api.get(`/statements/${kind}/`, { params }),
  pdfUrl: async (kind, params) => {
    const res = await api.get(`/statements/${kind}/pdf/`, { params, responseType: 'blob' })
    return URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
  },
}
