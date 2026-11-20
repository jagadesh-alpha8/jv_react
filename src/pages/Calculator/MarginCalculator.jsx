import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, RotateCcw, ShoppingCart, Receipt, Landmark, TrendingUp, ArrowLeftRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select } from '../../components/ui/select'
import { Table, THead, TBody, Tr, Th, Td, TableWrap } from '../../components/ui/table'
import { AnimatedNumber, stagger, riseItem } from '../../components/fx/motion'
import { cn } from '../../lib/cn'

/*
 * GST & Margin Calculator — a scratch pad, nothing is saved to the server.
 * Enter what you buy an item for and what you sell it for (both exclusive of
 * GST) to see input GST (ITC), output GST, net GST payable and profit.
 * All money is worked out in whole paise so totals never show float noise.
 */

const GST_RATES = [0, 5, 12, 18, 28, 40]
const STORAGE_KEY = 'gstbill.marginCalculator.v1'

let nextId = 1
const newRow = (over = {}) => ({ id: nextId++, name: '', qty: '1', buyRate: '', buyTax: '18', sellRate: '', sellTax: '18', ...over })
const SAMPLE = () => [newRow({ name: 'Product 1', qty: '1', buyRate: '4800', sellRate: '6500' })]

function loadRows() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (Array.isArray(saved) && saved.length) return saved.map((r) => newRow({ ...r, id: undefined }))
  } catch { /* storage unavailable — start fresh */ }
  return SAMPLE()
}

