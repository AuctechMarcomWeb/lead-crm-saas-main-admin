import React, { useState, useEffect } from 'react'
import { Modal } from 'antd'
import { CheckCircle, Clock, IndianRupee } from 'lucide-react'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import { patchRequest } from '../../../Helpers'

const MarkBillPaidModal = ({ open, bill, onClose, onSuccess }) => {
  const [paidAt, setPaidAt] = useState(dayjs().format('YYYY-MM-DD'))
  const [paymentRef, setPaymentRef] = useState('')
  const [paidBy, setPaidBy] = useState('')
  const [remarks, setRemarks] = useState('')
  const [loading, setLoading] = useState(false)

  /* Reset fields on open */
  useEffect(() => {
    if (open) {
      setPaidAt(dayjs().format('YYYY-MM-DD'))
      setPaymentRef('')
      setPaidBy('')
      setRemarks('')
    }
  }, [open])

  if (!bill) return null

  const school = bill.tenantDetails
  const monthLabel = bill.billingMonth
    ? dayjs(bill.billingMonth + '-01').format('MMMM YYYY')
    : '—'

  const handleSubmit = async () => {
    if (!paidAt) { toast.error('Select payment date'); return }
    setLoading(true)
    try {
      await patchRequest({
        url: `monthly-billing/${bill._id}/mark-paid`,
        cred: { paidAt, paymentRef, paidBy, remarks },
      })
      toast.success('Bill marked as paid')
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
      width={400}
      destroyOnClose
      title={
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle size={15} />
          Mark Bill as Paid
        </div>
      }
    >
      <div className="space-y-3 mt-3">

        {/* Bill info card */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 space-y-1.5">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-gray-800 text-sm">{school?.schoolName || '—'}</p>
              <p className="text-xs text-gray-400 mt-0.5">{monthLabel}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-[#0c3b73] flex items-center gap-0.5 justify-end">
                <IndianRupee size={12} />
                {Number(bill.totalAmount ?? 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {bill.studentCount} students
              </p>
            </div>
          </div>

          {/* Amount breakdown */}
          <div className="border-t border-gray-200 pt-2 grid grid-cols-3 gap-1 text-center">
            <div>
              <div className="text-[9px] text-gray-400 uppercase">Base</div>
              <div className="text-xs font-medium text-gray-700">₹{bill.baseAmount?.toLocaleString('en-IN')}</div>
            </div>
            <div>
              <div className="text-[9px] text-gray-400 uppercase">Addon</div>
              <div className="text-xs font-medium text-amber-600">+₹{bill.addonAmount?.toLocaleString('en-IN') || 0}</div>
            </div>
            <div>
              <div className="text-[9px] text-gray-400 uppercase">Total</div>
              <div className="text-xs font-bold text-[#0c3b73]">₹{bill.totalAmount?.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>

        {/* Payment date */}
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">
            Payment Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
            className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0c3b73]"
          />
        </div>

        {/* Payment reference */}
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">
            Payment Reference{' '}
            <span className="text-gray-400 font-normal">(UTR / Cheque / Transaction ID)</span>
          </label>
          <input
            type="text"
            value={paymentRef}
            onChange={(e) => setPaymentRef(e.target.value)}
            placeholder="e.g. UTR123456789"
            className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0c3b73]"
          />
        </div>

        {/* Paid by */}
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">
            Received By <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            placeholder="Admin name"
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
            {loading && <Clock size={13} className="animate-spin" />}
            {loading ? 'Saving…' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default MarkBillPaidModal
