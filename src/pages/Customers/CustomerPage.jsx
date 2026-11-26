import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Pencil, FilePlus2, ReceiptText, Wallet, MessageCircle, Phone, Mail, Download, FileText } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { customersApi, productsApi, invoicesApi, nongstApi } from '../../api'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Modal } from '../../components/ui/modal'
import { Textarea } from '../../components/ui/textarea'
import { Table, THead, TBody, Tr, Th, Td, TableWrap, EmptyRow } from '../../components/ui/table'
import { CenteredSpinner } from '../../components/ui/spinner'
import { useToast } from '../../components/ui/toast'
import { cn } from '../../lib/cn'
import { customerPlace } from '../../lib/customer'
import CustomerFormModal from './CustomerFormModal'
import InvoiceForm from '../Invoices/InvoiceForm'
import InvoiceDetail from '../Invoices/InvoiceDetail'
import PaymentModal from '../Invoices/PaymentModal'
import NonGstBillForm from '../NonGst/NonGstBillForm'
import { ReceiveModal } from '../NonGst/NonGstPayments'
import StatementPage from '../Statements/StatementPage'

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const dmy = (s) => (s ? s.split('-').reverse().join('-') : '—')
const drcr = (n) => {
  const v = Number(n || 0)
  if (v === 0) return inr(0)
  return `${inr(Math.abs(v))} ${v > 0 ? 'Dr' : 'Cr'}`
}
const days = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000)

const TABS = [
  ['invoices', 'GST invoices'],
  ['bills', 'Non-GST bills'],
  ['payments', 'Payments'],
  ['ledger', 'Ledger'],
  ['statement', 'Statement'],
]

