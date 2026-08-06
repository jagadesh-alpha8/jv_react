import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from './components/ui/toast'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppShell from './components/layout/AppShell'
import Dashboard from './pages/Dashboard/Dashboard'
import Invoices from './pages/Invoices/Invoices'
import Payments from './pages/Payments/Payments'
import Customers from './pages/Customers/Customers'
import Products from './pages/Products/Products'
import Company from './pages/Company/Company'
import Login from './pages/Login/Login'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<AppShell />}>
                  <Route index element={<Dashboard />} />
                  <Route path="invoices" element={<Invoices />} />
                  <Route path="payments" element={<Payments />} />
                  <Route path="customers" element={<Customers />} />
                  <Route path="products" element={<Products />} />
                  <Route path="company" element={<Company />} />
                </Route>
              </Route>
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
