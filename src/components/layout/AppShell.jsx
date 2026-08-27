import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, FileText, CreditCard, Users, Package, Building2,
  Menu, LogOut, ChevronDown, User,
} from 'lucide-react'
import { dashboardApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { Dialog, DialogContent } from '../ui/dialog'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu'
import ThemeToggle from '../ThemeToggle'
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
  connected: 'bg-success',
  offline: 'bg-destructive',
  checking: 'bg-warning',
}

function SidebarNav({ onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
          J V
        </div>
        <div>
          <div className="text-sm font-semibold text-sidebar-foreground">
            GST<span className="text-primary">Bill</span>
          </div>
          <div className="text-[11px] text-sidebar-foreground/50">Billing System</div>
        </div>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
        {navGroups.map((group) => (
          <div key={group.section}>
            <div className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
              {group.section}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-sidebar-accent text-white'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                    )
                  }
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
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
    <div className="flex h-screen overflow-hidden bg-muted/40">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
        <SidebarNav />
      </aside>

      {/* Mobile drawer */}
      <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DialogContent
          showClose={false}
          className="left-0 top-0 h-full w-72 max-w-[85vw] translate-x-0 translate-y-0 rounded-none border-r border-sidebar-border bg-sidebar p-0 data-[state=open]:animate-[drawer-in_0.2s_ease-out] data-[state=closed]:animate-[drawer-out_0.2s_ease-in] sm:max-w-[85vw]"
        >
          <SidebarNav onNavigate={() => setDrawerOpen(false)} />
        </DialogContent>
      </Dialog>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent lg:hidden"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-base font-semibold sm:text-lg">{title}</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground sm:inline-flex">
              FY {fy || '—'}
            </span>
            <span className="hidden items-center gap-1.5 text-xs text-muted-foreground md:inline-flex">
              <span className={cn('h-1.5 w-1.5 rounded-full', statusStyle[apiStatus])} />
              {apiStatus}
            </span>

            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 rounded-full border border-border py-1 pl-1 pr-2 text-sm hover:bg-accent">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary">
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

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
