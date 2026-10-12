import { useEffect, useState, useCallback } from 'react'
import { Search, Plus, AlertTriangle, Info } from 'lucide-react'
import { productsApi } from '../../api'
import { Modal } from '../../components/ui/modal'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { Select } from '../../components/ui/select'
import { Label } from '../../components/ui/label'
import { Card } from '../../components/ui/card'
import { Table, THead, TBody, Tr, Th, Td, TableWrap, EmptyRow } from '../../components/ui/table'
import { Pagination } from '../../components/ui/pagination'
import { CenteredSpinner } from '../../components/ui/spinner'
import { useToast } from '../../components/ui/toast'

const EMPTY = { name: '', description: '', hsn_sac_code: '', unit: 'pcs', price: '', tax_percentage: '18', is_service: false }
const NO_CHECK = { exact: null, matches: [], checking: false }

const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`
const norm = (v) => (v || '').trim().replace(/\s+/g, ' ').toLowerCase()

// DRF returns either {detail: "..."} or a per-field map like {name: ["..."]}.
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

export default function Products() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  // Live duplicate lookup for the name field + the user's "yes, create it anyway" ack.
  const [nameCheck, setNameCheck] = useState(NO_CHECK)
  const [dupAcknowledged, setDupAcknowledged] = useState(false)
  const toast = useToast()

  const load = useCallback(async (q = search, pg = page) => {
    setLoading(true)
    try {
      const res = await productsApi.list({ search: q, page: pg })
      setRows(res.data.results ?? res.data)
      setTotalCount(res.data.count ?? (res.data.results ?? res.data).length)
    } catch { toast('Failed to load products', 'error') }
    finally { setLoading(false) }
  }, [search, page]) // eslint-disable-line

  useEffect(() => { load() }, [page]) // eslint-disable-line
  useEffect(() => { setPage(1); load(search, 1) }, [search]) // eslint-disable-line

  // Ask the backend which existing products look like the name being typed.
  useEffect(() => {
    if (!modalOpen) { setNameCheck(NO_CHECK); return }

    const name = form.name.trim()
    if (name.length < 2) { setNameCheck(NO_CHECK); return }

    setNameCheck((p) => ({ ...p, checking: true }))
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await productsApi.checkName(name, editing?.id, { signal: controller.signal })
        setNameCheck({ exact: res.data.exact, matches: res.data.matches || [], checking: false })
      } catch {
        if (!controller.signal.aborted) setNameCheck(NO_CHECK)
      }
    }, 300)

    return () => { clearTimeout(timer); controller.abort() }
  }, [form.name, modalOpen, editing])

  const closeModal = () => {
    setModalOpen(false)
    setNameCheck(NO_CHECK)
    setDupAcknowledged(false)
  }

  const openCreate = () => {
    setEditing(null); setForm(EMPTY); setNameCheck(NO_CHECK); setDupAcknowledged(false); setModalOpen(true)
  }
  const openEdit = (p) => {
    setEditing(p); setForm({ ...p }); setNameCheck(NO_CHECK); setDupAcknowledged(false); setModalOpen(true)
  }

  // Editing a product without touching its name never introduces a new clash.
  const renaming = !editing || norm(form.name) !== norm(editing.name)

  const save = async () => {
    if (!form.name || !form.price) return toast('Name and price are required', 'error')

    // Block the first save on an exact-name clash; a second click confirms it.
    if (nameCheck.exact && renaming && !dupAcknowledged) {
      setDupAcknowledged(true)
      return toast(`"${nameCheck.exact.name}" already exists — press Save again to use this name anyway`, 'error')
    }

    setSaving(true)
    try {
      const payload = dupAcknowledged ? { ...form, allow_duplicate: true } : form
      if (editing) { await productsApi.update(editing.id, payload) }
      else { await productsApi.create(payload) }
      toast(editing ? 'Product updated' : 'Product created', 'success')
      closeModal()
      load(search, page)
    } catch (e) {
      toast(firstError(e.response?.data) || 'Save failed', 'error')
    } finally { setSaving(false) }
  }

  const remove = async (id) => {
    if (!confirm('Delete this product?')) return
    try { await productsApi.remove(id); toast('Product deleted', 'success'); load() }
    catch { toast('Delete failed', 'error') }
  }

  const f = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    if (k === 'name') setDupAcknowledged(false)
    setForm((p) => ({ ...p, [k]: v }))
  }

  const similar = nameCheck.matches.filter((m) => m.id !== nameCheck.exact?.id)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> New Product</Button>
      </div>

      <Card>
        <TableWrap>
          <Table>
            <THead>
              <Tr>
                <Th>Name</Th><Th>HSN/SAC</Th><Th>Unit</Th><Th>Price</Th><Th>GST %</Th><Th>Type</Th><Th className="text-right">Actions</Th>
              </Tr>
            </THead>
            <TBody>
              {loading ? (
                <tr><td colSpan={7}><CenteredSpinner /></td></tr>
              ) : rows.length === 0 ? (
                <EmptyRow colSpan={7}>No products found</EmptyRow>
              ) : rows.map((p) => (
                <Tr key={p.id}>
                  <Td className="font-medium">{p.name}</Td>
                  <Td className="font-mono text-xs">{p.hsn_sac_code || '—'}</Td>
                  <Td>{p.unit}</Td>
                  <Td className="font-mono text-xs">{money(p.price)}</Td>
                  <Td>{p.tax_percentage}%</Td>
                  <Td>{p.is_service ? 'Service' : 'Goods'}</Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>Edit</Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => remove(p.id)}>Delete</Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </TableWrap>
      </Card>

      <Pagination page={page} setPage={setPage} rowCount={rows.length} totalCount={totalCount} />

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit Product' : 'New Product'}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button onClick={save} loading={saving}>
              {saving ? 'Saving…' : nameCheck.exact && renaming && dupAcknowledged ? 'Save duplicate anyway' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="flex items-center justify-between">
                <Label>Name *</Label>
                {nameCheck.checking && <span className="text-xs text-muted-foreground">Checking…</span>}
              </div>
              <Input
                value={form.name}
                onChange={f('name')}
                placeholder="Product / Service name"
                autoComplete="off"
                className={nameCheck.exact ? 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30' : ''}
              />
            </div>
            <div>
              <Label>HSN / SAC Code</Label>
              <Input value={form.hsn_sac_code || ''} onChange={f('hsn_sac_code')} placeholder="e.g. 998313" />
            </div>
          </div>

          {nameCheck.exact && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-destructive">This product already exists</p>
                  <ExistingProduct p={nameCheck.exact} onUse={openEdit} />
                  <p className="mt-2 text-xs text-muted-foreground">
                    {renaming
                      ? 'Edit the existing product instead, or change the name. Saving twice will create a duplicate.'
                      : 'Another product already uses this name. Renaming this one would keep them in conflict.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!nameCheck.exact && similar.length > 0 && (
            <div className="rounded-md border border-border bg-muted/60 p-3">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {similar.length} similar product{similar.length > 1 ? 's' : ''} already exist{similar.length > 1 ? '' : 's'}
                  </p>
                  <div className="mt-1 max-h-40 space-y-0.5 overflow-y-auto">
                    {similar.map((p) => <ExistingProduct key={p.id} p={p} onUse={openEdit} />)}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <Label>Description</Label>
            <Textarea rows={2} value={form.description || ''} onChange={f('description')} placeholder="Optional description" />
          </div>
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
    </div>
  )
}

function ExistingProduct({ p, onUse }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded px-1 py-1 hover:bg-foreground/5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{p.name}</p>
        <p className="truncate font-mono text-xs text-muted-foreground">
          {money(p.price)} · {p.tax_percentage}% GST · {p.unit}{p.hsn_sac_code ? ` · ${p.hsn_sac_code}` : ''}
        </p>
      </div>
      <Button variant="outline" size="sm" className="shrink-0" onClick={() => onUse(p)}>Edit this</Button>
    </div>
  )
}
