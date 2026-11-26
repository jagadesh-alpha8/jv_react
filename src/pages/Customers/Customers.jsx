import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, EyeOff, Eye } from 'lucide-react'
import { customersApi } from '../../api'
import { Modal } from '../../components/ui/modal'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card } from '../../components/ui/card'
import { Table, THead, TBody, Tr, Th, Td, TableWrap, EmptyRow } from '../../components/ui/table'
import { Pagination } from '../../components/ui/pagination'
import { CenteredSpinner } from '../../components/ui/spinner'
import { useToast } from '../../components/ui/toast'
import { customerPlace } from '../../lib/customer'
import CustomerFormModal from './CustomerFormModal'


export default function Customers() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
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

  const openCreate = () => { setEditing(null); setModalOpen(true) }
  const openEdit = (c) => { setEditing(c); setModalOpen(true) }
  const afterSave = () => { setModalOpen(false); load(search, page) }

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
                    <Link to={`/customers/${c.id}`} className="font-medium hover:text-primary hover:underline">{c.name}</Link>
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

      <CustomerFormModal open={modalOpen} editing={editing} onClose={() => setModalOpen(false)} onSaved={afterSave} />

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
