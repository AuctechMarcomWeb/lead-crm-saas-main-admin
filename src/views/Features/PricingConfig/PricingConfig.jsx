import React, { useState, useEffect } from 'react'
import { Settings, Save, Loader2, History, IndianRupee, Users, Calculator } from 'lucide-react'
import toast from 'react-hot-toast'
import { getRequest, putRequest } from '../../../Helpers'

/* ─── Price Calculator Logic ─── */
export const calculatePrice = (studentCount, config) => {
  if (!config || !studentCount) return 0
  const { basePrice, baseStudentLimit, extraBlockSize, extraBlockPrice } = config
  const count = Number(studentCount)
  if (count <= baseStudentLimit) return basePrice
  const extra = count - baseStudentLimit
  const blocks = Math.ceil(extra / extraBlockSize)
  return basePrice + blocks * extraBlockPrice
}

/**
 * resolveAmount — plan type ke hisaab se sahi amount return karta hai
 * - FIXED plan (ya price set hai) → plan.price directly
 * - PER_STUDENT plan → calculatePrice formula
 */
export const resolveAmount = (plan, studentCount, pricingConfig) => {
  if (!plan) return 0
  if (plan.pricingModel === 'PER_STUDENT') {
    return calculatePrice(Number(studentCount), pricingConfig)
  }
  if (plan.price !== undefined && plan.price !== null && plan.price > 0) {
    return plan.price
  }
  return calculatePrice(Number(studentCount), pricingConfig)
}

