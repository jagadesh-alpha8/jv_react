import { lazy, Suspense, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { AuroraBackground } from '../../components/fx/AuroraBackground'
import { Eyebrow, Reveal, ease, trackPointer } from '../../components/fx/motion'
import { User, Lock, Eye, EyeOff, ArrowRight, AlertCircle, ShieldCheck, Zap, Receipt } from 'lucide-react'

const Hero3D = lazy(() => import('../../three/Hero3D'))

const features = [
  { icon: Receipt, label: 'GST-compliant invoices' },
  { icon: Zap, label: 'Instant PDF & payments' },
  { icon: ShieldCheck, label: 'Secure by default' },
]

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
    <div className="relative grid min-h-screen bg-background lg:grid-cols-[1.15fr_1fr]">
      {/* ── Showcase panel ── */}
      <div className="relative isolate hidden overflow-hidden bg-[#05050a] text-white lg:flex lg:flex-col">
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="aurora-a absolute -left-32 -top-40 h-[32rem] w-[32rem] rounded-full bg-violet-600/30 blur-[120px]" />
          <div className="aurora-b absolute -bottom-40 -right-20 h-[30rem] w-[34rem] rounded-full bg-cyan-500/20 blur-[120px]" />
          <div className="grid-bg-dark absolute inset-0" />
        </div>

        <div className="flex items-center gap-3 p-10">
          <div className="conic-ring flex h-10 w-10 items-center justify-center rounded-xl bg-[#0b0b12] text-xs font-bold tracking-wider shadow-[0_0_24px_-4px_rgb(139_92_246/0.8)]">
            JV
          </div>
          <span className="text-lg font-semibold">GST<span className="text-gradient-light">Bill</span></span>
        </div>

        <div className="relative min-h-0 flex-1">
          <Suspense fallback={null}>
            <Hero3D className="absolute inset-0" />
          </Suspense>
        </div>

        <div className="p-10 pt-0">
          <Reveal delay={0.2}>
            <Eyebrow dark>Billing, reimagined</Eyebrow>
          </Reveal>
          <Reveal delay={0.3}>
            <h2 className="mt-4 max-w-md text-4xl font-semibold leading-[1.08] tracking-[-0.03em]">
              <span className="bg-gradient-to-b from-white to-white/55 bg-clip-text text-transparent">Invoices that </span>
              <span className="text-gradient-light">get paid faster.</span>
            </h2>
          </Reveal>
          <div className="mt-6 flex flex-wrap gap-2">
            {features.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.45 + i * 0.08, ease }}
                className="glass-dark inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-white/75"
              >
                <f.icon className="h-3.5 w-3.5 text-violet-300" />
                {f.label}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Form panel ── */}
      <div className="relative isolate flex items-center justify-center overflow-hidden p-6">
        <AuroraBackground />

        <div className="relative w-full max-w-sm">
          {/* compact 3D on small screens */}
          <div className="relative -mt-4 mb-2 h-48 lg:hidden">
            <Suspense fallback={null}>
              <Hero3D className="absolute inset-0" compact z={7} />
            </Suspense>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24, rotateX: 12, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
            transition={{ duration: 0.8, ease }}
            style={{ transformPerspective: 1000 }}
            onMouseMove={trackPointer}
            className="ring-glow glass rounded-3xl p-7 shadow-[0_30px_80px_-30px_rgb(76_29_149/0.5)] sm:p-8"
          >
            <div className="mb-6 flex items-center gap-2.5 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 text-xs font-bold text-white">JV</div>
              <span className="font-semibold">GST<span className="text-gradient">Bill</span></span>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Sign in to access your billing dashboard</p>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: [0, -6, 6, -3, 3, 0] }}
                transition={{ duration: 0.45 }}
                className="mt-5 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="username" className="text-sm font-medium">Username</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    autoComplete="username"
                    className="h-11 pl-9"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="h-11 px-9"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="group w-full" size="lg" loading={isLoading}>
                {isLoading ? (
                  'Signing in…'
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>
          </motion.div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} GSTBill. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
