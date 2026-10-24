/* eslint-disable prettier/prettier */
import React, { useState, useEffect } from 'react'
import {
  CalendarDays, CheckCircle, Clock, AlertCircle, Plus, RefreshCw,
  IndianRupee, BookOpen, TrendingUp, Users, ShieldAlert, Eye,
  Receipt, Loader2, Search, X, ChevronDown,
} from 'lucide-react'
import { Modal, Table, Tag, Pagination, Empty, Tooltip, Select } from 'antd'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import { getRequest, postRequest, patchRequest } from '../../../Helpers'

/* ─── Status config ─────────────────────────────────────────────── */
const STATUS_CFG = {
  ACTIVE:     { label: 'Active',     color: 'blue',   icon: Clock },
  FULLY_PAID: { label: 'Fully Paid', color: 'green',  icon: CheckCircle },
  OVERDUE:    { label: 'Overdue',    color: 'red',    icon: AlertCircle },
  CANCELLED:  { label: 'Cancelled',  color: 'default', icon: X },
}

const MONTH_STATUS_CFG = {
  PENDING:        { label: 'Pending',      color: 'orange', bg: 'bg-orange-50',  text: 'text-orange-700', border: 'border-orange-200', icon: Clock },
  PARTIALLY_PAID: { label: 'Partial',      color: 'blue',   bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200',   icon: IndianRupee },
  PAID:           { label: 'Paid',         color: 'green',  bg: 'bg-green-50',   text: 'text-green-700',  border: 'border-green-200',  icon: CheckCircle },
  OVERDUE:        { label: 'Overdue',      color: 'red',    bg: 'bg-red-50',     text: 'text-red-700',    border: 'border-red-200',    icon: AlertCircle },
}

/* ─── Current session year helper ───────────────────────────────── */
const currentSession = () => {
  const now = new Date()
  const y = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
  return `${y}-${String(y + 1).slice(-2)}`
}

const generateSessionOptions = () => {
  const cur = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => {
    const y = cur - 1 + i
    return { value: `${y}-${String(y + 1).slice(-2)}`, label: `Session ${y}-${String(y + 1).slice(-2)}` }
  })
}

/* ════════════════════════════════════════════════════════════════════
   SUMMARY CARDS (top dashboard row)
════════════════════════════════════════════════════════════════════ */
const SummaryCard = ({ icon: Icon, label, value, sub, color, bgColor }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-start gap-3">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bgColor}`}>
      <Icon size={18} className={color} />
    </div>
    <div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-lg font-bold text-gray-800 leading-tight">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
)