/* ─── Live Preview Component ─── */
const LivePreview = ({ config }) => {
  const [previewCount, setPreviewCount] = useState(500)
  const price = calculatePrice(previewCount, config)
  const extra = Math.max(0, previewCount - config.baseStudentLimit)
  const blocks = extra > 0 ? Math.ceil(extra / config.extraBlockSize) : 0

  return (
    <div className="card mb-3">
      <div className="card-header !bg-[#0c3b73] text-white d-flex align-items-center gap-2">
        <Calculator size={14} />
        <span>Live Price Preview</span>
      </div>
      <div className="card-body">
        {/* Student count input */}
        <div className="row g-2 align-items-center mb-3">
          <div className="col-auto">
            <label className="form-label mb-0">Student Count:</label>
          </div>
          <div className="col-auto">
            <input
              type="number"
              min={1}
              value={previewCount}
              onChange={(e) => setPreviewCount(Number(e.target.value) || 0)}
              className="form-control form-control-sm"
              style={{ width: 120 }}
            />
          </div>
        </div>

        {/* Breakdown */}
        <div className="bg-blue-50 border border-blue-100 rounded p-3 mb-3">
          <div className="d-flex justify-content-between mb-1">
            <span style={{ fontSize: 12, color: '#6b7280' }}>Base (0–{config.baseStudentLimit} students)</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>₹{config.basePrice?.toLocaleString('en-IN')}</span>
          </div>
          {blocks > 0 && (
            <div className="d-flex justify-content-between mb-1">
              <span style={{ fontSize: 12, color: '#ea580c' }}>
                Extra {extra} students ({blocks} block{blocks > 1 ? 's' : ''} × ₹{config.extraBlockPrice})
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#ea580c' }}>
                ₹{(blocks * config.extraBlockPrice)?.toLocaleString('en-IN')}
              </span>
            </div>
          )}
          <hr className="my-2" />
          <div className="d-flex justify-content-between">
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0c3b73' }}>Total Amount</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0c3b73' }}>₹{price?.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Quick preview chips */}
        <div className="row g-2">
          {[350, 400, 500, 600, 700, 1000].map((s) => (
            <div className="col-4" key={s}>
              <div
                onClick={() => setPreviewCount(s)}
                className="border rounded text-center p-2"
                style={{ cursor: 'pointer', background: previewCount === s ? '#e8f0fa' : '#fff', borderColor: previewCount === s ? '#0c3b73' : '#dee2e6' }}
              >
                <div style={{ fontSize: 11, color: '#6b7280' }}>{s} students</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0c3b73' }}>
                  ₹{calculatePrice(s, config)?.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── History Item ─── */
const HistoryItem = ({ item, index }) => (
  <div className="d-flex align-items-start gap-3 py-2 border-bottom">
    <div
      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 text-muted fw-bold"
      style={{ width: 28, height: 28, background: '#f1f5f9', fontSize: 11 }}
    >
      {index + 1}
    </div>
    <div className="flex-1">
      <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>
        Base: ₹{item.basePrice} / {item.baseStudentLimit} students
        <span className="text-muted fw-normal mx-1">·</span>
        <span style={{ fontWeight: 400, color: '#6b7280' }}>
          Extra: ₹{item.extraBlockPrice} per {item.extraBlockSize} students
        </span>
      </div>
      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
        Changed on{' '}
        {new Date(item.changedAt || item.createdAt).toLocaleDateString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
        })}
        {item.changedBy && ` · by ${item.changedBy}`}
      </div>
    </div>
  </div>
)

const EMPTY_CONFIG = {
  baseStudentLimit: 350,
  basePrice: 1200,
  extraBlockSize: 50,
  extraBlockPrice: 100,
}

/* ═══ MAIN COMPONENT ═══ */
const PricingConfig = () => {
  const [config, setConfig] = useState(EMPTY_CONFIG)
  const [savedConfig, setSavedConfig] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const fetchConfig = async () => {
    setLoading(true)
    try {
      const res = await getRequest('pricing-config')
      const data = res?.data?.data
      if (data?.current) {
        setConfig(data.current)
        setSavedConfig(data.current)
      }
      if (data?.history) setHistory(data.history)
    } catch {
      setSavedConfig(EMPTY_CONFIG)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchConfig() }, [])

  const set = (key, val) => {
    setConfig((p) => ({ ...p, [key]: Number(val) || 0 }))
    setErrors((p) => ({ ...p, [key]: undefined }))
  }

  const validate = () => {
    const e = {}
    if (!config.baseStudentLimit || config.baseStudentLimit < 1) e.baseStudentLimit = 'Required'
    if (!config.basePrice || config.basePrice < 0) e.basePrice = 'Required'
    if (!config.extraBlockSize || config.extraBlockSize < 1) e.extraBlockSize = 'Required'
    if (!config.extraBlockPrice || config.extraBlockPrice < 0) e.extraBlockPrice = 'Required'
    return e
  }

  const handleSave = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); toast.error('Please fix errors'); return }
    setSaving(true)
    try {
      await putRequest({ url: 'pricing-config', cred: config })
      toast.success('Pricing configuration saved successfully')
      setSavedConfig({ ...config })
      fetchConfig()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save config')
    } finally {
      setSaving(false)
    }
  }

  const isDirty = JSON.stringify(config) !== JSON.stringify(savedConfig)

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: 300 }}>
        <Loader2 size={20} className="animate-spin text-muted me-2" />
        <span style={{ fontSize: 13, color: '#6b7280' }}>Loading pricing config...</span>
      </div>
    )
  }

  return (
    <div className="container-fluid px-0">

      {/* ── Page Header ── */}
      <div className="card mb-3">
        <div className="card-body py-3 d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0 d-flex align-items-center gap-2" style={{ fontSize: 16, fontWeight: 600, color: '#1e293b' }}>
              <Settings size={18} className="text-[#e24028]" />
              Pricing Configuration
            </h5>
            <p className="mb-0 text-muted" style={{ fontSize: 13, fontWeight: 400 }}>
              Set base price and per-student pricing rules
            </p>
          </div>
          {isDirty && (
            <span className="badge rounded-pill" style={{ background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', fontSize: 11, fontWeight: 500, padding: '4px 10px' }}>
              Unsaved changes
            </span>
          )}
        </div>
      </div>

      <div className="row g-4">

        {/* ── LEFT: Config Form ── */}
        <div className="col-lg-6">

          {/* Base Plan */}
          <div className="card mb-3">
            <div className="card-header !bg-[#0c3b73] text-white">Base Plan Pricing</div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">
                    Base Student Limit <span className="text-danger">*</span>
                  </label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text"><Users size={13} /></span>
                    <input
                      type="number"
                      min={1}
                      value={config.baseStudentLimit}
                      onChange={(e) => set('baseStudentLimit', e.target.value)}
                      className={`form-control form-control-sm ${errors.baseStudentLimit ? 'is-invalid' : ''}`}
                      placeholder="e.g. 350"
                    />
                    {errors.baseStudentLimit && <div className="invalid-feedback">{errors.baseStudentLimit}</div>}
                  </div>
                  <small className="text-muted">Max students included in base price</small>
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Base Price (₹) <span className="text-danger">*</span>
                  </label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text"><IndianRupee size={13} /></span>
                    <input
                      type="number"
                      min={0}
                      value={config.basePrice}
                      onChange={(e) => set('basePrice', e.target.value)}
                      className={`form-control form-control-sm ${errors.basePrice ? 'is-invalid' : ''}`}
                      placeholder="e.g. 1200"
                    />
                    {errors.basePrice && <div className="invalid-feedback">{errors.basePrice}</div>}
                  </div>
                  <small className="text-muted">Flat price for 0–{config.baseStudentLimit} students</small>
                </div>
              </div>
            </div>
          </div>

          {/* Extra Students */}
          <div className="card mb-3">
            <div className="card-header !bg-[#0c3b73] text-white">Extra Students Pricing</div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">
                    Block Size (students) <span className="text-danger">*</span>
                  </label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text"><Users size={13} /></span>
                    <input
                      type="number"
                      min={1}
                      value={config.extraBlockSize}
                      onChange={(e) => set('extraBlockSize', e.target.value)}
                      className={`form-control form-control-sm ${errors.extraBlockSize ? 'is-invalid' : ''}`}
                      placeholder="e.g. 50"
                    />
                    {errors.extraBlockSize && <div className="invalid-feedback">{errors.extraBlockSize}</div>}
                  </div>
                  <small className="text-muted">Price charged per this many extra students</small>
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Price per Block (₹) <span className="text-danger">*</span>
                  </label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text"><IndianRupee size={13} /></span>
                    <input
                      type="number"
                      min={0}
                      value={config.extraBlockPrice}
                      onChange={(e) => set('extraBlockPrice', e.target.value)}
                      className={`form-control form-control-sm ${errors.extraBlockPrice ? 'is-invalid' : ''}`}
                      placeholder="e.g. 100"
                    />
                    {errors.extraBlockPrice && <div className="invalid-feedback">{errors.extraBlockPrice}</div>}
                  </div>
                  <small className="text-muted">Charged per block of extra students</small>
                </div>
              </div>

              {/* Formula */}
              <div className="mt-3 p-3 rounded" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <p className="mb-1" style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>Current Formula:</p>
                <code style={{ fontSize: 12, color: '#0c3b73' }}>
                  Price = ₹{config.basePrice} + ceil((students − {config.baseStudentLimit}) / {config.extraBlockSize}) × ₹{config.extraBlockPrice}
                </code>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="d-flex justify-content-end">
            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="btn btn-sm d-flex align-items-center gap-2"
              style={{ background: '#0c3b73', color: '#fff', fontSize: 13, padding: '6px 20px', opacity: (saving || !isDirty) ? 0.6 : 1 }}
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>

        {/* ── RIGHT: Preview + History ── */}
        <div className="col-lg-6">

          <LivePreview config={config} />

          {/* Change History */}
          <div className="card">
            <div className="card-header !bg-[#0c3b73] text-white d-flex align-items-center gap-2">
              <History size={14} />
              <span>Pricing Change History</span>
            </div>
            <div className="card-body p-0">
              {history.length === 0 ? (
                <div className="text-center py-4">
                  <History size={22} className="text-muted mb-2" />
                  <p className="mb-0 text-muted" style={{ fontSize: 13 }}>No pricing changes recorded yet</p>
                </div>
              ) : (
                <div className="px-3" style={{ maxHeight: 280, overflowY: 'auto' }}>
                  {history.map((item, i) => (
                    <HistoryItem key={i} item={item} index={i} />
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default PricingConfig
