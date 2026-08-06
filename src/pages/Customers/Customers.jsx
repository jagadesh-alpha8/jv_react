import { useEffect, useState, useCallback } from 'react'
import { Search, Plus } from 'lucide-react'
import { customersApi } from '../../api'
import { Modal } from '../../components/ui/modal'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card } from '../../components/ui/card'
import { Table, THead, TBody, Tr, Th, Td, TableWrap, EmptyRow } from '../../components/ui/table'
import { Pagination } from '../../components/ui/pagination'
import { CenteredSpinner } from '../../components/ui/spinner'
import { useToast } from '../../components/ui/toast'

const EMPTY = { name: '', phone: '', email: '', address: '', city: '', state: '', state_code: '', pincode: '', gst_number: '' }

export default function Customers() {
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
      const res = await customersApi.list({ search: q, page: pg })
      setRows(res.data.results ?? res.data)
      setTotalCount(res.data.count ?? (res.data.results ?? res.data).length)
    } catch { toast('Failed to load customers', 'error') }
    finally { setLoading(false) }
  }, [search, page]) // eslint-disable-line

  useEffect(() => { load() }, [page]) // eslint-disable-line
  useEffect(() => { setPage(1); load(search, 1) }, [search]) // eslint-disable-line

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModalOpen(true) }
  const openEdit = (c) => { setEditing(c); setForm({ ...c }); setModalOpen(true) }

  const save = async () => {
    if (!form.name) return toast('Name is required', 'error')
    setSaving(true)
    try {
      if (editing) { await customersApi.update(editing.id, form) }
      else { await customersApi.create(form) }
      toast(editing ? 'Customer updated' : 'Customer created', 'success')
      setModalOpen(false)
      load(search, page)
    } catch (e) {
      toast(e.response?.data?.detail || 'Save failed', 'error')
    } finally { setSaving(false) }
  }

  const remove = async (id) => {
    if (!confirm('Delete this customer?')) return
    try { await customersApi.remove(id); toast('Customer deleted', 'success'); load() }
    catch { toast('Delete failed', 'error') }
  }

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search customers…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> New Customer</Button>
      </div>

      <Card>
        <TableWrap>
          <Table>
            <THead>
              <Tr>
                <Th>Name</Th><Th>Phone</Th><Th>Email</Th><Th>City</Th><Th>GST No.</Th><Th className="text-right">Actions</Th>
              </Tr>
            </THead>
            <TBody>
              {loading ? (
                <tr><td colSpan={6}><CenteredSpinner /></td></tr>
              ) : rows.length === 0 ? (
                <EmptyRow colSpan={6}>No customers found</EmptyRow>
              ) : rows.map((c) => (
                <Tr key={c.id}>
                  <Td className="font-medium">{c.name}</Td>
                  <Td>{c.phone || '—'}</Td>
                  <Td>{c.email || '—'}</Td>
                  <Td>{c.city || '—'}</Td>
                  <Td className="font-mono text-xs">{c.gst_number || '—'}</Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>Edit</Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => remove(c.id)}>Delete</Button>
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
        title={editing ? 'Edit Customer' : 'New Customer'}
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
            <Input value={form.address} onChange={f('address')} placeholder="Street address" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label>City</Label>
              <Input value={form.city} onChange={f('city')} placeholder="City" />
            </div>
            <div>
              <Label>State</Label>
              <Input value={form.state} onChange={f('state')} placeholder="State" />
            </div>
            <div>
              <Label>State Code</Label>
              <Input value={form.state_code} onChange={f('state_code')} placeholder="e.g. 33" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Pincode</Label>
              <Input value={form.pincode} onChange={f('pincode')} placeholder="Pincode" />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
