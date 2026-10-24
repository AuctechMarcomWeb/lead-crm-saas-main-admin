import React, { useState } from 'react'
import { Filter, X } from 'lucide-react'
import { Select } from 'antd'

const { Option } = Select

const BILLING_CYCLES = ['Monthly', 'Quarterly', 'Yearly']

const AddOnFilters = ({ onApply, onClear, appliedFilters }) => {
  const [draft, setDraft] = useState({
    billingCycle: null,
    minPrice: '',
    maxPrice: '',
    ...appliedFilters,
  })

  const hasActive =
    appliedFilters?.billingCycle || appliedFilters?.minPrice || appliedFilters?.maxPrice

  const handleApply = () => onApply({ ...draft })

  const handleClear = () => {
    const reset = { billingCycle: null, minPrice: '', maxPrice: '' }
    setDraft(reset)
    onClear()
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-orange-500" />
        <h3 className="text-sm font-semibold text-gray-700">Filters & Search</h3>
        {hasActive && (
          <span className="ml-auto text-xs text-orange-500 font-medium bg-orange-50 px-2 py-0.5 rounded-full">
            Filters active
          </span>
        )}
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-3 items-end">
        {/* Billing Cycle */}
        <div className="flex flex-col w-full sm:w-[180px]">
          <label className="text-xs font-medium text-gray-600 mb-1">Billing Cycle</label>
          <Select
            value={draft.billingCycle}
            placeholder="All Cycles"
            allowClear
            onChange={(v) => setDraft((p) => ({ ...p, billingCycle: v ?? null }))}
            size="middle"
          >
            {BILLING_CYCLES.map((c) => (
              <Option key={c} value={c}>
                {c}
              </Option>
            ))}
          </Select>
        </div>

        {/* Min Price */}
        <div className="flex flex-col w-full sm:w-[140px]">
          <label className="text-xs font-medium text-gray-600 mb-1">Min Price (₹)</label>
          <input
            type="number"
            value={draft.minPrice}
            onChange={(e) => setDraft((p) => ({ ...p, minPrice: e.target.value }))}
            placeholder="e.g. 99"
            min={0}
            className="h-[32px] px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0c3b73] focus:border-[#0c3b73]"
          />
        </div>

        {/* Max Price */}
        <div className="flex flex-col w-full sm:w-[140px]">
          <label className="text-xs font-medium text-gray-600 mb-1">Max Price (₹)</label>
          <input
            type="number"
            value={draft.maxPrice}
            onChange={(e) => setDraft((p) => ({ ...p, maxPrice: e.target.value }))}
            placeholder="e.g. 999"
            min={0}
            className="h-[32px] px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0c3b73] focus:border-[#0c3b73]"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pb-0.5">
          <button
            onClick={handleApply}
            className="h-[32px] px-5 rounded-md bg-[#0c3b73] text-white text-sm hover:bg-[#0a2f5c] transition-colors"
          >
            Apply
          </button>
          {hasActive && (
            <button
              onClick={handleClear}
              className="h-[32px] px-4 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm transition-colors flex items-center gap-1.5"
            >
              <X size={13} />
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default AddOnFilters
