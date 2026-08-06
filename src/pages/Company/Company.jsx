import { useEffect, useState } from 'react'
import { companyApi } from '../../api'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { Label } from '../../components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { CenteredSpinner } from '../../components/ui/spinner'
import { useToast } from '../../components/ui/toast'

const EMPTY = {
  name: '', address: '', phone: '', email: '', gstin: '', pan: '',
  state: '', state_code: '', bank_name: '', bank_account: '',
  bank_ifsc: '', bank_branch: '', invoice_prefix: 'INV', terms_and_conditions: '',
}

export default function Company() {
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  useEffect(() => {
    companyApi.get()
      .then((r) => setForm({ ...EMPTY, ...r.data }))
      .catch(() => toast('Failed to load company profile', 'error'))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line

  const save = async () => {
    if (!form.name) return toast('Company name is required', 'error')
    setSaving(true)
    try {
      await companyApi.update(form)
      toast('Company profile saved', 'success')
    } catch (e) {
      toast(e.response?.data?.detail || 'Save failed', 'error')
    } finally { setSaving(false) }
  }

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  if (loading) return <CenteredSpinner />

  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <CardHeader><CardTitle>Business Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Company Name *</Label>
              <Input value={form.name} onChange={f('name')} placeholder="Your company name" />
            </div>
            <div>
              <Label>Invoice Prefix</Label>
              <Input value={form.invoice_prefix} onChange={f('invoice_prefix')} placeholder="INV" />
            </div>
          </div>
          <div>
            <Label>Address</Label>
            <Textarea rows={3} value={form.address || ''} onChange={f('address')} placeholder="Full address" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Phone</Label>
              <Input value={form.phone || ''} onChange={f('phone')} placeholder="Phone number" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email || ''} onChange={f('email')} placeholder="Email address" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>GSTIN</Label>
              <Input value={form.gstin || ''} onChange={f('gstin')} placeholder="GST Identification Number" />
            </div>
            <div>
              <Label>PAN</Label>
              <Input value={form.pan || ''} onChange={f('pan')} placeholder="PAN Number" />
            </div>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Bank Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Bank Name</Label>
              <Input value={form.bank_name || ''} onChange={f('bank_name')} placeholder="Bank name" />
            </div>
            <div>
              <Label>Account Number</Label>
              <Input value={form.bank_account || ''} onChange={f('bank_account')} placeholder="Account number" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>IFSC Code</Label>
              <Input value={form.bank_ifsc || ''} onChange={f('bank_ifsc')} placeholder="IFSC code" />
            </div>
            <div>
              <Label>Branch</Label>
              <Input value={form.bank_branch || ''} onChange={f('bank_branch')} placeholder="Branch name" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Terms &amp; Conditions</CardTitle></CardHeader>
        <CardContent>
          <Textarea rows={5} value={form.terms_and_conditions || ''} onChange={f('terms_and_conditions')} placeholder="Default terms and conditions printed on invoices…" />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} loading={saving}>{saving ? 'Saving…' : 'Save Profile'}</Button>
      </div>
    </div>
  )
}
