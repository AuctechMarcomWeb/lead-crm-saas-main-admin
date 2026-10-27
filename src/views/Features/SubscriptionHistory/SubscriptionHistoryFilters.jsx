import React, { useState, useEffect } from 'react'
import { Filter, X, Search } from 'lucide-react'
import { Select, Input } from 'antd'

const { Option } = Select

const STATUS_COLORS = { ACTIVE: 'green', EXPIRED: 'red', PENDING: 'orange', CANCELLED: 'volcano', TRIAL: 'blue' }
const CYCLE_COLORS = { Monthly: 'blue', Quarterly: 'purple', Yearly: 'green' }
const PAID_STATUS_OPTIONS = ['PAID', 'UNPAID', 'PENDING', 'OVERDUE']

const SubscriptionHistoryFilters = ({
  appliedFilters,
  schools = [],
  schoolsLoading = false,
  onApply,
  onClear,
  onSearch,
}) => {
  const [draft, setDraft] = useState({ ...appliedFilters })
  const [searchText, setSearchText] = useState(appliedFilters.search || '')

  /* keep draft in sync if parent resets appliedFilters */
  useEffect(() => {
    setDraft({ ...appliedFilters })
    setSearchText(appliedFilters.search || '')
  }, [appliedFilters])

  const set = (key, val) => setDraft((p) => ({ ...p, [key]: val ?? null }))

  const hasActive = Object.values(appliedFilters).some(Boolean)
  const hasDraft = Object.values(draft).some(Boolean) || !!searchText

  const handleApply = () => onApply({ ...draft })

  const handleClear = () => {
    const reset = { tenantId: null, status: null, billingCycle: null, planType: null, paidStatus: null }
    setDraft(reset)
    setSearchText('')
    onClear()
  }

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchText(value)
    set('search', value || null)
    onSearch?.(value)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-orange-500" />
        <h3 className="text-sm font-semibold text-gray-700">Filters</h3>
        {hasActive && (
          <span className="ml-auto text-xs text-orange-500 font-medium bg-orange-50 px-2 py-0.5 rounded-full">
            Filters active
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        {/* Search */}
        <div className="flex flex-col w-full sm:w-[200px]">
          <label className="text-xs font-medium text-gray-600 mb-1">Search</label>
          <Input
            placeholder="Search by plan name..."
            prefix={<Search className="w-3.5 h-3.5 text-gray-400" />}
            value={searchText}
            onChange={handleSearchChange}
            allowClear
            size="middle"
            onClear={() => {
              setSearchText('')
              set('search', null)
              onSearch?.('')
            }}
          />
        </div>

        {/* Agency */}
        <div className="flex flex-col w-full sm:w-[220px]">
          <label className="text-xs font-medium text-gray-600 mb-1">Agency</label>
          <Select
            allowClear
            placeholder="All Agencies"
            loading={schoolsLoading}
            value={draft.tenantId}
            onChange={(v) => set('tenantId', v)}
            size="middle"
          >
            {schools.map((agency) => (
              <Option key={agency._id} value={agency._id}>
                {agency.agencyName || agency.schoolName || agency.name}
              </Option>
            ))}
          </Select>
        </div>

        {/* Subscription Status */}
        <div className="flex flex-col w-full sm:w-[150px]">
          <label className="text-xs font-medium text-gray-600 mb-1">Sub. Status</label>
          <Select
            allowClear
            placeholder="All statuses"
            value={draft.status}
            onChange={(v) => set('status', v)}
            size="middle"
          >
            {Object.keys(STATUS_COLORS).map((s) => (
              <Option key={s} value={s}>{s}</Option>
            ))}
          </Select>
        </div>

        {/* Payment Status */}
        <div className="flex flex-col w-full sm:w-[150px]">
          <label className="text-xs font-medium text-gray-600 mb-1">Payment</label>
          <Select
            allowClear
            placeholder="All payments"
            value={draft.paidStatus}
            onChange={(v) => set('paidStatus', v)}
            size="middle"
          >
            {PAID_STATUS_OPTIONS.map((s) => (
              <Option key={s} value={s}>{s}</Option>
            ))}
          </Select>
        </div>

        {/* Billing Cycle */}
        <div className="flex flex-col w-full sm:w-[150px]">
          <label className="text-xs font-medium text-gray-600 mb-1">Billing Cycle</label>
          <Select
            allowClear
            placeholder="All cycles"
            value={draft.billingCycle}
            onChange={(v) => set('billingCycle', v)}
            size="middle"
          >
            {Object.keys(CYCLE_COLORS).map((c) => (
              <Option key={c} value={c}>{c}</Option>
            ))}
          </Select>
        </div>

        {/* Plan Type */}
        <div className="flex flex-col w-full sm:w-[140px]">
          <label className="text-xs font-medium text-gray-600 mb-1">Plan Type</label>
          <Select
            allowClear
            placeholder="Plan / Addon"
            value={draft.planType}
            onChange={(v) => set('planType', v)}
            size="middle"
          >
            <Option value="Plan">Plan</Option>
            <Option value="Addon">Addon</Option>
          </Select>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pb-0.5">
          <button
            onClick={handleApply}
            disabled={!hasDraft}
            className="h-[32px] px-5 rounded-md bg-[#0c3b73] text-white text-sm hover:bg-[#0a2f5c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

export default SubscriptionHistoryFilters
