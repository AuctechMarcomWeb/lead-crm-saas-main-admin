import React, { useState, useEffect, useCallback } from 'react'
import {
  AlertTriangle, CheckCircle, RefreshCw, IndianRupee,
  Clock, School, Download, FileText
} from 'lucide-react'
import { Table, Empty, Tooltip, Modal } from 'antd'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { getRequest, patchRequest } from '../../../Helpers'

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
          <div className="bg-red-50 rounded-lg p-3 text-sm border border-red-100">
            <p className="font-semibold text-gray-800">{record.tenantDetails?.schoolName}</p>
            <p className="text-red-600 text-xs mt-0.5 font-medium">
              ⚠️ Overdue since {dayjs(record.dueDate).format('DD MMM YYYY')} ({dayjs().diff(dayjs(record.dueDate), 'day')} days)
            </p>
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
const OverdueReport = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [totalOverdue, setTotalOverdue] = useState(0)
  const [markPaidRecord, setMarkPaidRecord] = useState(null)

  const fetchOverdue = useCallback(() => {
    setLoading(true)
    // monthly-billing?status=OVERDUE — same endpoint, filter by OVERDUE status
    getRequest('monthly-billing?status=OVERDUE&isPagination=false')
      .then((res) => {
        const records = res?.data?.data?.bills || []
        setData(records)
        setTotalOverdue(records.reduce((s, r) => s + (r.totalAmount || 0), 0))
      })
      .catch(() => {
        toast.error('Failed to load overdue report')
        setData([])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchOverdue() }, [fetchOverdue])

  const exportExcel = () => {
    if (!data.length) { toast.error('No overdue records'); return }
    const rows = data.map((row, i) => ({
      'Sr.': i + 1,
      'School': row.tenantDetails?.schoolName || '—',
      'Month': row.billingMonth ? dayjs(row.billingMonth + '-01').format('MMM YYYY') : '—',
      'Amount (₹)': row.totalAmount || 0,
      'Due Date': row.dueDate ? dayjs(row.dueDate).format('DD MMM YYYY') : '—',
      'Overdue Days': row.dueDate ? dayjs().diff(dayjs(row.dueDate), 'day') : 0,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Overdue')
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    saveAs(new Blob([buf], { type: 'application/octet-stream' }), `overdue-report-${dayjs().format('YYYY-MM-DD')}.xlsx`)
    toast.success('Exported successfully')
  }

  const columns = [
    {
      title: 'Sr.',
      key: 'sr',
      align: 'center',
      width: 55,
      render: (_, __, i) => i + 1,
    },
    {
      title: 'School',
      key: 'school',
      render: (_, row) => {
        const s = row.tenantDetails
        return (
          <div className="flex items-center gap-2">
            {s?.logo ? (
              <img src={s.logo} alt="" className="w-8 h-8 rounded-lg object-contain border border-gray-100 flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center border border-red-100 text-xs font-bold text-red-500 flex-shrink-0">
                {s?.schoolName?.slice(0, 2).toUpperCase() || '--'}
              </div>
            )}
            <div>
              <p className="font-medium text-gray-800 text-sm">{s?.schoolName || '—'}</p>
              <p className="text-xs text-gray-400">{s?.subdomain}</p>
            </div>
          </div>
        )
      },
    },
    {
      title: 'Month',
      dataIndex: 'billingMonth',
      align: 'center',
      render: (m) => m ? (
        <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
          {dayjs(m + '-01').format('MMM YYYY')}
        </span>
      ) : '—',
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      align: 'center',
      render: (v) => <span className="font-bold text-red-700">₹{Number(v || 0).toLocaleString('en-IN')}</span>,
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      align: 'center',
      render: (d) => d ? <span className="text-xs text-red-600 font-semibold">{dayjs(d).format('DD MMM YYYY')}</span> : '—',
    },
    {
      title: 'Overdue By',
      key: 'overdueDays',
      align: 'center',
      render: (_, row) => {
        if (!row.dueDate) return '—'
        const days = dayjs().diff(dayjs(row.dueDate), 'day')
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold
            ${days > 30 ? 'bg-red-100 text-red-700' : days > 7 ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
            <Clock size={10} /> {days} days
          </span>
        )
      },
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      render: (_, row) => (
        <button
          onClick={() => setMarkPaidRecord(row)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#0c3b73] hover:bg-[#0a2f5c] text-white rounded-lg transition">
          <CheckCircle size={11} /> Mark Paid
        </button>
      ),
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
            <AlertTriangle size={20} className="text-red-500" />
            Overdue Payments
          </h1>
          <p className="text-sm text-gray-500">Schools with outstanding payments past due date</p>
        </div>
        <div className="flex items-center gap-3">
          {data.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-center">
              <p className="text-xs text-red-500 font-medium">Total Outstanding</p>
              <p className="text-lg font-bold text-red-700">₹{totalOverdue.toLocaleString('en-IN')}</p>
            </div>
          )}
          <button onClick={exportExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-xs bg-[#0c3b73] hover:bg-[#0a2f5c] text-white rounded-lg transition">
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      {/* Alert banner */}
      {data.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 font-medium">
            {data.length} school{data.length > 1 ? 's have' : ' has'} overdue payments totalling ₹{totalOverdue.toLocaleString('en-IN')}
          </p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="_id"
          loading={loading}
          pagination={false}
          locale={{ emptyText: (
            <div className="py-10 text-center">
              <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No overdue payments — all tenant are up to date!</p>
            </div>
          )}}
          scroll={{ x: 'max-content' }}
          rowClassName="bg-red-50/20"
        />
      </div>

      {/* Mark Paid Modal */}
      <MarkPaidModal
        open={!!markPaidRecord}
        record={markPaidRecord}
        onClose={() => setMarkPaidRecord(null)}
        onSuccess={fetchOverdue}
      />
    </div>
  )
}

export default OverdueReport
