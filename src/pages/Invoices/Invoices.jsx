import { useEffect, useState, useCallback } from 'react'
import { Search, Plus, Download, Trash2 } from 'lucide-react'
import { invoicesApi, customersApi, productsApi } from '../../api'
import { Modal } from '../../components/ui/modal'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select } from '../../components/ui/select'
import { Badge } from '../../components/ui/badge'
import { Card } from '../../components/ui/card'
import { Table, THead, TBody, Tr, Th, Td, TableWrap, EmptyRow } from '../../components/ui/table'
import { Pagination } from '../../components/ui/pagination'
import { CenteredSpinner } from '../../components/ui/spinner'
import { useToast } from '../../components/ui/toast'
import InvoiceForm from './InvoiceForm'
import PaymentModal from './PaymentModal'
import InvoiceDetail from './InvoiceDetail'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

export default function Invoices() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [fyFilter, setFy] = useState('')
  const [fyList, setFyList] = useState([])
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const [payOpen, setPayOpen] = useState(false)
  const [payInvoice, setPayInvoice] = useState(null)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailId, setDetailId] = useState(null)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [lastInvoiceId, setLastInvoiceId] = useState(null)

  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])

  const toast = useToast()

  const refreshLastInvoiceId = () => {
    invoicesApi.last().then((r) => setLastInvoiceId(r.data.id)).catch(() => {})
  }

  const load = useCallback(async (q = search, fy = fyFilter, pg = page) => {
    setLoading(true)
    try {
      const params = { page: pg }
      if (q) params.search = q
      if (fy) params.financial_year = fy
      const res = await invoicesApi.list(params)
      setRows(res.data.results ?? res.data)
      setTotalCount(res.data.count ?? (res.data.results ?? res.data).length)
    } catch { toast('Failed to load invoices', 'error') }
    finally { setLoading(false) }
    refreshLastInvoiceId()
  }, [search, fyFilter, page]) // eslint-disable-line

  useEffect(() => {
    invoicesApi.financialYears().then((r) => setFyList(r.data)).catch(() => {})
    customersApi.list({ page: 1 }).then((r) => setCustomers(r.data.results ?? r.data)).catch(() => {})
    productsApi.list({ page: 1 }).then((r) => setProducts(r.data.results ?? r.data)).catch(() => {})
  }, [])

  useEffect(() => { load() }, [page]) // eslint-disable-line
  useEffect(() => { setPage(1); load(search, fyFilter, 1) }, [search, fyFilter]) // eslint-disable-line

  const openCreate = () => { setEditing(null); setFormOpen(true) }

  const openEdit = async (inv) => {
    try {
      const response = await invoicesApi.get(inv.id)
      setEditing(response.data)
      setFormOpen(true)
    } catch {
      toast('Failed to load invoice', 'error')
    }
  }

  const handleSaved = () => { setFormOpen(false); load() }
  const openPayment = (inv) => { setPayInvoice(inv); setPayOpen(true) }
  const handlePaymentSaved = () => { setPayOpen(false); load() }
  const openDetail = (inv) => { setDetailId(inv.id); setDetailOpen(true) }

  const openDeleteConfirm = (inv) => { setDeleteTarget(inv); setDeleteOpen(true) }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    const confirmed = window.confirm(
      `Final confirmation: permanently delete invoice ${deleteTarget.invoice_number}? This cannot be undone.`
    )
    if (!confirmed) return
    setDeleting(true)
    try {
      await invoicesApi.remove(deleteTarget.id)
      toast('Invoice deleted', 'success')
      setDeleteOpen(false)
      setDeleteTarget(null)
      load()
    } catch (err) {
      toast(err?.response?.data?.detail || 'Failed to delete invoice', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search invoices…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select className="sm:w-36" value={fyFilter} onChange={(e) => setFy(e.target.value)}>
            <option value="">All FY</option>
            {fyList.map((fy) => <option key={fy} value={fy}>{fy}</option>)}
          </Select>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> New Invoice</Button>
      </div>

      <Card>
        <TableWrap>
          <Table>
            <THead>
              <Tr>
                <Th>Invoice #</Th><Th>Customer</Th><Th>Date</Th><Th>Due Date</Th>
                <Th className="text-right">Subtotal</Th><Th className="text-right">Tax</Th>
                <Th className="text-right">Total</Th><Th className="text-right">Due</Th>
                <Th>Status</Th><Th className="text-right">Actions</Th>
              </Tr>
            </THead>
            <TBody>
              {loading ? (
                <tr><td colSpan={10}><CenteredSpinner /></td></tr>
              ) : rows.length === 0 ? (
                <EmptyRow colSpan={10}>No invoices found</EmptyRow>
              ) : rows.map((inv) => (
                <Tr key={inv.id}>
                  <Td className="font-mono text-xs">{inv.invoice_number}</Td>
                  <Td className="font-medium">{inv.customer_name}</Td>
                  <Td>{inv.issue_date}</Td>
                  <Td>{inv.due_date || '—'}</Td>
                  <Td className="text-right font-mono text-xs">{fmt(inv.subtotal)}</Td>
                  <Td className="text-right font-mono text-xs">{fmt(inv.tax_total)}</Td>
                  <Td className="text-right font-mono text-xs font-semibold">{fmt(inv.grand_total)}</Td>
                  <Td className={`text-right font-mono text-xs ${Number(inv.amount_due) > 0 ? 'text-warning' : 'text-muted-foreground'}`}>
                    {fmt(inv.amount_due)}
                  </Td>
                  <Td><Badge status={inv.status} /></Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openDetail(inv)}>View</Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(inv)}>Edit</Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openPayment(inv)}
                        className={Number(inv.amount_due) > 0 ? '' : 'invisible pointer-events-none'}
                        tabIndex={Number(inv.amount_due) > 0 ? 0 : -1}
                      >
                        + Pay
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Download PDF"
                        onClick={() =>
                          invoicesApi
                            .downloadPdf(inv.id, `Invoice_${inv.invoice_number}.pdf`)
                            .catch(() => toast('Failed to download PDF', 'error'))
                        }
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Delete Invoice"
                        className={`text-destructive hover:text-destructive ${inv.id === lastInvoiceId ? '' : 'invisible pointer-events-none'}`}
                        onClick={() => openDeleteConfirm(inv)}
                        tabIndex={inv.id === lastInvoiceId ? 0 : -1}
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

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? `Edit ${editing.invoice_number}` : 'New Invoice'} size="xl">
        <InvoiceForm
          editing={editing}
          customers={customers}
          products={products}
          onSaved={handleSaved}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>

      {payInvoice && (
        <PaymentModal
          open={payOpen}
          invoice={payInvoice}
          onClose={() => setPayOpen(false)}
          onSaved={handlePaymentSaved}
        />
      )}

      <InvoiceDetail
        open={detailOpen}
        invoiceId={detailId}
        onClose={() => setDetailOpen(false)}
        onPay={openPayment}
      />

      <Modal
        open={deleteOpen}
        onClose={() => { if (!deleting) { setDeleteOpen(false); setDeleteTarget(null) } }}
        title="Delete Invoice"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setDeleteOpen(false); setDeleteTarget(null) }} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} loading={deleting}>
              Delete Invoice
            </Button>
          </>
        }
      >
        {deleteTarget && (
          <div className="space-y-3 text-sm">
            <p>
              You are about to permanently delete invoice{' '}
              <span className="font-mono font-semibold">{deleteTarget.invoice_number}</span> for{' '}
              <span className="font-medium">{deleteTarget.customer_name}</span> ({fmt(deleteTarget.grand_total)}).
            </p>
            <p className="font-medium text-destructive">
              Warning: this will also delete all of its line items and payment records. This action
              cannot be undone. Invoices are normally retained for audit purposes — only proceed if
              you are certain.
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}
