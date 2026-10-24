/* eslint-disable prettier/prettier */
import { useState, useEffect, useCallback } from 'react'
import {
  TrendingUp, IndianRupee, School, CheckCircle,
  Clock, AlertCircle, Download, RefreshCw, Percent,
} from 'lucide-react'
import { Select, Empty, Progress } from 'antd'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { getRequest } from '../../../Helpers'

const { Option } = Select

// ── Status breakdown bar ──────────────────────────────────────
const StatusBar = ({ paid, pending, overdue, total }) => {
  if (!total) return null
  const paidPct    = Math.round((paid    / total) * 100)
  const pendingPct = Math.round((pending / total) * 100)
  const overduePct = Math.round((overdue / total) * 100)
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>Payment Status Breakdown</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#185FA5' }}>{total} tenant</span>
      </div>
      {/* Segmented bar */}
      <div style={{ height: 12, borderRadius: 8, display: 'flex', overflow: 'hidden', background: '#f3f4f6' }}>
        {paidPct > 0    && <div style={{ width: `${paidPct}%`,    background: '#16a34a', transition: 'width 0.5s' }} />}
        {pendingPct > 0 && <div style={{ width: `${pendingPct}%`, background: '#f59e0b', transition: 'width 0.5s' }} />}
        {overduePct > 0 && <div style={{ width: `${overduePct}%`, background: '#dc2626', transition: 'width 0.5s' }} />}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
        {[
          { label: `Paid (${paid})`,    color: '#16a34a', pct: paidPct    },
          { label: `Pending (${pending})`, color: '#f59e0b', pct: pendingPct },
          { label: `Overdue (${overdue})`, color: '#dc2626', pct: overduePct },
        ].map(({ label, color, pct }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
            <span style={{ fontSize: 11, color: '#6b7280' }}>{label} ({pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── KPI Card ──────────────────────────────────────────────────
const KPI = ({ label, value, sub, Icon, color, bg }) => (
  <div style={{
    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
    padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  }}>
    <div style={{ width: 42, height: 42, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={18} color={color} />
    </div>
    <div>
      <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#111', letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
)

// ── School row card ───────────────────────────────────────────
const SchoolRow = ({ row, index }) => {
  const pct = row.totalSessionAmount > 0
    ? Math.round((row.totalPaid / row.totalSessionAmount) * 100)
    : 0
  const barColor = pct === 100 ? '#16a34a' : pct >= 60 ? '#f59e0b' : '#dc2626'

  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
      padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      {/* School name + status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, background: '#EAF2FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 12, color: '#185FA5', flexShrink: 0,
          }}>
            {row.tenantDetails?.schoolName?.slice(0, 2).toUpperCase() || '--'}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{row.tenantDetails?.schoolName || '—'}</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>{row.tenantDetails?.subdomain}</div>
          </div>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
          background: pct === 100 ? '#dcfce7' : pct >= 60 ? '#fffbeb' : '#fee2e2',
          color:      pct === 100 ? '#16a34a' : pct >= 60 ? '#92400e' : '#dc2626',
        }}>
          {pct}% paid
        </span>
      </div>

      {/* Amounts */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 10, flexWrap: 'wrap' }}>
        {[
          { label: 'Billed',  val: `₹${(row.totalSessionAmount || 0).toLocaleString('en-IN')}`, color: '#185FA5' },
          { label: 'Paid',    val: `₹${(row.totalPaid || 0).toLocaleString('en-IN')}`,          color: '#16a34a' },
          { label: 'Due',     val: `₹${(row.totalDue || 0).toLocaleString('en-IN')}`,           color: row.totalDue > 0 ? '#dc2626' : '#16a34a' },
          { label: 'Months',  val: `${row.paidMonthsCount ?? 0} / 12`,                           color: '#6b7280' },
        ].map(({ label, val, color }) => (
          <div key={label}>
            <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, borderRadius: 6, background: '#f3f4f6', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 6, transition: 'width 0.5s' }} />
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────
const CollectionSummaryReport = () => {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(false)
  const [sessionYear, setSessionYear] = useState(() => {
    const now = new Date()
    const y   = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
    return `${y}-${String(y + 1).slice(-2)}`
  })
  const [view, setView] = useState('cards') // 'cards' | 'table'

  const sessionOptions = Array.from({ length: 5 }, (_, i) => {
    const y = new Date().getFullYear() - i
    return `${y}-${String(y + 1).slice(-2)}`
  })

  const fetchData = useCallback(() => {
    setLoading(true)
    getRequest(`session-billing?sessionYear=${sessionYear}&isPagination=false`)
      .then((res) => setData(res?.data?.data?.bills || []))
      .catch(() => { toast.error('Failed to load report'); setData([]) })
      .finally(() => setLoading(false))
  }, [sessionYear])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Aggregations ──────────────────────────────────────────────
  const totalSchools   = data.length
  const totalBilled    = data.reduce((s, r) => s + (r.totalSessionAmount || 0), 0)
  const totalCollected = data.reduce((s, r) => s + (r.totalPaid || 0), 0)
  const totalDue       = data.reduce((s, r) => s + (r.totalDue || 0), 0)
  const fullyPaid      = data.filter((r) => r.status === 'FULLY_PAID').length
  const overdueSchools = data.filter((r) => r.status === 'OVERDUE').length
  const recoveryRate   = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0

  const paidStatuses    = data.filter((r) => r.status === 'FULLY_PAID').length
  const pendingStatuses = data.filter((r) => r.status === 'ACTIVE').length
  const overdueStatuses = data.filter((r) => r.status === 'OVERDUE').length

  // ── Export Excel ──────────────────────────────────────────────
  const exportExcel = () => {
    if (!data.length) { toast.error('No data'); return }
    const rows = data.map((r, i) => ({
      'Sr.':            i + 1,
      'School':         r.tenantDetails?.schoolName || '—',
      'Session':        r.sessionYear,
      'Students':       r.studentCount || 0,
      'Total Billed':   r.totalSessionAmount || 0,
      'Total Paid':     r.totalPaid || 0,
      'Total Due':      r.totalDue || 0,
      'Paid Months':    r.paidMonthsCount ?? 0,
      'Status':         r.status || '—',
      'Recovery %':     r.totalSessionAmount > 0
        ? `${Math.round((r.totalPaid / r.totalSessionAmount) * 100)}%` : '0%',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Collection Summary')
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    saveAs(new Blob([buf], { type: 'application/octet-stream' }),
      `collection-summary-${sessionYear}.xlsx`)
    toast.success('Exported successfully')
  }

  return (
    <div className="min-h-screen">

      {/* Header */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm">
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
            <TrendingUp size={20} className="text-[#185FA5]" />
            Collection Summary Report
          </h1>
          <p className="text-sm text-gray-500">Overall fee collection status across all tenant</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Select value={sessionYear} onChange={setSessionYear} size="middle" style={{ width: 130 }}>
            {sessionOptions.map((s) => <Option key={s} value={s}>{s}</Option>)}
          </Select>
          {/* View toggle */}
          <div style={{ display: 'flex', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            {[{ key: 'cards', label: 'Cards' }, { key: 'table', label: 'List' }].map(({ key, label }) => (
              <button key={key} onClick={() => setView(key)} style={{
                padding: '5px 14px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: view === key ? '#0c3b73' : '#fff',
                color:      view === key ? '#fff'    : '#6b7280',
              }}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 13 }}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={exportExcel} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: 'none', background: '#0c3b73', color: '#fff', cursor: 'pointer', fontSize: 13 }}>
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 16 }}>
        <KPI label="Total Schools"    value={totalSchools}                                Icon={School}       color="#185FA5" bg="#EAF2FF" />
        <KPI label="Total Billed"     value={`₹${totalBilled.toLocaleString('en-IN')}`}   Icon={IndianRupee}  color="#185FA5" bg="#EAF2FF" />
        <KPI label="Collected"        value={`₹${totalCollected.toLocaleString('en-IN')}`} Icon={CheckCircle} color="#16a34a" bg="#dcfce7" />
        <KPI label="Outstanding"      value={`₹${totalDue.toLocaleString('en-IN')}`}       Icon={AlertCircle} color="#dc2626" bg="#fee2e2" />
        <KPI label="Recovery Rate"    value={`${recoveryRate}%`}                           Icon={Percent}     color="#185FA5" bg="#EAF2FF" sub={`${fullyPaid} tenant fully paid`} />
        <KPI label="Overdue Schools"  value={overdueSchools}                               Icon={Clock}       color="#dc2626" bg="#fee2e2" sub="past due date" />
      </div>

      {/* Status breakdown bar */}
      {totalSchools > 0 && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 shadow-sm">
          <StatusBar
            paid={paidStatuses}
            pending={pendingStatuses}
            overdue={overdueStatuses}
            total={totalSchools}
          />
          {/* Recovery rate progress */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>Overall Recovery Rate</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: recoveryRate >= 80 ? '#16a34a' : recoveryRate >= 50 ? '#f59e0b' : '#dc2626' }}>{recoveryRate}%</span>
            </div>
            <div style={{ height: 10, borderRadius: 8, background: '#f3f4f6', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${recoveryRate}%`,
                background: recoveryRate >= 80 ? 'linear-gradient(90deg,#16a34a,#22c55e)' : recoveryRate >= 50 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#dc2626,#ef4444)',
                borderRadius: 8,
                transition: 'width 0.6s ease',
              }} />
            </div>
          </div>
        </div>
      )}

      {/* School cards / list */}
      {loading ? (
        <div className="bg-white rounded-lg border p-10 text-center text-gray-400">Loading...</div>
      ) : data.length === 0 ? (
        <div className="bg-white rounded-lg border p-10">
          <Empty description="No data found for this session year" />
        </div>
      ) : view === 'cards' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {data.map((row, i) => <SchoolRow key={row._id} row={row} index={i} />)}
        </div>
      ) : (
        // Simple list view
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto shadow-sm">
          <table className="w-full text-sm">
            <thead style={{ background: '#0c3b73' }}>
              <tr>
                {['Sr.', 'School', 'Students', 'Billed', 'Paid', 'Due', 'Months', 'Recovery', 'Status'].map((h) => (
                  <th key={h} style={{ padding: '10px 12px', color: '#fff', fontWeight: 600, fontSize: 12, textAlign: h === 'Sr.' ? 'center' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => {
                const pct = row.totalSessionAmount > 0
                  ? Math.round((row.totalPaid / row.totalSessionAmount) * 100) : 0
                return (
                  <tr key={row._id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#6b7280' }}>{i + 1}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 600, color: '#111' }}>{row.tenantDetails?.schoolName || '—'}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{row.tenantDetails?.subdomain}</div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>{row.studentCount ?? '—'}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 700 }}>₹{(row.totalSessionAmount || 0).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '10px 12px', color: '#16a34a', fontWeight: 700 }}>₹{(row.totalPaid || 0).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '10px 12px', color: row.totalDue > 0 ? '#dc2626' : '#16a34a', fontWeight: 700 }}>₹{(row.totalDue || 0).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>{row.paidMonthsCount ?? 0} / 12</td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#16a34a' : pct >= 60 ? '#f59e0b' : '#dc2626', borderRadius: 4 }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, minWidth: 30 }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                        background: row.status === 'FULLY_PAID' ? '#dcfce7' : row.status === 'OVERDUE' ? '#fee2e2' : '#dbeafe',
                        color:      row.status === 'FULLY_PAID' ? '#16a34a' : row.status === 'OVERDUE' ? '#dc2626' : '#1d4ed8',
                      }}>
                        {row.status === 'FULLY_PAID' ? 'Fully Paid' : row.status === 'OVERDUE' ? 'Overdue' : 'Active'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}

export default CollectionSummaryReport
