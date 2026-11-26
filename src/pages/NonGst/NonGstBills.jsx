import { useCallback, useEffect, useState } from 'react'
import { Search, Plus, Download, FileText, Trash2, Pencil, History } from 'lucide-react'
import { nongstApi, customersApi, productsApi } from '../../api'
import { Modal } from '../../components/ui/modal'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select } from '../../components/ui/select'
import { Label } from '../../components/ui/label'
import { Card } from '../../components/ui/card'
import { Table, THead, TBody, Tr, Th, Td, TableWrap, EmptyRow } from '../../components/ui/table'
import { Pagination } from '../../components/ui/pagination'
import { CenteredSpinner } from '../../components/ui/spinner'
import { useToast } from '../../components/ui/toast'
import NonGstBillForm from './NonGstBillForm'
import { inr, today, errorText } from './shared'
import { customerLabel } from '../../lib/customer'

const EMPTY_OPENING = () => ({ customer: '', bill_date: today(), opening_amount: '', notes: '' })

/** Add, correct or remove opening balances. */
function OpeningBalanceModal({ open, customers, onClose, onSaved }) {
  const toast = useToast()
  const [list, setList] = useState([])
  const [listLoading, setListLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)   // null = adding a new one
  const [form, setForm] = useState(EMPTY_OPENING)
  const [saving, setSaving] = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)
  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const loadList = () => {
    setListLoading(true)
    nongstApi.bills({ opening: 1, page_size: 500 })
      .then((r) => setList(r.data.results ?? r.data))
      .catch(() => toast('Could not load opening balances', 'error'))
      .finally(() => setListLoading(false))
  }

  useEffect(() => {
    if (!open) return
    setEditingId(null); setForm(EMPTY_OPENING()); setConfirmDel(null)
    loadList()
  }, [open]) // eslint-disable-line

  const startEdit = (o) => {
    setConfirmDel(null)
    setEditingId(o.id)
    setForm({ customer: String(o.customer), bill_date: o.bill_date, opening_amount: String(o.total), notes: o.notes || '' })
  }
  const cancelEdit = () => { setEditingId(null); setForm(EMPTY_OPENING()) }

  const save = async () => {
    if (!form.customer) return toast('Pick a customer', 'error')
    if (!(Number(form.opening_amount) > 0)) return toast('Enter the amount they already owe', 'error')
    setSaving(true)
    try {
      if (editingId) {
        await nongstApi.updateBill(editingId, { opening_amount: form.opening_amount, bill_date: form.bill_date, notes: form.notes })
        toast('Opening balance corrected', 'success')
      } else {
        await nongstApi.createBill({ ...form, customer: Number(form.customer), is_opening: true })
        toast('Opening balance saved', 'success')
      }
      cancelEdit()
      loadList()
      onSaved()
    } catch (e) {
      toast(errorText(e, 'Could not save the opening balance'), 'error')
    } finally { setSaving(false) }
  }

  const remove = async (o) => {
    setSaving(true)
    try {
      await nongstApi.removeBill(o.id)
      toast(`Opening balance for ${o.customer_name} deleted`, 'success')
      setConfirmDel(null)
      if (editingId === o.id) cancelEdit()
      loadList()
      onSaved()
    } catch (e) {
      toast(errorText(e, 'Could not delete the opening balance'), 'error')
    } finally { setSaving(false) }
  }

  const editingRow = list.find((o) => o.id === editingId)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Opening balances"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {editingId && <Button variant="ghost" onClick={cancelEdit}>Cancel edit</Button>}
          <Button onClick={save} loading={saving}>{editingId ? 'Save correction' : 'Add opening balance'}</Button>
        </>
      }
    >
      <p className="mb-4 text-sm text-muted-foreground">
        Money a customer already owed before you started Non-GST billing here. It is not printed as a bill.
        You can correct or delete it until that customer's first Non-GST bill.
      </p>

      <div className="mb-5 overflow-hidden rounded-xl border border-foreground/10">
        {listLoading ? (
          <div className="py-6"><CenteredSpinner /></div>
        ) : list.length === 0 ? (
          <div className="px-4 py-5 text-center text-sm text-muted-foreground">No opening balances yet.</div>
        ) : (
          <table className="w-full text-sm">
            <tbody className="divide-y divide-foreground/[0.06]">
              {list.map((o) => (
                <tr key={o.id} className={o.id === editingId ? 'bg-violet-500/[0.08]' : ''}>
                  <td className="px-3 py-2">
                    <div className="font-medium">{o.customer_name}</div>
                    <div className="text-xs text-muted-foreground">as of {o.bill_date}</div>
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-amber-300">{inr(o.total)}</td>
                  <td className="w-44 px-2 py-2 text-right">
                    {confirmDel === o.id ? (
                      <span className="inline-flex items-center gap-1">
                        <Button size="sm" variant="destructive" onClick={() => remove(o)} loading={saving}>Delete</Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirmDel(null)}>Keep</Button>
                      </span>
                    ) : o.is_editable ? (
                      <span className="inline-flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => startEdit(o)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirmDel(o.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground" title="This customer already has Non-GST bills that carry this balance forward.">Locked (has bills)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {editingId ? `Correct opening balance · ${editingRow?.customer_name || ''}` : 'Add opening balance'}
      </div>
      <div className="space-y-4">
        <div>
          <Label>Customer *</Label>
          <Select value={form.customer} onChange={f('customer')} disabled={Boolean(editingId)}>
            <option value="">— Select customer —</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{customerLabel(c)}</option>)}
            {editingId && editingRow && !customers.some((c) => String(c.id) === String(editingRow.customer)) && (
              <option value={editingRow.customer}>{editingRow.customer_name}</option>
            )}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Amount owed ₹ *</Label><Input type="number" min="0" step="0.01" value={form.opening_amount} onChange={f('opening_amount')} placeholder="0.00" /></div>
          <div><Label>As of date</Label><Input type="date" value={form.bill_date} onChange={f('bill_date')} /></div>
        </div>
        <div><Label>Notes</Label><Input value={form.notes} onChange={f('notes')} placeholder="Optional" /></div>
      </div>
    </Modal>
  )
}

export default function NonGstBills() {
  const toast = useToast()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [fy, setFy] = useState('')
  const [fyList, setFyList] = useState([])
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [lastId, setLastId] = useState(null)

  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [openingOpen, setOpeningOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async (q = search, year = fy, pg = page) => {
    setLoading(true)
    try {
      const params = { page: pg }
      if (q) params.search = q
      if (year) params.financial_year = year
      const res = await nongstApi.bills(params)
      setRows(res.data.results ?? res.data)
      setTotalCount(res.data.count ?? (res.data.results ?? res.data).length)
    } catch { toast('Failed to load bills', 'error') }
    finally { setLoading(false) }
    nongstApi.lastBill().then((r) => setLastId(r.data.id)).catch(() => {})
    nongstApi.financialYears().then((r) => setFyList(r.data)).catch(() => {})
  }, [search, fy, page]) // eslint-disable-line

  useEffect(() => {
    customersApi.list({ page_size: 500, ordering: 'name' }).then((r) => setCustomers(r.data.results ?? r.data)).catch(() => {})
    productsApi.list({ page_size: 500, ordering: 'name' }).then((r) => setProducts(r.data.results ?? r.data)).catch(() => {})
  }, [])
  useEffect(() => { load() }, [page]) // eslint-disable-line
  useEffect(() => { setPage(1); load(search, fy, 1) }, [search, fy]) // eslint-disable-line

  const openCreate = () => { setEditing(null); setFormOpen(true) }
  const openEdit = async (b) => {
    try {
      const res = await nongstApi.bill(b.id)
      if (!res.data.is_editable) return toast('This bill can no longer be edited because the customer has a newer bill.', 'error')
      setEditing(res.data)
      setFormOpen(true)
    } catch { toast('Failed to load the bill', 'error') }
  }

  const afterSave = () => {
    setFormOpen(false)
    load()
  }

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await nongstApi.removeBill(deleteTarget.id)
      toast(`Bill ${deleteTarget.bill_number} deleted`, 'success')
      setDeleteTarget(null)
      load()
    } catch (e) {
      toast(errorText(e, 'Could not delete the bill'), 'error')
    } finally { setDeleting(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search bill # or customer…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select className="sm:w-36" value={fy} onChange={(e) => setFy(e.target.value)} aria-label="Financial year">
            <option value="">All FY</option>
            {fyList.map((y) => <option key={y} value={y}>{y}</option>)}
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setOpeningOpen(true)}><History className="h-4 w-4" /> Opening balances</Button>
          <Button onClick={openCreate}><Plus className="h-4 w-4" /> New bill</Button>
        </div>
      </div>

      <Card>
        <TableWrap>
          <Table className="min-w-[900px]">
            <THead>
              <Tr>
                <Th>Bill #</Th><Th>Customer</Th><Th>Date</Th>
                <Th className="text-right">This bill</Th><Th className="text-right">Old balance</Th>
                <Th className="text-right">Paid now</Th><Th className="text-right">Balance</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </THead>
            <TBody>
              {loading ? (
                <tr><td colSpan={8}><CenteredSpinner /></td></tr>
              ) : rows.length === 0 ? (
                <EmptyRow colSpan={8}>No Non-GST bills yet. Create the first one with “New bill”.</EmptyRow>
              ) : rows.map((b) => (
                <Tr key={b.id}>
                  <Td className="font-mono text-xs">{b.bill_number}</Td>
                  <Td className="font-medium">{b.customer_name}</Td>
                  <Td>{b.bill_date}</Td>
                  <Td className="text-right font-mono text-xs font-semibold">{inr(b.total)}</Td>
                  <Td className="text-right font-mono text-xs text-amber-300/90">{inr(b.previous_balance)}</Td>
                  <Td className="text-right font-mono text-xs text-emerald-400">{Number(b.paid_now) ? inr(b.paid_now) : '—'}</Td>
                  <Td className="text-right font-mono text-xs font-semibold">{inr(b.balance_after)}</Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" title="View A5 bill" aria-label="View A5 bill" onClick={() => nongstApi.openPdf(b.id).catch(() => toast('Failed to open the bill', 'error'))}>
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Download PDF" aria-label="Download PDF" onClick={() => nongstApi.downloadPdf(b.id, `Bill_${b.bill_number}.pdf`).catch(() => toast('Failed to download', 'error'))}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Edit" aria-label="Edit bill" onClick={() => openEdit(b)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Delete (latest bill only)"
                        aria-label="Delete bill"
                        className={`text-destructive hover:text-destructive ${b.id === lastId ? '' : 'invisible pointer-events-none'}`}
                        tabIndex={b.id === lastId ? 0 : -1}
                        onClick={() => setDeleteTarget(b)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </TableWrap>
      </Card>

      <Pagination page={page} setPage={setPage} rowCount={rows.length} totalCount={totalCount} />

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? `Edit ${editing.bill_number}` : 'New Non-GST bill'} size="xl">
        {formOpen && (
          <NonGstBillForm editing={editing} customers={customers} products={products} onProductCreated={(p) => setProducts((prev) => (prev.some((x) => x.id === p.id) ? prev : [...prev, p].sort((a, b) => a.name.localeCompare(b.name))))} onSaved={afterSave} onCancel={() => setFormOpen(false)} />
        )}
      </Modal>

      <OpeningBalanceModal open={openingOpen} customers={customers} onClose={() => setOpeningOpen(false)} onSaved={() => load()} />

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => { if (!deleting) setDeleteTarget(null) }}
        title="Delete bill"
        size="sm"
        footer={<><Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button><Button variant="destructive" onClick={confirmDelete} loading={deleting}>Delete bill</Button></>}
      >
        {deleteTarget && (
          <p className="text-sm">
            Delete <span className="font-mono font-semibold">{deleteTarget.bill_number}</span> for {deleteTarget.customer_name} ({inr(deleteTarget.total)})?
            Any “paid now” amount on it is removed too, and the customer's balance goes back to what it was. This can't be undone.
          </p>
        )}
      </Modal>
    </div>
  )
}
