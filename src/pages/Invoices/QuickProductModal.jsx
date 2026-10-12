import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { productsApi } from '../../api'
import { Modal } from '../../components/ui/modal'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select } from '../../components/ui/select'
import { Label } from '../../components/ui/label'
import { useToast } from '../../components/ui/toast'

const EMPTY = { name: '', hsn_sac_code: '', unit: 'pcs', price: '', tax_percentage: '18', is_service: false }

const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`

function firstError(data) {
  if (!data) return null
  if (typeof data === 'string') return data
  if (data.detail) return data.detail
  for (const v of Object.values(data)) {
    const msg = Array.isArray(v) ? v[0] : v
    if (typeof msg === 'string') return msg
  }
  return null
}

// Create a product without leaving the invoice form. `initial` pre-fills the
// fields from whatever the user already typed on the line item.
export default function QuickProductModal({ open, initial, onClose, onCreated }) {
  const toast = useToast()
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [existing, setExisting] = useState(null)

  useEffect(() => {
    if (open) { setForm({ ...EMPTY, ...initial }); setExisting(null) }
  }, [open]) // eslint-disable-line

  // Warn when the name matches a product that already exists, so the user can pick it instead.
  useEffect(() => {
    if (!open) return
    const name = form.name.trim()
    if (name.length < 2) { setExisting(null); return }
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await productsApi.checkName(name, undefined, { signal: controller.signal })
        setExisting(res.data.exact || null)
      } catch {
        if (!controller.signal.aborted) setExisting(null)
      }
    }, 300)
    return () => { clearTimeout(timer); controller.abort() }
  }, [form.name, open])

  const f = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((p) => ({ ...p, [k]: v }))
  }

  const save = async () => {
    if (!form.name.trim() || !form.price) return toast('Name and price are required', 'error')
    if (existing) return toast(`"${existing.name}" already exists — use it instead`, 'error')
    setSaving(true)
    try {
      const res = await productsApi.create(form)
      toast('Product created', 'success')
      onCreated(res.data)
    } catch (e) {
      toast(firstError(e.response?.data) || 'Save failed', 'error')
    } finally { setSaving(false) }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Product"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={saving} disabled={Boolean(existing)}>{saving ? 'Saving…' : 'Save & Use'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Name *</Label>
            <Input value={form.name} onChange={f('name')} placeholder="Product / Service name" autoComplete="off" autoFocus />
          </div>
          <div>
            <Label>HSN / SAC Code</Label>
            <Input value={form.hsn_sac_code} onChange={f('hsn_sac_code')} placeholder="e.g. 8714" />
          </div>
        </div>

        {existing && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-destructive">This product already exists</p>
              <p className="truncate font-mono text-xs text-muted-foreground">
                {existing.name} · {money(existing.price)} · {existing.tax_percentage}% GST · {existing.unit}
              </p>
            </div>
            <Button variant="outline" size="sm" className="shrink-0" onClick={() => onCreated(existing)}>Use this</Button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label>Price (₹) *</Label>
            <Input type="number" step="0.01" value={form.price} onChange={f('price')} placeholder="0.00" />
          </div>
          <div>
            <Label>GST %</Label>
            <Select value={form.tax_percentage} onChange={f('tax_percentage')}>
              <option value="0">0%</option>
              <option value="5">5%</option>
              <option value="12">12%</option>
              <option value="18">18%</option>
              <option value="28">28%</option>
            </Select>
          </div>
          <div>
            <Label>Unit</Label>
            <Select value={form.unit} onChange={f('unit')}>
              <option value="pcs">pcs</option>
              <option value="set">set</option>
              <option value="kg">kg</option>
              <option value="ltr">ltr</option>
              <option value="hrs">hrs</option>
              <option value="mtr">mtr</option>
              <option value="box">box</option>
            </Select>
          </div>
        </div>
        <label className="flex items-center gap-2.5 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={!!form.is_service}
            onChange={f('is_service')}
            className="h-4 w-4 rounded border-input accent-[rgb(var(--primary))]"
          />
          This is a Service (SAC code)
        </label>
      </div>
    </Modal>
  )
}
