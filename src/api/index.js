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
}

// ── Dashboard ──
export const dashboardApi = {
  get: (params) => api.get('/dashboard/', { params }),
}
