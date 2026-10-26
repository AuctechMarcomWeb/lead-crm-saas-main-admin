/* eslint-disable prettier/prettier */
import { useState, useEffect, useCallback } from 'react'
import {
  PieChart, Users, Zap, CreditCard, AlertTriangle,
  Download, RefreshCw, TrendingUp, Clock,
} from 'lucide-react'
import { Table, Tag, Empty, Tooltip } from 'antd'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { getRequest } from '../../../Helpers'

// ── Plan status config ────────────────────────────────────────
const PLAN_STATUS = {
  ACTIVE:    { label: 'Active',    color: '#16a34a', bg: '#dcfce7' },
  TRIAL:     { label: 'Trial',     color: '#2563eb', bg: '#dbeafe' },
  EXPIRED:   { label: 'Expired',   color: '#dc2626', bg: '#fee2e2' },
  CANCELLED: { label: 'Cancelled', color: '#6b7280', bg: '#f3f4f6' },
  PENDING:   { label: 'Pending',   color: '#ca8a04', bg: '#fef9c3' },
  NONE:      { label: 'No Plan',   color: '#6b7280', bg: '#f3f4f6' },
}

const StatusBadge = ({ status }) => {
  const cfg = PLAN_STATUS[status] || PLAN_STATUS.NONE
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  )
}

