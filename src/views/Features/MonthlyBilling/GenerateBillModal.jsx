import React, { useState, useEffect } from 'react'
import { Modal, Select } from 'antd'
import { CalendarDays, Users, IndianRupee, Zap, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { postRequest, getRequest } from '../../../Helpers'

const { Option } = Select

/* Generate last 12 + next 2 months */
const generateMonthOptions = () => {
  const opts = []
  const now = new Date()
  for (let i = -1; i <= 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    opts.push({ val, label })
  }
  return opts
}

const MONTH_OPTS = generateMonthOptions()

/* ── Next month default (bill generate pehle hoga) ── */
const nextMonthDefault = () => {
  const d = new Date()
  d.setMonth(d.getMonth() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const GenerateBillModal = ({ open, schools = [], onClose, onSuccess }) => {
  const [mode, setMode] = useState('bulk')        // 'bulk' | 'single'
  const [billingMonth, setBillingMonth] = useState(nextMonthDefault())
  const [tenantId, setTenantId] = useState(null)
  const [studentCount, setStudentCount] = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  /* Reset on open */
  useEffect(() => {
    if (open) {
      setMode('bulk')
      setBillingMonth(nextMonthDefault())
      setTenantId(null)
      setStudentCount('')
      setPreview(null)
    }
  }, [open])

  /* Live preview when studentCount changes */
  useEffect(() => {
    const count = Number(studentCount)
    if (!studentCount || isNaN(count) || count < 0) {
      setPreview(null)
      return
    }
    const t = setTimeout(async () => {
      setPreviewLoading(true)
      try {
        const r = await postRequest({
          url: 'monthly-billing/preview',
          cred: { studentCount: count },
        })
        setPreview(r?.data?.data)
      } catch {
        setPreview(null)
      } finally {
        setPreviewLoading(false)
      }
    }, 400)
    return () => clearTimeout(t)
  }, [studentCount])

  const handleSubmit = async () => {
    if (!billingMonth) { toast.error('Select billing month'); return }
    if (mode === 'single' && !tenantId) { toast.error('Select a school'); return }

    setLoading(true)
    try {
      if (mode === 'bulk') {
        const r = await postRequest({
          url: 'monthly-billing/generate-bulk',
          cred: { billingMonth },
        })
        const d = r?.data?.data
        toast.success(`Done — ${d?.created} created, ${d?.skipped} skipped`)
        if (d?.errors?.length) toast.error(`${d.errors.length} school(s) failed`)
      } else {
        await postRequest({
          url: 'monthly-billing/generate',
          cred: {
            tenantId,
            billingMonth,
            ...(studentCount ? { studentCount: Number(studentCount) } : {}),
          },
        })
        toast.success('Bill generated successfully')
      }
      onSuccess()
      onClose()
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to generate bill'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const monthLabel = (ym) => {
    if (!ym) return ''
    const d = new Date(ym + '-01')
    return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={460}
      destroyOnClose
      title={
        <div className="flex items-center gap-2 text-[#0c3b73]">
          <CalendarDays size={16} />
          Generate Monthly Bills
        </div>
      }
    >
      <div className="space-y-4 mt-3">

        {/* Mode toggle */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {[
            { key: 'bulk',   label: 'All Schools (Bulk)' },
            { key: 'single', label: 'Single School' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`flex-1 py-2 text-sm font-medium transition ${
                mode === key
                  ? 'bg-[#0c3b73] text-white'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Billing month */}
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">
            Billing Month <span className="text-red-500">*</span>
          </label>
          <Select
            value={billingMonth}
            onChange={setBillingMonth}
            size="large"
            className="w-full"
          >
            {MONTH_OPTS.map((m) => (
              <Option key={m.val} value={m.val}>
                {m.label}
              </Option>
            ))}
          </Select>
          <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
            <AlertCircle size={10} />
            Bill should be generated before the month starts
          </p>
        </div>

        {/* Single school fields */}
        {mode === 'single' && (
          <>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">
                School <span className="text-red-500">*</span>
              </label>
              <Select
                showSearch
                allowClear
                placeholder="Select school"
                value={tenantId}
                onChange={setTenantId}
                optionFilterProp="children"
                size="large"
                className="w-full"
              >
                {schools.map((s) => (
                  <Option key={s._id} value={s._id}>
                    {s.schoolName}
                  </Option>
                ))}
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">
                Student Count{' '}
                <span className="text-gray-400 font-normal">(optional — auto from subscription)</span>
              </label>
              <input
                type="number"
                min={0}
                value={studentCount}
                onChange={(e) => setStudentCount(e.target.value)}
                placeholder="Leave blank to use subscription count"
                className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0c3b73]"
              />
            </div>
          </>
        )}

        {/* Live preview */}
        {mode === 'single' && studentCount && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
            {previewLoading ? (
              <p className="text-xs text-gray-400">Calculating…</p>
            ) : preview ? (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-[#0c3b73] flex items-center gap-1">
                  <IndianRupee size={11} /> Amount Preview
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white rounded-lg p-2 border border-blue-100">
                    <div className="text-xs text-gray-400">Base</div>
                    <div className="text-sm font-bold text-gray-800">₹{preview.baseAmount?.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-blue-100">
                    <div className="text-xs text-gray-400">Addon</div>
                    <div className="text-sm font-bold text-amber-600">+₹{preview.addonAmount?.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-[#0c3b73]/20">
                    <div className="text-xs text-gray-400">Total</div>
                    <div className="text-sm font-bold text-[#0c3b73]">₹{preview.totalAmount?.toLocaleString('en-IN')}</div>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 text-center">{preview.breakdown}</p>
              </div>
            ) : null}
          </div>
        )}

        {/* Bulk info box */}
        {mode === 'bulk' && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex gap-2">
            <Zap size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-700">Bulk Generate</p>
              <p className="text-xs text-amber-600 mt-0.5">
                Bills will be created for all active tenant using their current subscription student count.
                Already-existing bills for this month will be skipped.
              </p>
            </div>
          </div>
        )}

        {/* Summary */}
        {billingMonth && (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 text-xs text-gray-600 flex items-center gap-2">
            <CalendarDays size={13} className="text-[#0c3b73]" />
            Generating bill for <strong>{monthLabel(billingMonth)}</strong>
            {mode === 'single' && tenantId && (
              <>
                &nbsp;·&nbsp;
                <Users size={11} />
                &nbsp;{schools.find((s) => s._id === tenantId)?.schoolName}
              </>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 text-sm bg-[#0c3b73] hover:bg-[#0a2f5c] text-white rounded-lg transition disabled:opacity-60 flex items-center gap-2"
          >
            {loading && <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {loading ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default GenerateBillModal
