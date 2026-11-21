import { useCallback, useEffect, useState } from 'react'
import { Search, Plus, Trash2, Pencil } from 'lucide-react'
import { nongstApi, customersApi } from '../../api'
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
import { inr, today, errorText, PAYMENT_METHODS, methodLabel } from './shared'

const EMPTY = () => ({ customer: '', amount: '', payment_method: 'cash', payment_date: today(), reference_id: '', notes: '' })

/** Receive a new payment, or (with `editing`) correct one already recorded. */
function ReceiveModal({ open, editing, customers, onClose, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState(EMPTY)
  const [owes, setOwes] = useState(null)
  const [saving, setSaving] = useState(false)
  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  useEffect(() => {
    if (!open) return
    setOwes(null)
    setForm(editing ? {
      customer: String(editing.customer),
      amount: String(editing.amount),
      payment_method: editing.payment_method,
      payment_date: editing.payment_date,
      reference_id: editing.reference_id || '',
      notes: editing.notes || '',
    } : EMPTY())
  }, [open, editing])
  useEffect(() => {
    if (!form.customer) { setOwes(null); return }
    let stale = false
    nongstApi.balances({ customer: form.customer })
      .then((r) => { if (!stale) setOwes(Number(r.data.balance || 0)) })
      .catch(() => { if (!stale) setOwes(null) })
    return () => { stale = true }
  }, [form.customer, open, editing])

  // When editing, this payment's current amount is already taken off the balance, so add it back.
  const due = owes === null ? null : owes + (editing ? Number(editing.amount) : 0)

  const save = async () => {
    const amount = Number(form.amount)
    if (!form.customer) return toast('Pick a customer', 'error')
    if (!(amount > 0)) return toast('Enter an amount more than zero', 'error')
    if (due !== null && Math.round(amount * 100) > Math.round(due * 100)) {
      return toast(editing ? `This payment can be at most ${inr(due)}` : `This customer owes only ${inr(due)}`, 'error')
    }
    setSaving(true)
    try {
      if (editing) {
        const { customer, ...changes } = form // eslint-disable-line no-unused-vars
        await nongstApi.updatePayment(editing.id, changes)
        toast('Payment updated', 'success')
      } else {
        await nongstApi.createPayment({ ...form, customer: Number(form.customer) })
        toast('Payment recorded', 'success')
      }
      onSaved()
    } catch (e) {
      toast(errorText(e, 'Could not save the payment'), 'error')
    } finally { setSaving(false) }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit payment' : 'Receive payment'}
      size="sm"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save} loading={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Record payment'}</Button></>}
    >
      <div className="space-y-4">
        <div>
          <Label>Customer *</Label>
          <Select value={form.customer} onChange={f('customer')} disabled={Boolean(editing)}>
            <option value="">— Select customer —</option>
            {editing && !customers.some((c) => String(c.id) === String(editing.customer)) && (
              <option value={editing.customer}>{editing.customer_name}</option>
            )}
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          {editing && <p className="mt-1 text-xs text-muted-foreground">Customer can't be changed on a recorded payment.</p>}
        </div>
        {form.customer && (
          <div className="flex items-center justify-between rounded-xl border border-amber-400/25 bg-amber-500/[0.07] px-4 py-3">
            <span className="text-sm text-amber-200/90">{editing ? 'Most this payment can be' : 'Currently owes'}</span>
            <span className="font-mono text-lg font-semibold text-amber-300">{due === null ? '…' : inr(due)}</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Amount ₹ *</Label>
            <Input type="number" min="0" step="0.01" value={form.amount} onChange={f('amount')} placeholder="0.00" />
          </div>
          <div>
            <Label>Method</Label>
            <Select value={form.payment_method} onChange={f('payment_method')}>
              {PAYMENT_METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
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

export default function NonGstPayments() {
  const toast = useToast()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [customers, setCustomers] = useState([])
  const [receiveOpen, setReceiveOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async (q = search, pg = page) => {
    setLoading(true)
    try {
      const res = await nongstApi.payments({ search: q || undefined, page: pg })
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

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await nongstApi.removePayment(deleteTarget.id)
      toast('Payment deleted', 'success')
      setDeleteTarget(null)
      load()
    } catch (e) {
      toast(errorText(e, 'Could not delete the payment'), 'error')
    } finally { setDeleting(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search by bill #, customer or ref ID…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button onClick={() => setReceiveOpen(true)}><Plus className="h-4 w-4" /> Receive payment</Button>
      </div>

      <Card>
        <TableWrap>
          <Table>
            <THead>
              <Tr>
                <Th>Bill #</Th><Th>Customer</Th><Th>Date</Th><Th>Method</Th><Th>Amount</Th><Th>Ref ID</Th><Th>Notes</Th><Th className="text-right" />
              </Tr>
            </THead>
            <TBody>
              {loading ? (
                <tr><td colSpan={8}><CenteredSpinner /></td></tr>
              ) : rows.length === 0 ? (
                <EmptyRow colSpan={8}>No Non-GST payments yet</EmptyRow>
              ) : rows.map((p) => (
                <Tr key={p.id}>
                  <Td className="font-mono text-xs">
                    {p.from_bill ? p.bill_number : <span className="font-sans text-muted-foreground">On account</span>}
                  </Td>
                  <Td>{p.customer_name || '—'}</Td>
                  <Td>{p.payment_date}</Td>
                  <Td>{methodLabel[p.payment_method] || p.payment_method}</Td>
                  <Td className="font-mono text-xs">{inr(p.amount)}</Td>
                  <Td className="font-mono text-xs">{p.reference_id || '—'}</Td>
                  <Td>{p.notes || '—'}</Td>
                  <Td className="text-right">
                    {!p.from_bill && (
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" title="Edit payment" aria-label="Edit payment" onClick={() => setEditTarget(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Delete payment" aria-label="Delete payment" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(p)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </TableWrap>
      </Card>

      <Pagination page={page} setPage={setPage} rowCount={rows.length} totalCount={totalCount} />

      <ReceiveModal open={receiveOpen} customers={customers} onClose={() => setReceiveOpen(false)} onSaved={() => { setReceiveOpen(false); load() }} />
      <ReceiveModal open={Boolean(editTarget)} editing={editTarget} customers={customers} onClose={() => setEditTarget(null)} onSaved={() => { setEditTarget(null); load() }} />

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => { if (!deleting) setDeleteTarget(null) }}
        title="Delete payment"
        size="sm"
        footer={<><Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button><Button variant="destructive" onClick={confirmDelete} loading={deleting}>Delete</Button></>}
      >
        {deleteTarget && (
          <p className="text-sm">Delete the {inr(deleteTarget.amount)} payment from {deleteTarget.customer_name} on {deleteTarget.payment_date}? Their balance goes up by that amount.</p>
        )}
      </Modal>
    </div>
  )
}