// ── Distribution Tile ─────────────────────────────────────────
const DistTile = ({ label, count, total, color, bg, Icon }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#111', letterSpacing: '-0.02em' }}>{count}</div>
        </div>
      </div>
      {/* Mini bar */}
      <div style={{ height: 5, borderRadius: 4, background: '#f3f4f6', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.5s' }} />
      </div>
      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{pct}% of all tenant</div>
    </div>
  )
}

// ── Usage bar ─────────────────────────────────────────────────
const UsageBar = ({ used, total }) => {
  if (!total) return <span style={{ fontSize: 11, color: '#9ca3af' }}>Unlimited</span>
  const pct = Math.min(Math.round((used / total) * 100), 100)
  const color = pct >= 90 ? '#dc2626' : pct >= 70 ? '#f59e0b' : '#16a34a'
  return (
    <Tooltip title={`${used} / ${total} students (${pct}%)`}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span style={{ fontSize: 10, color: '#9ca3af' }}>{used} / {total}</span>
          <span style={{ fontSize: 10, fontWeight: 700, color }}>{pct}%</span>
        </div>
        <div style={{ height: 5, borderRadius: 4, background: '#f3f4f6', overflow: 'hidden', width: 100 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4 }} />
        </div>
      </div>
    </Tooltip>
  )
}

// ── Main Component ────────────────────────────────────────────
const PlanDistributionReport = () => {
  const [data, setData]         = useState([])
  const [loading, setLoading]   = useState(false)
  const [filter, setFilter]     = useState('ALL') // ALL | ACTIVE | TRIAL | EXPIRED | PENDING

  const fetchData = useCallback(() => {
    setLoading(true)
    // Fetch all tenants with their subscription status
    getRequest('subscription?isPagination=false')
      .then((res) => setData(res?.data?.data?.subscriptions || []))
      .catch(() => { toast.error('Failed to load data'); setData([]) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Distribution counts ───────────────────────────────────────
  const total     = data.length
  const active    = data.filter((r) => r.status === 'ACTIVE').length
  const trial     = data.filter((r) => r.status === 'TRIAL').length
  const expired   = data.filter((r) => r.status === 'EXPIRED').length
  const pending   = data.filter((r) => r.status === 'PENDING').length
  const cancelled = data.filter((r) => r.status === 'CANCELLED').length

  // Expiring in ≤ 30 days
  const expiringSoon = data.filter((r) => {
    const endDate = r.currentPlan?.endDate
    if (!endDate || r.status !== 'ACTIVE') return false
    const daysLeft = dayjs(endDate).diff(dayjs(), 'day')
    return daysLeft >= 0 && daysLeft <= 30
  }).length

  // ── Filtered rows ─────────────────────────────────────────────
  const filteredData = filter === 'ALL'
    ? data
    : data.filter((r) => r.status === filter)

  // ── Export ────────────────────────────────────────────────────
  const exportExcel = () => {
    if (!data.length) { toast.error('No data to export'); return }
    const rows = data.map((r, i) => ({
      'Sr.':           i + 1,
      'School':        r.tenantDetails?.schoolName || '—',
      'Plan Name':     r.currentPlan?.name || '—',
      'Billing Cycle': r.currentPlan?.billingCycle || '—',
      'Status':        r.status || '—',
      'Trial':         r.isTrial ? 'Yes' : 'No',
      'Start Date':    r.currentPlan?.startDate ? dayjs(r.currentPlan.startDate).format('DD MMM YYYY') : '—',
      'End Date':      r.currentPlan?.endDate   ? dayjs(r.currentPlan.endDate).format('DD MMM YYYY')   : '—',
      'Days Left':     r.currentPlan?.endDate   ? Math.max(0, dayjs(r.currentPlan.endDate).diff(dayjs(), 'day')) : '—',
      'Lead Limit':    r.totalStudentLimit || 0,
      'Used Leads':    r.usedStudents || 0,
      'Usage %':       r.totalStudentLimit > 0 ? `${Math.round((r.usedStudents / r.totalStudentLimit) * 100)}%` : 'Unlimited',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Plan Distribution')
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    saveAs(new Blob([buf], { type: 'application/octet-stream' }),
      `plan-distribution-${dayjs().format('YYYY-MM-DD')}.xlsx`)
    toast.success('Exported successfully')
  }

  // ── Table columns ─────────────────────────────────────────────
  const columns = [
    {
      title: 'Sr.',
      width: 55,
      align: 'center',
      render: (_, __, i) => i + 1,
    },
    {
      title: 'Agency',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#111' }}>{row.tenantDetails?.schoolName || '—'}</div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>{row.tenantDetails?.subdomain}</div>
        </div>
      ),
    },
    {
      title: 'Plan',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 12, color: '#111' }}>{row.currentPlan?.name || '—'}</div>
          {row.currentPlan?.billingCycle && (
            <div style={{ fontSize: 11, color: '#9ca3af' }}>{row.currentPlan.billingCycle}</div>
          )}
          {row.isTrial && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10, background: '#dbeafe', color: '#1d4ed8', marginTop: 2, display: 'inline-block' }}>TRIAL</span>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      align: 'center',
      render: (status) => <StatusBadge status={status} />,
    },
    {
      title: 'Valid Till',
      align: 'center',
      render: (_, row) => {
        const endDate = row.currentPlan?.endDate
        if (!endDate) return <span style={{ color: '#9ca3af', fontSize: 12 }}>—</span>
        const daysLeft = dayjs(endDate).diff(dayjs(), 'day')
        const isExpired = daysLeft < 0
        const soon      = daysLeft >= 0 && daysLeft <= 30
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: isExpired ? '#dc2626' : '#111' }}>
              {dayjs(endDate).format('DD MMM YYYY')}
            </div>
            {!isExpired && (
              <div style={{ fontSize: 11, color: soon ? '#dc2626' : '#9ca3af', fontWeight: soon ? 700 : 400 }}>
                {daysLeft} days left{soon ? ' ⚠️' : ''}
              </div>
            )}
            {isExpired && (
              <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 700 }}>Expired</div>
            )}
          </div>
        )
      },
    },
    {
      title: 'Lead Usage',
      align: 'center',
      render: (_, row) => (
        <UsageBar used={row.usedStudents || 0} total={row.totalStudentLimit || 0} />
      ),
    },
    {
      title: 'Payment',
      align: 'center',
      render: (_, row) => {
        const status = row.paidStatus
        const colors = { PAID: '#16a34a', UNPAID: '#dc2626', PENDING: '#f59e0b', OVERDUE: '#dc2626' }
        return (
          <span style={{ fontSize: 11, fontWeight: 700, color: colors[status] || '#6b7280' }}>
            {status || '—'}
          </span>
        )
      },
    },
  ]

  // ── Filter tabs ───────────────────────────────────────────────
  const tabs = [
    { key: 'ALL',      label: `All (${total})` },
    { key: 'ACTIVE',   label: `Active (${active})` },
    { key: 'TRIAL',    label: `Trial (${trial})` },
    { key: 'EXPIRED',  label: `Expired (${expired})` },
    { key: 'PENDING',  label: `Pending (${pending})` },
  ]

  return (
    <div className="min-h-screen">

      {/* Header */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm">
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
            <PieChart size={20} className="text-[#185FA5]" />
            Plan Distribution Report
          </h1>
          <p className="text-sm text-gray-500">Which tenant are on which plans, with lead usage & expiry</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 13 }}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={exportExcel} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: 'none', background: '#0c3b73', color: '#fff', cursor: 'pointer', fontSize: 13 }}>
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      {/* Distribution tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
        <DistTile label="Total Agencies" count={total}     total={total} color="#185FA5" bg="#EAF2FF" Icon={Users} />
        <DistTile label="Active Plans"   count={active}    total={total} color="#16a34a" bg="#dcfce7" Icon={CreditCard} />
        <DistTile label="On Trial"       count={trial}     total={total} color="#2563eb" bg="#dbeafe" Icon={Zap} />
        <DistTile label="Expired"        count={expired}   total={total} color="#dc2626" bg="#fee2e2" Icon={AlertTriangle} />
        <DistTile label="Pending"        count={pending}   total={total} color="#ca8a04" bg="#fef9c3" Icon={Clock} />
        <DistTile label="Expiring Soon"  count={expiringSoon} total={total} color="#ea580c" bg="#fff7ed" Icon={TrendingUp} />
      </div>

      {/* Expiry warning */}
      {expiringSoon > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 10, background: '#fff7ed', border: '1px solid #fed7aa', marginBottom: 14, fontSize: 13, color: '#ea580c', fontWeight: 500 }}>
          <AlertTriangle size={15} />
          {expiringSoon} agency{expiringSoon > 1 ? 'ies' : ''} — subscription expiring within 30 days. Consider renewing.
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #e5e7eb', marginBottom: 0, background: '#fff', borderRadius: '12px 12px 0 0', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
        {tabs.map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)} style={{
            flex: 1, padding: '10px 8px', border: 'none',
            borderBottom: filter === key ? '2px solid #0c3b73' : '2px solid transparent',
            background: filter === key ? '#f0f4ff' : '#fff',
            color: filter === key ? '#0c3b73' : '#6b7280',
            fontSize: 12, fontWeight: filter === key ? 700 : 500,
            cursor: 'pointer', transition: 'all 0.15s',
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-t-0 border-gray-200 rounded-b-lg overflow-x-auto shadow-sm">
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 15, showSizeChanger: false }}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: <Empty description="No tenant found" /> }}
          rowClassName={(row) =>
            row.status === 'EXPIRED'  ? 'bg-red-50/30' :
            row.isTrial               ? 'bg-blue-50/20' : ''
          }
        />
      </div>

    </div>
  )
}

export default PlanDistributionReport
