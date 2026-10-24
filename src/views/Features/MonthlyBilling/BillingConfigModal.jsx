import React, { useState, useEffect } from 'react'
import { Modal } from 'antd'
import { Settings, AlertCircle, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { getRequest, putRequest } from '../../../Helpers'

const BillingConfigModal = ({ open, onClose }) => {
  const [config, setConfig] = useState({
    baseStudentLimit: 350,
    basePrice: 1200,
    addonSlotSize: 50,
    addonSlotPrice: 100,
  })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)

  /* Fetch current config on open */
  useEffect(() => {
    if (!open) return
    setFetching(true)
    getRequest('monthly-billing/config')
      .then((r) => {
        const d = r?.data?.data
        if (d) {
          setConfig({
            baseStudentLimit: d.baseStudentLimit,
            basePrice: d.basePrice,
            addonSlotSize: d.addonSlotSize,
            addonSlotPrice: d.addonSlotPrice,
          })
        }
      })
      .catch(() => toast.error('Failed to load config'))
      .finally(() => setFetching(false))
  }, [open])

  const set = (key, val) =>
    setConfig((p) => ({ ...p, [key]: val === '' ? '' : Number(val) }))

  const handleSave = async () => {
    // Basic validation
    if (!config.baseStudentLimit || !config.basePrice || !config.addonSlotSize || !config.addonSlotPrice) {
      toast.error('All fields are required')
      return
    }
    setLoading(true)
    try {
      await putRequest({ url: 'monthly-billing/config', cred: config })
      toast.success('Pricing config updated. Existing bills are NOT affected.')
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update config')
    } finally {
      setLoading(false)
    }
  }

  /* Live example calculation */
  const exampleStudents = [100, 350, 400, 500, 700]
  const calcExample = (n) => {
    const base = Number(config.basePrice) || 0
    const limit = Number(config.baseStudentLimit) || 350
    const slotSize = Number(config.addonSlotSize) || 50
    const slotPrice = Number(config.addonSlotPrice) || 100
    const addon = n > limit ? Math.ceil((n - limit) / slotSize) * slotPrice : 0
    return base + addon
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={480}
      destroyOnClose
      title={
        <div className="flex items-center gap-2 text-[#0c3b73]">
          <Settings size={16} />
          Billing Pricing Config
        </div>
      }
    >
      {fetching ? (
        <div className="py-8 text-center text-sm text-gray-400">Loading config…</div>
      ) : (
        <div className="space-y-4 mt-3">

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex gap-2">
            <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Changes apply to <strong>new bills only</strong>. Existing generated bills will not be changed (they store a snapshot).
            </p>
          </div>

          {/* Rule 1: Base */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Base Plan Rule</p>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Student Limit (0 to X)"
                value={config.baseStudentLimit}
                onChange={(v) => set('baseStudentLimit', v)}
                suffix="students"
              />
              <Field
                label="Flat Price"
                value={config.basePrice}
                onChange={(v) => set('basePrice', v)}
                prefix="₹"
                suffix="/month"
              />
            </div>
            <p className="text-xs text-gray-400">
              Schools with 0–{config.baseStudentLimit} students pay ₹{config.basePrice}/month
            </p>
          </div>

          {/* Rule 2: Addon */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Addon Rule (Extra Students)</p>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Slot Size"
                value={config.addonSlotSize}
                onChange={(v) => set('addonSlotSize', v)}
                suffix="students"
              />
              <Field
                label="Price per Slot"
                value={config.addonSlotPrice}
                onChange={(v) => set('addonSlotPrice', v)}
                prefix="₹"
              />
            </div>
            <p className="text-xs text-gray-400">
              For every {config.addonSlotSize} students above {config.baseStudentLimit}, charge ₹{config.addonSlotPrice} extra
            </p>
          </div>

          {/* Live examples */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <p className="text-xs font-semibold text-[#0c3b73] mb-2">Live Preview</p>
            <div className="grid grid-cols-5 gap-1.5">
              {exampleStudents.map((n) => (
                <div key={n} className="bg-white rounded-lg p-2 text-center border border-blue-100">
                  <div className="text-[10px] text-gray-400">{n} students</div>
                  <div className="text-xs font-bold text-[#0c3b73] mt-0.5">
                    ₹{calcExample(n).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-5 py-2 text-sm bg-[#0c3b73] hover:bg-[#0a2f5c] text-white rounded-lg transition disabled:opacity-60 flex items-center gap-2"
            >
              <Save size={13} />
              {loading ? 'Saving…' : 'Save Config'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

/* Small reusable input field */
const Field = ({ label, value, onChange, prefix, suffix }) => (
  <div>
    <label className="text-xs font-medium text-gray-600 block mb-1">{label}</label>
    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-[#0c3b73]">
      {prefix && (
        <span className="px-2 text-gray-400 bg-gray-50 border-r border-gray-300 text-xs py-2">
          {prefix}
        </span>
      )}
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-2 py-2 text-sm outline-none bg-white"
      />
      {suffix && (
        <span className="px-2 text-gray-400 bg-gray-50 border-l border-gray-300 text-xs py-2 whitespace-nowrap">
          {suffix}
        </span>
      )}
    </div>
  </div>
)

export default BillingConfigModal
