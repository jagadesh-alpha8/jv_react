import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from './components/ui/toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppShell from './components/layout/AppShell'
import Dashboard from './pages/Dashboard/Dashboard'
import Invoices from './pages/Invoices/Invoices'
import Payments from './pages/Payments/Payments'
import Customers from './pages/Customers/Customers'
import CustomerPage from './pages/Customers/CustomerPage'
import Products from './pages/Products/Products'
import Company from './pages/Company/Company'
import MarginCalculator from './pages/Calculator/MarginCalculator'
import NonGstDashboard from './pages/NonGst/NonGstDashboard'
import NonGstBills from './pages/NonGst/NonGstBills'
import NonGstPayments from './pages/NonGst/NonGstPayments'
import StatementPage from './pages/Statements/StatementPage'
import Login from './pages/Login/Login'

export default function App() {
  return (
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
                <Route path="statement" element={<StatementPage key="gst" kind="gst" />} />
                <Route path="customers" element={<Customers />} />
                <Route path="customers/:id" element={<CustomerPage />} />
                <Route path="products" element={<Products />} />
                <Route path="company" element={<Company />} />
                <Route path="margin-calculator" element={<MarginCalculator />} />
                <Route path="non-gst" element={<NonGstDashboard />} />
                <Route path="non-gst/bills" element={<NonGstBills />} />
                <Route path="non-gst/payments" element={<NonGstPayments />} />
                <Route path="non-gst/statement" element={<StatementPage key="nongst" kind="nongst" />} />
              </Route>
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
