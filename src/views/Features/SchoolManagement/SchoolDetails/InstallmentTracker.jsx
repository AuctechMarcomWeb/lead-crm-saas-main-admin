/* eslint-disable prettier/prettier */
import React, { useState, useEffect } from 'react'
import {
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  IndianRupee,
  CalendarDays,
  ChevronDown,
  Loader2,
  X,
} from 'lucide-react'
import { Modal, Tag, Tooltip } from 'antd'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import { getRequest, patchRequest } from '../../../../Helpers'

/* ── Status config ────────────────────────────────────────────── */
const STATUS = {
  PAID:    { label: 'Paid',    color: 'green',  icon: CheckCircle,  bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200' },
  PENDING: { label: 'Pending', color: 'orange', icon: Clock,        bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  OVERDUE: { label: 'Overdue', color: 'red',    icon: AlertCircle,  bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200' },
}

/* ── Month label ─────────────────────────────────────────────── */
const monthLabel = (ym) => (ym ? dayjs(ym + '-01').format('MMM YYYY') : '—')

/* ── Mark Paid Modal ─────────────────────────────────────────── */
const MarkPaidModal = ({ open, installment, tenantId, onClose, onSuccess }) => {
  const [paidDate, setPaidDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [paymentRef, setPaymentRef] = useState('')
  const [remarks, setRemarks] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) { setPaidDate(dayjs().format('YYYY-MM-DD')); setPaymentRef(''); setRemarks('') }
  }, [open])

  if (!installment) return null

  const handleSubmit = async () => {
    if (!paidDate) { toast.error('Select payment date'); return }
    setLoading(true)
    try {
      await patchRequest({
        url: `subscription/${tenantId}/installments/${installment.installmentNo}/mark-paid`,
        cred: { paidDate, paymentRef, remarks },
      })
      toast.success(`Installment #${installment.installmentNo} marked as paid`)
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to mark as paid')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={380}
      destroyOnClose
      title={
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle size={15} />
          Mark Installment as Paid
        </div>
      }
    >
      <div className="space-y-3 mt-3">
        {/* Info card */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-400">Installment #{installment.installmentNo}</p>
            <p className="font-semibold text-gray-800 text-sm">{monthLabel(installment.billingMonth)}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-[#0c3b73] flex items-center gap-0.5 justify-end text-sm">
              <IndianRupee size={12} />
              {Number(installment.amount ?? 0).toLocaleString('en-IN')}
            </p>
            {installment.dueDate && (
              <p className="text-[10px] text-gray-400 mt-0.5">
                Due: {dayjs(installment.dueDate).format('DD MMM YYYY')}
              </p>
            )}
          </div>
        </div>

        {/* Payment date */}
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">
            Payment Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={paidDate}
            onChange={(e) => setPaidDate(e.target.value)}
            className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0c3b73]"
          />
        </div>

        {/* Payment ref */}
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">
            Payment Reference <span className="text-gray-400 font-normal">(UTR / Cheque / TXN ID)</span>
          </label>
          <input
            type="text"
            value={paymentRef}
            onChange={(e) => setPaymentRef(e.target.value)}
            placeholder="e.g. UTR123456789"
            className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0c3b73]"
          />
        </div>

        {/* Remarks */}
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">
            Remarks <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={2}
            placeholder="Any notes…"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-[#0c3b73]"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 text-sm bg-[#0c3b73] hover:bg-[#0a2f5c] text-white rounded-lg transition disabled:opacity-60 flex items-center gap-2"
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            {loading ? 'Saving…' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ── Main InstallmentTracker Component ───────────────────────── */
const InstallmentTracker = ({ tenantId, schoolName }) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [markPaidInst, setMarkPaidInst] = useState(null)

  const fetchInstallments = async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const res = await getRequest(`subscription/${tenantId}/installments`)
      setData(res?.data?.data || null)
    } catch {
      // Silently fail — installments not critical, show "not available" state
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInstallments()
  }, [tenantId])

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex items-center justify-center gap-2 text-gray-400 min-h-[120px]">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">Loading installments…</span>
      </div>
    )
  }

  // Not a yearly plan
  if (!data || data.billingCycle !== 'Yearly' || !data.installments?.length) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base font-medium text-slate-800">Installment Schedule</h3>
            <p className="text-xs text-slate-400">Only available for Yearly subscription plans</p>
          </div>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 text-center text-sm text-slate-400 mt-2">
          {data?.billingCycle
            ? `Current plan is ${data.billingCycle} — no installment schedule`
            : 'No active subscription found'}
        </div>
      </div>
    )
  }

  const { installments, summary, planName, totalAmount, startDate, endDate } = data
  const paidPercent = Math.round((summary.paid / 12) * 100)

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0c3b73] flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-medium text-slate-800">Installment Schedule</h3>
            <p className="text-xs text-slate-400">
              {planName} · Yearly · {dayjs(startDate).format('MMM YYYY')} – {dayjs(endDate).format('MMM YYYY')}
            </p>
          </div>
        </div>
        <button
          onClick={fetchInstallments}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400"
          title="Refresh"
        >
          <Loader2 size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Paid',        value: summary.paid,                                            icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50',  border: 'border-green-200' },
          { label: 'Pending',     value: summary.pending,                                         icon: Clock,       color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200' },
          { label: 'Overdue',     value: summary.overdue,                                         icon: AlertCircle, color: 'text-red-500',    bg: 'bg-red-50',    border: 'border-red-200' },
          { label: 'Remaining',   value: `₹${summary.remaining?.toLocaleString('en-IN')}`,        icon: IndianRupee, color: 'text-[#0c3b73]',  bg: 'bg-blue-50',   border: 'border-blue-200' },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={`${bg} border ${border} rounded-xl p-3 flex flex-col items-center gap-1`}>
            <Icon size={18} className={color} />
            <p className={`text-lg font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Progress bar ── */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-sm font-medium text-gray-600">Payment Progress</span>
          <span className="text-sm font-bold text-[#0c3b73]">{summary.paid}/12 months</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0c3b73] rounded-full transition-all duration-500"
            style={{ width: `${paidPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-green-600 font-semibold">
            ₹{summary.totalPaidAmount?.toLocaleString('en-IN')} received
          </span>
          <span className="text-xs text-gray-400 font-medium">
            Total: ₹{totalAmount?.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* ── Month Grid — 4 columns, readable ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {installments.map((inst) => {
          const cfg = STATUS[inst.status] || STATUS.PENDING
          const Icon = cfg.icon
          const isOverdue = inst.status === 'OVERDUE'
          const isPaid = inst.status === 'PAID'

          return (
            <div
              key={inst.installmentNo}
              className={`relative rounded-xl border p-3 transition-all ${cfg.bg} ${cfg.border} ${!isPaid ? 'hover:shadow-md hover:scale-[1.02] cursor-pointer' : ''}`}
              onClick={() => !isPaid && setMarkPaidInst(inst)}
            >
              {/* Installment number badge */}
              <div className="absolute top-2 right-2">
                <span className="text-[10px] font-bold text-gray-400">#{inst.installmentNo}</span>
              </div>

              {/* Month */}
              <div className="flex items-center gap-1.5 mb-1.5">
                <CalendarDays size={12} className={cfg.text} />
                <span className={`text-xs font-bold ${cfg.text}`}>{monthLabel(inst.billingMonth)}</span>
              </div>

              {/* Amount */}
              <div className="flex items-center gap-0.5 mb-2">
                <IndianRupee size={12} className="text-gray-700" />
                <span className="text-sm font-bold text-gray-800">
                  {Number(inst.amount ?? 0).toLocaleString('en-IN')}
                </span>
              </div>

              {/* Status badge */}
              <div className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 border ${cfg.bg} ${cfg.border}`}>
                <Icon size={10} className={cfg.text} />
                <span className={`text-[11px] font-semibold ${cfg.text}`}>{cfg.label}</span>
              </div>

              {/* Paid info */}
              {isPaid && inst.paidDate && (
                <div className="mt-2">
                  <p className="text-xs text-green-600 font-medium">
                    ✅ {dayjs(inst.paidDate).format('DD MMM YY')}
                  </p>
                  {inst.paymentRef && (
                    <Tooltip title={inst.paymentRef}>
                      <p className="text-[10px] text-gray-400 font-mono truncate max-w-full cursor-help mt-0.5">
                        {inst.paymentRef}
                      </p>
                    </Tooltip>
                  )}
                </div>
              )}

              {/* Due date for unpaid */}
              {!isPaid && inst.dueDate && (
                <p className={`text-[11px] mt-1.5 font-medium ${isOverdue ? 'text-red-500' : 'text-orange-500'}`}>
                  Due: {dayjs(inst.dueDate).format('DD MMM')}
                </p>
              )}

              {/* Tap to Pay button */}
              {!isPaid && (
                <div className={`mt-2 w-full text-center text-xs font-semibold py-1 rounded-lg ${
                  isOverdue ? 'bg-red-500 text-white' : 'bg-orange-400 text-white'
                }`}>
                  Tap to Pay
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Mark Paid Modal ── */}
      <MarkPaidModal
        open={!!markPaidInst}
        installment={markPaidInst}
        tenantId={tenantId}
        onClose={() => setMarkPaidInst(null)}
        onSuccess={fetchInstallments}
      />
    </div>
  )
}

export default InstallmentTracker
