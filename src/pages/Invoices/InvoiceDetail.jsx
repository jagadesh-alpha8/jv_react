import { useEffect, useState } from 'react'
import { Printer, Download } from 'lucide-react'
import { invoicesApi } from '../../api'
import { Modal } from '../../components/ui/modal'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { CenteredSpinner } from '../../components/ui/spinner'
import { useToast } from '../../components/ui/toast'

const fmt = (n) => `₹ ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtNum = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function InvoiceDetail({ open, invoiceId, onClose, onPay }) {
  const [inv, setInv] = useState(null)
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    if (!open || !invoiceId) return
    setLoading(true)
    setInv(null)
    invoicesApi.printView(invoiceId)
      .then((r) => setInv(r.data))
      .catch(() => toast('Failed to load invoice', 'error'))
      .finally(() => setLoading(false))
  }, [open, invoiceId]) // eslint-disable-line

  const company = inv?.company || {}
  const customer = inv?.customer_detail || {}
  const isIntra = inv?.supply_type === 'intra'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={inv ? inv.invoice_number : 'Invoice Details'}
      size="lg"
      footer={inv && (
        <>
          <span className="flex-1" />
          {Number(inv.amount_due) > 0 && (
            <Button variant="outline" onClick={() => { onClose(); onPay(inv) }}>Record Payment</Button>
          )}
          <Button
            variant="outline"
            onClick={() => invoicesApi.openPdf(invoiceId).catch(() => toast('Failed to open PDF', 'error'))}
          >
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button
            onClick={() =>
              invoicesApi
                .downloadPdf(invoiceId, `Invoice_${inv.invoice_number}.pdf`)
                .catch(() => toast('Failed to download PDF', 'error'))
            }
          >
            <Download className="h-4 w-4" /> PDF
          </Button>
        </>
      )}
    >
      {loading || !inv ? (
        <CenteredSpinner />
      ) : (
        <div className="space-y-5 text-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row">
            <div>
              <div className="text-lg font-semibold">{company.name || 'Company'}</div>
              <div className="text-muted-foreground">{company.address || ''}</div>
              <div className="text-muted-foreground">{[company.phone, company.email].filter(Boolean).join(' | ')}</div>
              {company.gstin && <div className="mt-1"><span className="font-semibold">GSTIN:</span> {company.gstin}</div>}
            </div>
            <div className="sm:text-right">
              <div className="text-base font-bold tracking-wide text-primary">TAX INVOICE</div>
              <div><span className="font-semibold">Invoice No:</span> <span className="font-mono text-primary">{inv.invoice_number}</span></div>
              <div><span className="font-semibold">Date:</span> {inv.issue_date}</div>
              {inv.due_date && <div><span className="font-semibold">Due:</span> {inv.due_date}</div>}
              <div><span className="font-semibold">FY:</span> {inv.financial_year}</div>
            </div>
          </div>

          <hr className="border-border" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border p-3.5">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bill To</div>
              <div className="mt-1 font-semibold">{customer.name || '—'}</div>
              <div className="text-muted-foreground">{customer.address || ''}</div>
              <div className="text-muted-foreground">{customer.phone || ''}</div>
              {customer.gst_number && <div className="mt-1"><span className="font-semibold">GSTIN:</span> {customer.gst_number}</div>}
            </div>
            <div className="rounded-lg border border-border p-3.5">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Supply Type</div>
              <div className="mt-1 font-semibold">{isIntra ? 'Intra-State (CGST + SGST)' : 'Inter-State (IGST)'}</div>
              <div className="mt-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</div>
              <div className="mt-1"><Badge status={inv.status} /></div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[760px] text-xs">
              <thead className="border-b border-border bg-muted/60 uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-2.5 py-2 text-center">#</th>
                  <th className="px-2.5 py-2 text-left">Description</th>
                  <th className="px-2.5 py-2 text-center">HSN/SAC</th>
                  <th className="px-2.5 py-2 text-center">Qty</th>
                  <th className="px-2.5 py-2 text-right">Rate ₹</th>
                  <th className="px-2.5 py-2 text-center">Disc</th>
                  <th className="px-2.5 py-2 text-right">Taxable ₹</th>
                  {isIntra ? (
                    <>
                      <th className="px-2.5 py-2 text-center">CGST%</th><th className="px-2.5 py-2 text-right">CGST ₹</th>
                      <th className="px-2.5 py-2 text-center">SGST%</th><th className="px-2.5 py-2 text-right">SGST ₹</th>
                    </>
                  ) : (
                    <>
                      <th className="px-2.5 py-2 text-center">IGST%</th><th className="px-2.5 py-2 text-right">IGST ₹</th>
                    </>
                  )}
                  <th className="px-2.5 py-2 text-right">Total ₹</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(inv.items || []).map((item, i) => (
                  <tr key={item.id ?? i}>
                    <td className="px-2.5 py-2 text-center">{i + 1}</td>
                    <td className="px-2.5 py-2 font-medium">{item.description}</td>
                    <td className="px-2.5 py-2 text-center">{item.hsn_sac_code || '—'}</td>
                    <td className="px-2.5 py-2 text-center">{item.quantity} {item.unit}</td>
                    <td className="px-2.5 py-2 text-right font-mono">{fmtNum(item.unit_price)}</td>
                    <td className="px-2.5 py-2 text-center">{item.discount_percent > 0 ? `${item.discount_percent}%` : '—'}</td>
                    <td className="px-2.5 py-2 text-right font-mono">{fmtNum(item.taxable_amount)}</td>
                    {isIntra ? (
                      <>
                        <td className="px-2.5 py-2 text-center">{item.cgst_percent}%</td>
                        <td className="px-2.5 py-2 text-right font-mono">{fmtNum(item.cgst_amount)}</td>
                        <td className="px-2.5 py-2 text-center">{item.sgst_percent}%</td>
                        <td className="px-2.5 py-2 text-right font-mono">{fmtNum(item.sgst_amount)}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-2.5 py-2 text-center">{item.igst_percent}%</td>
                        <td className="px-2.5 py-2 text-right font-mono">{fmtNum(item.igst_amount)}</td>
                      </>
                    )}
                    <td className="px-2.5 py-2 text-right font-mono font-semibold">{fmtNum(item.total_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-1.5 rounded-lg border border-border bg-muted/40 p-4">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal (Taxable)</span><span className="font-mono">{fmt(inv.subtotal)}</span></div>
              {isIntra ? (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground">CGST</span><span className="font-mono">{fmt(inv.cgst_total)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">SGST</span><span className="font-mono">{fmt(inv.sgst_total)}</span></div>
                </>
              ) : (
                <div className="flex justify-between"><span className="text-muted-foreground">IGST</span><span className="font-mono">{fmt(inv.igst_total)}</span></div>
              )}
              {Number(inv.round_off) !== 0 && (
                <div className="flex justify-between"><span className="text-muted-foreground">Round Off</span><span className="font-mono">{fmt(inv.round_off)}</span></div>
              )}
              <div className="flex justify-between border-t border-border pt-1.5 text-base font-bold"><span>Grand Total</span><span className="font-mono">{fmt(inv.grand_total)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount Paid</span><span className="font-mono text-success">{fmt(inv.amount_paid)}</span></div>
              <div className="flex justify-between font-semibold"><span>Balance Due</span><span className="font-mono">{fmt(inv.amount_due)}</span></div>
            </div>
          </div>

          {inv.notes && <div className="rounded-lg bg-muted/40 p-3.5"><span className="font-semibold">Notes:</span> {inv.notes}</div>}
          {company.bank_name && (
            <div className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Bank:</span> {company.bank_name} | <span className="font-semibold text-foreground">A/C:</span> {company.bank_account} | <span className="font-semibold text-foreground">IFSC:</span> {company.bank_ifsc}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
