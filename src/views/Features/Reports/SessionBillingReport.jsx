/* eslint-disable prettier/prettier */
import { useState, useEffect, useCallback } from 'react'
import {
  CalendarDays, AlertTriangle,
  Download, RefreshCw, IndianRupee, Lock,
  ChevronDown, ChevronUp,
} from 'lucide-react'
import { Table, Select, Empty } from 'antd'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { getRequest } from '../../../Helpers'

const { Option } = Select

// ── Status config ─────────────────────────────────────────────
const STATUS_CFG = {
  ACTIVE:     { label: 'Active',      color: '#1d4ed8', bg: '#dbeafe' },
  OVERDUE:    { label: 'Overdue',     color: '#dc2626', bg: '#fee2e2' },
  FULLY_PAID: { label: 'Fully Paid',  color: '#16a34a', bg: '#dcfce7' },
  CANCELLED:  { label: 'Cancelled',   color: '#6b7280', bg: '#f3f4f6' },
}

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.ACTIVE
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 10px',
      borderRadius: 20, background: cfg.bg, color: cfg.color,
    }}>
      {cfg.label}
    </span>
  )
}

// ── KPI Card ──────────────────────────────────────────────────
const KPI = ({ label, value, sub, color = '#185FA5', bg = '#EAF2FF' }) => (
  <div style={{
    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
    padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12,
  }}>
    <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <IndianRupee size={18} color={color} />
    </div>
    <div>
      <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#111', letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
)

// ── Month breakdown row (expandable) ─────────────────────────
const MonthBreakdown = ({ monthlyDues = [] }) => (
  <div style={{ padding: '12px 24px', background: '#f8fafc' }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
      {monthlyDues.map((due) => {
        const isPaid    = due.status === 'PAID'
        const isOverdue = due.status === 'OVERDUE'
        const isPart    = due.status === 'PARTIALLY_PAID'
        const bg        = isPaid ? '#dcfce7' : isOverdue ? '#fee2e2' : isPart ? '#fff7ed' : '#f3f4f6'
        const color     = isPaid ? '#16a34a' : isOverdue ? '#dc2626' : isPart ? '#ea580c' : '#6b7280'
        return (
          <div key={due.billingMonth} style={{ background: bg, borderRadius: 8, padding: '8px 10px', border: `1px solid ${color}30` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color }}>{due.monthName || due.billingMonth}</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#111', marginTop: 2 }}>
              ₹{(due.amount || 0).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: 10, color, marginTop: 2, fontWeight: 600 }}>
              {isPaid ? '✅ Paid' : isOverdue ? '⚠️ Overdue' : isPart ? '⏳ Partial' : '🕐 Pending'}
            </div>
          </div>
        )
      })}
    </div>
  </div>
)

