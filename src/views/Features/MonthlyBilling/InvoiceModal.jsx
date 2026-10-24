import React, { useState, useEffect, useRef } from 'react'
import { Modal } from 'antd'
import { FileText, Download, Printer } from 'lucide-react'
import dayjs from 'dayjs'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import toast from 'react-hot-toast'
import { getRequest } from '../../../Helpers'
import logoImg from '../../../assets/auctech-logo.png'

const BRAND = '#0c3b73'
const FONT  = "'Inter','Segoe UI','Helvetica Neue',Arial,sans-serif"
const inr   = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`
const typeLabel = (t) => ({ BASE_PLAN:'Base Plan', EXTRA_STUDENTS:'Extra Students', SUBSCRIPTION_ADDON:'Add-on' }[t] || t)

/* ══════════════════════════════════════════════════
   INVOICE DOCUMENT
══════════════════════════════════════════════════ */
const InvoiceDoc = React.forwardRef(({ invoice }, ref) => {
  if (!invoice) return null

  const isPaid   = invoice.status === 'PAID'
  const subtotal = invoice.subtotal || invoice.totalAmount || 0
  const hasTax   = (invoice.taxRate || 0) > 0

  const lineItems = invoice.lineItems?.length > 0 ? invoice.lineItems : [
    { type:'BASE_PLAN', description:`Base Plan — up to ${invoice.configSnapshot?.baseStudentLimit||350} students`, quantity:1, unitPrice:invoice.baseAmount||0, amount:invoice.baseAmount||0 },
    ...(invoice.addonSlots>0?[{ type:'EXTRA_STUDENTS', description:`Extra Students — ${invoice.addonSlots} slot(s)`, quantity:invoice.addonSlots, unitPrice:invoice.configSnapshot?.addonSlotPrice||100, amount:invoice.slotAddonAmount||0 }]:[]),
    ...(invoice.subscriptionAddonsSnapshot||[]).map(a=>({ type:'SUBSCRIPTION_ADDON', description:`${a.name}${a.quantity>1?` ×${a.quantity}`:''} — +${a.studentLimit} students`, quantity:a.quantity||1, unitPrice:a.price||0, amount:a.monthlyPrice||0 })),
  ]

  const cell  = (w, align='left') => ({ padding:'9px 10px', fontSize:12, color:'#1e293b', borderBottom:'1px solid #e2e8f0', textAlign:align, width:w||'auto', fontFamily:FONT })
  const hcell = (w, align='left') => ({ padding:'9px 10px', fontSize:11, fontWeight:700, color:'#1e293b', borderBottom:'2px solid #1e293b', borderTop:'1px solid #e2e8f0', textAlign:align, width:w||'auto', background:'transparent', fontFamily:FONT })

  return (
    <div ref={ref} style={{ fontFamily:FONT, background:'#fff', color:'#1e293b', padding:'44px 52px', maxWidth:760, margin:'0 auto' }}>

      {/* ── LOGO ── */}
      <div style={{ marginBottom:36 }}>
        <img src={logoImg} alt="SchoolCloudX" style={{ height:46, objectFit:'contain', display:'block' }} />
      </div>

      {/* ── TO / FROM ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:40, marginBottom:40 }}>
        {/* TO */}
        <div>
          <div style={{ fontSize:11, color:'#94a3b8', marginBottom:6, fontWeight:600 }}>To</div>
          <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:3 }}>{invoice.school?.name || '—'}</div>
          {invoice.school?.subdomain && <div style={{ fontSize:12, color:'#475569', marginBottom:2 }}>{invoice.school.subdomain}.schoolcloudx.com</div>}
          {invoice.school?.email     && <div style={{ fontSize:12, color:'#475569', marginBottom:2 }}>{invoice.school.email}</div>}
          {invoice.school?.phone     && <div style={{ fontSize:12, color:'#475569' }}>{invoice.school.phone}</div>}
        </div>

        {/* FROM */}
        <div>
          <div style={{ fontSize:11, color:'#94a3b8', marginBottom:6, fontWeight:600 }}>From</div>
          <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:6 }}>SchoolCloudX</div>
          {[
            ['Email',    'support@schoolcloudx.com'],
            ['Website',  'schoolcloudx.com'],
            ['Platform', 'Smart School Management'],
          ].map(([lbl, val]) => (
            <div key={lbl} style={{ display:'flex', gap:16, marginBottom:3 }}>
              <span style={{ fontSize:12, color:'#94a3b8', width:60, flexShrink:0 }}>{lbl}</span>
              <span style={{ fontSize:12, color:'#475569' }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── INVOICE HEADING ── */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:20, fontWeight:900, color:'#0f172a', marginBottom:14, letterSpacing:'-0.3px' }}>Invoice</div>
        <div style={{ display:'grid', gridTemplateColumns:'140px 1fr', rowGap:4, columnGap:12 }}>
          {[
            ['Invoice number', invoice.invoiceNumber || '—'],
            ['Invoice date',   dayjs(invoice.invoiceDate).format('DD-MM-YYYY')],
            ['Billing month',  dayjs(invoice.billingMonth+'-01').format('MMMM YYYY')],
            ['Due date',       invoice.dueDate ? dayjs(invoice.dueDate).format('DD-MM-YYYY') : '—'],
            ['Status',         invoice.status],
            ...(isPaid && invoice.paidAt ? [['Paid on', dayjs(invoice.paidAt).format('DD-MM-YYYY')]] : []),
            ...(isPaid && invoice.paymentRef ? [['Payment ref', invoice.paymentRef]] : []),
          ].map(([lbl, val]) => (
            <React.Fragment key={lbl}>
              <span style={{ fontSize:12, color:'#64748b', paddingBottom:2 }}>{lbl}:</span>
              <span style={{ fontSize:12, color: lbl==='Status' ? (isPaid?'#16a34a':'#92400e') : '#1e293b', fontWeight: lbl==='Status'?700:400 }}>{val}</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── LINE ITEMS TABLE ── */}
      <table style={{ width:'100%', borderCollapse:'collapse', marginTop:28, marginBottom:0 }}>
        <thead>
          <tr>
            <th style={hcell(null,'left')}>Description</th>
            <th style={hcell(80,'center')}>Type</th>
            <th style={hcell(50,'center')}>Qty</th>
            <th style={hcell(110,'right')}>Unit Price</th>
            <th style={hcell(110,'right')}>Total</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((item, i) => (
            <tr key={i}>
              <td style={cell(null,'left')}>{item.description}</td>
              <td style={{ ...cell(80,'center'), fontSize:11, color:'#64748b' }}>{typeLabel(item.type)}</td>
              <td style={{ ...cell(50,'center') }}>{item.quantity}</td>
              <td style={cell(110,'right')}>{inr(item.unitPrice)}</td>
              <td style={{ ...cell(110,'right'), fontWeight:600 }}>{inr(item.amount)}</td>
            </tr>
          ))}
          {/* spacer */}
          <tr><td colSpan={5} style={{ padding:'14px 0', borderBottom:'none' }} /></tr>
        </tbody>
      </table>

      {/* ── TOTALS ── */}
      <div style={{ borderTop:'1px solid #e2e8f0', paddingTop:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', fontSize:13, color:'#475569' }}>
          <span>Subtotal excl. tax</span><span>{inr(subtotal)}</span>
        </div>
        {hasTax && (
          <div style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', fontSize:13, color:'#475569' }}>
            <span>{invoice.taxLabel || `Tax (${invoice.taxRate}%)`}</span><span>{inr(invoice.taxAmount)}</span>
          </div>
        )}
        {hasTax && (
          <div style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', fontSize:13, color:'#475569' }}>
            <span>Total incl. tax</span><span>{inr(invoice.totalAmount)}</span>
          </div>
        )}
      </div>

      {/* ── AMOUNT DUE ── */}
      <div style={{ borderTop:'1px solid #e2e8f0', marginTop:8, paddingTop:14, display:'flex', justifyContent:'flex-end', alignItems:'center', gap:32 }}>
        <span style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>{isPaid ? 'Amount Paid' : 'Amount due'}</span>
        <span style={{ fontSize:22, fontWeight:900, color: isPaid ? '#16a34a' : BRAND }}>{inr(invoice.totalAmount)}</span>
      </div>

      {/* ── PAYMENT REF ── */}
      {isPaid && invoice.paymentRef && (
        <div style={{ marginTop:20, padding:'12px 16px', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, fontSize:12, color:'#166534' }}>
          ✓ Payment received · Ref: <strong style={{ fontFamily:'monospace' }}>{invoice.paymentRef}</strong>
          {invoice.paidAt && ` · ${dayjs(invoice.paidAt).format('DD MMM YYYY')}`}
        </div>
      )}

      {/* ── FOOTER NOTE ── */}
      <div style={{ marginTop:40, paddingTop:16, borderTop:'1px solid #f1f5f9' }}>
        <p style={{ fontSize:11, color:'#94a3b8', lineHeight:1.7, margin:0 }}>
          For any billing queries, please contact us at <strong>support@schoolcloudx.com</strong>.<br/>
          Generated by SchoolCloudX · {dayjs(invoice.invoiceDate).format('DD MMM YYYY, hh:mm A')} · {invoice.invoiceNumber}
        </p>
      </div>

    </div>
  )
})
InvoiceDoc.displayName = 'InvoiceDoc'

/* ══════════════════════════════════════════════════
   MAIN MODAL
══════════════════════════════════════════════════ */
const InvoiceModal = ({ open, billId, onClose }) => {
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(false)
  const printRef = useRef(null)

  useEffect(() => {
    if (!open || !billId) { setInvoice(null); return }
    setLoading(true)
    getRequest(`monthly-billing/${billId}/invoice?_t=${Date.now()}`)
      .then((res) => {
        const body = res?.data
        const data = body?.data || (body?.invoiceNumber ? body : null)
        setInvoice(data)
        if (!data) toast.error('Invoice data is empty')
      })
      .catch((err) => {
        const s = err?.response?.status
        const m = err?.response?.data?.message || err?.message
        if (s === 401) toast.error('Session expired — please login again')
        else if (s === 404) toast.error('Invoice not found')
        else toast.error(m || 'Failed to load invoice')
      })
      .finally(() => setLoading(false))
  }, [open, billId])

  /* ── Print ── */
  const handlePrint = () => {
    const content = printRef.current?.innerHTML
    if (!content) return
    const win = window.open('', '_blank')
    win.document.write(`<!DOCTYPE html><html><head>
      <meta charset="UTF-8"/>
      <title>${invoice?.invoiceNumber || 'Invoice'}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter','Segoe UI',Arial,sans-serif;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
        @media print{@page{margin:12mm;size:A4}}
      </style>
    </head><body>${content}</body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 700)
  }

  /* ── PDF ── */
  const handleDownloadPDF = () => {
    if (!invoice) return
    const doc = new jsPDF({ orientation:'portrait', unit:'pt', format:'a4' })
    const W = 595, M = 52

    // Logo text (jsPDF can't embed img easily without base64)
    doc.setFillColor(12,59,115)
    doc.rect(M, 40, 6, 28, 'F')
    doc.setTextColor(12,59,115); doc.setFont('helvetica','bold'); doc.setFontSize(18)
    doc.text('SchoolCloudX', M+14, 58)
    doc.setTextColor(148,163,184); doc.setFont('helvetica','normal'); doc.setFontSize(9)
    doc.text('Smart School Management', M+14, 70)

    // To / From
    doc.setTextColor(148,163,184); doc.setFontSize(9); doc.setFont('helvetica','bold')
    doc.text('TO', M, 108); doc.text('FROM', W/2+10, 108)
    doc.setTextColor(15,23,42); doc.setFontSize(11); doc.setFont('helvetica','bold')
    doc.text(invoice.school?.name||'—', M, 122); doc.text('SchoolCloudX', W/2+10, 122)
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(71,85,105)
    let ty = 133
    if (invoice.school?.subdomain) { doc.text(`${invoice.school.subdomain}.schoolcloudx.com`, M, ty); ty+=11 }
    if (invoice.school?.email)     { doc.text(invoice.school.email, M, ty); ty+=11 }
    if (invoice.school?.phone)     { doc.text(invoice.school.phone, M, ty) }
    let fy2 = 133
    ;[['Email','support@schoolcloudx.com'],['Website','schoolcloudx.com']].forEach(([l,v])=>{
      doc.setTextColor(148,163,184); doc.text(l, W/2+10, fy2)
      doc.setTextColor(71,85,105);   doc.text(v, W/2+56, fy2)
      fy2+=11
    })

    // Invoice heading
    doc.setTextColor(15,23,42); doc.setFont('helvetica','bold'); doc.setFontSize(16)
    doc.text('Invoice', M, 192)
    const meta = [
      ['Invoice number', invoice.invoiceNumber||'—'],
      ['Invoice date',   dayjs(invoice.invoiceDate).format('DD-MM-YYYY')],
      ['Billing month',  dayjs(invoice.billingMonth+'-01').format('MMMM YYYY')],
      ['Due date',       invoice.dueDate ? dayjs(invoice.dueDate).format('DD-MM-YYYY') : '—'],
      ['Status',         invoice.status],
      ...(invoice.status==='PAID'&&invoice.paidAt ? [['Paid on', dayjs(invoice.paidAt).format('DD-MM-YYYY')]] : []),
    ]
    let my = 207
    meta.forEach(([l,v])=>{
      doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(100,116,139)
      doc.text(l+':', M, my)
      doc.setTextColor(15,23,42)
      doc.text(v, M+100, my)
      my+=12
    })

    // Table
    const hasLI = (invoice.lineItems?.length||0)>0
    const rows = (hasLI ? invoice.lineItems : [
      { type:'BASE_PLAN', description:`Base Plan — up to ${invoice.configSnapshot?.baseStudentLimit||350} students`, quantity:1, unitPrice:invoice.baseAmount||0, amount:invoice.baseAmount||0 },
      ...(invoice.addonSlots>0?[{ type:'EXTRA_STUDENTS', description:`Extra Students — ${invoice.addonSlots} slot(s)`, quantity:invoice.addonSlots, unitPrice:invoice.configSnapshot?.addonSlotPrice||100, amount:invoice.slotAddonAmount||0 }]:[]),
      ...(invoice.subscriptionAddonsSnapshot||[]).map(a=>({ type:'SUBSCRIPTION_ADDON', description:`${a.name}${a.quantity>1?` ×${a.quantity}`:''} — +${a.studentLimit} students`, quantity:a.quantity||1, unitPrice:a.price||0, amount:a.monthlyPrice||0 })),
    ]).map((item,i)=>[item.description, typeLabel(item.type), item.quantity, `Rs.${Number(item.unitPrice||0).toLocaleString('en-IN')}`, `Rs.${Number(item.amount||0).toLocaleString('en-IN')}`])

    doc.autoTable({
      startY: my+8,
      head: [['Description','Type','Qty','Unit Price','Total']],
      body: rows,
      headStyles:{ fillColor:255, textColor:[15,23,42], fontStyle:'bold', fontSize:9, lineWidth:{ bottom:0.8 }, lineColor:[30,41,59] },
      bodyStyles:{ fontSize:9, textColor:[30,41,59] },
      alternateRowStyles:{ fillColor:255 },
      columnStyles:{ 0:{cellWidth:210}, 1:{cellWidth:80,halign:'center'}, 2:{cellWidth:40,halign:'center'}, 3:{cellWidth:90,halign:'right'}, 4:{cellWidth:90,halign:'right'} },
      margin:{ left:M, right:M },
      tableLineColor:[226,232,240], tableLineWidth:0,
    })

    const tableEnd = doc.lastAutoTable.finalY
    const sub = invoice.subtotal || invoice.totalAmount || 0
    doc.setDrawColor(226,232,240); doc.setLineWidth(0.5)
    doc.line(M, tableEnd+10, W-M, tableEnd+10)
    let totY = tableEnd+24
    doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(71,85,105)
    doc.text('Subtotal excl. tax', M, totY)
    doc.text(`Rs.${Number(sub).toLocaleString('en-IN')}`, W-M, totY, {align:'right'})
    if ((invoice.taxRate||0)>0) {
      totY+=14; doc.text(invoice.taxLabel||`Tax (${invoice.taxRate}%)`, M, totY)
      doc.text(`Rs.${Number(invoice.taxAmount||0).toLocaleString('en-IN')}`, W-M, totY, {align:'right'})
      totY+=14; doc.text('Total incl. tax', M, totY)
      doc.text(`Rs.${Number(invoice.totalAmount||0).toLocaleString('en-IN')}`, W-M, totY, {align:'right'})
    }
    doc.line(M, totY+10, W-M, totY+10)
    totY+=24
    doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(15,23,42)
    doc.text(invoice.status==='PAID'?'Amount Paid':'Amount due', M, totY)
    doc.setFontSize(14); doc.setTextColor(invoice.status==='PAID'?[22,163,74]:[12,59,115])
    doc.text(`Rs.${Number(invoice.totalAmount||0).toLocaleString('en-IN')}`, W-M, totY, {align:'right'})

    // Footer
    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(148,163,184)
    doc.text('For billing queries: support@schoolcloudx.com', M, 820)
    doc.text(`${invoice.invoiceNumber||''} · Generated ${dayjs(invoice.invoiceDate).format('DD MMM YYYY')}`, W-M, 820, {align:'right'})

    doc.save(`${invoice.invoiceNumber||'invoice'}.pdf`)
    toast.success('PDF downloaded')
  }

  return (
    <Modal
      open={open} onCancel={onClose} footer={null} width={820} destroyOnClose
      styles={{ body:{ padding:0 }, content:{ borderRadius:12, overflow:'hidden' } }}
      title={
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingRight:32, fontFamily:FONT }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <FileText size={15} color={BRAND} />
            <span style={{ fontWeight:700, fontSize:14, color:BRAND }}>
              {invoice?.invoiceNumber ? `Invoice — ${invoice.invoiceNumber}` : 'Invoice'}
            </span>
          </div>
          {invoice && (
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={handlePrint}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 14px', fontSize:12, fontWeight:600, border:'1px solid #e2e8f0', borderRadius:7, background:'#fff', cursor:'pointer', color:'#374151', fontFamily:FONT }}>
                <Printer size={13}/> Print
              </button>
              <button onClick={handleDownloadPDF}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 14px', fontSize:12, fontWeight:600, border:'none', borderRadius:7, background:BRAND, cursor:'pointer', color:'#fff', fontFamily:FONT }}>
                <Download size={13}/> Download PDF
              </button>
            </div>
          )}
        </div>
      }
    >
      <div style={{ maxHeight:'84vh', overflowY:'auto', background:'#fff' }}>
        {loading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'70px 0', gap:12, fontFamily:FONT }}>
            <div style={{ width:28, height:28, border:'3px solid #e2e8f0', borderTop:`3px solid ${BRAND}`, borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
            <span style={{ fontSize:13, color:'#94a3b8' }}>Loading invoice…</span>
          </div>
        ) : invoice ? (
          <InvoiceDoc ref={printRef} invoice={invoice} />
        ) : (
          <div style={{ padding:'70px 0', textAlign:'center', color:'#94a3b8', fontSize:14, fontFamily:FONT }}>Invoice not found</div>
        )}
      </div>
    </Modal>
  )
}

export default InvoiceModal
