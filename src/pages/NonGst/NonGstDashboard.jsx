import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'
import { Receipt, Wallet, Clock, Users, ArrowUpRight } from 'lucide-react'
import { nongstApi, customersApi } from '../../api'
import { StatCard } from '../../components/ui/stat-card'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Select } from '../../components/ui/select'
import { Table, THead, TBody, Tr, Th, Td, TableWrap, EmptyRow } from '../../components/ui/table'
import { CenteredSpinner } from '../../components/ui/spinner'
import { AnimatedNumber, Eyebrow, Reveal, ease, stagger } from '../../components/fx/motion'
import { inr0 } from './shared'
import { customerLabel } from '../../lib/customer'

const Hero3D = lazy(() => import('../../three/Hero3D'))

const fmtCount = (n) => Math.round(n).toLocaleString('en-IN')
const fmtAxis = (v) => (v >= 1e5 ? `₹${+(v / 1e5).toFixed(1)}L` : v >= 1e3 ? `₹${+(v / 1e3).toFixed(0)}K` : `₹${v}`)

function Hero({ data, scoped, customers, customerId, setCustomerId }) {
  const billed = Number(data?.total_billed || 0)
  const collected = Number(data?.total_collected || 0)
  const rate = billed > 0 ? Math.min(Math.round((collected / billed) * 100), 100) : 0
  const key = (data?.monthly || []).map((m) => m.billed).join(',')
  const values = useMemo(() => (key ? key.split(',').map(Number) : []), [key])

  return (
    <Reveal className="relative isolate overflow-hidden rounded-3xl border border-white/[0.08] bg-[#07070d] text-white shadow-[0_30px_80px_-30px_rgb(76_29_149/0.6)]">
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="aurora-a absolute -left-20 -top-32 h-80 w-80 rounded-full bg-amber-500/20 blur-[90px]" />
        <div className="aurora-b absolute -bottom-32 right-10 h-80 w-96 rounded-full bg-violet-600/25 blur-[100px]" />
        <div className="grid-bg-dark absolute inset-0" />
      </div>
      <div className="grid items-center gap-2 lg:grid-cols-[1.1fr_1fr]">
        <div className="relative z-10 p-6 sm:p-8">
          <Eyebrow dark>Non-GST · FY {data?.financial_year || '—'}</Eyebrow>
          <h2 className="mt-4 text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
            {scoped ? data.customer.name : 'Non-GST billing'}
            <span className="text-white/50">{scoped ? ' · balance' : ' at a glance'}</span>
          </h2>

          <div className="mt-6 text-xs font-medium uppercase tracking-[0.14em] text-white/45">Outstanding balance</div>
          <div className="mt-1 text-4xl font-semibold tracking-[-0.03em] text-amber-300 sm:text-5xl">
            <AnimatedNumber value={Number(data?.outstanding || 0)} format={inr0} duration={1.6} />
          </div>

          <div className="mt-5 max-w-md">
            <div className="flex items-center justify-between text-xs text-white/55">
              <span>Collected <span className="font-medium text-white/85">{inr0(collected)}</span> of {inr0(billed)} billed this year</span>
              <span className="font-mono text-cyan-300">{rate}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-amber-300 via-violet-400 to-cyan-300"
                initial={{ width: 0 }}
                animate={{ width: `${rate}%` }}
                transition={{ duration: 1.4, ease, delay: 0.3 }}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="w-full sm:w-64">
              <Select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                aria-label="Show figures for"
                className="border-white/10 bg-white/[0.05] text-white hover:border-white/20 [&_optgroup]:bg-[#0b0b12] [&_option]:bg-[#0b0b12]"
              >
                <option value="">Overall</option>
                <optgroup label="Customer wise">
                  {customers.map((c) => <option key={c.id} value={c.id}>{customerLabel(c)}</option>)}
                </optgroup>
              </Select>
            </div>
            <span className="text-xs text-white/45">{scoped ? 'Figures for this customer only' : 'All customers combined'}</span>
          </div>
        </div>
        <div className="relative h-[240px] sm:h-[300px] lg:h-[340px]">
          <Suspense fallback={<div className="absolute inset-0 m-auto h-40 w-32 animate-pulse rounded-2xl bg-violet-500/10" />}>
            <Hero3D className="absolute inset-0" compact z={5.6} variant="growth" values={values} />
          </Suspense>
        </div>
      </div>
    </Reveal>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-foreground/10 bg-popover/90 px-3 py-2 text-xs shadow-xl backdrop-blur-xl">
      <div className="text-muted-foreground">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="mt-0.5 flex items-center gap-2 font-mono">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          {p.name}: {inr0(p.value)}
        </div>
      ))}
    </div>
  )
}

