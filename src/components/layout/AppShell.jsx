import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import {
  LayoutDashboard, FileText, CreditCard, Users, Package, Building2,
  Menu, LogOut, ChevronDown, User,
} from 'lucide-react'
import { dashboardApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { Dialog, DialogContent } from '../ui/dialog'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu'
import { AuroraBackground } from '../fx/AuroraBackground'
import { ease } from '../fx/motion'
import { cn } from '../../lib/cn'

const navGroups = [
  {
    section: 'Main',
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    section: 'Billing',
    items: [
      { to: '/invoices', label: 'Invoices', icon: FileText },
      { to: '/payments', label: 'Payments', icon: CreditCard },
    ],
  },
  {
    section: 'Masters',
    items: [
      { to: '/customers', label: 'Customers', icon: Users },
      { to: '/products', label: 'Products', icon: Package },
    ],
  },
  {
    section: 'Settings',
    items: [{ to: '/company', label: 'Company', icon: Building2 }],
  },
]

const pageTitles = {
  '/': 'Dashboard',
  '/invoices': 'Invoices',
  '/payments': 'Payments',
  '/customers': 'Customers',
  '/products': 'Products',
  '/company': 'Company Profile',
}

const statusStyle = {
  connected: 'bg-emerald-400',
  offline: 'bg-rose-500',
  checking: 'bg-amber-400',
}

function SidebarNav({ onNavigate, id }) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* ambient glow */}
      <div aria-hidden className="pointer-events-none absolute -left-16 -top-24 h-64 w-64 rounded-full bg-violet-600/25 blur-[80px]" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-20 h-56 w-56 rounded-full bg-cyan-500/15 blur-[80px]" />
      <div aria-hidden className="grid-bg-dark pointer-events-none absolute inset-0 opacity-60" />

      <div className="relative flex items-center gap-3 px-5 py-5">
        <motion.div
          whileHover={{ rotateY: 180 }}
          transition={{ duration: 0.8, ease }}
          style={{ transformPerspective: 600 }}
          className="conic-ring flex h-9 w-9 items-center justify-center rounded-xl bg-[#0b0b12] text-xs font-bold tracking-wider text-white shadow-[0_0_24px_-4px_rgb(139_92_246/0.8)]"
        >
          JV
        </motion.div>
        <div>
          <div className="text-sm font-semibold text-white">
            GST<span className="text-gradient-light">Bill</span>
          </div>
          <div className="text-[11px] text-white/45">Billing System</div>
        </div>
      </div>

      <LayoutGroup id={id}>
        <nav className="relative flex-1 space-y-6 overflow-y-auto px-3 pb-4">
          {navGroups.map((group, gi) => (
            <div key={group.section}>
              <div className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
                {group.section}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item, ii) => (
                  <motion.div
                    key={item.to}
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.05 + gi * 0.06 + ii * 0.04, ease }}
                  >
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors',
                          isActive ? 'text-white' : 'text-white/60 hover:bg-white/[0.04] hover:text-white'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <motion.span
                              layoutId="nav-pill"
                              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                              className="absolute inset-0 rounded-xl border border-white/10 bg-gradient-to-r from-violet-500/30 via-indigo-500/15 to-transparent shadow-[0_0_24px_-6px_rgb(139_92_246/0.7)]"
                            >
                              <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-violet-300 to-cyan-300 shadow-[0_0_10px_rgb(139_92_246)]" />
                            </motion.span>
                          )}
                          <item.icon
                            className={cn(
                              'relative h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110',
                              isActive && 'text-violet-200 drop-shadow-[0_0_6px_rgb(167_139_250/0.8)]'
                            )}
                          />
                          <span className="relative">{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </LayoutGroup>
    </div>
  )
}

export default function AppShell() {
  const { pathname } = useLocation()
  const title = pageTitles[pathname] || 'GST Bill'
  const [fy, setFy] = useState(null)
  const [apiStatus, setApiStatus] = useState('checking')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { logout } = useAuth()

  useEffect(() => {
    dashboardApi.get()
      .then((r) => { setFy(r.data.financial_year); setApiStatus('connected') })
      .catch(() => setApiStatus('offline'))
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-white/[0.06] bg-[#07070d] lg:block">
        <SidebarNav id="desktop" />
      </aside>

      {/* Mobile drawer */}
      <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DialogContent
          showClose={false}
          className="left-0 top-0 h-full w-72 max-w-[85vw] translate-x-0 translate-y-0 rounded-none border-0 border-r border-white/[0.06] bg-[#07070d] p-0 backdrop-blur-none data-[state=open]:animate-[drawer-in_0.25s_ease-out] data-[state=closed]:animate-[drawer-out_0.2s_ease-in] sm:max-w-[85vw] sm:rounded-none"
        >
          <SidebarNav id="drawer" onNavigate={() => setDrawerOpen(false)} />
        </DialogContent>
      </Dialog>

      <div className="relative isolate flex min-w-0 flex-1 flex-col">
        <AuroraBackground />

        <header className="relative z-10 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-foreground/[0.06] bg-background/50 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <button
              className="rounded-full p-1.5 text-muted-foreground hover:bg-violet-500/10 lg:hidden"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <AnimatePresence mode="wait">
              <motion.h1
                key={title}
                initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                transition={{ duration: 0.3, ease }}
                className="text-base font-semibold tracking-tight sm:text-lg"
              >
                {title}
              </motion.h1>
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden items-center gap-1.5 rounded-full border border-foreground/10 bg-card/50 px-2.5 py-1 font-mono text-[11px] font-medium text-muted-foreground backdrop-blur sm:inline-flex">
              FY {fy || '—'}
            </span>
            <span className="hidden items-center gap-2 rounded-full border border-foreground/10 bg-card/50 px-2.5 py-1 text-[11px] capitalize text-muted-foreground backdrop-blur md:inline-flex">
              <span className="relative flex h-1.5 w-1.5">
                <span className={cn('pulse-ring absolute inset-0 rounded-full', statusStyle[apiStatus])} />
                <span className={cn('relative h-1.5 w-1.5 rounded-full', statusStyle[apiStatus])} />
              </span>
              {apiStatus}
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 rounded-full border border-foreground/10 bg-card/50 py-1 pl-1 pr-2 text-sm backdrop-blur transition-colors hover:border-violet-400/40">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 text-white">
                    <User className="h-3.5 w-3.5" />
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                  <LogOut className="h-3.5 w-3.5" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="relative flex-1 overflow-y-auto p-4 sm:p-6" style={{ perspective: 1400 }}>
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 16, rotateX: 4, filter: 'blur(8px)' }}
            // filter must end as 'none': any filter makes this a backdrop root and kills the glass blur inside
            animate={{ opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
            transition={{ duration: 0.6, ease }}
            style={{ transformOrigin: '50% 0%' }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
