import React, { useState, useEffect, useCallback } from 'react'
import {
  Building2, CheckCircle, XCircle, Clock, AlertCircle,
  IndianRupee, Download, FileText, ArrowLeft, TrendingUp, RefreshCw
} from 'lucide-react'
import { Table, Tag, Select, Empty, Tooltip, Modal } from 'antd'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { getRequest, patchRequest } from '../../../Helpers'
import { useNavigate } from 'react-router-dom'

const { Option } = Select

/* ─── Status config ─── */
const STATUS_CONFIG = {
  PAID:     { color: 'success', label: 'Paid',    bg: 'bg-green-50',  text: 'text-green-700',  icon: <CheckCircle size={11} /> },
  UNPAID:   { color: 'error',   label: 'Unpaid',  bg: 'bg-red-50',    text: 'text-red-700',    icon: <XCircle size={11} />     },
  PENDING:  { color: 'warning', label: 'Pending', bg: 'bg-orange-50', text: 'text-orange-700', icon: <Clock size={11} />       },
  OVERDUE:  { color: 'error',   label: 'Overdue', bg: 'bg-rose-50',   text: 'text-rose-700',   icon: <AlertCircle size={11} /> },
}

/* ─── Mark Paid Modal ─── */
const MarkPaidModal = ({ open, record, onClose, onSuccess }) => {
  const [paidDate, setPaidDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [paymentRef, setPaymentRef] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) { setPaidDate(dayjs().format('YYYY-MM-DD')); setPaymentRef('') }
  }, [open])

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await patchRequest({ url: `monthly-billing/${record._id}/mark-paid`, cred: { paidAt: paidDate, paymentRef } })
      toast.success('Marked as paid')
      onSuccess(); onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed')
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onCancel={onClose} footer={null} width={380}
      title={<div className="flex items-center gap-2 text-green-700"><CheckCircle size={15} /><span>Mark as Paid</span></div>}>
      {record && (
        <div className="space-y-3 mt-3">
          <div className="bg-gray-50 rounded-lg p-3 text-sm border border-gray-100">
            <p className="font-semibold text-gray-800">{dayjs(record.billingMonth + '-01').format('MMMM YYYY')}</p>
            <p className="text-gray-500 text-xs mt-0.5">Amount: ₹{record.totalAmount?.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Payment Date *</label>
            <input type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#0c3b73]" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Payment Reference (optional)</label>
            <input type="text" value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="UTR/Cheque/Transaction ID"
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#0c3b73]" />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={handleSubmit} disabled={loading}
              className="px-5 py-2 text-sm bg-[#0c3b73] hover:bg-[#0a2f5c] text-white rounded flex items-center gap-2 disabled:opacity-60">
              {loading && <RefreshCw size={13} className="animate-spin" />} Confirm Payment
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

/* ═══ MAIN ═══ */
const AgencyBillingReport = () => {
  const navigate = useNavigate()
  const [agencies, setAgencies] = useState([])
  const [selectedAgency, setSelectedAgency] = useState(null)
  const [selectedAgencyData, setSelectedAgencyData] = useState(null)
  const [selectedYear, setSelectedYear] = useState(dayjs().year())
  const [data, setData] = useState([])
  const [annualSummary, setAnnualSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [markPaidRecord, setMarkPaidRecord] = useState(null)

  const yearOptions = Array.from({ length: 5 }, (_, i) => dayjs().year() - i)

  /* ── Fetch tenant ── */
  useEffect(() => {
    getRequest('tenant?isPagination=false')
      .then((res) => {
        const list = res?.data?.data?.tenants || []
        setAgencies(list)
        if (list.length > 0) { setSelectedAgency(list[0]._id); setSelectedAgencyData(list[0]) }
      })
      .catch(() => {})
  }, [])

  /* ── Fetch agency annual report ── */
  const fetchAgencyReport = useCallback(() => {
    if (!selectedAgency) return
    setLoading(true)

    // monthly-billing endpoint se agency ka saara data fetch karo
    // year filter: us year ke sab months = YYYY-01 to YYYY-12
    const params = new URLSearchParams({
      tenantId:     selectedAgency,
      isPagination: 'false',
    })

    getRequest(`monthly-billing?${params.toString()}`)
      .then((res) => {
        const allBills = res?.data?.data?.bills || []

        // selected year ke bills filter karo
        const yearBills = allBills.filter((b) => {
          const billYear = b.billingMonth?.split('-')[0]
          return billYear === String(selectedYear)
        })

        setData(yearBills)

        // summary compute karo
        const totalBilled  = yearBills.reduce((s, r) => s + (r.totalAmount || 0), 0)
        const totalPaid    = yearBills.filter((r) => r.status === 'PAID').reduce((s, r) => s + (r.totalAmount || 0), 0)
        const totalPending = totalBilled - totalPaid
        setAnnualSummary({ totalBilled, totalPaid, totalPending })
      })
      .catch(() => {
        toast.error('Failed to load agency report')
        setData([])
        setAnnualSummary(null)
      })
      .finally(() => setLoading(false))
  }, [selectedAgency, selectedYear])

  useEffect(() => { fetchAgencyReport() }, [fetchAgencyReport])

  /* ── Export Excel ── */
  const exportExcel = () => {
    if (!data.length) { toast.error('No data to export'); return }
    const rows = data.map((row, i) => ({
      'Sr.': i + 1,
      'Month': dayjs(row.billingMonth + '-01').format('MMM YYYY'),
      'Leads': row.studentCount || 0,
      'Amount (₹)': row.totalAmount || 0,
      'Status': row.paidStatus || '—',
      'Due Date': row.dueDate ? dayjs(row.dueDate).format('DD MMM YYYY') : '—',
      'Paid Date': row.paidDate ? dayjs(row.paidDate).format('DD MMM YYYY') : '—',
      'Payment Ref': row.paymentRef || '—',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Annual Report')
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    saveAs(new Blob([buf], { type: 'application/octet-stream' }),
      `${selectedAgencyData?.schoolName || 'agency'}-${selectedYear}.xlsx`)
    toast.success('Excel exported')
  }

  /* ── Export PDF ── */
  const exportPDF = () => {
    if (!data.length) { toast.error('No data to export'); return }
    const doc = new jsPDF()
    doc.setFontSize(14)
    doc.text(`${selectedAgencyData?.schoolName || 'Agency'} — Annual Report ${selectedYear}`, 14, 15)
    if (annualSummary) {
      doc.setFontSize(9)
      doc.text(`Total Billed: ₹${annualSummary.totalBilled?.toLocaleString('en-IN')}  |  Paid: ₹${annualSummary.totalPaid?.toLocaleString('en-IN')}  |  Pending: ₹${annualSummary.totalPending?.toLocaleString('en-IN')}`, 14, 23)
    }
    doc.autoTable({
      startY: 28,
      head: [['Sr', 'Month', 'Leads', 'Amount', 'Status', 'Due Date', 'Paid Date']],
      body: data.map((row, i) => [
        i + 1,
        dayjs(row.billingMonth + '-01').format('MMM YYYY'),
        row.studentCount || 0,
        `₹${(row.totalAmount || 0).toLocaleString('en-IN')}`,
        row.paidStatus || '—',
        row.dueDate ? dayjs(row.dueDate).format('DD MMM YYYY') : '—',
        row.paidDate ? dayjs(row.paidDate).format('DD MMM YYYY') : '—',
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [12, 59, 115] },
    })
    doc.save(`${selectedAgencyData?.schoolName || 'agency'}-${selectedYear}.pdf`)
    toast.success('PDF exported')
  }

  /* ── Columns ── */
  const columns = [
    {
      title: 'Month',
      dataIndex: 'billingMonth',
      render: (m) => <span className="font-medium text-gray-800">{dayjs(m + '-01').format('MMMM YYYY')}</span>,
    },
    {
      title: 'Leads',
      dataIndex: 'studentCount',
      align: 'center',
      render: (v) => <span className="text-sm font-medium text-gray-700">{v ?? '—'}</span>,
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      align: 'center',
      render: (v) => <span className="font-bold text-gray-800">₹{Number(v || 0).toLocaleString('en-IN')}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      align: 'center',
      render: (status) => {
        const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
            {cfg.icon} {cfg.label}
          </span>
        )
      },
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      align: 'center',
      render: (d, row) => {
        const isOverdue = d && new Date(d) < new Date() && row.status !== 'PAID'
        return d ? (
          <span className={`text-xs ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
            {dayjs(d).format('DD MMM YYYY')}
          </span>
        ) : '—'
      },
    },
    {
      title: 'Paid Date',
      dataIndex: 'paidAt',
      align: 'center',
      render: (d) => d ? (
        <span className="text-xs text-green-600 font-medium">{dayjs(d).format('DD MMM YYYY')}</span>
      ) : <span className="text-gray-300 text-xs">—</span>,
    },
    {
      title: 'Payment Ref',
      dataIndex: 'paymentRef',
      align: 'center',
      render: (ref) => ref ? (
        <span className="text-xs font-mono text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">{ref}</span>
      ) : <span className="text-gray-300 text-xs">—</span>,
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      render: (_, row) => row.status !== 'PAID' ? (
        <button
          onClick={() => setMarkPaidRecord(row)}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-[#0c3b73] hover:bg-[#0a2f5c] text-white rounded transition">
          <CheckCircle size={11} /> Mark Paid
        </button>
      ) : (
        <span className="text-xs text-green-600 flex items-center gap-1 justify-center">
          <CheckCircle size={11} /> Done
        </span>
      ),
    },
  ]

  const paidMonths   = data.filter((d) => d.status === 'PAID').length
  const unpaidMonths = data.filter((d) => d.status !== 'PAID').length

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
            <ArrowLeft size={15} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
              <Building2 size={20} className="text-[#e24028]" />
              Agency-wise Billing Report
            </h1>
            <p className="text-sm text-gray-500">Annual payment history per agency</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={exportExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-xs bg-[#0c3b73] hover:bg-[#0a2f5c] text-white rounded-lg transition">
            <Download size={13} /> Excel
          </button>
          <button onClick={exportPDF}
            className="flex items-center gap-1.5 px-3 py-2 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg transition">
            <FileText size={13} /> PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Agency</label>
            <Select
              showSearch placeholder="Select agency"
              value={selectedAgency}
              onChange={(v) => {
                setSelectedAgency(v)
                setSelectedAgencyData(agencies.find((s) => s._id === v) || null)
              }}
              className="w-60" size="middle" optionFilterProp="label"
            >
              {agencies.map((s) => (
                <Option key={s._id} value={s._id} label={s.agencyName}>
                  <span className="text-sm">{s.agencyName}</span>
                </Option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Year</label>
            <Select value={selectedYear} onChange={setSelectedYear} className="w-28" size="middle">
              {yearOptions.map((y) => (
                <Option key={y} value={y}>{y}</Option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Annual Summary */}
      {selectedAgencyData && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex items-center gap-3 mb-4">
            {selectedAgencyData.logo ? (
              <img src={selectedAgencyData.logo} alt="" className="w-12 h-12 rounded-xl object-contain border border-gray-200" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
            )}
            <div>
              <h2 className="text-base font-semibold text-gray-800">{selectedAgencyData.schoolName}</h2>
              <p className="text-xs text-gray-400">{selectedAgencyData.subdomain}.schoolcloudx.com · Annual Report {selectedYear}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Billed', val: `₹${(annualSummary?.totalBilled || 0).toLocaleString('en-IN')}`, color: 'text-violet-700', bg: 'bg-violet-50' },
              { label: 'Total Paid', val: `₹${(annualSummary?.totalPaid || 0).toLocaleString('en-IN')}`, color: 'text-green-700', bg: 'bg-green-50' },
              { label: 'Total Pending', val: `₹${(annualSummary?.totalPending || 0).toLocaleString('en-IN')}`, color: 'text-red-700', bg: 'bg-red-50' },
              { label: 'Months Paid', val: `${paidMonths} / ${data.length}`, color: 'text-blue-700', bg: 'bg-blue-50' },
            ].map((item) => (
              <div key={item.label} className={`${item.bg} rounded-xl p-3`}>
                <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                <p className={`text-lg font-bold ${item.color}`}>{item.val}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <Table
          columns={columns}
          dataSource={data}
          rowKey={(r) => r._id || r.billingMonth}
          loading={loading}
          pagination={false}
          locale={{ emptyText: <Empty description="No billing records found for this agency" /> }}
          scroll={{ x: 'max-content' }}
          rowClassName={(row) =>
            row.status === 'OVERDUE' ? 'bg-red-50/40' :
            row.status === 'PAID'    ? 'bg-green-50/20' : ''
          }
        />
      </div>

      {/* Mark Paid Modal */}
      <MarkPaidModal
        open={!!markPaidRecord}
        record={markPaidRecord}
        onClose={() => setMarkPaidRecord(null)}
        onSuccess={fetchAgencyReport}
      />
    </div>
  )
}

export default AgencyBillingReport
