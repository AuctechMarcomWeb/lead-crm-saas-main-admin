import React, { useState, useEffect } from 'react'
import {
  CalendarDays,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  RefreshCw,
  Settings,
  Eye,
  IndianRupee,
  FileText,
} from 'lucide-react'
import { Modal, Table, Tag, Pagination, Empty, Tooltip } from 'antd'
import InvoiceModal from './InvoiceModal'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import { getRequest, postRequest, patchRequest } from '../../../Helpers'
import Loader from '../../../components/Loading/Loader'
import MonthlyBillingFilters from './MonthlyBillingFilters'
import GenerateBillModal from './GenerateBillModal'
import BillingConfigModal from './BillingConfigModal'
import MarkBillPaidModal from './MarkBillPaidModal'

/* ─── Status config ─────────────────────────────────────────────── */
const STATUS_CFG = {
  PAID:    { label: 'Paid',    color: 'green',  icon: CheckCircle },
  PENDING: { label: 'Pending', color: 'orange', icon: Clock },
  OVERDUE: { label: 'Overdue', color: 'red',    icon: AlertCircle },
}

/* ─── Month label helper ─────────────────────────────────────────── */
const monthLabel = (ym) => (ym ? dayjs(ym + '-01').format('MMM YYYY') : '—')

/* ════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════════ */
const MonthlyBilling = () => {
  /* ── data state ── */
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(12)

  /* ── tenant for filter dropdown ── */
  const [schools, setSchools] = useState([])

  /* ── modals ── */
  const [showGenerate, setShowGenerate] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [markPaidBill, setMarkPaidBill] = useState(null)
  const [detailBill, setDetailBill] = useState(null)
  const [invoiceBillId, setInvoiceBillId] = useState(null)

  /* ── filters ── */
  const [filters, setFilters] = useState({
    tenantId: null,
    billingMonth: null,
    status: null,
  })

  /* ── fetch tenant once ── */
  useEffect(() => {
    getRequest('tenant?isPagination=false')
      .then((r) => setSchools(r?.data?.data?.tenants || []))
      .catch(() => {})
  }, [])

  /* ── fetch bills ── */
  const fetchBills = () => {
    setLoading(true)
    const params = new URLSearchParams({ page, limit })
    if (filters.tenantId)    params.append('tenantId',    filters.tenantId)
    if (filters.billingMonth) params.append('billingMonth', filters.billingMonth)
    if (filters.status)      params.append('status',      filters.status)

    getRequest(`monthly-billing?${params.toString()}`)
      .then((r) => {
        setBills(r?.data?.data?.bills || [])
        setTotal(r?.data?.data?.total || 0)
      })
      .catch(() => toast.error('Failed to load monthly bills'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchBills()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, filters])

  /* ── mark overdue ── */
  const handleMarkOverdue = async () => {
    try {
      const r = await patchRequest({ url: 'monthly-billing/mark-overdue', cred: {} })
      const cnt = r?.data?.data?.updatedCount ?? 0
      toast.success(`${cnt} bill(s) marked overdue`)
      fetchBills()
    } catch {
      toast.error('Failed to mark overdue bills')
    }
  }

  /* ── columns ── */
  const columns = [
    {
      title: 'Sr.',
      key: 'sr',
      align: 'center',
      width: 52,
      render: (_, __, i) => (page - 1) * limit + i + 1,
    },
    {
      title: 'School',
      key: 'school',
      render: (_, row) => {
        const s = row.tenantDetails
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0c3b73]/10 flex items-center justify-center border border-gray-200 text-xs font-bold text-[#0c3b73] flex-shrink-0">
              {s?.schoolName?.slice(0, 2).toUpperCase() || '--'}
            </div>
            <div>
              <p className="font-medium text-gray-800 leading-tight text-sm">
                {s?.schoolName || '—'}
              </p>
              <p className="text-xs text-gray-400">{s?.subdomain || '—'}</p>
            </div>
          </div>
        )
      },
    },
    {
      title: 'Billing Month',
      dataIndex: 'billingMonth',
      align: 'center',
      render: (m) => (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0c3b73] bg-blue-50 px-2.5 py-1 rounded-full">
          <CalendarDays size={11} />
          {monthLabel(m)}
        </span>
      ),
    },
    {
      title: 'Students',
      dataIndex: 'studentCount',
      align: 'center',
      render: (v) => (
        <span className="text-gray-700 font-medium text-sm">{(v ?? 0).toLocaleString('en-IN')}</span>
      ),
    },
    {
      title: 'Base',
      dataIndex: 'baseAmount',
      align: 'center',
      render: (v) => (
        <span className="text-gray-600 text-sm">₹{(v ?? 0).toLocaleString('en-IN')}</span>
      ),
    },
    {
      title: 'Addon',
      key: 'addon',
      align: 'center',
      render: (_, row) => {
        const hasSlot = (row.addonSlots ?? 0) > 0
        const hasSubAddon = (row.subscriptionAddonAmount ?? 0) > 0
        const total = row.addonAmount ?? 0

        if (!hasSlot && !hasSubAddon) {
          return <span className="text-gray-300 text-sm">—</span>
        }

        const tipParts = []
        if (hasSlot)
          tipParts.push(`${row.addonSlots} slot(s) × ₹${row.configSnapshot?.addonSlotPrice ?? 100} = ₹${row.slotAddonAmount ?? 0}`)
        if (hasSubAddon)
          tipParts.push(`Subscription addons: ₹${row.subscriptionAddonAmount}`)

        return (
          <Tooltip title={tipParts.join(' | ')}>
            <span className="text-amber-600 text-sm font-medium cursor-help">
              +₹{total.toLocaleString('en-IN')}
            </span>
          </Tooltip>
        )
      },
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      align: 'center',
      render: (v) => (
        <span className="font-bold text-gray-800 text-sm">
          ₹{(v ?? 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      align: 'center',
      render: (d) => {
        if (!d) return <span className="text-gray-300 text-xs">—</span>
        const overdue = new Date(d) < new Date()
        return (
          <span className={`text-xs font-medium ${overdue ? 'text-red-500' : 'text-gray-600'}`}>
            {dayjs(d).format('DD MMM YY')}
          </span>
        )
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      align: 'center',
      render: (status) => {
        const cfg = STATUS_CFG[status]
        if (!cfg) return <span className="text-gray-400 text-xs">—</span>
        const Icon = cfg.icon
        return (
          <Tag
            color={cfg.color}
            className="flex items-center gap-1 w-fit mx-auto text-xs"
          >
            <Icon size={10} />
            {cfg.label}
          </Tag>
        )
      },
    },
    {
      title: 'Paid Date',
      dataIndex: 'paidAt',
      align: 'center',
      render: (d) =>
        d ? (
          <span className="text-xs text-green-600 font-medium">
            {dayjs(d).format('DD MMM YY')}
          </span>
        ) : (
          <span className="text-gray-300 text-xs">—</span>
        ),
    },
    {
      title: 'Ref',
      dataIndex: 'paymentRef',
      align: 'center',
      render: (r) =>
        r ? (
          <span className="text-xs text-gray-500 font-mono bg-gray-50 px-1.5 py-0.5 rounded">
            {r}
          </span>
        ) : (
          <span className="text-gray-300 text-xs">—</span>
        ),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      width: 120,
      render: (_, row) => (
        <div className="flex items-center justify-center gap-1.5">
          {/* Invoice */}
          <Tooltip title="View Invoice">
            <button
              onClick={() => setInvoiceBillId(row._id)}
              className="p-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-[#0c3b73] transition"
            >
              <FileText size={13} />
            </button>
          </Tooltip>
          {/* View detail */}
          <Tooltip title="View detail">
            <button
              onClick={() => setDetailBill(row)}
              className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-500 transition"
            >
              <Eye size={13} />
            </button>
          </Tooltip>
          {/* Mark paid */}
          {row.status !== 'PAID' && (
            <button
              onClick={() => setMarkPaidBill(row)}
              className="flex items-center gap-1 px-2 py-1.5 text-xs bg-[#0c3b73] hover:bg-[#0a2f5c] text-white rounded-lg transition"
            >
              <CheckCircle size={11} /> Paid
            </button>
          )}
          {row.status === 'PAID' && (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle size={11} /> Done
            </span>
          )}
        </div>
      ),
    },
  ]

  /* ── render ── */
  return (
    <div className="min-h-screen space-y-4">

      {/* ── Header ── */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
            <CalendarDays size={20} className="text-[#e24028]" />
            Monthly Billing
          </h1>
          <p className="text-sm text-gray-500">
            Generate, track, and manage per-month school bills
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip title="Mark overdue on pending bills past due date">
            <button
              onClick={handleMarkOverdue}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 transition"
            >
              <AlertCircle size={14} className="text-red-400" />
              Mark Overdue
            </button>
          </Tooltip>
          <button
            onClick={() => setShowConfig(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 transition"
          >
            <Settings size={14} />
            Pricing Config
          </button>
          <button
            onClick={() => setShowGenerate(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[#0c3b73] hover:bg-[#0a2f5c] text-white rounded-lg transition"
          >
            <Plus size={15} />
            Generate Bills
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <MonthlyBillingFilters
        schools={schools}
        filters={filters}
        onApply={(f) => { setFilters(f); setPage(1) }}
        onClear={() => { setFilters({ tenantId: null, billingMonth: null, status: null }); setPage(1) }}
      />

      {/* ── Month cards (visual row like image) ── */}
      <MonthSummaryStrip bills={bills} />

      {/* ── Table ── */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto shadow-sm">
        {loading ? (
          <div className="p-8 text-center">
            <Loader />
            <p className="text-sm text-gray-400 mt-2">Loading bills…</p>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={bills}
            rowKey="_id"
            pagination={false}
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: <Empty description="No bills found" /> }}
          />
        )}

        {!loading && total > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </p>
            <Pagination
              current={page}
              pageSize={limit}
              total={total}
              pageSizeOptions={['12', '24', '48']}
              showSizeChanger
              onChange={(p) => setPage(p)}
              onShowSizeChange={(_, s) => { setLimit(s); setPage(1) }}
              size="small"
            />
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <GenerateBillModal
        open={showGenerate}
        schools={schools}
        onClose={() => setShowGenerate(false)}
        onSuccess={fetchBills}
      />

      <BillingConfigModal
        open={showConfig}
        onClose={() => setShowConfig(false)}
      />

      <MarkBillPaidModal
        open={!!markPaidBill}
        bill={markPaidBill}
        onClose={() => setMarkPaidBill(null)}
        onSuccess={fetchBills}
      />

      {/* Bill Detail Modal */}
      <BillDetailModal
        open={!!detailBill}
        bill={detailBill}
        onClose={() => setDetailBill(null)}
      />

      {/* Invoice Modal */}
      <InvoiceModal
        open={!!invoiceBillId}
        billId={invoiceBillId}
        onClose={() => setInvoiceBillId(null)}
      />
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   MONTH SUMMARY STRIP  (image jaisi UI — months row mein)
   Har unique billingMonth ka ek card — total, paid, pending, overdue
════════════════════════════════════════════════════════════════════ */
const MonthSummaryStrip = ({ bills }) => {
  // Group bills by billingMonth
  const grouped = bills.reduce((acc, b) => {
    const m = b.billingMonth
    if (!acc[m]) acc[m] = { total: 0, paid: 0, pending: 0, overdue: 0, amount: 0 }
    acc[m].total++
    acc[m][b.status?.toLowerCase() || 'pending']++
    acc[m].amount += b.totalAmount || 0
    return acc
  }, {})

  const months = Object.keys(grouped).sort().reverse().slice(0, 6)

  if (months.length === 0) return null

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
      {months.map((ym) => {
        const g = grouped[ym]
        return (
          <div
            key={ym}
            className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm hover:shadow-md transition"
          >
            {/* Month label */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#0c3b73] uppercase tracking-wide">
                {monthLabel(ym)}
              </span>
              <CalendarDays size={13} className="text-gray-300" />
            </div>

            {/* Amount */}
            <div className="flex items-center gap-1 mb-2.5">
              <IndianRupee size={13} className="text-gray-400" />
              <span className="text-base font-bold text-gray-800">
                {(g.amount / 1000).toFixed(1)}k
              </span>
            </div>

            {/* 2 status boxes — like client sketch */}
            <div className="grid grid-cols-2 gap-1.5">
              <div className="flex flex-col items-center bg-green-50 rounded-lg py-1.5">
                <CheckCircle size={12} className="text-green-500 mb-0.5" />
                <span className="text-xs font-bold text-green-700">{g.paid}</span>
                <span className="text-[9px] text-green-500 leading-none">Paid</span>
              </div>
              <div
                className={`flex flex-col items-center rounded-lg py-1.5 ${
                  g.overdue > 0 ? 'bg-red-50' : 'bg-orange-50'
                }`}
              >
                {g.overdue > 0 ? (
                  <AlertCircle size={12} className="text-red-500 mb-0.5" />
                ) : (
                  <Clock size={12} className="text-orange-400 mb-0.5" />
                )}
                <span className={`text-xs font-bold ${g.overdue > 0 ? 'text-red-700' : 'text-orange-700'}`}>
                  {g.overdue > 0 ? g.overdue : g.pending}
                </span>
                <span className={`text-[9px] leading-none ${g.overdue > 0 ? 'text-red-400' : 'text-orange-400'}`}>
                  {g.overdue > 0 ? 'Overdue' : 'Pending'}
                </span>
              </div>
            </div>

            {/* Total tenant */}
            <div className="mt-2 text-center text-[10px] text-gray-400">
              {g.total} school{g.total !== 1 ? 's' : ''}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   BILL DETAIL MODAL
════════════════════════════════════════════════════════════════════ */
const BillDetailModal = ({ open, bill, onClose }) => {
  if (!bill) return null
  const cfg = bill.configSnapshot || {}
  const school = bill.tenantDetails
  const subAddons = bill.subscriptionAddonsSnapshot || []
  const hasSlot     = (bill.addonSlots ?? 0) > 0
  const hasSubAddon = (bill.subscriptionAddonAmount ?? 0) > 0

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={460}
      title={
        <div className="flex items-center gap-2 text-[#0c3b73]">
          <CalendarDays size={15} />
          Bill Detail — {monthLabel(bill.billingMonth)}
        </div>
      }
    >
      <div className="space-y-3 mt-3 text-sm">

        {/* School */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
          <p className="font-semibold text-gray-800">{school?.schoolName || '—'}</p>
          <p className="text-xs text-gray-400 mt-0.5">{school?.subdomain || '—'}</p>
        </div>

        {/* Amount Breakdown */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Amount Breakdown</p>

          {/* Base */}
          <Row
            label={`Base charge (≤${cfg.baseStudentLimit ?? 350} students)`}
            value={`₹${(bill.baseAmount || 0).toLocaleString('en-IN')}`}
          />

          {/* Student count */}
          <Row label="Actual student count" value={(bill.studentCount ?? 0).toLocaleString('en-IN')} />

          {/* Extra student slots */}
          {hasSlot ? (
            <Row
              label={`Extra student slots (${bill.addonSlots} slot × ₹${cfg.addonSlotPrice ?? 100})`}
              value={`+₹${(bill.slotAddonAmount ?? 0).toLocaleString('en-IN')}`}
              highlight
            />
          ) : (
            <Row label="Extra student slots" value="—" />
          )}

          {/* Subscription addons */}
          {hasSubAddon ? (
            <>
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5 mt-1 space-y-1.5">
                <p className="text-xs font-semibold text-amber-700 mb-1">Subscription Add-ons</p>
                {subAddons.map((a, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div>
                      <span className="text-xs text-gray-700 font-medium">{a.name}</span>
                      <span className="text-[10px] text-gray-400 ml-1.5">
                        {a.quantity > 1 ? `×${a.quantity} ` : ''}
                        (+{((a.studentLimit ?? 0)).toLocaleString('en-IN')} students)
                        {a.billingCycle === 'Yearly' ? ' · yearly÷12' : ''}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-amber-700">
                      +₹{(a.monthlyPrice ?? 0).toLocaleString('en-IN')}/mo
                    </span>
                  </div>
                ))}
                <div className="border-t border-amber-200 pt-1 flex justify-between">
                  <span className="text-xs text-amber-700 font-semibold">Addon subtotal</span>
                  <span className="text-xs font-bold text-amber-700">
                    +₹{(bill.subscriptionAddonAmount ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <Row label="Subscription add-ons" value="—" />
          )}

          {/* Total */}
          <div className="border-t-2 border-gray-200 pt-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-gray-800">Total Amount</span>
              <span className="text-base font-bold text-[#0c3b73]">
                ₹{(bill.totalAmount || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5 text-right">
              ₹{(bill.baseAmount || 0).toLocaleString('en-IN')} base
              {hasSlot ? ` + ₹${(bill.slotAddonAmount ?? 0).toLocaleString('en-IN')} slots` : ''}
              {hasSubAddon ? ` + ₹${(bill.subscriptionAddonAmount ?? 0).toLocaleString('en-IN')} addons` : ''}
            </p>
          </div>
        </div>

        {/* Dates */}
        <div className="space-y-1.5 border-t border-gray-100 pt-2">
          <Row label="Period" value={`${dayjs(bill.periodStart).format('DD MMM')} – ${dayjs(bill.periodEnd).format('DD MMM YYYY')}`} />
          <Row label="Due Date" value={bill.dueDate ? dayjs(bill.dueDate).format('DD MMM YYYY') : '—'} />
          <Row label="Generated" value={dayjs(bill.generatedAt || bill.createdAt).format('DD MMM YYYY')} />
        </div>

        {/* Payment info */}
        {bill.status === 'PAID' && (
          <div className="space-y-1.5 border-t border-gray-100 pt-2">
            <Row label="Paid On"      value={bill.paidAt     ? dayjs(bill.paidAt).format('DD MMM YYYY') : '—'} />
            <Row label="Payment Ref"  value={bill.paymentRef || '—'} />
            <Row label="Paid By"      value={bill.paidBy     || '—'} />
          </div>
        )}

        {bill.remarks && (
          <p className="text-xs text-gray-500 bg-yellow-50 border border-yellow-100 rounded px-2 py-1.5">
            Remarks: {bill.remarks}
          </p>
        )}

        {/* Config snapshot note */}
        <p className="text-[10px] text-gray-400 italic border-t border-gray-100 pt-2">
          Pricing config at time of bill: base ≤{cfg.baseStudentLimit} → ₹{cfg.basePrice},
          extra per {cfg.addonSlotSize} students → ₹{cfg.addonSlotPrice}
        </p>
      </div>
    </Modal>
  )
}

const Row = ({ label, value, bold, highlight }) => (
  <div className="flex justify-between items-center">
    <span className="text-gray-500 text-xs">{label}</span>
    <span
      className={`text-xs ${bold ? 'font-bold text-gray-800' : ''} ${highlight ? 'text-amber-600 font-semibold' : 'text-gray-700'}`}
    >
      {value}
    </span>
  </div>
)

export default MonthlyBilling
