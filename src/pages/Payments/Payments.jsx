import { useEffect, useState, useCallback } from 'react'
import { Search, Plus, Pencil, Trash2 } from 'lucide-react'
import { paymentsApi, invoicesApi, customersApi } from '../../api'
import { Modal } from '../../components/ui/modal'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select } from '../../components/ui/select'
import { Label } from '../../components/ui/label'
import { Card } from '../../components/ui/card'
import { Table, THead, TBody, Tr, Th, Td, TableWrap, EmptyRow } from '../../components/ui/table'
import { Pagination } from '../../components/ui/pagination'
import { CenteredSpinner } from '../../components/ui/spinner'
import { useToast } from '../../components/ui/toast'
import { customerLabel } from '../../lib/customer'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

const METHODS = [
  ['cash', 'Cash'], ['upi', 'UPI'], ['card', 'Card'], ['bank', 'Bank Transfer'],
  ['cheque', 'Cheque'], ['neft', 'NEFT'], ['rtgs', 'RTGS'],
]
const methodLabel = Object.fromEntries(METHODS)

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const EMPTY = () => ({ customer: '', invoice: '', amount: '', payment_method: 'cash', payment_date: today(), reference_id: '', notes: '' })

/** Record a payment against one unpaid GST invoice, picked by customer. */
function RecordPaymentModal({ open, customers, onClose, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState(EMPTY)
  const [invoices, setInvoices] = useState([])
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [saving, setSaving] = useState(false)
  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  useEffect(() => { if (open) { setForm(EMPTY()); setInvoices([]) } }, [open])

  // Load the chosen customer's invoices that still have something due.
  useEffect(() => {
    setForm((p) => ({ ...p, invoice: '' }))
    if (!form.customer) { setInvoices([]); return }
    let stale = false
    setLoadingInvoices(true)
    invoicesApi.list({ customer: form.customer, page_size: 500, ordering: 'issue_date' })
      .then((r) => {
        if (stale) return
        const unpaid = (r.data.results ?? r.data).filter((inv) => Number(inv.amount_due) > 0)
        setInvoices(unpaid)
        if (unpaid.length === 1) setForm((p) => ({ ...p, invoice: String(unpaid[0].id) }))
      })
      .catch(() => { if (!stale) toast("Couldn't load this customer's invoices", 'error') })
      .finally(() => { if (!stale) setLoadingInvoices(false) })
    return () => { stale = true }
  }, [form.customer]) // eslint-disable-line

  const invoice = invoices.find((inv) => String(inv.id) === form.invoice)
  const totalOwed = invoices.reduce((s, inv) => s + Number(inv.amount_due), 0)

  const save = async () => {
    const amount = Number(form.amount)
    if (!form.customer) return toast('Pick a customer', 'error')
    if (!invoice) return toast('Pick an invoice', 'error')
    if (!(amount > 0)) return toast('Enter an amount more than zero', 'error')
    if (Math.round(amount * 100) > Math.round(Number(invoice.amount_due) * 100)) {
      return toast(`This invoice has only ${fmt(invoice.amount_due)} due`, 'error')
    }
    setSaving(true)
    try {
      const { customer, invoice: _inv, ...payload } = form // eslint-disable-line no-unused-vars
      await invoicesApi.addPayment(invoice.id, payload)
      toast(`Payment recorded on ${invoice.invoice_number}`, 'success')
      onSaved()
    } catch (e) {
      const data = e.response?.data
      toast(data?.detail || data?.amount?.[0] || data?.non_field_errors?.[0] || 'Failed to save payment', 'error')
    } finally { setSaving(false) }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record payment"
      size="sm"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save} loading={saving}>{saving ? 'Saving…' : 'Record payment'}</Button></>}
    >
      <div className="space-y-4">
        <div>
          <Label>Customer *</Label>
          <Select value={form.customer} onChange={f('customer')}>
            <option value="">— Select customer —</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{customerLabel(c)}</option>)}
          </Select>
        </div>
        {form.customer && (
          <div>
            <Label>Invoice *</Label>
            <Select value={form.invoice} onChange={f('invoice')} disabled={loadingInvoices || invoices.length === 0}>
              <option value="">
                {loadingInvoices ? 'Loading…' : invoices.length === 0 ? 'No unpaid invoices' : '— Select invoice —'}
              </option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>{inv.invoice_number} · {inv.issue_date} · due {fmt(inv.amount_due)}</option>
              ))}
            </Select>
            {!loadingInvoices && invoices.length > 1 && (
              <p className="mt-1 text-xs text-muted-foreground">{invoices.length} unpaid invoices, {fmt(totalOwed)} due in all</p>
            )}
          </div>
        )}
        {invoice && (
          <div className="flex items-center justify-between rounded-lg bg-muted/60 px-4 py-3">
            <span className="text-xs text-muted-foreground">Amount due on {invoice.invoice_number}</span>
            <span className="font-mono text-lg font-bold text-warning">{fmt(invoice.amount_due)}</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Amount ₹ *</Label>
            <Input type="number" min="0.01" step="0.01" max={invoice?.amount_due || undefined} value={form.amount} onChange={f('amount')} placeholder="0.00" />
          </div>
          <div>
            <Label>Method</Label>
            <Select value={form.payment_method} onChange={f('payment_method')}>
              {METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Date</Label><Input type="date" value={form.payment_date} onChange={f('payment_date')} /></div>
          <div><Label>Reference</Label><Input value={form.reference_id} onChange={f('reference_id')} placeholder="UTR / cheque no." /></div>
        </div>
        <div><Label>Notes</Label><Input value={form.notes} onChange={f('notes')} placeholder="Optional" /></div>
      </div>
    </Modal>
  )
}

/** Correct a recorded GST payment. The invoice stays the same; everything else can change. */
function EditPaymentModal({ payment, onClose, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState(null)
  const [allowed, setAllowed] = useState(null)   // most this payment can be: invoice due + its own amount
  const [saving, setSaving] = useState(false)
  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  useEffect(() => {
    if (!payment) { setForm(null); setAllowed(null); return }
    setForm({
      amount: String(payment.amount),
      payment_method: payment.payment_method,
      payment_date: payment.payment_date,
      reference_id: payment.reference_id || '',
      notes: payment.notes || '',
    })
    let stale = false
    invoicesApi.get(payment.invoice)
      .then((r) => { if (!stale) setAllowed(Number(r.data.amount_due) + Number(payment.amount)) })
      .catch(() => { if (!stale) setAllowed(null) })
    return () => { stale = true }
  }, [payment])

  const save = async () => {
    const amount = Number(form.amount)
    if (!(amount > 0)) return toast('Enter an amount more than zero', 'error')
    if (allowed !== null && Math.round(amount * 100) > Math.round(allowed * 100)) {
      return toast(`This payment can be at most ${fmt(allowed)}`, 'error')
    }
    setSaving(true)
    try {
      await paymentsApi.update(payment.id, form)
      toast('Payment updated', 'success')
      onSaved()
    } catch (e) {
      const data = e.response?.data
      toast(data?.detail || data?.amount?.[0] || data?.invoice?.[0] || data?.non_field_errors?.[0] || 'Failed to update payment', 'error')
    } finally { setSaving(false) }
  }

  return (
    <Modal
      open={Boolean(payment)}
      onClose={onClose}
      title="Edit payment"
      size="sm"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save} loading={saving}>{saving ? 'Saving…' : 'Save changes'}</Button></>}
    >
      {payment && form && (
        <div className="space-y-4">
          <div className="rounded-lg bg-muted/60 px-4 py-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Invoice</span><span className="font-mono">{payment.invoice_number}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span>{payment.customer_name || '—'}</span></div>
            <div className="mt-1 flex justify-between border-t border-border pt-1">
              <span className="text-muted-foreground">Most this payment can be</span>
              <span className="font-mono font-semibold text-warning">{allowed === null ? '…' : fmt(allowed)}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Amount ₹ *</Label>
              <Input type="number" min="0.01" step="0.01" max={allowed || undefined} value={form.amount} onChange={f('amount')} />
            </div>
            <div>
              <Label>Method</Label>
              <Select value={form.payment_method} onChange={f('payment_method')}>
                {METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Date</Label><Input type="date" value={form.payment_date} onChange={f('payment_date')} /></div>
            <div><Label>Reference</Label><Input value={form.reference_id} onChange={f('reference_id')} placeholder="UTR / cheque no." /></div>
          </div>
          <div><Label>Notes</Label><Input value={form.notes} onChange={f('notes')} placeholder="Optional" /></div>
        </div>
      )}
    </Modal>
  )
}

export default function Payments() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [customers, setCustomers] = useState([])
  const [recordOpen, setRecordOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const toast = useToast()

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await paymentsApi.remove(deleteTarget.id)
      toast('Payment deleted', 'success')
      setDeleteTarget(null)
      load()
    } catch (e) {
      toast(e.response?.data?.detail || 'Could not delete the payment', 'error')
    } finally { setDeleting(false) }
  }

  const load = useCallback(async (q = search, pg = page) => {
    setLoading(true)
    try {
      const res = await paymentsApi.list({ search: q, page: pg })
      setRows(res.data.results ?? res.data)
      setTotalCount(res.data.count ?? (res.data.results ?? res.data).length)
    } catch { toast('Failed to load payments', 'error') }
    finally { setLoading(false) }
  }, [search, page]) // eslint-disable-line

  useEffect(() => {
    customersApi.list({ page_size: 500, ordering: 'name' }).then((r) => setCustomers(r.data.results ?? r.data)).catch(() => {})
  }, [])
  useEffect(() => { load() }, [page]) // eslint-disable-line
  useEffect(() => { setPage(1); load(search, 1) }, [search]) // eslint-disable-line

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search by invoice # or ref ID…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button onClick={() => setRecordOpen(true)}><Plus className="h-4 w-4" /> Record payment</Button>
      </div>

      <Card>
        <TableWrap>
          <Table>
            <THead>
              <Tr>
                <Th>Invoice #</Th><Th>Customer</Th><Th>Date</Th><Th>Method</Th><Th>Amount</Th><Th>Ref ID</Th><Th>Notes</Th><Th className="text-right" />
              </Tr>
            </THead>
            <TBody>
              {loading ? (
                <tr><td colSpan={8}><CenteredSpinner /></td></tr>
              ) : rows.length === 0 ? (
                <EmptyRow colSpan={8}>No payments found</EmptyRow>
              ) : rows.map((p) => (
                <Tr key={p.id}>
                  <Td className="font-mono text-xs">{p.invoice_number || p.invoice}</Td>
                  <Td>{p.customer_name || '—'}</Td>
                  <Td>{p.payment_date}</Td>
                  <Td>{methodLabel[p.payment_method] || p.payment_method}</Td>
                  <Td className="font-mono text-xs">{fmt(p.amount)}</Td>
                  <Td className="font-mono text-xs">{p.reference_id || '—'}</Td>
                  <Td>{p.notes || '—'}</Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" title="Edit payment" aria-label="Edit payment" onClick={() => setEditTarget(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Delete payment" aria-label="Delete payment" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(p)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </TableWrap>
      </Card>

      <Pagination page={page} setPage={setPage} rowCount={rows.length} totalCount={totalCount} />

      <RecordPaymentModal
        open={recordOpen}
        customers={customers}
        onClose={() => setRecordOpen(false)}
        onSaved={() => { setRecordOpen(false); load() }}
      />

      <EditPaymentModal
        payment={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={() => { setEditTarget(null); load() }}
      />

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => { if (!deleting) setDeleteTarget(null) }}
        title="Delete payment"
        size="sm"
        footer={<><Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button><Button variant="destructive" onClick={confirmDelete} loading={deleting}>Delete</Button></>}
      >
        {deleteTarget && (
          <p className="text-sm">
            Delete the {fmt(deleteTarget.amount)} payment on {deleteTarget.invoice_number} from {deleteTarget.customer_name || 'this customer'} ({deleteTarget.payment_date})?
            That amount goes back to the invoice's balance due.
          </p>
        )}
      </Modal>
    </div>
  )
}
