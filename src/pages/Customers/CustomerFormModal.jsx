import { useEffect, useState } from 'react'
import { customersApi } from '../../api'
import { Modal } from '../../components/ui/modal'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { useToast } from '../../components/ui/toast'

const EMPTY = { name: '', phone: '', email: '', address: '', city: '', state: '', state_code: '', pincode: '', gst_number: '' }

// The address is now one free-text box (like the company profile). Customers saved
// before this change may still have separate city/pincode values: fold them into the
// address text and clear the old fields, so nothing is lost and the invoice PDF does
// not print the city/pincode twice.
function toSingleAddress(c) {
  const city = (c.city || '').trim()
  const pincode = (c.pincode || '').trim()
  let address = (c.address || '').trim()
  const extra = [city, pincode].filter((part) => part && !address.includes(part)).join(' - ')
  if (extra) address = address ? `${address}\n${extra}` : extra
  return { ...c, address, city: '', pincode: '' }
}

/** Create a customer, or (with `editing`) change one. Used by the Customers list and the customer page. */
export default function CustomerFormModal({ open, editing, onClose, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setForm(editing ? toSingleAddress(editing) : EMPTY)
  }, [open, editing])

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const save = async () => {
    if (!form.name) return toast('Name is required', 'error')
    setSaving(true)
    try {
      const res = editing ? await customersApi.update(editing.id, form) : await customersApi.create(form)
      toast(editing ? 'Customer updated' : 'Customer created', 'success')
      onSaved(res.data)
    } catch (e) {
      toast(e.response?.data?.detail || 'Save failed', 'error')
    } finally { setSaving(false) }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit Customer' : 'New Customer'}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Name *</Label>
            <Input value={form.name} onChange={f('name')} placeholder="Customer name" />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={form.phone} onChange={f('phone')} placeholder="Phone number" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={f('email')} placeholder="Email address" />
          </div>
          <div>
            <Label>GST Number</Label>
            <Input value={form.gst_number} onChange={f('gst_number')} placeholder="GSTIN (optional)" />
          </div>
        </div>
        <div>
          <Label>Address</Label>
          <Textarea rows={3} value={form.address || ''} onChange={f('address')} placeholder="Full address" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>State</Label>
            <Input value={form.state || ''} onChange={f('state')} placeholder="State" />
          </div>
          <div>
            <Label>State Code</Label>
            <Input value={form.state_code || ''} onChange={f('state_code')} placeholder="e.g. 33" />
          </div>
        </div>
      </div>
    </Modal>
  )
}