// ── Main Component ────────────────────────────────────────────
const SessionBillingReport = () => {
  const [data, setData]         = useState([])
  const [loading, setLoading]   = useState(false)
  const [summary, setSummary]   = useState(null)
  const [sessionYear, setSessionYear] = useState(() => {
    const now = new Date()
    const y   = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
    return `${y}-${String(y + 1).slice(-2)}`
  })
  const [expandedRows, setExpandedRows] = useState([])

  // Last 5 session years
  const sessionOptions = Array.from({ length: 5 }, (_, i) => {
    const y = new Date().getFullYear() - i
    return `${y}-${String(y + 1).slice(-2)}`
  })

  const fetchData = useCallback(() => {
    setLoading(true)
    getRequest(`session-billing?sessionYear=${sessionYear}&isPagination=false`)
      .then((res) => {
        setData(res?.data?.data?.bills || [])
        setSummary(res?.data?.data?.summary || null)
      })
      .catch(() => {
        toast.error('Failed to load session billing report')
        setData([])
      })
      .finally(() => setLoading(false))
  }, [sessionYear])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Computed summary from data when backend summary missing ──
  const totalBilled  = data.reduce((s, r) => s + (r.totalSessionAmount || 0), 0)
  const totalPaid    = data.reduce((s, r) => s + (r.totalPaid || 0), 0)
  const totalDue     = data.reduce((s, r) => s + (r.totalDue || 0), 0)
  const fullyPaid    = data.filter((r) => r.status === 'FULLY_PAID').length
  const overdueCount = data.filter((r) => r.status === 'OVERDUE').length
  const restricted   = data.filter((r) => r.restrictNewAdmissions).length

  // ── Export Excel ──────────────────────────────────────────────
  const exportExcel = () => {
    if (!data.length) { toast.error('No data to export'); return }
    const rows = data.map((r, i) => ({
      'Sr.':             i + 1,
      'School':          r.tenantDetails?.schoolName || '—',
      'Session':         r.sessionYear,
      'Students':        r.studentCount || 0,
      'Monthly Amt (₹)': r.monthlyAmount || 0,
      'Total Billed (₹)':r.totalSessionAmount || 0,
      'Total Paid (₹)':  r.totalPaid || 0,
      'Total Due (₹)':   r.totalDue || 0,
      'Status':          r.status || '—',
      'Admissions Blocked': r.restrictNewAdmissions ? 'Yes' : 'No',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Session Billing')
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    saveAs(new Blob([buf], { type: 'application/octet-stream' }),
      `session-billing-${sessionYear}.xlsx`)
    toast.success('Exported successfully')
  }

  // ── Toggle row expand ─────────────────────────────────────────
  const toggleRow = (id) =>
    setExpandedRows((prev) => prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id])

  // ── Table columns ─────────────────────────────────────────────
  const columns = [
    {
      title: 'Sr.',
      width: 55,
      align: 'center',
      render: (_, __, i) => i + 1,
    },
    {
      title: 'School',
      render: (_, row) => {
        const s = row.tenantDetails
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: '#EAF2FF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 11, color: '#185FA5', flexShrink: 0,
            }}>
              {s?.schoolName?.slice(0, 2).toUpperCase() || '--'}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#111' }}>{s?.schoolName || '—'}</div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>{s?.subdomain}</div>
            </div>
          </div>
        )
      },
    },
    {
      title: 'Students',
      dataIndex: 'studentCount',
      align: 'center',
      render: (v) => <span style={{ fontWeight: 600 }}>{v ?? '—'}</span>,
    },
    {
      title: 'Monthly',
      dataIndex: 'monthlyAmount',
      align: 'center',
      render: (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`,
    },
    {
      title: 'Total Billed',
      dataIndex: 'totalSessionAmount',
      align: 'center',
      render: (v) => <span style={{ fontWeight: 700 }}>₹{Number(v || 0).toLocaleString('en-IN')}</span>,
    },
    {
      title: 'Paid',
      dataIndex: 'totalPaid',
      align: 'center',
      render: (v) => <span style={{ color: '#16a34a', fontWeight: 700 }}>₹{Number(v || 0).toLocaleString('en-IN')}</span>,
    },
    {
      title: 'Due',
      dataIndex: 'totalDue',
      align: 'center',
      render: (v) => (
        <span style={{ color: v > 0 ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
          ₹{Number(v || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      title: 'Paid Months',
      align: 'center',
      render: (_, row) => {
        const paid = row.paidMonthsCount ?? 0
        const total = 12
        return (
          <span style={{ fontSize: 12 }}>
            <span style={{ fontWeight: 700, color: '#16a34a' }}>{paid}</span>
            <span style={{ color: '#9ca3af' }}> / {total}</span>
          </span>
        )
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      align: 'center',
      render: (status) => <StatusBadge status={status} />,
    },
    {
      title: 'Restrictions',
      align: 'center',
      render: (_, row) =>
        row.restrictNewAdmissions ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#dc2626', fontWeight: 600 }}>
            <Lock size={11} /> Blocked
          </span>
        ) : (
          <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>✓ Open</span>
        ),
    },
    {
      title: 'Months',
      align: 'center',
      width: 80,
      render: (_, row) => (
        <button
          onClick={() => toggleRow(row._id)}
          style={{
            background: 'none', border: '1px solid #e5e7eb', borderRadius: 6,
            padding: '3px 8px', cursor: 'pointer', fontSize: 11, color: '#6b7280',
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}
        >
          {expandedRows.includes(row._id) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          View
        </button>
      ),
    },
  ]

  return (
    <div className="min-h-screen">

      {/* Header */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm">
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
            <CalendarDays size={20} className="text-[#185FA5]" />
            Session Billing Report
          </h1>
          <p className="text-sm text-gray-500">Academic year wise subscription billing for all tenant</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Select value={sessionYear} onChange={setSessionYear} size="middle" style={{ width: 130 }}>
            {sessionOptions.map((s) => <Option key={s} value={s}>{s}</Option>)}
          </Select>
          <button
            onClick={fetchData}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#374151' }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
          <button
            onClick={exportExcel}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: 'none', background: '#0c3b73', color: '#fff', cursor: 'pointer', fontSize: 13 }}
          >
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
        <KPI label="Total Billed"    value={`₹${totalBilled.toLocaleString('en-IN')}`}  color="#185FA5" bg="#EAF2FF" />
        <KPI label="Total Collected" value={`₹${totalPaid.toLocaleString('en-IN')}`}    color="#16a34a" bg="#dcfce7" />
        <KPI label="Total Due"       value={`₹${totalDue.toLocaleString('en-IN')}`}     color="#dc2626" bg="#fee2e2" />
        <KPI label="Fully Paid"      value={`${fullyPaid} tenant`}                     color="#16a34a" bg="#dcfce7" sub={`of ${data.length} total`} />
        <KPI label="Overdue"         value={`${overdueCount} tenant`}                  color="#dc2626" bg="#fee2e2" sub="past due date" />
        <KPI label="Admissions Off"  value={`${restricted} tenant`}                    color="#ea580c" bg="#fff7ed" sub="blocked due to overdue" />
      </div>

      {/* Alert banner for overdue */}
      {overdueCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', marginBottom: 14, fontSize: 13, color: '#dc2626', fontWeight: 500 }}>
          <AlertTriangle size={15} />
          {overdueCount} school{overdueCount > 1 ? 's have' : ' has'} overdue session payments.
          {restricted > 0 && ` ${restricted} school${restricted > 1 ? 's have' : ' has'} admissions blocked.`}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto shadow-sm">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: false }}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: <Empty description="No session bills found for this year" /> }}
          rowClassName={(row) =>
            row.status === 'OVERDUE'    ? 'bg-red-50/30' :
            row.status === 'FULLY_PAID' ? 'bg-green-50/20' : ''
          }
          expandable={{
            expandedRowKeys: expandedRows,
            expandedRowRender: (row) => <MonthBreakdown monthlyDues={row.monthlyDues || []} />,
            showExpandColumn: false,
          }}
        />
      </div>

    </div>
  )
}

export default SessionBillingReport
