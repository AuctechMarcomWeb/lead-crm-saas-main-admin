import React, { useState, useEffect } from 'react'
import { Modal, Select } from 'antd'
import { Loader2, HelpCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { postRequest, putRequest } from '../../../Helpers'

const { Option } = Select

const EMPTY_FORM = { category: '', question: '', answer: '' }

const FAQModal = ({ open, onClose, editData, categories = [], refresh }) => {
  const isEdit = !!editData
  const [form, setForm]     = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  /* ── prefill ── */
  useEffect(() => {
    if (editData) {
      setForm({
        category: editData.category || '',
        question: editData.question || '',
        answer:   editData.answer   || '',
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setErrors({})
  }, [editData, open])

  const set = (key, val) => {
    setForm(p => ({ ...p, [key]: val }))
    setErrors(p => ({ ...p, [key]: undefined }))
  }

  /* ── validation ── */
  const validate = () => {
    const e = {}
    if (!form.category.trim()) e.category = 'Category is required'
    if (!form.question.trim()) e.question  = 'Question is required'
    if (!form.answer.trim())   e.answer    = 'Answer is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  /* ── submit ── */
  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const payload = {
        category: form.category.trim(),
        question: form.question.trim(),
        answer:   form.answer.trim(),
      }
      if (isEdit) {
        await putRequest({ url: `faq/${editData._id}`, cred: payload })
        toast.success('FAQ updated successfully')
      } else {
        await postRequest({ url: 'faq', cred: payload })
        toast.success('FAQ created successfully')
      }
      refresh()
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || (isEdit ? 'Update failed' : 'Create failed'))
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
      title={
        <div className="flex items-center gap-2">
          <HelpCircle size={16} className="text-[#0c3b73]" />
          <div>
            <p className="text-sm font-semibold text-gray-800 leading-tight m-0">
              {isEdit ? 'Edit FAQ' : 'Add New FAQ'}
            </p>
            <p className="text-xs text-gray-400 font-normal m-0">
              {isEdit ? 'Update FAQ details below' : 'Fill in category, question and answer'}
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-4 mt-3">

        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          {/* Free-text input + datalist from existing categories */}
          <input
            list="faq-categories"
            value={form.category}
            onChange={e => set('category', e.target.value)}
            placeholder="e.g. Billing, Technical, General"
            className={`w-full h-9 px-3 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0c3b73] focus:border-[#0c3b73] transition ${
              errors.category ? 'border-red-400' : 'border-gray-300'
            }`}
          />
          <datalist id="faq-categories">
            {categories.map(c => <option key={c} value={c} />)}
          </datalist>
          {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
        </div>

        {/* Question */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Question <span className="text-red-500">*</span>
          </label>
          <input
            value={form.question}
            onChange={e => set('question', e.target.value)}
            placeholder="Enter the FAQ question"
            className={`w-full h-9 px-3 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0c3b73] focus:border-[#0c3b73] transition ${
              errors.question ? 'border-red-400' : 'border-gray-300'
            }`}
          />
          {errors.question && <p className="text-xs text-red-500 mt-1">{errors.question}</p>}
        </div>

        {/* Answer */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Answer <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.answer}
            onChange={e => set('answer', e.target.value)}
            placeholder="Enter the detailed answer"
            rows={5}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0c3b73] focus:border-[#0c3b73] transition resize-none ${
              errors.answer ? 'border-red-400' : 'border-gray-300'
            }`}
          />
          {errors.answer && <p className="text-xs text-red-500 mt-1">{errors.answer}</p>}
        </div>

      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 pt-4 mt-3 border-t border-gray-100">
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
          {loading && <Loader2 size={13} className="animate-spin" />}
          {loading ? (isEdit ? 'Updating...' : 'Saving...') : (isEdit ? 'Update FAQ' : 'Save FAQ')}
        </button>
      </div>
    </Modal>
  )
}

export default FAQModal
