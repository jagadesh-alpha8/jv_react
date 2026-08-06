import { useEffect, useState, useCallback } from 'react'
import { Search, Plus } from 'lucide-react'
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

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModalOpen(true) }
  const openEdit = (p) => { setEditing(p); setForm({ ...p }); setModalOpen(true) }

  const save = async () => {
    if (!form.name || !form.price) return toast('Name and price are required', 'error')
    setSaving(true)
    try {
      if (editing) { await productsApi.update(editing.id, form) }
      else { await productsApi.create(form) }
      toast(editing ? 'Product updated' : 'Product created', 'success')
      setModalOpen(false)
      load(search, page)
    } catch (e) {
      toast(e.response?.data?.detail || 'Save failed', 'error')
    } finally { setSaving(false) }
  }

  const remove = async (id) => {
    if (!confirm('Delete this product?')) return
    try { await productsApi.remove(id); toast('Product deleted', 'success'); load() }
    catch { toast('Delete failed', 'error') }
  }

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

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
                  <Td className="font-mono text-xs">₹{Number(p.price).toLocaleString('en-IN')}</Td>
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
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Product' : 'New Product'}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Name *</Label>
              <Input value={form.name} onChange={f('name')} placeholder="Product / Service name" />
            </div>
            <div>
              <Label>HSN / SAC Code</Label>
              <Input value={form.hsn_sac_code || ''} onChange={f('hsn_sac_code')} placeholder="e.g. 998313" />
            </div>
          </div>
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
