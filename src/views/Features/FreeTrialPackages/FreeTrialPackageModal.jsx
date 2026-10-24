import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2, Gift } from 'lucide-react'
import { Switch, Modal } from 'antd'
import toast from 'react-hot-toast'
import { postRequest, putRequest } from '../../../Helpers'

/* ── helpers ── */
const inputCls = (error) =>
  `w-full h-[34px] px-3 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0c3b73] focus:border-[#0c3b73] transition ${
    error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'
  }`

const Field = ({ label, error, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-gray-600">{label}</label>
    {children}
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
)

const RequiredLabel = ({ label }) => (
  <>{label} <span className="text-red-500">*</span></>
)

const INFO_STYLES = {
  blue:  'bg-blue-50 border-blue-100 text-blue-800',
  amber: 'bg-amber-50 border-amber-100 text-amber-800',
  green: 'bg-green-50 border-green-100 text-green-800',
}

const InfoBox = ({ color = 'blue', children }) => (
  <div className={`mt-1.5 px-3 py-2 rounded-lg border text-[11px] leading-relaxed ${INFO_STYLES[color]}`}>
    {children}
  </div>
)

const EMPTY_FORM = {
  name:         '',
  description:  '',
  durationDays: '',
  features:     [''],
  isDefault:    false,
  eligibleOnce: true,
  isActive:     true,
}

const FreeTrialPackageModal = ({ open, onClose, editData, refresh }) => {
  const isEdit = !!editData

  const [form, setForm]     = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editData) {
      setForm({
        name:         editData.name         || '',
        description:  editData.description  || '',
        durationDays: editData.durationDays !== undefined ? String(editData.durationDays) : '',
        features:     editData.features?.length ? editData.features : [''],
        isDefault:    editData.isDefault    || false,
        eligibleOnce: editData.eligibleOnce !== false,
        isActive:     editData.isActive     !== false,
      })
    } else {
      setForm({ ...EMPTY_FORM })
    }
    setErrors({})
  }, [editData, open])

  const set = (key, value) => {
    setForm((p) => ({ ...p, [key]: value }))
    setErrors((p) => ({ ...p, [key]: undefined }))
  }

  const addFeature    = () => set('features', [...form.features, ''])
  const updateFeature = (i, v) => { const u = [...form.features]; u[i] = v; set('features', u) }
  const removeFeature = (i) => {
    const u = form.features.filter((_, j) => j !== i)
    set('features', u.length ? u : [''])
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim())
      e.name = 'Package name is required'
    if (!form.durationDays || Number(form.durationDays) < 1)
      e.durationDays = 'Trial duration must be at least 1 day'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length) {
      setErrors(e)
      toast.error('Please fix the errors before submitting')
      return
    }
    setLoading(true)
    try {
      const payload = {
        name:         form.name.trim(),
        description:  form.description.trim(),
        durationDays: Number(form.durationDays),
        features:     form.features.filter((f) => f.trim()),
        isDefault:    form.isDefault,
        eligibleOnce: form.eligibleOnce,
        isActive:     form.isActive,
      }

      if (isEdit) {
        await putRequest({ url: `free-trial-packages/${editData._id}`, cred: payload })
        toast.success(`Package "${form.name}" updated successfully`)
      } else {
        await postRequest({ url: 'free-trial-packages', cred: payload })
        toast.success(`Package "${form.name}" created successfully`)
      }
      refresh()
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || (isEdit ? 'Update failed' : 'Creation failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
      destroyOnClose
      styles={{ header: { borderBottom: '1px solid #f1f5f9', paddingBottom: 12 } }}
      title={
        <div className="flex items-center gap-3">
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: '#0c3b73',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Gift size={18} color="#fff" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 leading-tight m-0">
              {isEdit ? 'Edit Free Trial Package' : 'Create Free Trial Package'}
            </p>
            <p className="text-xs text-gray-400 font-normal mt-0.5 m-0">
              {isEdit
                ? 'Update the trial package details below'
                : 'Define a new trial package for new agency registrations'}
            </p>
          </div>
        </div>
      }
    >
      <div className="max-h-[72vh] overflow-y-auto px-1 py-3 space-y-4">

        {/* ── Package Name ── */}
        <Field label={<RequiredLabel label="Package Name" />} error={errors.name}>
          <input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. 30-Day Starter Trial"
            className={inputCls(errors.name)}
          />
        </Field>

        {/* ── Description ── */}
        <Field label="Description" error={errors.description}>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Optional — brief description of this trial package"
            rows={2}
            className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0c3b73] focus:border-[#0c3b73] transition resize-none ${
              errors.description ? 'border-red-400' : 'border-gray-300'
            }`}
          />
        </Field>

        {/* ── Duration ── */}
        <div className="grid grid-cols-1 gap-4">
          <Field label={<RequiredLabel label="Duration (Days)" />} error={errors.durationDays}>
            <input
              type="number"
              value={form.durationDays}
              onChange={(e) => set('durationDays', e.target.value)}
              placeholder="e.g. 30"
              min={1}
              className={inputCls(errors.durationDays)}
            />
          </Field>
        </div>

        {/* Preview */}
        {form.durationDays && Number(form.durationDays) > 0 && (
          <InfoBox color="green">
            🎁 New agency will get a <strong>{form.durationDays}-day</strong> free trial.
          </InfoBox>
        )}

        {/* ── Features ── */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-600">
              Included Features <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <button
              onClick={addFeature}
              className="flex items-center gap-1 text-xs text-[#0c3b73] hover:text-[#0a2f5c] font-semibold transition"
            >
              <Plus size={13} /> Add Feature
            </button>
          </div>
          <div className="space-y-1.5">
            {form.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-5 text-right flex-shrink-0">{index + 1}.</span>
                <input
                  value={feature}
                  onChange={(e) => updateFeature(index, e.target.value)}
                  placeholder={`Feature ${index + 1}, e.g. Student Management`}
                  className="flex-1 h-[32px] px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0c3b73] focus:border-[#0c3b73] transition"
                />
                {form.features.length > 1 && (
                  <button
                    onClick={() => removeFeature(index)}
                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Toggles ── */}
        <div className="space-y-3 pt-1">

          {/* Set as Default */}
          <div className="flex items-start justify-between gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <div>
              <p className="text-sm font-semibold text-amber-800 leading-tight">Set as Default Package</p>
              <p className="text-xs text-amber-700 mt-0.5">
                When enabled, this package will be automatically assigned to all new school registrations.
                Only one package can be default at a time.
              </p>
            </div>
            <Switch
              checked={form.isDefault}
              onChange={(v) => set('isDefault', v)}
              checkedChildren="Yes"
              unCheckedChildren="No"
            />
          </div>

          {/* Eligible Once */}
          <div className="flex items-start justify-between gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
            <div>
              <p className="text-sm font-semibold text-gray-700 leading-tight">One-Time Eligibility</p>
              <p className="text-xs text-gray-500 mt-0.5">
                When enabled, a school can receive this trial package only once. Admin can reset eligibility manually.
              </p>
            </div>
            <Switch
              checked={form.eligibleOnce}
              onChange={(v) => set('eligibleOnce', v)}
              checkedChildren="Yes"
              unCheckedChildren="No"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
            <div>
              <p className="text-sm font-semibold text-gray-700 leading-tight">Active</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Inactive packages will not be assigned to new agency.
              </p>
            </div>
            <Switch
              checked={form.isActive}
              onChange={(v) => set('isActive', v)}
              checkedChildren="Active"
              unCheckedChildren="Inactive"
            />
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-gray-100">
        <button
          onClick={onClose}
          className="px-5 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-6 py-2 text-sm rounded-lg text-white transition flex items-center gap-2 disabled:opacity-60 font-semibold bg-[#0c3b73] hover:bg-[#0a2f5c]"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {loading
            ? (isEdit ? 'Updating...' : 'Creating...')
            : (isEdit ? 'Update Package' : 'Create Package')}
        </button>
      </div>
    </Modal>
  )
}

export default FreeTrialPackageModal
