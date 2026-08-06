import { useState } from 'react'
import { invoicesApi } from '../../api'
import { Modal } from '../../components/ui/modal'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select } from '../../components/ui/select'
import { Label } from '../../components/ui/label'
import { useToast } from '../../components/ui/toast'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

export default function PaymentModal({ open, invoice, onClose, onSaved }) {
  const [form, setForm] = useState({ amount: '', payment_method: 'cash', payment_date: new Date().toISOString().slice(0, 10), reference_id: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const save = async () => {
    const amount = Number(form.amount)
    if (!form.amount || amount <= 0) return toast('Enter a valid amount', 'error')
    const balanceDue = Number(invoice?.amount_due || 0)
    if (amount > balanceDue) {
      return toast('Payment amount cannot exceed the outstanding balance.', 'error')
    }
    setSaving(true)
    try {
      await invoicesApi.addPayment(invoice.id, form)
      toast('Payment recorded', 'success')
      onSaved()
    } catch (e) {
      const data = e.response?.data
      const msg = data?.detail || data?.amount?.[0] || data?.non_field_errors?.[0] || 'Failed to save payment'
      toast(msg, 'error')
    } finally { setSaving(false) }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Add Payment — ${invoice?.invoice_number}`}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={saving}>{saving ? 'Saving…' : 'Record Payment'}</Button>
        </>
      }
    >
      <div className="mb-4 rounded-lg bg-muted/60 px-4 py-3">
        <div className="text-xs text-muted-foreground">Amount Due</div>
        <div className="mt-0.5 font-mono text-xl font-bold text-warning">{fmt(invoice?.amount_due)}</div>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Amount (₹) *</Label>
            <Input type="number" step="0.01" min="0.01" max={invoice?.amount_due || undefined} value={form.amount} onChange={f('amount')} placeholder="0.00" />
          </div>
          <div>
            <Label>Method</Label>
            <Select value={form.payment_method} onChange={f('payment_method')}>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="bank">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="neft">NEFT</option>
              <option value="rtgs">RTGS</option>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Payment Date</Label>
            <Input type="date" value={form.payment_date} onChange={f('payment_date')} />
          </div>
          <div>
            <Label>Reference ID</Label>
            <Input value={form.reference_id} onChange={f('reference_id')} placeholder="UTR / Cheque No." />
          </div>
        </div>
        <div>
          <Label>Notes</Label>
          <Input value={form.notes} onChange={f('notes')} placeholder="Optional notes" />
        </div>
      </div>
    </Modal>
  )
}
