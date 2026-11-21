import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, Eye, FileSpreadsheet } from 'lucide-react'
import { customersApi, statementsApi } from '../../api'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select } from '../../components/ui/select'
import { Label } from '../../components/ui/label'
import { Card } from '../../components/ui/card'
import { Table, THead, TBody, Tr, Th, Td, TableWrap } from '../../components/ui/table'
import { CenteredSpinner } from '../../components/ui/spinner'
import { useToast } from '../../components/ui/toast'

const COPY = {
  gst: { debit: 'Invoiced', empty: 'No GST invoices or payments in this period', file: 'GST' },
  nongst: { debit: 'Billed', empty: 'No Non-GST bills or payments in this period', file: 'NonGST' },
}

const money = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const balance = (n) => {
  const v = Number(n || 0)
  if (v === 0) return money(0)
  return `${money(Math.abs(v))} ${v > 0 ? 'Dr' : 'Cr'}`
}
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const dmy = (s) => (s ? s.split('-').reverse().join('-') : '')

// Indian financial year starts 1 April.
const PRESETS = [
  ['this_month', 'This month', () => { const t = new Date(); return [new Date(t.getFullYear(), t.getMonth(), 1), t] }],
  ['last_month', 'Last month', () => { const t = new Date(); return [new Date(t.getFullYear(), t.getMonth() - 1, 1), new Date(t.getFullYear(), t.getMonth(), 0)] }],
  ['this_fy', 'This financial year', () => { const t = new Date(); const y = t.getMonth() >= 3 ? t.getFullYear() : t.getFullYear() - 1; return [new Date(y, 3, 1), t] }],
  ['last_fy', 'Last financial year', () => { const t = new Date(); const y = (t.getMonth() >= 3 ? t.getFullYear() : t.getFullYear() - 1) - 1; return [new Date(y, 3, 1), new Date(y + 1, 2, 31)] }],
]

