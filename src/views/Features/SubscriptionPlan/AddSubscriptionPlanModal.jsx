import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { Select, Modal } from 'antd'
import toast from 'react-hot-toast'
import { postRequest, putRequest } from '../../../Helpers'

const { Option } = Select

const BILLING_CYCLES = ['Monthly', 'Yearly']

const PLAN_TYPES = [
  { value: 'Plan',  label: 'Subscription Plan' },
  { value: 'Addon', label: 'Add-on' },
]


const EMPTY_FORM = {
  name: '',
  description: '',
  planType: 'Plan',
  billingCycle: 'Monthly',
  price: '',
  features: [''],
  studentLimit: '',
  trialDays: '',
}

const SubscriptionModal = ({ open, onClose, editData, planType = 'Plan', refresh }) => {
  const isEdit = !!editData

  const [form, setForm]     = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editData) {
      setForm({
        name:         editData.name || '',
        description:  editData.description || '',
        planType:     editData.planType || 'Plan',
        billingCycle: editData.billingCycle || 'Monthly',
        price:        editData.price !== undefined ? String(editData.price) : '',
        features:     editData.features?.length ? editData.features : [''],
        studentLimit: editData.studentLimit !== undefined ? String(editData.studentLimit) : '',
        trialDays:    editData.trialDays !== undefined ? String(editData.trialDays) : '',
      })
    } else {
      setForm({ ...EMPTY_FORM, planType })
    }
    setErrors({})
  }, [editData, open])

  const set = (key, value) => {
    setForm((p) => ({ ...p, [key]: value }))
    setErrors((p) => ({ ...p, [key]: undefined }))
  }

  const addFeature    = () => set('features', [...form.features, ''])
  const updateFeature = (i, v) => { const u = [...form.features]; u[i] = v; set('features', u) }
  const removeFeature = (i) => { const u = form.features.filter((_, j) => j !== i); set('features', u.length ? u : ['']) }

  const validate = () => {
    const e = {}
    if (!form.planType)    e.planType = 'Plan type is required'
    if (!form.name.trim()) e.name     = 'Name is required'
    if (form.price === '' || form.price === null)
      e.price = 'Price is required'
    else if (isNaN(Number(form.price)) || Number(form.price) < 0)
      e.price = 'Enter a valid positive price'
    if (!form.studentLimit)
      e.studentLimit = 'Student limit is required'
    else if (isNaN(Number(form.studentLimit)) || Number(form.studentLimit) < 1)
      e.studentLimit = 'Enter a valid student limit (minimum 1)'
    if (!form.features.filter((f) => f.trim()).length)
      e.features = 'At least one feature is required'
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
        name: form.name.trim(),
        ...(isEdit ? {} : { planType: form.planType }),
        price:        Number(form.price) || 0,
        studentLimit: Number(form.studentLimit) || 0,
        billingCycle: form.billingCycle,
        features:     form.features.filter((f) => f.trim()),
        trialDays:    Number(form.trialDays) || 0,
        ...(form.description.trim() ? { description: form.description.trim() } : {}),
      }
      if (isEdit) {
        await putRequest({ url: `subscriptionPlan/${editData._id}`, cred: payload })
        toast.success(`${form.planType === 'Addon' ? 'Add-on' : 'Plan'} updated successfully`)
      } else {
        await postRequest({ url: 'subscriptionPlan', cred: payload })
        toast.success(`${form.planType === 'Addon' ? 'Add-on' : 'Plan'} created successfully`)
      }
      refresh()
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || (isEdit ? 'Update failed' : 'Creation failed'))
    } finally {
      setLoading(false)
    }
  }

  const entityLabel = form.planType === 'Addon' ? 'Add-on' : 'Plan'

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={580}
      destroyOnClose
      styles={{ header: { borderBottom: '1px solid #f1f5f9', paddingBottom: 12 } }}
      title={
        <div className="flex items-center gap-3">
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: '#0c3b73',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ color: '#fff', fontSize: 16 }}>
              {form.planType === 'Addon' ? '＋' : '📋'}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 leading-tight m-0">
              {isEdit ? `Edit ${entityLabel}` : `Create ${entityLabel}`}
            </p>
            <p className="text-xs text-gray-400 font-normal mt-0.5 m-0">
              {isEdit ? 'Update the details below' : 'Fill in all required fields to create a new plan'}
            </p>
          </div>
        </div>
      }
    >
      <div className="max-h-[72vh] overflow-y-auto px-1 py-3 space-y-4">

        {/* ── Plan Type ── */}
        <Field label={<RequiredLabel label="Plan Type" />} error={errors.planType}>
          <Select
            value={form.planType}
            onChange={(v) => set('planType', v)}
            className="w-full"
            status={errors.planType ? 'error' : ''}
            disabled={isEdit}
          >
            {PLAN_TYPES.map(({ value, label }) => (
              <Option key={value} value={value}>{label}</Option>
            ))}
          </Select>
          {isEdit && <LockedNote text="Plan type cannot be changed after creation" />}
        </Field>

        {/* ── Plan Name ── */}
        <Field label={<RequiredLabel label={`${entityLabel} Name`} />} error={errors.name}>
          <input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder={form.planType === 'Addon' ? 'e.g. 50 Students Add-on' : 'e.g. Pro Plan'}
            className={inputCls(errors.name)}
          />
        </Field>

        {/* ── Description ── */}
        <Field label="Description" error={errors.description}>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Optional — brief description of this plan"
            rows={2}
            className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0c3b73] focus:border-[#0c3b73] transition resize-none ${
              errors.description ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'
            }`}
          />
        </Field>

        {/* ── Billing Cycle & Price ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={<RequiredLabel label="Billing Cycle" />} error={errors.billingCycle}>
            <Select
              value={form.billingCycle}
              onChange={(v) => set('billingCycle', v)}
              className="w-full"
              status={errors.billingCycle ? 'error' : ''}
            >
              {BILLING_CYCLES.map((c) => (
                <Option key={c} value={c}>{c}</Option>
              ))}
            </Select>
          </Field>

          <Field label={<RequiredLabel label="Price (₹)" />} error={errors.price}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">₹</span>
              <input
                type="number"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                placeholder="e.g. 1200"
                min={0}
                className={`${inputCls(errors.price)} pl-7`}
              />
            </div>
          </Field>
        </div>

        {/* ── Student Limit ── */}
        <Field label={<RequiredLabel label="Student Limit" />} error={errors.studentLimit}>
          <input
            type="number"
            value={form.studentLimit}
            onChange={(e) => set('studentLimit', e.target.value)}
            placeholder={form.planType === 'Addon' ? 'e.g. 50' : 'e.g. 350'}
            min={1}
            className={inputCls(errors.studentLimit)}
          />
        </Field>

        {/* ── Trial Days (Plans only) ── */}
        {form.planType === 'Plan' && (
          <Field
            label={
              <span>Trial Days <span className="text-[10px] font-normal text-gray-400">(0 = no trial)</span></span>
            }
            error={errors.trialDays}
          >
            <input
              type="number"
              value={form.trialDays}
              onChange={(e) => set('trialDays', e.target.value)}
              placeholder="e.g. 30"
              min={0}
              className={inputCls(errors.trialDays)}
            />
            {Number(form.trialDays) > 0 && Number(form.studentLimit) > 0 && (
              <InfoBox color="amber">
                <strong>Free Trial:</strong> New tenant will get <strong>{form.trialDays} days</strong> free trial with a limit of <strong>{Number(form.studentLimit).toLocaleString('en-IN')} students</strong>.
              </InfoBox>
            )}
            {Number(form.trialDays) > 0 && !Number(form.studentLimit) && (
              <InfoBox color="red">
                <strong>Note:</strong> Please set a Student Limit for the trial period (e.g. 350), otherwise the default of 350 will be applied.
              </InfoBox>
            )}
          </Field>
        )}

        {/* ── Features ── */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-600">
              <RequiredLabel label="Features" />
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
                  placeholder={`Feature ${index + 1}`}
                  className={`flex-1 h-[32px] px-3 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0c3b73] focus:border-[#0c3b73] transition ${
                    errors.features ? 'border-red-400' : 'border-gray-300'
                  }`}
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
          {errors.features && <p className="text-xs text-red-500 mt-0.5">{errors.features}</p>}
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
            : (isEdit ? `Update ${entityLabel}` : `Create ${entityLabel}`)}
        </button>
      </div>
    </Modal>
  )
}

/* ── Sub-components ── */
const RequiredLabel = ({ label }) => (
  <>{label} <span className="text-red-500">*</span></>
)

const LockedNote = ({ text }) => (
  <p className="text-xs text-gray-400 mt-0.5">{text}</p>
)

const INFO_STYLES = {
  green: 'bg-green-50 border-green-100 text-green-800',
  blue:  'bg-blue-50 border-blue-100 text-blue-800',
  amber: 'bg-amber-50 border-amber-100 text-amber-800',
  red:   'bg-red-50 border-red-100 text-red-700',
}

const InfoBox = ({ color = 'blue', children }) => (
  <div className={`mt-1.5 px-3 py-2 rounded-lg border text-[11px] leading-relaxed ${INFO_STYLES[color]}`}>
    {children}
  </div>
)

const Field = ({ label, error, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-gray-600">{label}</label>
    {children}
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
)

const inputCls = (error) =>
  `w-full h-[34px] px-3 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0c3b73] focus:border-[#0c3b73] transition ${
    error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'
  }`

export default SubscriptionModal
