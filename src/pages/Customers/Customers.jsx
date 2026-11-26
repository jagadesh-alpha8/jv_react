import { useEffect, useState, useCallback } from 'react'
import { Search, Plus, EyeOff, Eye } from 'lucide-react'
import { customersApi } from '../../api'
import { Modal } from '../../components/ui/modal'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Card } from '../../components/ui/card'
import { Table, THead, TBody, Tr, Th, Td, TableWrap, EmptyRow } from '../../components/ui/table'
import { Pagination } from '../../components/ui/pagination'
import { CenteredSpinner } from '../../components/ui/spinner'
import { useToast } from '../../components/ui/toast'
import { customerPlace } from '../../lib/customer'

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
  const [showHidden, setShowHidden] = useState(false)
  // Delete flow: { customer, blocked: null | message, busy }
  const [del, setDel] = useState(null)
  const toast = useToast()

  const load = useCallback(async (q = search, pg = page) => {
    setLoading(true)
    try {
      const res = await customersApi.list({ search: q, page: pg, hidden: showHidden ? 1 : undefined })
      setRows(res.data.results ?? res.data)
      setTotalCount(res.data.count ?? (res.data.results ?? res.data).length)
    } catch { toast('Failed to load customers', 'error') }
    finally { setLoading(false) }
  }, [search, page, showHidden]) // eslint-disable-line

  useEffect(() => { load() }, [page]) // eslint-disable-line
  useEffect(() => { setPage(1); load(search, 1) }, [search, showHidden]) // eslint-disable-line

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModalOpen(true) }
  const openEdit = (c) => { setEditing(c); setForm(toSingleAddress(c)); setModalOpen(true) }

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

  const confirmDelete = async () => {
    const c = del.customer
    setDel((d) => ({ ...d, busy: true }))
    try {
      await customersApi.remove(c.id)
      toast(`${c.name} deleted`, 'success')
      setDel(null)
      load()
    } catch (e) {
      const data = e.response?.data
      if (data?.can_hide) {
        setDel({ customer: c, blocked: data.detail, busy: false })
      } else {
        toast(data?.detail || 'Delete failed', 'error')
        setDel((d) => ({ ...d, busy: false }))
      }
    }
  }

  const hideCustomer = async () => {
    const c = del.customer
    setDel((d) => ({ ...d, busy: true }))
    try {
      await customersApi.hide(c.id)
      toast(`${c.name} hidden. Their invoices and bills are kept.`, 'success')
      setDel(null)
      load()
    } catch {
      toast('Could not hide the customer', 'error')
      setDel((d) => ({ ...d, busy: false }))
    }
  }

  const restoreCustomer = async (c) => {
    try {
      await customersApi.restore(c.id)
      toast(`${c.name} is back in your customer list`, 'success')
      load()
    } catch { toast('Could not restore the customer', 'error') }
  }

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search customers…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowHidden((v) => !v)}>
            {showHidden ? <><Eye className="h-4 w-4" /> Show active</> : <><EyeOff className="h-4 w-4" /> Hidden customers</>}
          </Button>
          {!showHidden && <Button onClick={openCreate}><Plus className="h-4 w-4" /> New Customer</Button>}
        </div>
      </div>

      <Card>
        <TableWrap>
          <Table>
            <THead>
              <Tr>
                <Th>Name</Th><Th>Phone</Th><Th>Email</Th><Th>State</Th><Th>GST No.</Th><Th className="text-right">Actions</Th>
              </Tr>
            </THead>
            <TBody>
              {loading ? (
                <tr><td colSpan={6}><CenteredSpinner /></td></tr>
              ) : rows.length === 0 ? (
                <EmptyRow colSpan={6}>{showHidden ? 'No hidden customers' : 'No customers found'}</EmptyRow>
              ) : rows.map((c) => (
                <Tr key={c.id}>
                  <Td>
                    <div className="font-medium">{c.name}</div>
                    {customerPlace(c) && <div className="text-xs text-muted-foreground">{customerPlace(c)}</div>}
                  </Td>
                  <Td>{c.phone || '—'}</Td>
                  <Td>{c.email || '—'}</Td>
                  <Td>{c.state || '—'}</Td>
                  <Td className="font-mono text-xs">{c.gst_number || '—'}</Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-1.5">
                      {showHidden ? (
                        <Button variant="ghost" size="sm" onClick={() => restoreCustomer(c)}>Restore</Button>
                      ) : (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>Edit</Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDel({ customer: c, blocked: null, busy: false })}>Delete</Button>
                        </>
                      )}
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

      <Modal
        open={Boolean(del)}
        onClose={() => { if (!del?.busy) setDel(null) }}
        title={del?.blocked ? 'Customer has records' : 'Delete customer'}
        size="sm"
        footer={del && (
          <>
            <Button variant="ghost" onClick={() => setDel(null)} disabled={del.busy}>Cancel</Button>
            {del.blocked
              ? <Button onClick={hideCustomer} loading={del.busy}><EyeOff className="h-4 w-4" /> Hide customer</Button>
              : <Button variant="destructive" onClick={confirmDelete} loading={del.busy}>Delete</Button>}
          </>
        )}
      >
        {del && (del.blocked ? (
          <div className="space-y-3 text-sm">
            <p>{del.blocked}</p>
            <p className="text-muted-foreground">
              Hiding removes them from the customer list and from the pick-lists for new invoices, bills and payments.
              Their past invoices, bills and balances stay exactly as they are, and you can restore them any time from “Hidden customers”.
            </p>
          </div>
        ) : (
          <p className="text-sm">Delete <span className="font-semibold">{del.customer.name}</span>? This can't be undone.</p>
        ))}
      </Modal>
    </div>
  )
}
