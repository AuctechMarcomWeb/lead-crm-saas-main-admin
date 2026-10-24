/* eslint-disable prettier/prettier */
import React, { useState, useEffect } from 'react'
import {
  BookOpen, CheckCircle, Clock, AlertCircle, IndianRupee,
  CalendarDays, Loader2, Receipt, ShieldAlert, RefreshCw,
} from 'lucide-react'
import { Modal, Tag, Select } from 'antd'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import { getRequest, postRequest } from '../../../../Helpers'

/* ─── Status configs ── */
const MONTH_STATUS = {
  PENDING:        { label: 'Pending',  bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: Clock },
  PARTIALLY_PAID: { label: 'Partial',  bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   icon: IndianRupee },
  PAID:           { label: 'Paid',     bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  icon: CheckCircle },
  OVERDUE:        { label: 'Overdue',  bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    icon: AlertCircle },
}

const currentSession = () => {
  const now = new Date()
  const y = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
  return `${y}-${String(y + 1).slice(-2)}`
}

const genSessionOptions = () => {
  const cur = new Date().getFullYear()
  return Array.from({ length: 4 }, (_, i) => {
    const y = cur - 1 + i
    return { value: `${y}-${String(y + 1).slice(-2)}`, label: `${y}-${String(y + 1).slice(-2)}` }
  })
}