/** Customer statement for one ledger. `kind` is 'gst' or 'nongst'; the two never mix. */
export default function StatementPage({ kind }) {
  const copy = COPY[kind]
  const toast = useToast()
  const [params] = useSearchParams()
  const [customers, setCustomers] = useState([])
  const [customer, setCustomer] = useState(params.get('customer') || '')
  const [preset, setPreset] = useState('this_month')
  const [from, setFrom] = useState(() => iso(PRESETS[0][2]()[0]))
  const [to, setTo] = useState(() => iso(PRESETS[0][2]()[1]))
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [pdfBusy, setPdfBusy] = useState(false)

  useEffect(() => {
    customersApi.list({ page_size: 500, ordering: 'name' }).then((r) => setCustomers(r.data.results ?? r.data)).catch(() => {})
  }, [])

  const pickPreset = (key) => {
    setPreset(key)
    const p = PRESETS.find(([k]) => k === key)
    if (p) { const [a, b] = p[2](); setFrom(iso(a)); setTo(iso(b)) }
  }

  const valid = customer && from && to && from <= to
  const query = useMemo(() => ({ customer, date_from: from, date_to: to }), [customer, from, to])

  useEffect(() => {
    if (!valid) { setData(null); return }
    let stale = false
    setLoading(true)
    statementsApi.get(kind, query)
      .then((r) => { if (!stale) setData(r.data) })
      .catch((e) => { if (!stale) { setData(null); toast(e.response?.data?.detail || "Couldn't load the statement", 'error') } })
      .finally(() => { if (!stale) setLoading(false) })
    return () => { stale = true }
  }, [kind, query, valid]) // eslint-disable-line

  const fileBase = data ? `Statement_${copy.file}_${data.customer.name.replace(/[^A-Za-z0-9]+/g, '_')}_${dmy(from)}_to_${dmy(to)}` : 'Statement'

  const pdf = async (mode) => {
    setPdfBusy(true)
    try {
      const url = await statementsApi.pdfUrl(kind, query)
      if (mode === 'open') {
        window.open(url, '_blank')
      } else {
        const a = document.createElement('a')
        a.href = url
        a.download = `${fileBase}.pdf`
        document.body.appendChild(a); a.click(); a.remove()
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch { toast("Couldn't create the PDF", 'error') }
    finally { setPdfBusy(false) }
  }

  const csv = () => {
    const q = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`
    const lines = [
      ['Date', 'Particulars', 'Debit', 'Credit', 'Balance'],
      [dmy(data.date_from), 'Opening balance', '', '', balance(data.opening_balance)],
      ...data.entries.map((e) => [dmy(e.date), e.particulars, Number(e.debit) ? e.debit : '', Number(e.credit) ? e.credit : '', balance(e.balance)]),
      ['', 'Total for the period', data.total_debit, data.total_credit, ''],
      [dmy(data.date_to), 'Closing balance', '', '', balance(data.closing_balance)],
    ]
    const blob = new Blob(['﻿' + lines.map((l) => l.map(q).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${fileBase}.csv`
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 30000)
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-4">
            <Label>Customer *</Label>
            <Select value={customer} onChange={(e) => setCustomer(e.target.value)}>
              <option value="">— Select customer —</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div className="md:col-span-3">
            <Label>Period</Label>
            <Select value={preset} onChange={(e) => pickPreset(e.target.value)}>
              {PRESETS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              <option value="custom">Custom dates</option>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>From</Label>
            <Input type="date" value={from} max={to || undefined} onChange={(e) => { setFrom(e.target.value); setPreset('custom') }} />
          </div>
          <div className="md:col-span-3">
            <Label>To</Label>
            <Input type="date" value={to} min={from || undefined} onChange={(e) => { setTo(e.target.value); setPreset('custom') }} />
          </div>
        </div>
        {from && to && from > to && <p className="mt-2 text-xs text-destructive">'From' date must be on or before the 'To' date.</p>}
      </Card>

      {!customer ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">Pick a customer to see their statement.</Card>
      ) : loading && !data ? (
        <Card><CenteredSpinner /></Card>
      ) : data && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-lg font-semibold">{data.customer.name}</div>
              <div className="text-xs text-muted-foreground">{dmy(data.date_from)} to {dmy(data.date_to)}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => pdf('open')} disabled={pdfBusy}><Eye className="h-4 w-4" /> View PDF</Button>
              <Button onClick={() => pdf('download')} loading={pdfBusy}><Download className="h-4 w-4" /> Download PDF</Button>
              <Button variant="outline" onClick={csv}><FileSpreadsheet className="h-4 w-4" /> Excel (CSV)</Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Summary label="Opening balance" value={`₹${balance(data.opening_balance)}`} />
            <Summary label={`${copy.debit} (debit)`} value={`₹${money(data.total_debit)}`} />
            <Summary label="Received (credit)" value={`₹${money(data.total_credit)}`} />
            <Summary label="Closing balance" value={`₹${balance(data.closing_balance)}`} strong />
          </div>

          <Card className={loading ? 'opacity-60' : ''}>
            <TableWrap>
              <Table>
                <THead>
                  <Tr><Th>Date</Th><Th>Particulars</Th><Th className="text-right">Debit</Th><Th className="text-right">Credit</Th><Th className="text-right">Balance</Th></Tr>
                </THead>
                <TBody>
                  <Tr>
                    <Td>{dmy(data.date_from)}</Td>
                    <Td className="font-semibold">Opening balance</Td>
                    <Td /><Td />
                    <Td className="text-right font-mono text-xs font-semibold">{balance(data.opening_balance)}</Td>
                  </Tr>
                  {data.entries.length === 0 ? (
                    <Tr><Td /><Td className="text-muted-foreground" colSpan={4}>{copy.empty}</Td></Tr>
                  ) : data.entries.map((e, i) => (
                    <Tr key={i}>
                      <Td>{dmy(e.date)}</Td>
                      <Td>{e.particulars}</Td>
                      <Td className="text-right font-mono text-xs">{Number(e.debit) ? money(e.debit) : ''}</Td>
                      <Td className="text-right font-mono text-xs">{Number(e.credit) ? money(e.credit) : ''}</Td>
                      <Td className="text-right font-mono text-xs font-semibold">{balance(e.balance)}</Td>
                    </Tr>
                  ))}
                  <Tr className="border-t-2 border-foreground/20">
                    <Td /><Td className="font-semibold">Total for the period</Td>
                    <Td className="text-right font-mono text-xs font-semibold">{money(data.total_debit)}</Td>
                    <Td className="text-right font-mono text-xs font-semibold">{money(data.total_credit)}</Td>
                    <Td />
                  </Tr>
                  <Tr>
                    <Td>{dmy(data.date_to)}</Td>
                    <Td className="font-semibold">Closing balance</Td>
                    <Td /><Td />
                    <Td className="text-right font-mono text-xs font-bold">{balance(data.closing_balance)}</Td>
                  </Tr>
                </TBody>
              </Table>
            </TableWrap>
          </Card>
          <p className="text-xs text-muted-foreground">
            Dr = the customer owes you, Cr = you hold the customer's money in advance. Bills and invoices are dated by their
            bill / invoice date, payments by the date the money was received.
          </p>
        </>
      )}
    </div>
  )
}

function Summary({ label, value, strong }) {
  return (
    <Card className={`p-4 ${strong ? 'ring-1 ring-violet-400/40' : ''}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 font-mono ${strong ? 'text-xl font-bold' : 'text-lg font-semibold'}`}>{value}</div>
    </Card>
  )
}
