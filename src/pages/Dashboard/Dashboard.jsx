import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { IndianRupee, FileText, Clock, Users } from 'lucide-react'
import { dashboardApi } from '../../api'
import { StatCard } from '../../components/ui/stat-card'
import { Badge } from '../../components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Table, THead, TBody, Tr, Th, Td, TableWrap, EmptyRow } from '../../components/ui/table'
import { CenteredSpinner } from '../../components/ui/spinner'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

export default function Dashboard() {
  const [data, setData] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    dashboardApi.get().then((r) => setData(r.data)).catch(console.error)
  }, [])

  const statusRows = data
    ? [
        { label: 'Paid', count: data.paid_invoices, color: 'green' },
        { label: 'Unpaid', count: data.unpaid_invoices, color: 'blue' },
        { label: 'Overdue', count: data.overdue_invoices, color: 'red' },
      ]
    : []

  const chartData = (data?.monthly_revenue || []).map((d) => ({ ...d, label: d.month.split(' ')[0] }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Revenue" value={data ? fmt(data.total_revenue) : '—'} sub="This financial year" icon={IndianRupee} tone="brand" />
        <StatCard label="Invoices" value={data?.total_invoices ?? '—'} sub={`FY ${data?.financial_year || ''}`} icon={FileText} tone="green" />
        <StatCard label="Amount Due" value={data ? fmt(data.total_due) : '—'} sub="Pending collection" icon={Clock} tone="yellow" />
        <StatCard label="Customers" value={data?.total_customers ?? '—'} sub="Active customers" icon={Users} tone="purple" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {!data ? (
              <CenteredSpinner />
            ) : chartData.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">No revenue data yet</div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="rgb(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'rgb(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: 'rgb(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={56} />
                    <Tooltip
                      cursor={{ fill: 'rgb(var(--muted))' }}
                      formatter={(v) => [fmt(v), 'Revenue']}
                      contentStyle={{
                        background: 'rgb(var(--popover))',
                        border: '1px solid rgb(var(--border))',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="revenue" fill="rgb(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {statusRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <Badge color={row.color} label={row.label} />
                <span className="text-sm font-semibold">{row.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')}>View all</Button>
        </CardHeader>
        <TableWrap>
          <Table>
            <THead>
              <Tr>
                <Th>Invoice #</Th><Th>Customer</Th><Th>Date</Th><Th>Amount</Th><Th>Status</Th>
              </Tr>
            </THead>
            <TBody>
              {!data ? (
                <tr><td colSpan={5}><CenteredSpinner /></td></tr>
              ) : data.recent_invoices.length === 0 ? (
                <EmptyRow colSpan={5}>No invoices yet</EmptyRow>
              ) : (
                data.recent_invoices.map((inv) => (
                  <Tr key={inv.id} className="cursor-pointer" onClick={() => navigate('/invoices')}>
                    <Td className="font-mono text-xs">{inv.invoice_number}</Td>
                    <Td>{inv.customer_name}</Td>
                    <Td>{inv.issue_date}</Td>
                    <Td className="font-mono text-xs">{fmt(inv.grand_total)}</Td>
                    <Td><Badge status={inv.status} /></Td>
                  </Tr>
                ))
              )}
            </TBody>
          </Table>
        </TableWrap>
      </Card>
    </div>
  )
}