/* ─── Payment Modal ── */
const PayModal = ({ open, bill, tenantId, onClose, onSuccess }) => {
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState('CASH')
  const [ref, setRef] = useState('')
  const [months, setMonths] = useState([])
  const [remarks, setRemarks] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (!open) { setAmount(''); setRef(''); setMonths([]); setRemarks('') } }, [open])
  if (!bill) return null

  const unpaid = (bill.monthlyDues || []).filter(d => d.status !== 'PAID')

  const handlePay = async () => {
    if (!amount || Number(amount) <= 0) { toast.error('Enter amount'); return }
    setLoading(true)
    try {
      await postRequest({
        url: `session-billing/${tenantId}/pay`,
        cred: {
          sessionYear: bill.sessionYear,
          totalPaidAmount: Number(amount),
          paymentMode: mode,
          paymentRef: ref || undefined,
          remarks: remarks || undefined,
          ...(months.length > 0 ? { months } : {}),
        },
      })
      toast.success('Payment recorded')
      onSuccess(); onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed')
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onCancel={onClose} footer={null} width={460} destroyOnClose
      title={<div className="flex items-center gap-2 text-green-700"><Receipt size={14} /> Record Payment · {bill.sessionYear}</div>}>
      <div className="space-y-3 mt-3">
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex justify-between text-xs">
          <span className="text-gray-500">Due</span>
          <span className="font-bold text-red-600">₹{(bill.totalDue || 0).toLocaleString('en-IN')}</span>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Amount <span className="text-red-500">*</span></label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter amount"
              className="w-full h-9 pl-7 pr-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0c3b73]" />
          </div>
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {[1200, 2400, 3600, bill.totalDue].filter(Boolean).map(v => (
              <button key={v} onClick={() => setAmount(String(v))}
                className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100 transition">
                ₹{v?.toLocaleString('en-IN')}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Apply to months <span className="text-gray-400">(optional)</span></label>
          <Select mode="multiple" className="w-full" placeholder="Auto-distributes if blank" value={months} onChange={setMonths}
            options={unpaid.map(d => ({ value: d.billingMonth, label: `${d.monthName} — ₹${d.balanceAmount?.toLocaleString('en-IN')}` }))} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Mode</label>
            <Select className="w-full" value={mode} onChange={setMode}
              options={['CASH','CHEQUE','NEFT','RTGS','UPI','ONLINE','OTHER'].map(m => ({ value: m, label: m }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Reference</label>
            <input type="text" value={ref} onChange={e => setRef(e.target.value)} placeholder="UTR / Cheque"
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0c3b73]" />
          </div>
        </div>

        <input type="text" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Remarks (optional)"
          className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0c3b73]" />

        <div className="flex justify-end gap-2 pt-1 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handlePay} disabled={loading}
            className="px-5 py-2 text-sm bg-[#0c3b73] hover:bg-[#0a2f5c] text-white rounded-lg disabled:opacity-60 flex items-center gap-2">
            {loading && <Loader2 size={12} className="animate-spin" />} {loading ? 'Saving…' : 'Record Payment'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ─── Main Panel ── */
const SessionBillingPanel = ({ tenantId }) => {
  const [sessionYear, setSessionYear] = useState(currentSession())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [noSession, setNoSession] = useState(false)

  const fetchData = async () => {
    if (!tenantId) return
    setLoading(true); setNoSession(false)
    try {
      const res = await getRequest(`session-billing/${tenantId}/dashboard?sessionYear=${sessionYear}`)
      const d = res?.data?.data
      if (d?.hasSessionBill === false) { setData(null); setNoSession(true) }
      else setData(d)
    } catch { toast.error('Failed to load session billing') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [tenantId, sessionYear])

  const paidMonths = data?.summary?.paidMonths || 0
  const paidPercent = Math.round((paidMonths / 12) * 100)

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0c3b73] flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-medium text-slate-800">Session Billing</h3>
            <p className="text-xs text-slate-400">April – March subscription dues</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select size="small" value={sessionYear} onChange={v => setSessionYear(v)}
            options={genSessionOptions()} className="w-28" />
          <button onClick={fetchData} className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 text-gray-400 py-8">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      ) : noSession ? (
        <div className="bg-slate-50 rounded-xl p-4 text-center text-sm text-slate-400">
          No session bill for {sessionYear}.<br />
          <span className="text-xs">Generate from Session Billing page.</span>
        </div>
      ) : !data ? null : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { label: 'Total Session', value: `₹${(data.summary?.totalSessionAmount || 0).toLocaleString('en-IN')}`, color: 'text-[#0c3b73]', bg: 'bg-blue-50' },
              { label: 'Paid', value: `₹${(data.summary?.totalPaid || 0).toLocaleString('en-IN')}`, color: 'text-green-700', bg: 'bg-green-50' },
              { label: 'Due', value: `₹${(data.summary?.totalDue || 0).toLocaleString('en-IN')}`, color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'Overdue Months', value: data.summary?.overdueMonths || 0, color: data.summary?.overdueMonths > 0 ? 'text-red-600' : 'text-gray-500', bg: data.summary?.overdueMonths > 0 ? 'bg-red-50' : 'bg-gray-50' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`${bg} rounded-xl p-2.5 text-center`}>
                <p className="text-[10px] text-gray-500">{label}</p>
                <p className={`text-sm font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Payment Progress</span>
              <span className="font-semibold text-[#0c3b73]">{paidMonths}/12 months</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${paidMonths === 12 ? 'bg-green-500' : data.summary?.overdueMonths > 0 ? 'bg-red-400' : 'bg-[#0c3b73]'}`}
                style={{ width: `${paidPercent}%` }} />
            </div>
          </div>

          {/* Restrictions banner — sirf tab jab FULLY_PAID nahi aur restriction active ho */}
          {data.status !== 'FULLY_PAID' && (data.restrictions?.newAdmissionsDisabled || data.restrictions?.studentRegistrationDisabled) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 flex items-start gap-2 mb-3">
              <ShieldAlert size={14} className="text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-700 font-medium">
                Restrictions active: {data.restrictions?.overdueMonthCount} overdue months.<br />
                Admissions & registrations are blocked.
              </p>
            </div>
          )}
          {data.status === 'FULLY_PAID' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 flex items-start gap-2 mb-3">
              <ShieldAlert size={14} className="text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-green-700 font-medium">Session fully paid ✅ — No restrictions active.</p>
            </div>
          )}

          {/* Alerts */}
          {data.alerts?.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-3 space-y-1">
              {data.alerts.slice(0, 3).map((a, i) => (
                <p key={i} className="text-xs text-amber-700">⚠ {a.message}</p>
              ))}
            </div>
          )}

          {/* Month grid (compact) */}
          <div className="grid grid-cols-4 gap-1.5 mb-4">
            {(data.monthlyDues || []).map((due) => {
              const cfg = MONTH_STATUS[due.status] || MONTH_STATUS.PENDING
              const Icon = cfg.icon
              return (
                <div key={due.billingMonth} className={`rounded-lg border p-2 ${cfg.bg} ${cfg.border} text-center`}>
                  <p className={`text-[10px] font-bold ${cfg.text}`}>{due.monthName?.split(' ')[0]}</p>
                  <p className="text-xs font-semibold text-gray-700 mt-0.5">₹{(due.amount || 0) >= 1000 ? `${((due.amount || 0)/1000).toFixed(1)}k` : due.amount}</p>
                  <Icon size={9} className={`${cfg.text} mx-auto mt-1`} />
                </div>
              )
            })}
          </div>

          {/* Record Payment button */}
          {data.status !== 'FULLY_PAID' && (
            <button onClick={() => setPayOpen(true)}
              className="w-full py-2 text-sm bg-[#0c3b73] hover:bg-[#0a2f5c] text-white rounded-xl transition flex items-center justify-center gap-2">
              <Receipt size={14} /> Record Payment
            </button>
          )}

          {data.status === 'FULLY_PAID' && (
            <div className="w-full py-2 text-sm bg-green-50 text-green-700 rounded-xl flex items-center justify-center gap-2 font-semibold">
              <CheckCircle size={14} /> Fully Paid — Session Complete
            </div>
          )}
        </>
      )}

      <PayModal open={payOpen} bill={data} tenantId={tenantId} onClose={() => setPayOpen(false)} onSuccess={() => { setPayOpen(false); fetchData() }} />
    </div>
  )
}

export default SessionBillingPanel
