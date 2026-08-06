import { useState, useEffect } from 'react'
import { X, Plus } from 'lucide-react'
import { invoicesApi } from '../../api'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { Select } from '../../components/ui/select'
import { Label } from '../../components/ui/label'
import { useToast } from '../../components/ui/toast'

const newItem = () => ({ product: '', description: '', hsn_sac_code: '', unit: 'pcs', quantity: 1, unit_price: '', tax_percentage: 18, discount_percent: 0 })
const fmt2 = (n) => Number(n || 0).toFixed(2)

function calcItem(item) {
  const qty = Number(item.quantity) || 0
  const price = Number(item.unit_price) || 0
  const disc = Number(item.discount_percent) || 0
  const base = qty * price
  const discAmt = base * disc / 100
  const taxable = base - discAmt
  const gst = Number(item.tax_percentage) || 0
  const tax = taxable * gst / 100
  return { taxable, tax, total: taxable + tax }
}

export default function InvoiceForm({ editing, customers, products, onSaved, onCancel }) {
  const toast = useToast()
  const today = new Date().toISOString().slice(0, 10)

  const [form, setForm] = useState({
    customer: '', issue_date: today, due_date: '',
    supply_type: 'intra', notes: '', terms: '',
  })
  const [items, setItems] = useState([newItem()])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editing) {
      setForm({
        customer: editing.customer,
        issue_date: editing.issue_date,
        due_date: editing.due_date || '',
        supply_type: editing.supply_type,
        notes: editing.notes || '',
        terms: editing.terms || '',
      })
      if (editing.items && editing.items.length > 0) {
        setItems(editing.items.map((it) => ({
          product: it.product || '',
          description: it.description,
          hsn_sac_code: it.hsn_sac_code || '',
          unit: it.unit,
          quantity: it.quantity,
          unit_price: it.unit_price,
          tax_percentage: Number(it.tax_percentage),
          discount_percent: Number(it.discount_percent || 0),
        })))
      }
    }
  }, [editing])

  const setF = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const setItem = (i, k, v) => setItems((prev) => {
    const next = [...prev]
    next[i] = { ...next[i], [k]: v }
    if (k === 'product' && v) {
      const p = products.find((p) => String(p.id) === String(v))
      if (p) {
        next[i].description = p.name
        next[i].hsn_sac_code = p.hsn_sac_code || ''
        next[i].unit = p.unit
        next[i].unit_price = p.price
        next[i].tax_percentage = Number(p.tax_percentage)
      }
    }
    return next
  })

  const addItem = () => setItems((prev) => [...prev, newItem()])
  const removeItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i))

  const calculated = items.map((it) => calcItem(it))
  const subtotal = calculated.reduce((s, c) => s + c.taxable, 0)
  const taxTotal = calculated.reduce((s, c) => s + c.tax, 0)
  const rawTotal = subtotal + taxTotal
  const grandTotal = Math.round(rawTotal)
  const roundOff = grandTotal - rawTotal

  const save = async () => {
    if (!form.customer) return toast('Please select a customer', 'error')
    if (form.due_date && form.due_date < form.issue_date) {
      return toast('Due date must be on or after the invoice date.', 'error')
    }
    if (items.some((it) => !it.description || !it.unit_price)) return toast('All items need description and price', 'error')
    setSaving(true)
    try {
      const payload = {
        ...form,
        due_date: form.due_date || null,
        items: items.map((it, i) => ({ ...it, sort_order: i })),
      }
      if (editing) delete payload.issue_date
      if (editing) await invoicesApi.update(editing.id, payload)
      else await invoicesApi.create(payload)
      toast(editing ? 'Invoice updated' : 'Invoice created', 'success')
      onSaved()
    } catch (e) {
      const err = e.response?.data
      toast(typeof err === 'string' ? err : JSON.stringify(err) || 'Save failed', 'error')
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Customer *</Label>
          <Select value={form.customer} onChange={setF('customer')}>
            <option value="">— Select customer —</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
        <div>
          <Label>Supply Type</Label>
          <Select value={form.supply_type} onChange={setF('supply_type')}>
            <option value="intra">Intra-State (CGST + SGST)</option>
            <option value="inter">Inter-State (IGST)</option>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Invoice Date</Label>
          <Input
            type="date"
            value={form.issue_date}
            onChange={setF('issue_date')}
            disabled={Boolean(editing)}
            title={editing ? 'Invoice date cannot be changed after creation.' : undefined}
          />
          {editing && <p className="mt-1 text-xs text-muted-foreground">Invoice date cannot be changed after creation.</p>}
        </div>
        <div>
          <Label>Due Date</Label>
          <Input type="date" min={form.issue_date} value={form.due_date} onChange={setF('due_date')} />
        </div>
      </div>

      {/* Line Items */}
      <div>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-border bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="w-40 px-3 py-2.5 text-left font-medium">Product</th>
                <th className="px-3 py-2.5 text-left font-medium">Description</th>
                <th className="w-20 px-3 py-2.5 text-left font-medium">HSN</th>
                <th className="w-16 px-3 py-2.5 text-left font-medium">Unit</th>
                <th className="w-20 px-3 py-2.5 text-left font-medium">Qty</th>
                <th className="w-24 px-3 py-2.5 text-left font-medium">Price</th>
                <th className="w-20 px-3 py-2.5 text-left font-medium">GST%</th>
                <th className="w-16 px-3 py-2.5 text-left font-medium">Disc%</th>
                <th className="w-24 px-3 py-2.5 text-right font-medium">Total</th>
                <th className="w-9 px-2 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((it, i) => {
                const { total } = calcItem(it)
                return (
                  <tr key={i}>
                    <td className="p-1.5">
                      <Select value={it.product} onChange={(e) => setItem(i, 'product', e.target.value)} className="h-8 text-xs">
                        <option value="">— select —</option>
                        {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </Select>
                    </td>
                    <td className="p-1.5">
                      <Input className="h-8 text-xs" value={it.description} onChange={(e) => setItem(i, 'description', e.target.value)} placeholder="Description" />
                    </td>
                    <td className="p-1.5">
                      <Input className="h-8 text-xs" value={it.hsn_sac_code} onChange={(e) => setItem(i, 'hsn_sac_code', e.target.value)} />
                    </td>
                    <td className="p-1.5">
                      <Input className="h-8 text-xs" value={it.unit} onChange={(e) => setItem(i, 'unit', e.target.value)} />
                    </td>
                    <td className="p-1.5">
                      <Input className="h-8 text-xs" type="number" min="0" step="0.001" value={it.quantity} onChange={(e) => setItem(i, 'quantity', e.target.value)} />
                    </td>
                    <td className="p-1.5">
                      <Input className="h-8 text-xs" type="number" min="0" step="0.01" value={it.unit_price} onChange={(e) => setItem(i, 'unit_price', e.target.value)} />
                    </td>
                    <td className="p-1.5">
                      <Select className="h-8 pl-2 pr-5 text-xs" value={it.tax_percentage} onChange={(e) => setItem(i, 'tax_percentage', Number(e.target.value))}>
                        <option value={0}>0%</option>
                        <option value={5}>5%</option>
                        <option value={12}>12%</option>
                        <option value={18}>18%</option>
                        <option value={28}>28%</option>
                      </Select>
                    </td>
                    <td className="p-1.5">
                      <Input className="h-8 text-xs" type="number" min="0" max="100" value={it.discount_percent} onChange={(e) => setItem(i, 'discount_percent', e.target.value)} />
                    </td>
                    <td className="p-1.5 text-right font-mono text-xs">₹{fmt2(total)}</td>
                    <td className="p-1.5 text-center">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(i)}
                          className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addItem}>
          <Plus className="h-3.5 w-3.5" /> Add Item
        </Button>
      </div>

      {/* Totals */}
      <div className="ml-auto w-full max-w-xs space-y-1.5 rounded-lg border border-border bg-muted/40 p-4 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-mono">₹{fmt2(subtotal)}</span></div>
        {form.supply_type === 'intra' ? (
          <>
            <div className="flex justify-between"><span className="text-muted-foreground">CGST</span><span className="font-mono">₹{fmt2(taxTotal / 2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">SGST</span><span className="font-mono">₹{fmt2(taxTotal / 2)}</span></div>
          </>
        ) : (
          <div className="flex justify-between"><span className="text-muted-foreground">IGST</span><span className="font-mono">₹{fmt2(taxTotal)}</span></div>
        )}
        {roundOff !== 0 && (
          <div className="flex justify-between"><span className="text-muted-foreground">Round Off</span><span className="font-mono">₹{fmt2(roundOff)}</span></div>
        )}
        <div className="mt-1.5 flex justify-between border-t border-border pt-1.5 text-base font-semibold">
          <span>Grand Total</span><span className="font-mono">₹{fmt2(grandTotal)}</span>
        </div>
      </div>

      {/* Notes / Terms */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Notes</Label>
          <Textarea rows={2} value={form.notes} onChange={setF('notes')} placeholder="Internal notes…" />
        </div>
        <div>
          <Label>Terms &amp; Conditions</Label>
          <Textarea rows={2} value={form.terms} onChange={setF('terms')} placeholder="Terms…" />
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={save} loading={saving}>{saving ? 'Saving…' : (editing ? 'Update Invoice' : 'Create Invoice')}</Button>
      </div>
    </div>
  )
}