const num = (v) => {
  const n = parseFloat(v)
  return Number.isFinite(n) && n > 0 ? n : 0
}
const paise = (rupees) => Math.round(rupees * 100)
const inr = (p) => `₹${(p / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function lineMath(r) {
  const qty = num(r.qty)
  const buyBase = paise(qty * num(r.buyRate))
  const buyGst = Math.round((buyBase * num(r.buyTax)) / 100)
  const sellBase = paise(qty * num(r.sellRate))
  const sellGst = Math.round((sellBase * num(r.sellTax)) / 100)
  return { buyBase, buyGst, buyTotal: buyBase + buyGst, sellBase, sellGst, sellTotal: sellBase + sellGst }
}

function TotalsBox({ title, icon: Icon, tone, rows }) {
  return (
    <div className={cn('rounded-xl border p-4', tone === 'buy' ? 'border-violet-400/20 bg-violet-500/[0.05]' : 'border-cyan-400/20 bg-cyan-500/[0.05]')}>
      <div className={cn('mb-3 flex items-center gap-2 text-sm font-semibold', tone === 'buy' ? 'text-violet-300' : 'text-cyan-300')}>
        <Icon className="h-4 w-4" /> {title}
      </div>
      <div className="space-y-2 text-sm">
        {rows.map(([label, value], i) => (
          <div
            key={label}
            className={cn('flex justify-between', i === rows.length - 1 && 'border-t border-dashed border-foreground/15 pt-2 font-semibold')}
          >
            <span className={i === rows.length - 1 ? '' : 'text-muted-foreground'}>{label}</span>
            <span className="font-mono tabular-nums">{inr(value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Metric({ label, hint, value, good, icon: Icon, extra }) {
  return (
    <motion.div variants={riseItem} className="rounded-2xl border border-foreground/[0.08] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
        <Icon className={cn('h-4 w-4', good ? 'text-emerald-400' : 'text-rose-400')} />
      </div>
      <div className={cn('mt-2 font-mono text-2xl font-semibold tabular-nums', good ? 'text-emerald-400' : 'text-rose-400')}>
        <AnimatedNumber value={value} format={inr} duration={0.6} />
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{extra ?? hint}</div>
    </motion.div>
  )
}

export default function MarginCalculator() {
  const [rows, setRows] = useState(loadRows)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.map(({ id: _id, ...r }) => r)))
    } catch { /* ignore */ }
  }, [rows])

  const update = (id, key) => (e) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [key]: e.target.value } : r)))
  const addRow = () => setRows((rs) => [...rs, newRow()])
  const removeRow = (id) => setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.id !== id) : [newRow()]))
  const reset = () => setRows(SAMPLE())

  const lines = useMemo(() => rows.map((r) => ({ row: r, ...lineMath(r) })), [rows])
  const t = useMemo(
    () =>
      lines.reduce(
        (a, l) => ({
          buyBase: a.buyBase + l.buyBase, buyGst: a.buyGst + l.buyGst, buyTotal: a.buyTotal + l.buyTotal,
          sellBase: a.sellBase + l.sellBase, sellGst: a.sellGst + l.sellGst, sellTotal: a.sellTotal + l.sellTotal,
        }),
        { buyBase: 0, buyGst: 0, buyTotal: 0, sellBase: 0, sellGst: 0, sellTotal: 0 }
      ),
    [lines]
  )

  const invoiceDiff = t.sellTotal - t.buyTotal
  const netGst = t.sellGst - t.buyGst
  const profit = t.sellBase - t.buyBase
  const margin = t.sellBase > 0 ? (profit / t.sellBase) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Enter what you buy and sell each product for (before GST) to see input tax credit, GST payable and your profit in one view.
            This is a calculator only, so nothing here is saved to your invoices.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <span className="text-xs text-muted-foreground">Rates exclude GST</span>
        </CardHeader>
        <TableWrap>
          <Table className="min-w-[980px]">
            <THead>
              <tr>
                <Th rowSpan={2} className="align-bottom">Product</Th>
                <Th rowSpan={2} className="align-bottom">Qty</Th>
                <Th colSpan={3} className="border-l border-foreground/[0.075] bg-violet-500/[0.07] text-center text-violet-300">Purchase (input)</Th>
                <Th colSpan={3} className="border-l border-foreground/[0.075] bg-cyan-500/[0.07] text-center text-cyan-300">Selling (output)</Th>
                <Th rowSpan={2} />
              </tr>
              <tr>
                <Th className="border-l border-foreground/[0.075]">Buy rate ₹</Th>
                <Th>GST</Th>
                <Th className="text-right">Buy total</Th>
                <Th className="border-l border-foreground/[0.075]">Sell rate ₹</Th>
                <Th>GST</Th>
                <Th className="text-right">Sell total</Th>
              </tr>
            </THead>
            <TBody>
              {lines.map(({ row: r, buyTotal, sellTotal }) => (
                <Tr key={r.id}>
                  <Td className="w-[22%] min-w-[180px] py-2">
                    <Input value={r.name} onChange={update(r.id, 'name')} placeholder="Item name" aria-label="Product name" />
                  </Td>
                  <Td className="w-24 py-2">
                    <Input type="number" min="0" step="any" value={r.qty} onChange={update(r.id, 'qty')} aria-label="Quantity" />
                  </Td>
                  <Td className="w-32 border-l border-foreground/[0.06] py-2">
                    <Input type="number" min="0" step="any" value={r.buyRate} onChange={update(r.id, 'buyRate')} placeholder="0.00" aria-label="Buy rate" />
                  </Td>
                  <Td className="w-24 py-2">
                    <Select value={r.buyTax} onChange={update(r.id, 'buyTax')} aria-label="Purchase GST rate" className="h-10 rounded-xl">
                      {GST_RATES.map((g) => <option key={g} value={g}>{g}%</option>)}
                    </Select>
                  </Td>
                  <Td className="w-32 py-2 text-right font-mono text-sm font-medium tabular-nums text-violet-200">{inr(buyTotal)}</Td>
                  <Td className="w-32 border-l border-foreground/[0.06] py-2">
                    <Input type="number" min="0" step="any" value={r.sellRate} onChange={update(r.id, 'sellRate')} placeholder="0.00" aria-label="Sell rate" />
                  </Td>
                  <Td className="w-24 py-2">
                    <Select value={r.sellTax} onChange={update(r.id, 'sellTax')} aria-label="Selling GST rate" className="h-10 rounded-xl">
                      {GST_RATES.map((g) => <option key={g} value={g}>{g}%</option>)}
                    </Select>
                  </Td>
                  <Td className="w-32 py-2 text-right font-mono text-sm font-medium tabular-nums text-cyan-200">{inr(sellTotal)}</Td>
                  <Td className="w-12 py-2 text-center">
                    <Button variant="ghost" size="icon" onClick={() => removeRow(r.id)} aria-label="Remove row" className="text-muted-foreground hover:bg-rose-500/10 hover:text-rose-400">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </TableWrap>

        <CardContent className="space-y-5 pt-4">
          <button
            type="button"
            onClick={addRow}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-violet-400/40 bg-violet-500/[0.05] py-2.5 text-sm font-medium text-violet-300 transition-colors hover:bg-violet-500/[0.1]"
          >
            <Plus className="h-4 w-4" /> Add product
          </button>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TotalsBox
              title="Purchase totals"
              icon={ShoppingCart}
              tone="buy"
              rows={[
                ['Total cost (before GST)', t.buyBase],
                ['Input GST (ITC)', t.buyGst],
                ['Total purchase paid', t.buyTotal],
              ]}
            />
            <TotalsBox
              title="Selling totals"
              icon={Receipt}
              tone="sell"
              rows={[
                ['Total selling price (before GST)', t.sellBase],
                ['Output GST', t.sellGst],
                ['Total invoice value', t.sellTotal],
              ]}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tax and profit summary</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Metric
              label="Invoice difference"
              hint="Sell total minus buy total"
              value={invoiceDiff}
              good={invoiceDiff >= 0}
              icon={ArrowLeftRight}
            />
            <Metric
              label={netGst >= 0 ? 'Net GST payable' : 'ITC carried forward'}
              hint={netGst >= 0 ? 'Output GST minus input GST (ITC)' : 'Input GST is more than output GST'}
              value={Math.abs(netGst)}
              good={netGst <= 0}
              icon={Landmark}
            />
            <Metric
              label="Net profit"
              value={profit}
              good={profit >= 0}
              icon={TrendingUp}
              extra={`Before income tax · ${margin.toFixed(1)}% margin on sales`}
            />
          </motion.div>
          <p className="mt-4 text-xs text-muted-foreground">
            Assumes all input GST is eligible as ITC. GST on a product is not your cost when you can claim it back, so profit uses prices before GST.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
