import { useEffect, useState, useCallback } from 'react'
import { Search } from 'lucide-react'
import { paymentsApi } from '../../api'
import { Input } from '../../components/ui/input'
import { Card } from '../../components/ui/card'
import { Table, THead, TBody, Tr, Th, Td, TableWrap, EmptyRow } from '../../components/ui/table'
import { Pagination } from '../../components/ui/pagination'
import { CenteredSpinner } from '../../components/ui/spinner'
import { useToast } from '../../components/ui/toast'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

const methodLabel = {
  cash: 'Cash', card: 'Card', upi: 'UPI',
  bank: 'Bank Transfer', cheque: 'Cheque', neft: 'NEFT', rtgs: 'RTGS',
}

export default function Payments() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const toast = useToast()

  const load = useCallback(async (q = search, pg = page) => {
    setLoading(true)
    try {
      const res = await paymentsApi.list({ search: q, page: pg })
      setRows(res.data.results ?? res.data)
      setTotalCount(res.data.count ?? (res.data.results ?? res.data).length)
    } catch { toast('Failed to load payments', 'error') }
    finally { setLoading(false) }
  }, [search, page]) // eslint-disable-line

  useEffect(() => { load() }, [page]) // eslint-disable-line
  useEffect(() => { setPage(1); load(search, 1) }, [search]) // eslint-disable-line

  return (
    <div className="space-y-4">
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-8" placeholder="Search by invoice # or ref ID…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <TableWrap>
          <Table>
            <THead>
              <Tr>
                <Th>Invoice #</Th><Th>Customer</Th><Th>Date</Th><Th>Method</Th><Th>Amount</Th><Th>Ref ID</Th><Th>Notes</Th>
              </Tr>
            </THead>
            <TBody>
              {loading ? (
                <tr><td colSpan={7}><CenteredSpinner /></td></tr>
              ) : rows.length === 0 ? (
                <EmptyRow colSpan={7}>No payments found</EmptyRow>
              ) : rows.map((p) => (
                <Tr key={p.id}>
                  <Td className="font-mono text-xs">{p.invoice_number || p.invoice}</Td>
                  <Td>{p.customer_name || '—'}</Td>
                  <Td>{p.payment_date}</Td>
                  <Td>{methodLabel[p.payment_method] || p.payment_method}</Td>
                  <Td className="font-mono text-xs">{fmt(p.amount)}</Td>
                  <Td className="font-mono text-xs">{p.reference_id || '—'}</Td>
                  <Td>{p.notes || '—'}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </TableWrap>
      </Card>

      <Pagination page={page} setPage={setPage} rowCount={rows.length} totalCount={totalCount} />
    </div>
  )
}