export default function NonGstDashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)
  const [customers, setCustomers] = useState([])
  const [customerId, setCustomerId] = useState('')
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
    setError(false)
    nongstApi.dashboard(customerId ? { customer: customerId } : undefined)
      .then((r) => { if (!stale) setData(r.data) })
      .catch(() => { if (!stale) setError(true) })
      .finally(() => { if (!stale) setLoading(false) })
    return () => { stale = true }
  }, [customerId])

  const scoped = !!data?.customer
  const chart = (data?.monthly || []).map((m) => ({ ...m, label: m.month.replace(' 20', " '") }))

  return (
    <div className="space-y-6">
      <Hero data={data} scoped={scoped} customers={customers} customerId={customerId} setCustomerId={setCustomerId} />

      {error && !data && (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Couldn't load Non-GST figures. Check your connection and refresh.</CardContent></Card>
      )}

      <div className={loading && data ? 'space-y-6 opacity-60 transition-opacity' : 'space-y-6 transition-opacity'}>
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" style={{ perspective: 1200 }}>
          <StatCard label="Billed" value={data ? Number(data.total_billed) : '—'} format={inr0} sub="This financial year" icon={Receipt} tone="brand" />
          <StatCard label="Collected" value={data ? Number(data.total_collected) : '—'} format={inr0} sub="This financial year" icon={Wallet} tone="green" />
          <StatCard label="Outstanding" value={data ? Number(data.outstanding) : '—'} format={inr0} sub="Owed to you now" icon={Clock} tone="yellow" />
          {scoped ? (
            <StatCard label="Bills" value={data ? Number(data.bill_count) : '—'} format={fmtCount} sub={`FY ${data?.financial_year || ''}`} icon={Receipt} tone="cyan" />
          ) : (
            <StatCard label="Customers with dues" value={data ? Number(data.customers_with_dues) : '—'} format={fmtCount} sub={`${data ? data.bill_count : 0} bills this year`} icon={Users} tone="purple" />
          )}
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Reveal delay={0.15} className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Billed vs collected</CardTitle>
                <span className="text-xs text-muted-foreground">Last 12 months</span>
              </CardHeader>
              <CardContent>
                {!data ? <CenteredSpinner /> : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chart} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke="rgb(var(--foreground) / 0.06)" />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'rgb(var(--muted-foreground))' }} axisLine={false} tickLine={false} interval={0} />
                        <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 12, fill: 'rgb(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={56} />
                        <Tooltip cursor={{ fill: 'rgb(139 92 246 / 0.08)', radius: 8 }} content={<ChartTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar name="Billed" dataKey="billed" fill="#8b5cf6" radius={[6, 6, 2, 2]} maxBarSize={22} />
                        <Bar name="Collected" dataKey="collected" fill="#22d3ee" radius={[6, 6, 2, 2]} maxBarSize={22} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </Reveal>

          <Reveal delay={0.22}>
            <Card className="h-full">
              <CardHeader><CardTitle>{scoped ? 'Balance' : 'Top dues'}</CardTitle></CardHeader>
              <CardContent>
                {!data ? <CenteredSpinner /> : scoped ? (
                  <div className="py-6 text-center">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">{data.customer.name} owes</div>
                    <div className="mt-2 font-mono text-3xl font-semibold text-amber-300">{inr0(data.outstanding)}</div>
                  </div>
                ) : data.top_dues.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">No one owes you anything right now.</div>
                ) : (
                  <div className="space-y-3">
                    {data.top_dues.map((d) => {
                      const pct = Math.round((d.balance / data.top_dues[0].balance) * 100)
                      return (
                        <button key={d.id} type="button" onClick={() => setCustomerId(String(d.id))} className="block w-full text-left">
                          <div className="flex items-center justify-between text-sm">
                            <span className="truncate font-medium">{d.name}</span>
                            <span className="font-mono text-amber-300">{inr0(d.balance)}</span>
                          </div>
                          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-foreground/[0.06]">
                            <motion.div className="h-full rounded-full bg-amber-400" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease }} />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </Reveal>
        </div>

        <Reveal delay={0.3}>
          <Card>
            <CardHeader>
              <CardTitle>Recent bills</CardTitle>
              <Button variant="ghost" size="sm" className="group" onClick={() => navigate('/non-gst/bills')}>
                View all <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Button>
            </CardHeader>
            <TableWrap>
              <Table>
                <THead>
                  <Tr><Th>Bill #</Th><Th>Customer</Th><Th>Date</Th><Th className="text-right">This bill</Th><Th className="text-right">Balance after</Th></Tr>
                </THead>
                <TBody>
                  {!data ? (
                    <tr><td colSpan={5}><CenteredSpinner /></td></tr>
                  ) : data.recent_bills.length === 0 ? (
                    <EmptyRow colSpan={5}>No Non-GST bills yet</EmptyRow>
                  ) : data.recent_bills.map((b) => (
                    <Tr key={b.id} className="cursor-pointer" onClick={() => navigate('/non-gst/bills')}>
                      <Td className="font-mono text-xs">{b.bill_number}</Td>
                      <Td>{b.customer_name}</Td>
                      <Td className="text-muted-foreground">{b.bill_date}</Td>
                      <Td className="text-right font-mono text-xs">{inr0(b.total)}</Td>
                      <Td className="text-right font-mono text-xs text-amber-300">{inr0(b.balance_after)}</Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </TableWrap>
          </Card>
        </Reveal>
      </div>
    </div>
  )
}
