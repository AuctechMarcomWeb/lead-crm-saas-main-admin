import React, { useState } from 'react'
import { Select } from 'antd'
import { Search, X } from 'lucide-react'

const { Option } = Select

const STATUSES = ['PENDING', 'PAID', 'OVERDUE']

/* Generate last 24 months as options */
const generateMonthOptions = () => {
  const opts = []
  const now = new Date()
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    opts.push({ val, label })
  }
  return opts
}

const MONTH_OPTS = generateMonthOptions()

const MonthlyBillingFilters = ({ schools = [], filters, onApply, onClear }) => {
  const [local, setLocal] = useState({ ...filters })

  const set = (key, val) => setLocal((p) => ({ ...p, [key]: val || null }))

  const handleApply = () => onApply(local)

  const handleClear = () => {
    const empty = { tenantId: null, billingMonth: null, status: null }
    setLocal(empty)
    onClear()
  }

  const hasFilters = local.tenantId || local.billingMonth || local.status

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
      <div className="flex flex-wrap gap-2 items-end">

        {/* School filter */}
        <div className="flex flex-col gap-1 min-w-[200px] flex-1">
          <label className="text-xs font-medium text-gray-500">School</label>
          <Select
            showSearch
            allowClear
            placeholder="All tenant"
            value={local.tenantId}
            onChange={(v) => set('tenantId', v)}
            optionFilterProp="children"
            size="middle"
            className="w-full text-sm"
          >
            {schools.map((s) => (
              <Option key={s._id} value={s._id}>
                {s.schoolName}
              </Option>
            ))}
          </Select>
        </div>

        {/* Month filter */}
        <div className="flex flex-col gap-1 min-w-[160px]">
          <label className="text-xs font-medium text-gray-500">Billing Month</label>
          <Select
            allowClear
            placeholder="All months"
            value={local.billingMonth}
            onChange={(v) => set('billingMonth', v)}
            size="middle"
            className="w-full text-sm"
          >
            {MONTH_OPTS.map((m) => (
              <Option key={m.val} value={m.val}>
                {m.label}
              </Option>
            ))}
          </Select>
        </div>

        {/* Status filter */}
        <div className="flex flex-col gap-1 min-w-[140px]">
          <label className="text-xs font-medium text-gray-500">Status</label>
          <Select
            allowClear
            placeholder="All statuses"
            value={local.status}
            onChange={(v) => set('status', v)}
            size="middle"
            className="w-full text-sm"
          >
            {STATUSES.map((s) => (
              <Option key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </Option>
            ))}
          </Select>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pb-0.5">
          <button
            onClick={handleApply}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[#0c3b73] hover:bg-[#0a2f5c] text-white rounded-lg transition"
          >
            <Search size={13} />
            Apply
          </button>
          {hasFilters && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition"
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

export default MonthlyBillingFilters
