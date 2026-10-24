import React, { useState } from 'react'
import { Filter, X } from 'lucide-react'
import { Select } from 'antd'

const { Option } = Select

const ACTIVE_OPTIONS = [
  { value: 'true',  label: 'Active'   },
  { value: 'false', label: 'Inactive' },
]

const AgencyFilters = ({ onApply, onClear, appliedFilters }) => {
  const [draft, setDraft] = useState({
    search:   '',
    isActive: null,
    ...appliedFilters,
  })

  const hasActive =
    appliedFilters?.search ||
    (appliedFilters?.isActive !== null && appliedFilters?.isActive !== undefined)

  const handleApply = () => onApply({ ...draft })

  const handleClear = () => {
    const reset = { search: '', isActive: null }
    setDraft(reset)
    onClear()
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-orange-500" />
        <h3 className="text-sm font-semibold text-gray-700">Filters & Search</h3>
        {hasActive && (
          <span className="ml-auto text-xs text-orange-500 font-medium bg-orange-50 px-2 py-0.5 rounded-full">
            Filters active
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        {/* Search */}
        <div className="flex flex-col w-full sm:w-[220px]">
          <label className="text-xs font-medium text-gray-600 mb-1">Search</label>
          <input
            type="text"
            value={draft.search}
            onChange={(e) => setDraft((p) => ({ ...p, search: e.target.value }))}
            placeholder="Agency name, RERA no..."
            className="h-[32px] px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0c3b73] focus:border-[#0c3b73]"
          />
        </div>

        {/* Status */}
        <div className="flex flex-col w-full sm:w-[160px]">
          <label className="text-xs font-medium text-gray-600 mb-1">Status</label>
          <Select
            value={draft.isActive}
            placeholder="All"
            allowClear
            onChange={(v) => setDraft((p) => ({ ...p, isActive: v ?? null }))}
            size="middle"
          >
            {ACTIVE_OPTIONS.map(({ value, label }) => (
              <Option key={value} value={value}>{label}</Option>
            ))}
          </Select>
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
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default AgencyFilters
