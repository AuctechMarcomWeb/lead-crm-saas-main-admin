import React, { useState, useEffect } from 'react'
import { Plus, Trash2, PackagePlus, Loader2 } from 'lucide-react'
import { Select, Modal } from 'antd'
import toast from 'react-hot-toast'
// import { postRequest, putRequest } from '../../../../../Helpers'

const { Option } = Select

const BILLING_CYCLES = ['Monthly', 'Quarterly', 'Yearly']

const EMPTY_FORM = {
  planName: '',
  billingCycle: null,
  price: '',
  features: [''],
}

const AddOnModal = ({ open, onClose, editData, refresh }) => {
  const isEdit = !!editData
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  /* Pre-fill on edit */
  useEffect(() => {
    if (editData) {
      setForm({
        planName: editData.planName || '',
        billingCycle: editData.billingCycle || null,
        price: editData.price !== undefined ? String(editData.price) : '',
        features: editData.features?.length ? editData.features : [''],
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setErrors({})
  }, [editData, open])

  const set = (key, value) => {
    setForm((p) => ({ ...p, [key]: value }))
    setErrors((p) => ({ ...p, [key]: undefined }))
  }

  /* Feature helpers */
  const addFeature = () => set('features', [...form.features, ''])

  const updateFeature = (index, value) => {
    const updated = [...form.features]
    updated[index] = value
    set('features', updated)
  }

  const removeFeature = (index) => {
    const updated = form.features.filter((_, i) => i !== index)
    set('features', updated.length ? updated : [''])
  }

  /* Validation */
  const validate = () => {
    const e = {}
    if (!form.planName.trim()) e.planName = 'Plan name is required'
    if (!form.billingCycle) e.billingCycle = 'Billing cycle is required'
    if (!form.price) e.price = 'Price is required'
    else if (isNaN(Number(form.price)) || Number(form.price) < 0)
      e.price = 'Enter a valid positive price'
    const nonEmpty = form.features.filter((f) => f.trim())
    if (!nonEmpty.length) e.features = 'At least one feature is required'
    return e
  }

  const handleSubmit = async () => {
    // const e = validate()
    // if (Object.keys(e).length) {
    //   setErrors(e)
    //   toast.error('Please fix the errors before submitting')
    //   return
    // }
    // setLoading(true)
    // try {
    //   const payload = {
    //     planName: form.planName.trim(),
    //     billingCycle: form.billingCycle,
    //     price: Number(form.price),
    //     features: form.features.filter((f) => f.trim()),
    //   }
    //   if (isEdit) {
    //     await putRequest({ url: `addon-plans/${editData._id}`, cred: payload })
    //     toast.success('Add-on updated successfully')
    //   } else {
    //     await postRequest({ url: 'addon-plans', cred: payload })
    //     toast.success('Add-on created successfully')
    //   }
    //   refresh()
    //   onClose()
    // } catch (err) {
    //   toast.error(isEdit ? 'Update failed' : 'Creation failed')
    // } finally {
    //   setLoading(false)
    // }
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
      destroyOnClose
      title={
        <div className="flex items-center gap-2">
        
          <div>
            <p className="text-base font-semibold text-gray-800 leading-tight">
              {isEdit ? 'Edit Add-On Plan' : 'Create Add-On Plan'}
            </p>
            <p className="text-xs text-gray-400 font-normal">
              {isEdit ? 'Update add-on details' : 'Fill in all required details'}
            </p>
          </div>
        </div>
      }
    >
      <div className="max-h-[75vh] overflow-y-auto p-1 mt-2 space-y-4">
        {/* ── Plan Name ── */}
        <Field label="Plan Name *" error={errors.planName}>
          <input
            value={form.planName}
            onChange={(e) => set('planName', e.target.value)}
            placeholder="e.g. Extra Storage Pack"
            className={input(errors.planName)}
          />
        </Field>

        {/* ── Billing Cycle & Price ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Billing Cycle *" error={errors.billingCycle}>
            <Select
              value={form.billingCycle}
              placeholder="Select cycle"
              onChange={(v) => set('billingCycle', v)}
              className="w-full"
              status={errors.billingCycle ? 'error' : ''}
            >
              {BILLING_CYCLES.map((c) => (
                <Option key={c} value={c}>
                  {c}
                </Option>
              ))}
            </Select>
            {errors.billingCycle && (
              <p className="text-xs text-red-500 mt-0.5">{errors.billingCycle}</p>
            )}
          </Field>

          <Field label="Price (₹) *" error={errors.price}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
                ₹
              </span>
              <input
                type="number"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                placeholder="e.g. 199"
                min={0}
                className={`${input(errors.price)} pl-7`}
              />
            </div>
          </Field>
        </div>

        {/* ── Features ── */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-600">Features *</label>
            <button
              onClick={addFeature}
              className="flex items-center gap-1 text-xs text-[#0c3b73] hover:text-[#0a2f5c] font-medium"
            >
              <Plus size={13} />
              Add Feature
            </button>
          </div>

          <div className="space-y-2 mt-1">
            {form.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-5 text-right flex-shrink-0">
                  {index + 1}.
                </span>
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

      {/* Footer */}
      <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-100">
        <button
          onClick={onClose}
          className="px-5 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-6 py-2 text-sm rounded-lg bg-[#0c3b73] text-white hover:bg-[#0a2f5c] transition flex items-center gap-2 disabled:opacity-60"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {loading
            ? isEdit
              ? 'Updating...'
              : 'Creating...'
            : isEdit
              ? 'Update Add-On'
              : 'Create Add-On'}
        </button>
      </div>
    </Modal>
  )
}

/* ─── Small helpers ─── */
const Field = ({ label, error, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-gray-600">{label}</label>
    {children}
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
)

const input = (error) =>
  `w-full h-[32px] px-3 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0c3b73] focus:border-[#0c3b73] transition ${
    error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'
  }`

export default AddOnModal
