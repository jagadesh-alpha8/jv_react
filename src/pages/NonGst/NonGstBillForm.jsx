import { useEffect, useMemo, useState } from 'react'
import { X, Plus } from 'lucide-react'
import { nongstApi } from '../../api'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { Select } from '../../components/ui/select'
import { Label } from '../../components/ui/label'
import { useToast } from '../../components/ui/toast'
import QuickProductModal from '../Invoices/QuickProductModal'
import { inr, today, errorText, PAYMENT_METHODS } from './shared'
import { customerLabel } from '../../lib/customer'

const NEW_PRODUCT = '__new__'
const UNITS = ['pcs', 'set', 'kg', 'ltr', 'hrs', 'mtr', 'box']
const newItem = () => ({ product: '', description: '', unit: 'pcs', quantity: '1', rate: '' })
const paise = (n) => Math.round((Number(n) || 0) * 100)

/** Create or edit a Non-GST bill. Shows the customer's old balance live. */
export default function NonGstBillForm({ editing, customers, products, onProductCreated, onSaved, onCancel }) {
  const toast = useToast()
  const [customer, setCustomer] = useState('')
  const [billDate, setBillDate] = useState(today())
  const [items, setItems] = useState([newItem()])
  const [notes, setNotes] = useState('')
  const [paidNow, setPaidNow] = useState('')
  const [method, setMethod] = useState('cash')
  const [prevBalance, setPrevBalance] = useState(0)
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  // Index of the line that asked for a new product, or null when the quick-add modal is closed.
  const [quickAddRow, setQuickAddRow] = useState(null)

  useEffect(() => {
    if (!editing) return
    setCustomer(String(editing.customer))
    setBillDate(editing.bill_date)
    setNotes(editing.notes || '')
    setPaidNow(Number(editing.paid_now) ? String(editing.paid_now) : '')
    setPrevBalance(Number(editing.previous_balance))
    setItems(editing.items.map((it) => ({
      product: it.product ? String(it.product) : '',
      description: it.description,
      unit: it.unit,
      quantity: String(Number(it.quantity)),
      rate: String(it.rate),
    })))
  }, [editing])

  // New bill: the old balance is whatever the customer owes right now.
  useEffect(() => {
    if (editing || !customer) { if (!editing) setPrevBalance(0); return }
    let stale = false
    setBalanceLoading(true)
    nongstApi.balances({ customer })
      .then((r) => { if (!stale) setPrevBalance(Number(r.data.balance || 0)) })
      .catch(() => { if (!stale) toast("Couldn't load this customer's balance", 'error') })
      .finally(() => { if (!stale) setBalanceLoading(false) })
    return () => { stale = true }
  }, [customer, editing]) // eslint-disable-line

  const setItem = (i, key, value) => setItems((prev) => prev.map((it, idx) => {
    if (idx !== i) return it
    const next = { ...it, [key]: value }
    if (key === 'product' && value) {
      const p = products.find((x) => String(x.id) === String(value))
      if (p) Object.assign(next, { description: p.name, unit: p.unit || 'pcs', rate: String(p.price) })
    }
    return next
  }))

  const onProductSelect = (i, v) => {
    if (v === NEW_PRODUCT) setQuickAddRow(i)
    else setItem(i, 'product', v)
  }

  // Seed the quick-add form with whatever was already typed on that line.
  const quickAddInitial = () => {
    const it = items[quickAddRow] || {}
    const initial = { name: it.product ? '' : it.description || '' }
    if (UNITS.includes(it.unit)) initial.unit = it.unit
    if (it.rate) initial.price = it.rate
    return initial
  }

  const handleProductCreated = (p) => {
    onProductCreated?.(p)
    const row = quickAddRow
    setItems((prev) => prev.map((it, idx) => (idx === row
      ? { ...it, product: String(p.id), description: p.name, unit: p.unit || 'pcs', rate: String(p.price) }
      : it)))
    setQuickAddRow(null)
  }

  // Money in whole paise so the preview matches the server exactly.
  const lineAmount = (it) => Math.round(paise(it.rate) * (Number(it.quantity) || 0))
  const itemsTotal = items.reduce((s, it) => s + lineAmount(it), 0)
  const thisBill = Math.round(itemsTotal / 100) * 100
  const roundOff = thisBill - itemsTotal
  const prev = paise(prevBalance)
  const totalDue = prev + thisBill
  const paid = paise(paidNow)
  const balance = totalDue - paid

  const problems = useMemo(() => {
    const out = []
    if (!customer) out.push('Pick a customer')
    if (items.some((it) => !(it.description || '').trim() && !it.product)) out.push('Every line needs an item')
    if (items.some((it) => !(Number(it.quantity) > 0))) out.push('Quantities must be more than zero')
    if (items.some((it) => it.rate === '' || Number(it.rate) < 0)) out.push('Every line needs a rate')
    if (paid < 0) out.push('Paid now cannot be negative')
    if (paid > totalDue) out.push('Paid now is more than the total due')
    return out
  }, [customer, items, paid, totalDue])

  const save = async () => {
    if (problems.length) return toast(problems[0], 'error')
    setSaving(true)
    const payload = {
      bill_date: billDate,
      notes,
      paid_now: (paid / 100).toFixed(2),
      paid_now_method: method,
      items: items.map((it, i) => ({
        product: it.product ? Number(it.product) : null,
        description: it.description,
        unit: it.unit || 'pcs',
        quantity: it.quantity,
        rate: it.rate,
        sort_order: i,
      })),
    }
    try {
      const res = editing
        ? await nongstApi.updateBill(editing.id, payload)
        : await nongstApi.createBill({ ...payload, customer: Number(customer) })
      toast(editing ? `Bill ${res.data.bill_number} updated` : `Bill ${res.data.bill_number} created`, 'success')
      onSaved(res.data)
    } catch (e) {
      toast(errorText(e, 'Could not save the bill'), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Label>Customer *</Label>
          <Select value={customer} onChange={(e) => setCustomer(e.target.value)} disabled={Boolean(editing)}>
            <option value="">— Select customer —</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{customerLabel(c)}</option>)}
          </Select>
          {editing && <p className="mt-1 text-xs text-muted-foreground">Customer can't be changed on a saved bill.</p>}
        </div>
        <div>
          <Label>Bill date</Label>
          <Input type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} />
        </div>
      </div>

      {customer && (
        <div className="flex items-center justify-between rounded-xl border border-amber-400/25 bg-amber-500/[0.07] px-4 py-3 text-sm">
          <span className="text-amber-200/90">{editing ? 'Old balance on this bill' : 'Old balance (owed before this bill)'}</span>
          <span className="font-mono text-base font-semibold text-amber-300">{balanceLoading ? '…' : inr(prev / 100)}</span>
        </div>
      )}

      <div>
        <div className="overflow-x-auto rounded-xl border border-foreground/10">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-foreground/10 bg-white/[0.02] text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="w-48 px-3 py-2.5 text-left font-medium">Product</th>
                <th className="px-3 py-2.5 text-left font-medium">Item</th>
                <th className="w-20 px-3 py-2.5 text-left font-medium">Unit</th>
                <th className="w-24 px-3 py-2.5 text-left font-medium">Qty</th>
                <th className="w-28 px-3 py-2.5 text-left font-medium">Rate ₹</th>
                <th className="w-28 px-3 py-2.5 text-right font-medium">Amount</th>
                <th className="w-9" />
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/[0.06]">
              {items.map((it, i) => (
                <tr key={i}>
                  <td className="p-1.5">
                    <Select className="h-9 text-xs" value={it.product} onChange={(e) => onProductSelect(i, e.target.value)} aria-label="Product">
                      <option value="">— type below —</option>
                      <option value={NEW_PRODUCT}>+ Add new product…</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </Select>
                  </td>
                  <td className="p-1.5"><Input className="h-9 text-xs" value={it.description} onChange={(e) => setItem(i, 'description', e.target.value)} placeholder="Item name" aria-label="Item" /></td>
                  <td className="p-1.5"><Input className="h-9 text-xs" value={it.unit} onChange={(e) => setItem(i, 'unit', e.target.value)} aria-label="Unit" /></td>
                  <td className="p-1.5"><Input className="h-9 text-xs" type="number" min="0" step="0.001" value={it.quantity} onChange={(e) => setItem(i, 'quantity', e.target.value)} aria-label="Quantity" /></td>
                  <td className="p-1.5"><Input className="h-9 text-xs" type="number" min="0" step="0.01" value={it.rate} onChange={(e) => setItem(i, 'rate', e.target.value)} placeholder="0.00" aria-label="Rate" /></td>
                  <td className="p-1.5 text-right font-mono text-xs">{inr(lineAmount(it) / 100)}</td>
                  <td className="p-1.5 text-center">
                    {items.length > 1 && (
                      <button type="button" onClick={() => setItems((p) => p.filter((_, idx) => idx !== i))} aria-label="Remove line" className="rounded p-1 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-400">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setItems((p) => [...p, newItem()])}>
          <Plus className="h-3.5 w-3.5" /> Add item
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Paid now ₹</Label>
              <Input type="number" min="0" step="0.01" value={paidNow} onChange={(e) => setPaidNow(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label>Method</Label>
              <Select value={method} onChange={(e) => setMethod(e.target.value)} disabled={!paid}>
                {PAYMENT_METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional, prints at the bottom of the bill" />
          </div>
        </div>

        <div className="space-y-1.5 rounded-xl border border-foreground/10 bg-white/[0.02] p-4 text-sm">
          {roundOff !== 0 && (
            <>
              <Row label="Items total" value={itemsTotal} muted />
              <Row label="Round off" value={roundOff} muted />
            </>
          )}
          <Row label="This bill" value={thisBill} />
          <Row label="Previous balance" value={prev} className="text-amber-300" />
          <div className="border-t border-dashed border-foreground/15 pt-1.5">
            <Row label="Total due" value={totalDue} bold />
          </div>
          <Row label="Paid now" value={paid} className="text-emerald-400" />
          <div className="mt-1 flex items-center justify-between rounded-lg bg-violet-500/10 px-3 py-2 text-base font-semibold">
            <span>Balance</span>
            <span className="font-mono">{inr(balance / 100)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-foreground/10 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={save} loading={saving}>{saving ? 'Saving…' : editing ? 'Update bill' : 'Create bill'}</Button>
      </div>

      <QuickProductModal
        open={quickAddRow !== null}
        initial={quickAddRow !== null ? quickAddInitial() : null}
        onClose={() => setQuickAddRow(null)}
        onCreated={handleProductCreated}
      />
    </div>
  )
}

function Row({ label, value, bold, muted, className = '' }) {
  return (
    <div className={`flex justify-between ${bold ? 'font-semibold' : ''} ${className}`}>
      <span className={muted ? 'text-muted-foreground' : ''}>{label}</span>
      <span className="font-mono">{inr(value / 100)}</span>
    </div>
  )
}