// wa.me wants the number with country code and no symbols; Indian 10-digit numbers get 91.
function whatsappUrl(phone, text) {
  let digits = (phone || '').replace(/\D/g, '').replace(/^0+/, '')
  if (digits.length === 10) digits = `91${digits}`
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

/** Average days from invoice date to the payment that cleared it, over fully paid GST invoices. */
function averageDaysToPay(invoices, payments) {
  const lastPay = {}
  for (const p of payments) {
    if (!lastPay[p.invoice_id] || p.payment_date > lastPay[p.invoice_id]) lastPay[p.invoice_id] = p.payment_date
  }
  const spans = invoices
    .filter((i) => i.status === 'paid' && lastPay[i.id])
    .map((i) => Math.max(0, days(i.issue_date, lastPay[i.id])))
  return spans.length ? Math.round(spans.reduce((a, b) => a + b, 0) / spans.length) : null
}

export default function CustomerPage() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const tab = TABS.some(([k]) => k === params.get('tab')) ? params.get('tab') : 'invoices'
  const setTab = (k) => setParams((p) => { p.set('tab', k); return p }, { replace: true })
  const toast = useToast()

  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])

  // Which modal is open: 'edit' | 'invoice' | 'bill' | 'pay' | 'gstpay' | 'ngpay' | null
  const [modal, setModal] = useState(null)
  const [payInvoice, setPayInvoice] = useState(null)
  const [detailId, setDetailId] = useState(null)

  const load = useCallback(() => {
    customersApi.ledger(id)
      .then((r) => { setData(r.data); setError(null) })
      .catch((e) => setError(e.response?.status === 404 ? 'This customer does not exist.' : "Couldn't load this customer."))
  }, [id])

  useEffect(() => { setData(null); load() }, [load])

  // The invoice and bill forms need the customer and product pick-lists; load them once, when first needed.
  const needLists = modal === 'invoice' || modal === 'bill' || modal === 'ngpay'
  useEffect(() => {
    if (!needLists || customers.length) return
    customersApi.list({ page_size: 500, ordering: 'name' }).then((r) => setCustomers(r.data.results ?? r.data)).catch(() => {})
    productsApi.list({ page: 1, page_size: 500 }).then((r) => setProducts(r.data.results ?? r.data)).catch(() => {})
  }, [needLists]) // eslint-disable-line

  const c = data?.customer
  // A hidden customer is not in the pick-list, but the forms must still be able to select them.
  const pickList = useMemo(
    () => (c && !customers.some((x) => x.id === c.id) ? [c, ...customers] : customers),
    [c, customers],
  )

  const gst = data?.gst
  const ng = data?.nongst

  const payments = useMemo(() => {
    if (!data) return []
    return [
      ...gst.payments.map((p) => ({ ...p, book: 'GST', key: `g${p.id}` })),
      ...ng.payments.map((p) => ({ ...p, book: 'Non-GST', key: `n${p.id}` })),
    ].sort((a, b) => (a.payment_date < b.payment_date ? 1 : a.payment_date > b.payment_date ? -1 : 0))
  }, [data]) // eslint-disable-line

  const avgDays = useMemo(() => (data ? averageDaysToPay(gst.invoices, gst.payments) : null), [data]) // eslint-disable-line
  const dueInvoices = gst?.invoices.filter((i) => Number(i.amount_due) > 0) ?? []

  const done = () => { setModal(null); load() }

  if (error) {
    return (
      <Card className="p-10 text-center text-sm text-muted-foreground">
        {error} <Link to="/customers" className="text-primary hover:underline">Back to customers</Link>
      </Card>
    )
  }
  if (!data) return <Card><CenteredSpinner /></Card>

  const lastPayment = [gst.last_payment_date, ng.last_payment_date].filter(Boolean).sort().pop()
  const lastBill = [gst.last_bill_date, ng.last_bill_date].filter(Boolean).sort().pop()
  const waText = `Dear ${c.name}, your outstanding balance with us is ${inr(data.combined_balance)}. Thank you.`

  return (
    <div className="space-y-4">
      <Link to="/customers" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Customers
      </Link>

      {/* Customer card */}
      <Card className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight">{c.name}</h2>
              {customerPlace(c) && <span className="text-sm text-muted-foreground">{customerPlace(c).split(' · ')[0]}</span>}
              {!c.is_active && <Badge color="gray" label="Hidden" />}
            </div>
            {c.address && <p className="whitespace-pre-line text-sm text-muted-foreground">{c.address}</p>}
            <div className="flex flex-wrap gap-x-5 gap-y-1 pt-1 text-sm">
              {c.gst_number && <span><span className="text-muted-foreground">GSTIN </span><span className="font-mono">{c.gst_number}</span></span>}
              {c.phone && <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1 hover:text-primary"><Phone className="h-3.5 w-3.5" />{c.phone}</a>}
              {c.email && <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 hover:text-primary"><Mail className="h-3.5 w-3.5" />{c.email}</a>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Button variant="outline" onClick={() => setModal('edit')}><Pencil className="h-4 w-4" /> Edit</Button>
            <Button onClick={() => setModal('invoice')}><FilePlus2 className="h-4 w-4" /> New invoice</Button>
            <Button variant="outline" onClick={() => setModal('bill')}><ReceiptText className="h-4 w-4" /> New non-GST bill</Button>
            <Button variant="outline" onClick={() => setModal('pay')}><Wallet className="h-4 w-4" /> Record payment</Button>
            <Button
              variant="outline"
              onClick={() => window.open(whatsappUrl(c.phone, waText), '_blank', 'noopener')}
              title={c.phone ? `Message ${c.phone} on WhatsApp` : 'No phone saved: WhatsApp will ask who to send to'}
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary tiles */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <BookTile title="GST" book={gst} overdue={gst.overdue_count > 0}
          note={gst.overdue_count > 0 ? `${gst.overdue_count} overdue · ${inr(gst.overdue_amount)}` : null} />
        <BookTile title="Non-GST" book={ng} />
        <Card className="p-4 ring-1 ring-violet-400/40">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Combined balance due</div>
          <div className={cn('mt-1 font-mono text-2xl font-bold', gst.overdue_count > 0 && Number(data.combined_balance) > 0 && 'text-rose-400')}>
            {drcr(data.combined_balance)}
          </div>
          <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <Fact label="Last bill" value={dmy(lastBill)} />
            <Fact label="Last payment" value={dmy(lastPayment)} />
            <Fact label="Avg. days to pay" value={avgDays === null ? '—' : `${avgDays} days`} title="GST invoices, from invoice date to the payment that cleared it" />
          </dl>
        </Card>
      </div>

      {/* Sales trend, top products, notes */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SalesTrend trend={data.sales_trend} className="lg:col-span-2" />
        <div className="space-y-4">
          <TopProducts items={data.top_products} />
          <NotesCard customer={c} onSaved={(notes) => setData((d) => ({ ...d, customer: { ...d.customer, notes } }))} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-foreground/10">
        {TABS.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cn(
              '-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors',
              tab === k ? 'border-violet-400 font-medium text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
            {k === 'invoices' && <Count n={gst.invoices.length} />}
            {k === 'bills' && <Count n={ng.bills.length} />}
            {k === 'payments' && <Count n={payments.length} />}
          </button>
        ))}
      </div>

      {tab === 'invoices' && (
        <Card>
          <TableWrap>
            <Table>
              <THead><Tr><Th>Invoice #</Th><Th>Date</Th><Th>Due date</Th><Th className="text-right">Total</Th><Th className="text-right">Paid</Th><Th className="text-right">Due</Th><Th>Status</Th><Th className="text-right">Actions</Th></Tr></THead>
              <TBody>
                {gst.invoices.length === 0 ? <EmptyRow colSpan={8}>No GST invoices yet</EmptyRow> : gst.invoices.map((inv) => (
                  <Tr key={inv.id} className="cursor-pointer" onClick={() => setDetailId(inv.id)}>
                    <Td className="font-mono text-xs">{inv.invoice_number}</Td>
                    <Td>{dmy(inv.issue_date)}</Td>
                    <Td>{dmy(inv.due_date)}</Td>
                    <Td className="text-right font-mono text-xs font-semibold">{inr(inv.grand_total)}</Td>
                    <Td className="text-right font-mono text-xs">{inr(inv.amount_paid)}</Td>
                    <Td className={cn('text-right font-mono text-xs', Number(inv.amount_due) > 0 ? 'text-warning' : 'text-muted-foreground')}>{inr(inv.amount_due)}</Td>
                    <Td><Badge status={inv.status} label={inv.status === 'unpaid' ? 'Due' : undefined} /></Td>
                    <Td onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        {Number(inv.amount_due) > 0 && <Button variant="ghost" size="sm" onClick={() => { setPayInvoice(inv); setModal('gstpay') }}>+ Pay</Button>}
                        <Button variant="ghost" size="icon" title="Download PDF"
                          onClick={() => invoicesApi.downloadPdf(inv.id, `Invoice_${inv.invoice_number}.pdf`).catch(() => toast('Failed to download PDF', 'error'))}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </TableWrap>
        </Card>
      )}

      {tab === 'bills' && (
        <Card>
          <TableWrap>
            <Table>
              <THead><Tr><Th>Bill #</Th><Th>Date</Th><Th className="text-right">Total</Th><Th className="text-right">Paid with bill</Th><Th className="text-right">Actions</Th></Tr></THead>
              <TBody>
                {ng.bills.length === 0 ? <EmptyRow colSpan={5}>No Non-GST bills yet</EmptyRow> : ng.bills.map((b) => (
                  <Tr key={b.id}>
                    <Td className="font-mono text-xs">{b.is_opening ? <span className="font-sans text-muted-foreground">Opening balance</span> : b.bill_number}</Td>
                    <Td>{dmy(b.bill_date)}</Td>
                    <Td className="text-right font-mono text-xs font-semibold">{inr(b.total)}</Td>
                    <Td className="text-right font-mono text-xs">{Number(b.paid_now) ? inr(b.paid_now) : '—'}</Td>
                    <Td>
                      <div className="flex justify-end">
                        {!b.is_opening && (
                          <Button variant="ghost" size="icon" title="Open PDF" onClick={() => nongstApi.openPdf(b.id).catch(() => toast('Failed to open PDF', 'error'))}>
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </TableWrap>
        </Card>
      )}

      {tab === 'payments' && (
        <Card>
          <TableWrap>
            <Table>
              <THead><Tr><Th>Date</Th><Th>Book</Th><Th>Against</Th><Th>Mode</Th><Th>Reference</Th><Th className="text-right">Amount</Th></Tr></THead>
              <TBody>
                {payments.length === 0 ? <EmptyRow colSpan={6}>No payments received yet</EmptyRow> : payments.map((p) => (
                  <Tr key={p.key}>
                    <Td>{dmy(p.payment_date)}</Td>
                    <Td><Badge color={p.book === 'GST' ? 'brand' : 'blue'} label={p.book} /></Td>
                    <Td className="font-mono text-xs">{p.against || <span className="font-sans text-muted-foreground">On account</span>}</Td>
                    <Td>{p.method}</Td>
                    <Td className="text-xs text-muted-foreground">{p.reference || '—'}</Td>
                    <Td className="text-right font-mono text-xs font-semibold text-emerald-300">{inr(p.amount)}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </TableWrap>
        </Card>
      )}

      {tab === 'ledger' && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <LedgerCard title="GST ledger" entries={gst.ledger} />
          <LedgerCard title="Non-GST ledger" entries={ng.ledger} />
        </div>
      )}

      {tab === 'statement' && <StatementTab customerId={c.id} />}

      {/* Modals */}
      <CustomerFormModal open={modal === 'edit'} editing={c} onClose={() => setModal(null)} onSaved={done} />

      <Modal open={modal === 'invoice'} onClose={() => setModal(null)} title={`New invoice · ${c.name}`} size="xl">
        {modal === 'invoice' && (
          <InvoiceForm editing={null} defaultCustomer={c.id} customers={pickList} products={products}
            onProductCreated={(p) => setProducts((prev) => (prev.some((x) => x.id === p.id) ? prev : [p, ...prev]))}
            onSaved={done} onCancel={() => setModal(null)} />
        )}
      </Modal>

      <Modal open={modal === 'bill'} onClose={() => setModal(null)} title={`New Non-GST bill · ${c.name}`} size="xl">
        {modal === 'bill' && (
          <NonGstBillForm editing={null} defaultCustomer={c.id} customers={pickList} products={products}
            onProductCreated={(p) => setProducts((prev) => (prev.some((x) => x.id === p.id) ? prev : [...prev, p].sort((a, b) => a.name.localeCompare(b.name))))}
            onSaved={done} onCancel={() => setModal(null)} />
        )}
      </Modal>

      <Modal open={modal === 'pay'} onClose={() => setModal(null)} title="Record payment" size="sm">
        <div className="space-y-4 text-sm">
          <div>
            <div className="mb-2 font-medium">Against a GST invoice</div>
            {dueInvoices.length === 0 ? (
              <p className="text-muted-foreground">No GST invoice has money due.</p>
            ) : (
              <div className="space-y-1.5">
                {dueInvoices.map((inv) => (
                  <button key={inv.id} onClick={() => { setPayInvoice(inv); setModal('gstpay') }}
                    className="flex w-full items-center justify-between rounded-xl border border-foreground/10 px-3 py-2 text-left hover:border-violet-400/40 hover:bg-violet-500/[0.06]">
                    <span><span className="font-mono text-xs">{inv.invoice_number}</span> <span className="text-xs text-muted-foreground">· {dmy(inv.issue_date)}</span></span>
                    <span className="font-mono text-xs text-warning">{inr(inv.amount_due)} due</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="border-t border-foreground/10 pt-4">
            <div className="mb-2 font-medium">Non-GST</div>
            <Button variant="outline" className="w-full" onClick={() => setModal('ngpay')}>
              Receive Non-GST payment · {drcr(ng.balance)} owed
            </Button>
          </div>
        </div>
      </Modal>

      {payInvoice && (
        <PaymentModal key={payInvoice.id} open={modal === 'gstpay'} invoice={payInvoice} onClose={() => setModal(null)} onSaved={done} />
      )}

      <ReceiveModal open={modal === 'ngpay'} editing={null} defaultCustomer={c.id} customers={pickList} onClose={() => setModal(null)} onSaved={done} />

      <InvoiceDetail
        open={detailId !== null}
        invoiceId={detailId}
        onClose={() => setDetailId(null)}
        onPay={(inv) => { setDetailId(null); setPayInvoice(inv); setModal('gstpay') }}
      />
    </div>
  )
}

function Count({ n }) {
  return <span className="ml-1.5 rounded-full bg-foreground/[0.07] px-1.5 py-0.5 text-[10px] text-muted-foreground">{n}</span>
}

function Fact({ label, value, title }) {
  return (
    <div title={title}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  )
}

function BookTile({ title, book, overdue, note }) {
  return (
    <Card className="p-4">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className={cn('mt-1 font-mono text-2xl font-semibold', overdue && 'text-rose-400')}>{drcr(book.balance)}</div>
      <div className="text-xs text-muted-foreground">balance due{note && <span className="text-rose-400"> · {note}</span>}</div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <Fact label="Total billed" value={inr(book.billed)} />
        <Fact label="Total received" value={inr(book.paid)} />
      </dl>
    </Card>
  )
}

function LedgerCard({ title, entries }) {
  return (
    <Card>
      <div className="border-b border-foreground/[0.075] px-4 py-3 text-sm font-semibold">{title}</div>
      <TableWrap>
        <Table className="min-w-[560px]">
          <THead><Tr><Th>Date</Th><Th>Particulars</Th><Th className="text-right">Debit</Th><Th className="text-right">Credit</Th><Th className="text-right">Balance</Th></Tr></THead>
          <TBody>
            {entries.length === 0 ? <EmptyRow colSpan={5}>Nothing recorded yet</EmptyRow> : entries.map((e, i) => (
              <Tr key={i}>
                <Td>{dmy(e.date)}</Td>
                <Td className="whitespace-normal">{e.particulars}</Td>
                <Td className="text-right font-mono text-xs">{Number(e.debit) ? inr(e.debit) : ''}</Td>
                <Td className="text-right font-mono text-xs text-emerald-300">{Number(e.credit) ? inr(e.credit) : ''}</Td>
                <Td className="text-right font-mono text-xs font-semibold">{drcr(e.balance)}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </TableWrap>
    </Card>
  )
}

function StatementTab({ customerId }) {
  const [kind, setKind] = useState('gst')
  return (
    <div className="space-y-3">
      <div className="inline-flex rounded-xl border border-foreground/10 p-0.5 text-sm">
        {[['gst', 'GST'], ['nongst', 'Non-GST']].map(([k, l]) => (
          <button key={k} onClick={() => setKind(k)}
            className={cn('rounded-lg px-3 py-1.5', kind === k ? 'bg-violet-500/15 font-medium text-foreground' : 'text-muted-foreground hover:text-foreground')}>
            {l}
          </button>
        ))}
      </div>
      <StatementPage key={kind} kind={kind} customerId={customerId} />
    </div>
  )
}

const GST_COLOR = '#8b5cf6'
const NG_COLOR = '#38bdf8'
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const axisInr = (v) => (v >= 1e7 ? `₹${+(v / 1e7).toFixed(1)}Cr` : v >= 1e5 ? `₹${+(v / 1e5).toFixed(1)}L` : v >= 1e3 ? `₹${+(v / 1e3).toFixed(0)}K` : `₹${v}`)

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((a, p) => a + Number(p.value || 0), 0)
  return (
    <div className="rounded-xl border border-foreground/10 bg-popover/90 px-3 py-2 text-xs shadow-xl backdrop-blur-xl">
      <div className="mb-1 text-muted-foreground">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: p.color }} />{p.name}</span>
          <span className="font-mono">{inr(p.value)}</span>
        </div>
      ))}
      <div className="mt-1 flex justify-between gap-4 border-t border-foreground/10 pt-1 font-semibold">
        <span>Total</span><span className="font-mono">{inr(total)}</span>
      </div>
    </div>
  )
}

function SalesTrend({ trend, className }) {
  const rows = trend.map((t) => {
    const [y, m] = t.month.split('-')
    return { label: `${MONTHS[Number(m) - 1]} ${y.slice(2)}`, gst: Number(t.gst), nongst: Number(t.nongst) }
  })
  const total = rows.reduce((a, r) => a + r.gst + r.nongst, 0)
  return (
    <Card className={cn('p-4', className)}>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">Sales, last 12 months</div>
          <div className="text-xs text-muted-foreground">Billed per month · {inr(total)} in total</div>
        </div>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: GST_COLOR }} />GST</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: NG_COLOR }} />Non-GST</span>
        </div>
      </div>
      {total === 0 ? (
        <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">No sales in the last 12 months</div>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="rgb(var(--foreground) / 0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'rgb(var(--muted-foreground))' }} axisLine={false} tickLine={false} interval={0} />
              <YAxis tickFormatter={axisInr} tick={{ fontSize: 11, fill: 'rgb(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={56} />
              <Tooltip cursor={{ fill: 'rgb(139 92 246 / 0.08)', radius: 6 }} content={<TrendTooltip />} />
              <Bar dataKey="gst" name="GST" stackId="s" fill={GST_COLOR} maxBarSize={28} />
              <Bar dataKey="nongst" name="Non-GST" stackId="s" fill={NG_COLOR} radius={[6, 6, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}

function TopProducts({ items }) {
  const max = Math.max(...items.map((t) => Number(t.amount)), 1)
  return (
    <Card className="p-4">
      <div className="mb-3 text-sm font-semibold">Top products <span className="font-normal text-muted-foreground">· all time</span></div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing bought yet.</p>
      ) : (
        <ol className="space-y-2.5">
          {items.map((t, i) => (
            <li key={i} className="text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate" title={t.name}>{t.name}</span>
                <span className="shrink-0 font-mono text-xs">{inr(t.amount)}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
                <div className="h-full rounded-full bg-violet-400/70" style={{ width: `${(Number(t.amount) / max) * 100}%` }} />
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                {Number(t.quantity).toLocaleString('en-IN')} {t.unit} · on {t.times} {t.times === 1 ? 'bill' : 'bills'}
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}

function NotesCard({ customer, onSaved }) {
  const toast = useToast()
  const [text, setText] = useState(customer.notes || '')
  const [saving, setSaving] = useState(false)
  useEffect(() => { setText(customer.notes || '') }, [customer.id, customer.notes])
  const changed = text !== (customer.notes || '')

  const save = async () => {
    setSaving(true)
    try {
      const res = await customersApi.update(customer.id, { notes: text })
      onSaved(res.data.notes ?? text)
      toast('Notes saved', 'success')
    } catch { toast("Couldn't save the notes", 'error') }
    finally { setSaving(false) }
  }

  return (
    <Card className="p-4">
      <div className="mb-2 text-sm font-semibold">Notes</div>
      <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)}
        placeholder={'e.g. Pays on 5th of every month\nContact: Ramesh'} />
      {changed && (
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setText(customer.notes || '')} disabled={saving}>Cancel</Button>
          <Button size="sm" onClick={save} loading={saving}>Save notes</Button>
        </div>
      )}
    </Card>
  )
}
