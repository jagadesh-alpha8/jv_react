import { lazy, Suspense, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { IndianRupee, FileText, Clock, Users, Wallet, ArrowUpRight } from 'lucide-react'
import { dashboardApi, customersApi } from '../../api'
import { StatCard } from '../../components/ui/stat-card'
import { Badge } from '../../components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Select } from '../../components/ui/select'
import { Table, THead, TBody, Tr, Th, Td, TableWrap, EmptyRow } from '../../components/ui/table'
import { CenteredSpinner } from '../../components/ui/spinner'
import { AnimatedNumber, Eyebrow, Reveal, ease, stagger } from '../../components/fx/motion'

// three.js is heavy — load the scene only when the dashboard renders
const Hero3D = lazy(() => import('../../three/Hero3D'))

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
const fmtCount = (n) => Math.round(n).toLocaleString('en-IN')
const fmtAxis = (v) => (v >= 1e7 ? `₹${+(v / 1e7).toFixed(1)}Cr` : v >= 1e5 ? `₹${+(v / 1e5).toFixed(1)}L` : v >= 1e3 ? `₹${+(v / 1e3).toFixed(0)}K` : `₹${v}`)

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

function HeroBanner({ data, scoped, customers, customerId, setCustomerId }) {
  const revenue = Number(data?.total_revenue || 0)
  const due = Number(data?.total_due || 0)
  const collected = Math.max(revenue - due, 0)
  const rate = revenue > 0 ? Math.round((collected / revenue) * 100) : 0

  return (
    <Reveal className="relative isolate overflow-hidden rounded-3xl border border-white/[0.08] bg-[#07070d] text-white shadow-[0_30px_80px_-30px_rgb(76_29_149/0.6)]">
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="aurora-a absolute -left-20 -top-32 h-80 w-80 rounded-full bg-violet-600/35 blur-[90px]" />
        <div className="aurora-b absolute -bottom-32 right-10 h-80 w-96 rounded-full bg-cyan-500/20 blur-[100px]" />
        <div className="grid-bg-dark absolute inset-0" />
      </div>

      <div className="grid items-center gap-2 lg:grid-cols-[1.1fr_1fr]">
        <div className="relative z-10 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <Eyebrow dark>FY {data?.financial_year || '—'} · Live</Eyebrow>
          </div>
          <h2 className="mt-4 text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
            {greeting()}
            <span className="text-white/50">, here’s {scoped ? data.customer.name : 'your business'}</span>
          </h2>

          <div className="mt-6 text-xs font-medium uppercase tracking-[0.14em] text-white/45">
            {scoped ? 'Billed this year' : 'Total revenue'}
          </div>
          <div className="text-gradient-light mt-1 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
            <AnimatedNumber value={revenue} format={fmt} duration={1.8} />
          </div>

          <div className="mt-5 max-w-md">
            <div className="flex items-center justify-between text-xs text-white/55">
              <span>Collected <span className="font-medium text-white/85">{fmt(collected)}</span></span>
              <span className="font-mono text-cyan-300">{rate}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-300 shadow-[0_0_12px_rgb(103_232_249/0.7)]"
                initial={{ width: 0 }}
                animate={{ width: `${rate}%` }}
                transition={{ duration: 1.6, ease, delay: 0.3 }}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="w-full sm:w-64">
              <Select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                aria-label="Dashboard scope"
                className="border-white/10 bg-white/[0.05] text-white hover:border-white/20 [&_optgroup]:bg-[#0b0b12] [&_option]:bg-[#0b0b12]"
              >
                <option value="">Overall</option>
                <optgroup label="Customer wise">
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </optgroup>
              </Select>
            </div>
            <span className="text-xs text-white/45">
              {scoped ? 'Figures for this customer only' : 'All customers combined'}
            </span>
          </div>
        </div>

        <div className="relative h-[240px] sm:h-[300px] lg:h-[340px]">
          <Suspense fallback={<div className="absolute inset-0 m-auto h-40 w-32 animate-pulse rounded-2xl bg-violet-500/10" />}>
            <Hero3D className="absolute inset-0" compact z={5.6} />
          </Suspense>
        </div>
      </div>
    </Reveal>
  )
}

function StatusDonut({ rows }) {
  const total = rows.reduce((s, r) => s + (r.count || 0), 0)
  let start = 0
  const gap = total > 0 && rows.filter((r) => r.count).length > 1 ? 0.012 : 0

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row lg:flex-col 2xl:flex-row">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r="48" fill="none" stroke="currentColor" strokeWidth="12" className="text-foreground/[0.06]" />
          {total > 0 &&
            rows.map((r, i) => {
              const frac = (r.count || 0) / total
              const seg = Math.max(frac - gap, 0)
              const offset = -start
              start += frac
              return (
                <motion.circle
                  key={r.label}
                  cx="60" cy="60" r="48" fill="none"
                  stroke={r.hex}
                  strokeWidth="12"
                  strokeLinecap="round"
                  pathLength="1"
                  strokeDashoffset={offset}
                  initial={{ strokeDasharray: '0 1' }}
                  animate={{ strokeDasharray: `${seg} 1` }}
                  transition={{ duration: 1.2, delay: 0.2 + i * 0.15, ease }}
                  style={{ filter: `drop-shadow(0 0 6px ${r.hex}88)` }}
                />
              )
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tracking-tight"><AnimatedNumber value={total} format={fmtCount} /></span>
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Invoices</span>
        </div>
      </div>

      <div className="w-full space-y-3">
        {rows.map((r) => {
          const pct = total ? Math.round(((r.count || 0) / total) * 100) : 0
          return (
            <div key={r.label}>
              <div className="flex items-center justify-between">
                <Badge color={r.color} label={r.label} />
                <span className="whitespace-nowrap text-sm font-semibold tabular-nums">
                  {r.count ?? 0} <span className="text-xs font-normal text-muted-foreground">· {pct}%</span>
                </span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-foreground/[0.06]">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: r.hex, boxShadow: `0 0 10px ${r.hex}` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1.2, ease, delay: 0.3 }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-foreground/10 bg-popover/90 px-3 py-2 text-xs shadow-xl backdrop-blur-xl">
      <div className="text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-mono text-sm font-semibold">{fmt(payload[0].value)}</div>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [customers, setCustomers] = useState([])
  const [customerId, setCustomerId] = useState('')  // '' = overall
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    customersApi.list({ page_size: 500, ordering: 'name' })
      .then((r) => setCustomers(r.data.results ?? r.data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    let stale = false
    setLoading(true)
    dashboardApi.get(customerId ? { customer: customerId } : undefined)
      .then((r) => { if (!stale) setData(r.data) })
      .catch(console.error)
      .finally(() => { if (!stale) setLoading(false) })
    return () => { stale = true }
  }, [customerId])

  const scoped = !!data?.customer

  const statusRows = data
    ? [
        { label: 'Paid', count: data.paid_invoices, color: 'green', hex: '#10b981' },
        { label: 'Unpaid', count: data.unpaid_invoices, color: 'blue', hex: '#38bdf8' },
        { label: 'Overdue', count: data.overdue_invoices, color: 'red', hex: '#f43f5e' },
      ]
    : []

  const chartData = (data?.monthly_revenue || []).map((d) => ({ ...d, label: d.month.split(' ')[0] }))

  return (
    <div className="space-y-6">
      <HeroBanner
        data={data}
        scoped={scoped}
        customers={customers}
        customerId={customerId}
        setCustomerId={setCustomerId}
      />

      <div className={loading && data ? 'space-y-6 opacity-60 transition-opacity' : 'space-y-6 transition-opacity'}>
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          style={{ perspective: 1200 }}
        >
          <StatCard label={scoped ? 'Billed' : 'Total Revenue'} value={data ? Number(data.total_revenue) : '—'} format={fmt} sub="This financial year" icon={IndianRupee} tone="brand" />
          <StatCard label="Invoices" value={data ? Number(data.total_invoices) : '—'} format={fmtCount} sub={`FY ${data?.financial_year || ''}`} icon={FileText} tone="green" />
          <StatCard label="Amount Due" value={data ? Number(data.total_due) : '—'} format={fmt} sub="Pending collection" icon={Clock} tone="yellow" />
          {scoped ? (
            <StatCard label="Amount Paid" value={data ? Number(data.total_paid) : '—'} format={fmt} sub="Received so far" icon={Wallet} tone="cyan" />
          ) : (
            <StatCard label="Customers" value={data ? Number(data.total_customers) : '—'} format={fmtCount} sub="Active customers" icon={Users} tone="purple" />
          )}
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Reveal delay={0.15} className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
                <span className="text-xs text-muted-foreground">FY {data?.financial_year || ''}</span>
              </CardHeader>
              <CardContent>
                {!data ? (
                  <CenteredSpinner />
                ) : chartData.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    {scoped ? 'No revenue from this customer yet' : 'No revenue data yet'}
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                        <defs>
                          <linearGradient id="revBar" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22d3ee" />
                            <stop offset="45%" stopColor="#818cf8" />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.55} />
                          </linearGradient>
                          <linearGradient id="revBarHover" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#67e8f9" />
                            <stop offset="100%" stopColor="#a78bfa" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="rgb(var(--foreground) / 0.06)" />
                        <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'rgb(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 12, fill: 'rgb(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={56} />
                        <Tooltip cursor={{ fill: 'rgb(139 92 246 / 0.08)', radius: 8 }} content={<ChartTooltip />} />
                        <Bar
                          dataKey="revenue"
                          fill="url(#revBar)"
                          radius={[8, 8, 2, 2]}
                          maxBarSize={38}
                          animationDuration={1200}
                          activeBar={{ fill: 'url(#revBarHover)', style: { filter: 'drop-shadow(0 0 10px rgb(139 92 246 / 0.7))' } }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </Reveal>

          <Reveal delay={0.22}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Invoice Status</CardTitle>
              </CardHeader>
              <CardContent>
                {!data ? <CenteredSpinner /> : <StatusDonut rows={statusRows} />}
              </CardContent>
            </Card>
          </Reveal>
        </div>

        <Reveal delay={0.3}>
          <Card>
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
              <Button variant="ghost" size="sm" className="group" onClick={() => navigate('/invoices')}>
                View all <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Button>
            </CardHeader>
            <TableWrap>
              <Table>
                <THead>
                  <Tr>
                    <Th>Invoice #</Th><Th>Customer</Th><Th>Date</Th><Th>Amount</Th><Th>Status</Th>
                  </Tr>
                </THead>
                <TBody>
                  {!data ? (
                    <tr><td colSpan={5}><CenteredSpinner /></td></tr>
                  ) : data.recent_invoices.length === 0 ? (
                    <EmptyRow colSpan={5}>{scoped ? 'No invoices for this customer yet' : 'No invoices yet'}</EmptyRow>
                  ) : (
                    data.recent_invoices.map((inv, i) => (
                      <motion.tr
                        key={inv.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease, delay: 0.35 + i * 0.05 }}
                        className="cursor-pointer transition-colors duration-200 hover:bg-gradient-to-r hover:from-violet-500/[0.07] hover:via-indigo-500/[0.03] hover:to-transparent"
                        onClick={() => navigate('/invoices')}
                      >
                        <Td className="font-mono text-xs">{inv.invoice_number}</Td>
                        <Td>{inv.customer_name}</Td>
                        <Td className="text-muted-foreground">{inv.issue_date}</Td>
                        <Td className="font-mono text-xs font-medium">{fmt(inv.grand_total)}</Td>
                        <Td><Badge status={inv.status} /></Td>
                      </motion.tr>
                    ))
                  )}
                </TBody>
              </Table>
            </TableWrap>
          </Card>
        </Reveal>
      </div>
    </div>
  )
}