/* ════════════════════════════════════════════════════════════════════
   GENERATE SESSION BILL MODAL
════════════════════════════════════════════════════════════════════ */
const GenerateSessionModal = ({ open, schools, onClose, onSuccess }) => {
  const [tenantId, setTenantId] = useState('')
  const [sessionYear, setSessionYear] = useState(currentSession())
  const [studentCount, setStudentCount] = useState('')
  const [overdueMonths, setOverdueMonths] = useState(2)
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (!open) { setTenantId(''); setStudentCount('') } }, [open])

  const handleSubmit = async () => {
    if (!tenantId) { toast.error('Select a school'); return }
    setLoading(true)
    try {
      await postRequest({
        url: 'session-billing/generate',
        cred: {
          tenantId, sessionYear,
          ...(studentCount ? { studentCount: Number(studentCount) } : {}),
          overdueRestrictionMonths: Number(overdueMonths),
        },
      })
      toast.success(`Session bill generated for ${sessionYear}`)
      onSuccess(); onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to generate session bill')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onCancel={onClose} footer={null} width={460} destroyOnClose
      title={<div className="flex items-center gap-2 text-[#0c3b73]"><BookOpen size={15} />Generate Session Bill</div>}>
      <div className="space-y-4 mt-3">
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">School <span className="text-red-500">*</span></label>
          <Select showSearch optionFilterProp="label" placeholder="Select school…" className="w-full" value={tenantId || undefined}
            onChange={setTenantId} options={schools.map(s => ({ value: s._id, label: s.schoolName }))} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Session Year</label>
          <Select className="w-full" value={sessionYear} onChange={setSessionYear} options={generateSessionOptions()} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Student Count <span className="text-gray-400">(optional)</span></label>
            <input type="number" value={studentCount} onChange={e => setStudentCount(e.target.value)}
              placeholder="Auto from subscription" className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0c3b73]" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Overdue Threshold (months)</label>
            <input type="number" min={1} max={12} value={overdueMonths} onChange={e => setOverdueMonths(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0c3b73]" />
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
          12 monthly dues (April → March) will be auto-generated at <strong>₹1200/month</strong> base rate.
        </div>
        <div className="flex justify-end gap-2 pt-1 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="px-5 py-2 text-sm bg-[#0c3b73] hover:bg-[#0a2f5c] text-white rounded-lg transition disabled:opacity-60 flex items-center gap-2">
            {loading && <Loader2 size={13} className="animate-spin" />}
            {loading ? 'Generating…' : 'Generate Bill'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ════════════════════════════════════════════════════════════════════
   RECORD PAYMENT MODAL
════════════════════════════════════════════════════════════════════ */
const PaymentModal = ({ open, bill, onClose, onSuccess }) => {
  const [totalPaidAmount, setTotalPaidAmount] = useState('')
  const [paymentMode, setPaymentMode] = useState('CASH')
  const [paymentRef, setPaymentRef] = useState('')
  const [paidBy, setPaidBy] = useState('')
  const [remarks, setRemarks] = useState('')
  const [selectedMonths, setSelectedMonths] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (!open) { setTotalPaidAmount(''); setPaymentRef(''); setSelectedMonths([]); setRemarks('') } }, [open])

  if (!bill) return null

  const unpaidMonths = (bill.monthlyDues || []).filter(d => d.status !== 'PAID')

  const handleSubmit = async () => {
    if (!totalPaidAmount || Number(totalPaidAmount) <= 0) { toast.error('Enter payment amount'); return }
    setLoading(true)
    try {
      await postRequest({
        url: `session-billing/${bill.tenantId?._id || bill.tenantId}/pay`,
        cred: {
          sessionYear: bill.sessionYear,
          totalPaidAmount: Number(totalPaidAmount),
          paymentMode, paymentRef, paidBy, remarks,
          ...(selectedMonths.length > 0 ? { months: selectedMonths } : {}),
        },
      })
      toast.success('Payment recorded successfully')
      onSuccess(); onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Payment failed')
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onCancel={onClose} footer={null} width={520} destroyOnClose
      title={<div className="flex items-center gap-2 text-green-700"><Receipt size={15} />Record Payment</div>}>
      <div className="space-y-3 mt-3">
        {/* School + Session info */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-400">School</p>
            <p className="font-semibold text-gray-800 text-sm">{bill.tenantDetails?.schoolName || '—'}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Session · Due</p>
            <p className="font-bold text-[#0c3b73] text-sm">{bill.sessionYear}</p>
            <p className="text-xs text-red-500">₹{(bill.totalDue || 0).toLocaleString('en-IN')} pending</p>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Amount Paid <span className="text-red-500">*</span></label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
            <input type="number" value={totalPaidAmount} onChange={e => setTotalPaidAmount(e.target.value)} placeholder="e.g. 3600"
              className="w-full h-9 pl-7 pr-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0c3b73]" />
          </div>
          <p className="text-xs text-gray-400 mt-1">Quick: &nbsp;
            {[1200, 2400, 3600, bill.totalDue].filter(Boolean).map(v => (
              <button key={v} onClick={() => setTotalPaidAmount(String(v))}
                className="mr-1 px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100 transition">
                ₹{v?.toLocaleString('en-IN')}
              </button>
            ))}
          </p>
        </div>

        {/* Months to apply (optional) */}
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">
            Apply to Months <span className="text-gray-400 font-normal">(optional — auto-distributes oldest-first if blank)</span>
          </label>
          <Select mode="multiple" className="w-full" placeholder="Select months (optional)…"
            value={selectedMonths} onChange={setSelectedMonths}
            options={unpaidMonths.map(d => ({
              value: d.billingMonth,
              label: `${d.monthName} — ₹${d.balanceAmount?.toLocaleString('en-IN')} pending`,
            }))} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Payment Mode</label>
            <Select className="w-full" value={paymentMode} onChange={setPaymentMode}
              options={['CASH','CHEQUE','NEFT','RTGS','UPI','ONLINE','OTHER'].map(m => ({ value: m, label: m }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Payment Ref</label>
            <input type="text" value={paymentRef} onChange={e => setPaymentRef(e.target.value)} placeholder="UTR / Cheque / TXN ID"
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0c3b73]" />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Remarks</label>
          <input type="text" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Optional notes…"
            className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0c3b73]" />
        </div>

        <div className="flex justify-end gap-2 pt-1 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="px-5 py-2 text-sm bg-[#0c3b73] hover:bg-[#0a2f5c] text-white rounded-lg transition disabled:opacity-60 flex items-center gap-2">
            {loading && <Loader2 size={13} className="animate-spin" />}
            {loading ? 'Saving…' : 'Record Payment'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ════════════════════════════════════════════════════════════════════
   SESSION DETAIL MODAL (month-wise grid + receipts)
════════════════════════════════════════════════════════════════════ */
const SessionDetailModal = ({ open, tenantId, sessionYear, onClose, onPaySuccess }) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [payOpen, setPayOpen] = useState(false)

  const fetchDetail = async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const res = await getRequest(`session-billing/${tenantId}/detail?sessionYear=${sessionYear}`)
      setData(res?.data?.data || null)
    } catch { toast.error('Failed to load session detail') }
    finally { setLoading(false) }
  }

  useEffect(() => { if (open && tenantId) fetchDetail() }, [open, tenantId, sessionYear])

  if (!open) return null

  return (
    <>
      <Modal open={open} onCancel={onClose} footer={null} width={780} destroyOnClose
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#0c3b73]">
              <CalendarDays size={15} />
              Session Billing — {data?.tenantDetails?.schoolName || '…'} · {sessionYear}
            </div>
            {data && data.status !== 'FULLY_PAID' && (
              <button onClick={() => setPayOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#0c3b73] hover:bg-[#0a2f5c] text-white rounded-lg transition mr-8">
                <Receipt size={12} /> Record Payment
              </button>
            )}
          </div>
        }>
        {loading ? (
          <div className="p-12 flex items-center justify-center gap-2 text-gray-400">
            <Loader2 size={18} className="animate-spin" /> Loading detail…
          </div>
        ) : !data ? (
          <div className="p-8 text-center text-gray-400 text-sm">No data found</div>
        ) : (
          <div className="mt-2 space-y-5">
            {/* Summary row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Session', value: `₹${data.totalSessionAmount?.toLocaleString('en-IN')}`, color: 'text-[#0c3b73]', bg: 'bg-blue-50' },
                { label: 'Paid', value: `₹${data.totalPaid?.toLocaleString('en-IN')}`, color: 'text-green-700', bg: 'bg-green-50' },
                { label: 'Due', value: `₹${data.totalDue?.toLocaleString('en-IN')}`, color: 'text-red-600', bg: 'bg-red-50' },
                { label: 'Monthly Rate', value: `₹${data.monthlyAmount?.toLocaleString('en-IN')}`, color: 'text-gray-700', bg: 'bg-gray-50' },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className={`text-base font-bold ${color} mt-0.5`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Restrictions banner — sirf tab dikhao jab FULLY_PAID nahi hai AND restriction flag true ho */}
            {data.status !== 'FULLY_PAID' && (data.restrictNewAdmissions || data.restrictStudentRegistration) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <ShieldAlert size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-red-700">
                  <p className="font-semibold">Restrictions Active</p>
                  <p className="mt-0.5">
                    {data.restrictNewAdmissions && 'New admissions blocked. '}
                    {data.restrictStudentRegistration && 'Student registration blocked.'}
                    {' '}Clear overdue payments to lift restrictions.
                  </p>
                </div>
              </div>
            )}
            {/* Fully paid → green success banner */}
            {data.status === 'FULLY_PAID' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                <ShieldAlert size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-green-700">
                  <p className="font-semibold">Session Fully Paid ✅</p>
                  <p className="mt-0.5">All dues cleared. No restrictions active.</p>
                </div>
              </div>
            )}

            {/* Month grid */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Monthly Dues</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {(data.monthlyDues || []).map((due) => {
                  const cfg = MONTH_STATUS_CFG[due.status] || MONTH_STATUS_CFG.PENDING
                  const Icon = cfg.icon
                  return (
                    <div key={due.billingMonth} className={`rounded-xl border p-3 ${cfg.bg} ${cfg.border}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-bold ${cfg.text}`}>{due.monthName?.split(' ')[0]}</span>
                        <Icon size={10} className={cfg.text} />
                      </div>
                      <p className="text-sm font-bold text-gray-800">₹{due.amount?.toLocaleString('en-IN')}</p>
                      {due.paidAmount > 0 && due.status !== 'PAID' && (
                        <p className="text-[10px] text-blue-600 mt-0.5">+₹{due.paidAmount?.toLocaleString('en-IN')} partial</p>
                      )}
                      <span className={`inline-block mt-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                        {cfg.label}
                      </span>
                      {due.dueDate && due.status !== 'PAID' && (
                        <p className="text-[9px] text-gray-400 mt-1">Due: {dayjs(due.dueDate).format('DD MMM')}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Recent receipts */}
            {data.receipts?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recent Receipts</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {data.receipts.slice().reverse().slice(0, 5).map((r) => (
                    <div key={r._id} className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex justify-between items-start text-xs">
                      <div>
                        <p className="font-semibold text-gray-800 font-mono">{r.receiptNo}</p>
                        <p className="text-gray-500 mt-0.5">{r.monthsApplied?.map(m => m.monthName).join(', ')}</p>
                        {r.paymentRef && <p className="text-gray-400 mt-0.5">Ref: {r.paymentRef}</p>}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-700">₹{r.totalPaidAmount?.toLocaleString('en-IN')}</p>
                        <p className="text-gray-400 mt-0.5">{dayjs(r.paidAt).format('DD MMM YYYY')}</p>
                        <p className="text-gray-400">{r.paymentMode}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Nested Payment Modal */}
      {data && (
        <PaymentModal open={payOpen} bill={{ ...data, tenantDetails: data.tenantDetails, tenantId }}
          onClose={() => setPayOpen(false)}
          onSuccess={() => { setPayOpen(false); fetchDetail(); onPaySuccess?.() }} />
      )}
    </>
  )
}

/* ════════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════════ */
export default function SessionBilling() {
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [schools, setSchools] = useState([])
  const [report, setReport] = useState(null)

  const [sessionYear, setSessionYear] = useState(currentSession())
  const [searchText, setSearchText] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const [showGenerate, setShowGenerate] = useState(false)
  const [detailBill, setDetailBill] = useState(null)   // { tenantId, sessionYear }
  const [payBill, setPayBill] = useState(null)

  /* Fetch tenant once */
  useEffect(() => {
    getRequest('tenant?isPagination=false').then(r => setSchools(r?.data?.data?.tenants || [])).catch(() => {})
  }, [])

  /* Fetch bills */
  const fetchBills = () => {
    setLoading(true)
    const params = new URLSearchParams({ page, limit, sessionYear })
    if (filterStatus) params.append('status', filterStatus)
    if (searchText.trim()) params.append('search', searchText.trim())
    getRequest(`session-billing?${params.toString()}`)
      .then(r => { setBills(r?.data?.data?.bills || []); setTotal(r?.data?.data?.total || 0) })
      .catch(() => toast.error('Failed to load session bills'))
      .finally(() => setLoading(false))
  }

  /* Fetch report */
  const fetchReport = () => {
    getRequest(`session-billing/report?sessionYear=${sessionYear}`)
      .then(r => setReport(r?.data?.data?.summary || null))
      .catch(() => {})
  }

  useEffect(() => { fetchBills(); fetchReport() }, [page, sessionYear, filterStatus])

  const handleSearch = () => { setPage(1); fetchBills() }

  /* Mark overdue */
  const handleMarkOverdue = async () => {
    try {
      const r = await patchRequest({ url: 'session-billing/mark-overdue', cred: {} })
      toast.success(`${r?.data?.data?.updatedMonths ?? 0} month(s) marked overdue`)
      fetchBills(); fetchReport()
    } catch { toast.error('Failed') }
  }

  /* Columns */
  const columns = [
    { title: 'Sr.', key: 'sr', align: 'center', width: 50, render: (_, __, i) => (page - 1) * limit + i + 1 },
    {
      title: 'School', key: 'school',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#0c3b73]/10 flex items-center justify-center text-xs font-bold text-[#0c3b73] flex-shrink-0">
            {row.tenantDetails?.schoolName?.slice(0, 2).toUpperCase() || '—'}
          </div>
          <div>
            <p className="font-medium text-gray-800 text-sm leading-tight">{row.tenantDetails?.schoolName || '—'}</p>
            <p className="text-xs text-gray-400">{row.tenantDetails?.subdomain || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Monthly Amt', dataIndex: 'monthlyAmount', align: 'center',
      render: v => <span className="text-sm font-semibold text-gray-800">₹{(v || 0).toLocaleString('en-IN')}</span>,
    },
    {
      title: 'Total Session', dataIndex: 'totalSessionAmount', align: 'center',
      render: v => <span className="text-sm font-bold text-[#0c3b73]">₹{(v || 0).toLocaleString('en-IN')}</span>,
    },
    {
      title: 'Paid', dataIndex: 'totalPaid', align: 'center',
      render: v => <span className="text-sm font-semibold text-green-600">₹{(v || 0).toLocaleString('en-IN')}</span>,
    },
    {
      title: 'Due', dataIndex: 'totalDue', align: 'center',
      render: v => <span className={`text-sm font-semibold ${v > 0 ? 'text-red-500' : 'text-gray-400'}`}>₹{(v || 0).toLocaleString('en-IN')}</span>,
    },
    {
      title: 'Paid / Overdue', key: 'months', align: 'center',
      render: (_, row) => (
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-semibold">{row.paidMonthsCount || 0} paid</span>
          {row.overdueMonthsCount > 0 && (
            <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-semibold">{row.overdueMonthsCount} overdue</span>
          )}
        </div>
      ),
    },
    {
      title: 'Status', dataIndex: 'status', align: 'center',
      render: status => {
        const cfg = STATUS_CFG[status] || {}
        const Icon = cfg.icon
        return <Tag color={cfg.color} className="flex items-center gap-1 w-fit mx-auto text-xs">{Icon && <Icon size={10} />}{cfg.label || status}</Tag>
      },
    },
    {
      title: 'Restrictions', key: 'restrict', align: 'center',
      render: (_, row) => row.restrictNewAdmissions ? (
        <Tooltip title="New admissions & registrations blocked"><span className="flex items-center gap-1 text-xs text-red-600"><ShieldAlert size={12} /> Restricted</span></Tooltip>
      ) : <span className="text-xs text-gray-300">—</span>,
    },
    {
      title: 'Actions', key: 'action', align: 'center', width: 130,
      render: (_, row) => (
        <div className="flex items-center gap-1.5 justify-center">
          <Tooltip title="View detail">
            <button onClick={() => setDetailBill({ tenantId: row.tenantId, sessionYear: row.sessionYear })}
              className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 transition"><Eye size={13} /></button>
          </Tooltip>
          {row.status !== 'FULLY_PAID' && (
            <button onClick={() => setPayBill(row)}
              className="flex items-center gap-1 px-2 py-1.5 text-xs bg-[#0c3b73] hover:bg-[#0a2f5c] text-white rounded-lg transition">
              <Receipt size={11} /> Pay
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
            <BookOpen size={20} className="text-[#e24028]" /> Session Billing
          </h1>
          <p className="text-sm text-gray-500">Manage subscription billing for academic sessions (April – March)</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={sessionYear} onChange={v => { setSessionYear(v); setPage(1) }}
            options={generateSessionOptions()} className="w-36" />
          <button onClick={handleMarkOverdue}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 transition">
            <AlertCircle size={14} className="text-red-400" /> Mark Overdue
          </button>
          <button onClick={() => setShowGenerate(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[#0c3b73] hover:bg-[#0a2f5c] text-white rounded-lg transition">
            <Plus size={15} /> Generate Bill
          </button>
        </div>
      </div>

      {/* Report summary cards */}
      {report && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <SummaryCard icon={Users} label="Total Schools" value={report.totalSchools} color="text-[#0c3b73]" bgColor="bg-blue-50" />
          <SummaryCard icon={IndianRupee} label="Total Billed" value={`₹${(report.totalBilledAmount/1000).toFixed(0)}k`} color="text-gray-700" bgColor="bg-gray-100" />
          <SummaryCard icon={CheckCircle} label="Collected" value={`₹${(report.totalCollected/1000).toFixed(0)}k`} sub={`${report.collectionPercent}% collected`} color="text-green-600" bgColor="bg-green-50" />
          <SummaryCard icon={AlertCircle} label="Total Due" value={`₹${(report.totalDue/1000).toFixed(0)}k`} color="text-red-500" bgColor="bg-red-50" />
          <SummaryCard icon={TrendingUp} label="Fully Paid" value={report.fullyPaid} color="text-emerald-600" bgColor="bg-emerald-50" />
          <SummaryCard icon={ShieldAlert} label="Restricted" value={report.restricted} color="text-orange-600" bgColor="bg-orange-50" />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] border border-gray-300 rounded-lg px-3 h-9">
          <Search size={14} className="text-gray-400 flex-shrink-0" />
          <input value={searchText} onChange={e => setSearchText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search school name…" className="flex-1 text-sm outline-none bg-transparent" />
          {searchText && <button onClick={() => { setSearchText(''); fetchBills() }}><X size={13} className="text-gray-400" /></button>}
        </div>
        <Select allowClear placeholder="All statuses" value={filterStatus || undefined} onChange={v => { setFilterStatus(v || ''); setPage(1) }}
          options={Object.entries(STATUS_CFG).map(([v, c]) => ({ value: v, label: c.label }))} className="w-36" />
        <button onClick={fetchBills} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 transition">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        {loading ? (
          <div className="p-10 flex items-center justify-center gap-2 text-gray-400">
            <Loader2 size={18} className="animate-spin" /> Loading session bills…
          </div>
        ) : (
          <Table columns={columns} dataSource={bills} rowKey="_id" pagination={false}
            scroll={{ x: 'max-content' }} locale={{ emptyText: <Empty description="No session bills found. Generate one to get started." /> }} />
        )}
        {!loading && total > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</p>
            <Pagination current={page} pageSize={limit} total={total} onChange={setPage} size="small" showSizeChanger={false} />
          </div>
        )}
      </div>

      {/* Modals */}
      <GenerateSessionModal open={showGenerate} schools={schools} onClose={() => setShowGenerate(false)}
        onSuccess={() => { fetchBills(); fetchReport() }} />

      {payBill && (
        <PaymentModal open={!!payBill} bill={payBill} onClose={() => setPayBill(null)}
          onSuccess={() => { setPayBill(null); fetchBills(); fetchReport() }} />
      )}

      {detailBill && (
        <SessionDetailModal open={!!detailBill} tenantId={detailBill.tenantId}
          sessionYear={detailBill.sessionYear} onClose={() => setDetailBill(null)}
          onPaySuccess={() => { fetchBills(); fetchReport() }} />
      )}
    </div>
  )
}
