import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { ease } from '../../components/fx/motion'
import { User, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Check } from 'lucide-react'

const HIGHLIGHTS = ['GST invoices', 'Instant PDF', 'Payment tracking']

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      const response = await api.post('/login/', { username, password })
      if (response.data?.token) login(response.data.token)
    } catch (err) {
      setError(err.response?.data?.non_field_errors?.[0] || 'Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#140c33] px-5 py-10 text-white">
      {/* gradient glow behind the card */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="aurora-a absolute -left-40 -top-48 h-[36rem] w-[36rem] rounded-full bg-violet-600/45 blur-[140px]" />
        <div className="aurora-b absolute -bottom-48 -right-40 h-[36rem] w-[36rem] rounded-full bg-emerald-500/30 blur-[140px]" />
        <div className="aurora-c absolute left-1/2 top-1/2 h-[22rem] w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="grid-bg-dark absolute inset-0 opacity-40" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease }}
        className="w-full max-w-[420px]"
      >
        <div className="rounded-3xl border border-violet-400/20 bg-[#0d0d16]/85 p-8 shadow-[0_40px_120px_-30px_rgb(76_29_149/0.8)] backdrop-blur-2xl sm:p-10">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 text-base font-bold tracking-wider shadow-[0_10px_30px_-8px_rgb(139_92_246/0.9)]">
              JV
            </div>
            <div className="mt-4 text-lg font-semibold tracking-tight">
              GST<span className="text-gradient-light">Bill</span>
            </div>
            <h1 className="mt-6 text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-1.5 text-sm text-white/55">Sign in to your billing dashboard</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: [0, -6, 6, -3, 3, 0] }}
              transition={{ duration: 0.45 }}
              className="mt-6 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-white/85">Username</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-[18px] w-[18px] -translate-y-1/2 text-white/70" />
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                  className="h-12 rounded-xl pl-11"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-white/85">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-[18px] w-[18px] -translate-y-1/2 text-white/70" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-12 rounded-xl px-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 z-10 -translate-y-1/2 text-white/50 hover:text-white"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="group mt-2 h-12 w-full rounded-xl" size="lg" loading={isLoading}>
              {isLoading ? (
                'Signing in…'
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-7 flex flex-wrap justify-center gap-x-3.5 gap-y-2 border-t border-white/10 pt-5">
            {HIGHLIGHTS.map((h, i) => (
              <motion.span
                key={h}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease, delay: 0.5 + i * 0.1 }}
                className="flex items-center gap-1.5 text-xs text-white/60"
              >
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                {h}
              </motion.span>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-white/40">
          © {new Date().getFullYear()} GSTBill. All rights reserved.
        </p>
      </motion.div>
    </div>
  )
}
