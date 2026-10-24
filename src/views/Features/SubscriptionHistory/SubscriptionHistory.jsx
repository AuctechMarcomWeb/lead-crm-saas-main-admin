import React, { useState, useEffect } from 'react'
import { CreditCard, CheckCircle, Clock, AlertCircle, Plus } from 'lucide-react'
import { Pagination, Tag, Empty, Table, Modal } from 'antd'
import toast from 'react-hot-toast'
import { getRequest, patchRequest } from '../../../Helpers'
import DeleteModal from '../../../components/DeleteModal/DeleteModal'
import Loader from '../../../components/Loading/Loader'
import { useRoles } from '../../../Context/AuthContext'
import SubscriptionHistoryFilters from './SubscriptionHistoryFilters'
import SubscriptionModal from '../SchoolManagement/subscriptionAddModal'
import dayjs from 'dayjs'

const STATUS_COLORS = {
  ACTIVE: 'green',
  EXPIRED: 'red',
  PENDING: 'orange',
  CANCELLED: 'volcano',
  TRIAL: 'blue',
}

const PAID_STATUS_CONFIG = {
  PAID:    { label: 'Paid',    bg: 'bg-green-50',  text: 'text-green-700'  },
  UNPAID:  { label: 'Unpaid',  bg: 'bg-red-50',    text: 'text-red-700'    },
  PENDING: { label: 'Pending', bg: 'bg-orange-50', text: 'text-orange-700' },
  OVERDUE: { label: 'Overdue', bg: 'bg-rose-50',   text: 'text-rose-700'   },
}

const CYCLE_COLORS = {
  Monthly: 'blue',
  Quarterly: 'purple',
  Yearly: 'green',
}

/* ─── Mark Paid Modal ─── */
const MarkPaidModal = ({ open, record, onClose, onSuccess }) => {
  const [paidDate, setPaidDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [paymentRef, setPaymentRef] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setPaidDate(dayjs().format('YYYY-MM-DD'))
      setPaymentRef('')
    }
  }, [open])

  const handleSubmit = async () => {
    if (!paidDate) { toast.error('Please select payment date'); return }
    setLoading(true)
    try {
      await patchRequest({ url: `subscription/${record._id}/mark-paid`, cred: { paidDate, paymentRef } })
      toast.success('Marked as paid successfully')
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
      width={380}
      title={
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle size={15} />
          <span>Mark as Paid</span>
        </div>
      }
    >
      {record && (
        <div className="space-y-3 mt-3">
          <div className="bg-gray-50 rounded-lg p-3 text-sm border border-gray-100">
            <p className="font-semibold text-gray-800">{record.tenantDetails?.schoolName}</p>
            <p className="text-gray-500 text-xs mt-0.5">
              Plan: {record.currentPlan?.name || record.currentPlanDetails?.name || '—'}
            </p>
            <p className="text-gray-500 text-xs mt-0.5">
              Amount: ₹{Number(record.totalAmount ?? 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Payment Date *</label>
            <input
              type="date"
              value={paidDate}
              onChange={(e) => setPaidDate(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#0c3b73]"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Payment Reference (optional)
            </label>
            <input
              type="text"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="UTR / Cheque / Transaction ID"
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#0c3b73]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2 text-sm bg-[#0c3b73] hover:bg-[#0a2f5c] text-white rounded flex items-center gap-2 disabled:opacity-60"
            >
              {loading && <Clock size={13} className="animate-spin" />}
              Confirm Payment
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

/* ═══ MAIN COMPONENT ═══ */
const SubscriptionHistory = () => {
  const { role } = useRoles()

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [markPaidRecord, setMarkPaidRecord] = useState(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  /* tenant for filter dropdown */
  const [schools, setSchools] = useState([])
  const [schoolsLoading, setSchoolsLoading] = useState(false)

  /* applied filters */
  const [appliedFilters, setAppliedFilters] = useState({
    tenantId: null,
    status: null,
    billingCycle: null,
    planType: null,
    paidStatus: null,
  })

  /* delete */
  const [selectedItem, setSelectedItem] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  /* ── fetch tenant ── */
  useEffect(() => {
    setSchoolsLoading(true)
    getRequest('tenant?isPagination=false')
      .then((res) => setSchools(res?.data?.data?.tenants || []))
      .catch(() => toast.error('Failed to load tenant'))
      .finally(() => setSchoolsLoading(false))
  }, [])

  /* ── fetch subscriptions ── */
  const fetchHistory = () => {
    setLoading(true)
    const params = new URLSearchParams({ page, limit })
    if (appliedFilters.tenantId)   params.append('tenantId',    appliedFilters.tenantId)
    if (appliedFilters.status)     params.append('status',      appliedFilters.status)
    if (appliedFilters.billingCycle) params.append('billingCycle', appliedFilters.billingCycle)
    if (appliedFilters.planType)   params.append('planType',    appliedFilters.planType)
    if (appliedFilters.paidStatus) params.append('paidStatus',  appliedFilters.paidStatus)
    if (searchQuery)               params.append('search',      searchQuery)

    getRequest(`subscription?${params.toString()}`)
      .then((res) => {
        setData(res?.data?.data?.subscriptions || res?.data?.subscriptions || [])
        setTotal(res?.data?.data?.total || res?.data?.total || 0)
      })
      .catch(() => toast.error('Failed to load subscription history'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, appliedFilters, searchQuery])

  const handleApply = (filters) => {
    setAppliedFilters(filters)
    setPage(1)
  }

  const handleClear = () => {
    setAppliedFilters({ tenantId: null, status: null, billingCycle: null, planType: null, paidStatus: null })
    setPage(1)
    setSearchQuery('')
  }

  const confirmDelete = async () => {
    if (!selectedItem) return
    setDeleteLoading(true)
    try {
      // Note: TenantSubscription delete is intentionally soft — just remove from view
      // If you want hard delete, add a DELETE /subscription/:id endpoint
      setData((prev) => prev.filter((d) => d._id !== selectedItem._id))
      setTotal((t) => Math.max(0, t - 1))
      toast.success('Record removed from view')
      setShowDeleteModal(false)
      setSelectedItem(null)
    } catch {
      toast.error('Delete failed')
    } finally {
      setDeleteLoading(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const columns = [
    {
      title: 'Sr.',
      key: 'sr',
      align: 'center',
      width: 55,
      render: (_, __, i) => (page - 1) * limit + i + 1,
    },
    {
      title: 'School',
      key: 'school',
      render: (_, row) => {
        const school = row.tenantDetails
        return (
          <div className="flex items-center gap-3">
            {school?.logo ? (
              <img
                src={school.logo}
                alt=""
                className="w-8 h-8 rounded-lg object-contain border border-gray-100"
                onError={(e) => (e.target.style.display = 'none')}
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[#0c3b73]/10 flex items-center justify-center border border-gray-200 text-xs font-bold text-[#0c3b73]">
                {school?.schoolName?.slice(0, 2).toUpperCase() || '--'}
              </div>
            )}
            <div>
              <p className="font-medium text-gray-800 leading-tight">
                {school?.schoolName || '--'}
              </p>
              <p className="text-xs text-gray-400">{school?.subdomain || '—'}.app</p>
            </div>
          </div>
        )
      },
    },
    {
      title: 'Plan',
      key: 'plan',
      render: (_, row) => {
        // currentPlanDetails = $lookup populated plan doc, currentPlan = embedded snapshot
        const planName = row.currentPlanDetails?.name || row.currentPlan?.name || '—'
        const planType = row.currentPlanDetails?.planType || '—'
        return (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center border border-gray-200 flex-shrink-0">
              <CreditCard size={13} className="text-gray-400" />
            </div>
            <div>
              <p className="font-medium text-gray-800 leading-tight text-sm">{planName}</p>
              <p className="text-xs text-gray-400">{planType}</p>
            </div>
          </div>
        )
      },
    },
    {
      title: 'Billing Cycle',
      key: 'billingCycle',
      align: 'center',
      render: (_, row) => {
        const cycle = row.currentPlanDetails?.billingCycle || row.currentPlan?.billingCycle
        return cycle ? (
          <Tag color={CYCLE_COLORS[cycle] || 'default'} className="text-xs">
            {cycle}
          </Tag>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        )
      },
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      align: 'center',
      render: (v) => (
        <span className="font-semibold text-gray-800">
          ₹{Number(v ?? 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      title: 'Student Limit',
      dataIndex: 'totalStudentLimit',
      align: 'center',
      render: (v) => (
        <span className="text-gray-700 font-medium">
          {v != null ? v.toLocaleString('en-IN') : '—'}
        </span>
      ),
    },
    {
      title: 'Used',
      dataIndex: 'usedStudents',
      align: 'center',
      render: (v) => <span className="text-gray-500 text-sm">{v ?? 0}</span>,
    },
    {
      title: 'Billing Month',
      dataIndex: 'billingMonth',
      align: 'center',
      render: (m) =>
        m ? (
          <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
            {dayjs(m + '-01').format('MMM YYYY')}
          </span>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        ),
    },
    {
      title: 'Payment',
      dataIndex: 'paidStatus',
      align: 'center',
      render: (status) => {
        const cfg = PAID_STATUS_CONFIG[status]
        if (!cfg) return <span className="text-gray-400 text-xs">—</span>
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
          >
            {status === 'PAID' ? (
              <CheckCircle size={10} />
            ) : status === 'OVERDUE' ? (
              <AlertCircle size={10} />
            ) : (
              <Clock size={10} />
            )}
            {cfg.label}
          </span>
        )
      },
    },
    {
      title: 'Paid Date',
      dataIndex: 'paidDate',
      align: 'center',
      render: (d) =>
        d ? (
          <span className="text-xs text-green-600 font-medium">{dayjs(d).format('DD MMM YY')}</span>
        ) : (
          <span className="text-gray-300 text-xs">—</span>
        ),
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      align: 'center',
      render: (d) => {
        if (!d) return <span className="text-gray-300 text-xs">—</span>
        const isOverdue = new Date(d) < new Date()
        return (
          <span className={`text-xs font-medium ${isOverdue ? 'text-red-500' : 'text-gray-600'}`}>
            {dayjs(d).format('DD MMM YY')}
          </span>
        )
      },
    },
    {
      title: 'Start Date',
      key: 'startDate',
      align: 'center',
      render: (_, row) => (
        <span className="text-gray-500 text-sm">{formatDate(row.currentPlan?.startDate)}</span>
      ),
    },
    {
      title: 'End Date',
      key: 'endDate',
      align: 'center',
      render: (_, row) => {
        const endDate = row.currentPlan?.endDate
        const isExpired = endDate && new Date(endDate) < new Date()
        return (
          <span className={`text-sm ${isExpired ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
            {formatDate(endDate)}
          </span>
        )
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      align: 'center',
      render: (status) => (
        <Tag color={STATUS_COLORS[status] || 'default'}>{status || '—'}</Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      width: 110,
      render: (_, row) =>
        row.paidStatus !== 'PAID' ? (
          <button
            onClick={() => setMarkPaidRecord(row)}
            className="flex items-center gap-1 px-2 py-1.5 text-xs bg-[#0c3b73] hover:bg-[#0a2f5c] text-white rounded-lg transition"
          >
            <CheckCircle size={11} /> Mark Paid
          </button>
        ) : (
          <span className="text-xs text-green-600 flex items-center gap-1 justify-center">
            <CheckCircle size={11} /> Paid
          </span>
        ),
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
            <CreditCard size={20} className="text-[#e24028]" />
            Subscription History
          </h1>
          <p className="text-sm text-gray-500">View and manage all school subscription records</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#0c3b73] hover:bg-[#0a2f5c] text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition"
        >
          <Plus size={16} />
          Assign Subscription
        </button>
      </div>

      {/* Filters */}
      <SubscriptionHistoryFilters
        appliedFilters={appliedFilters}
        schools={schools}
        schoolsLoading={schoolsLoading}
        onApply={handleApply}
        onClear={handleClear}
        onSearch={(val) => {
          setSearchQuery(val)
          setPage(1)
        }}
      />

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center">
            <Loader />
            <p className="text-sm text-gray-400 mt-2">Loading records...</p>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={data}
            rowKey="_id"
            pagination={false}
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: <Empty description="No subscription history found" /> }}
          />
        )}

        {!loading && total > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} results
            </p>
            <Pagination
              current={page}
              pageSize={limit}
              total={total}
              pageSizeOptions={['5', '10', '20', '50']}
              showSizeChanger
              onChange={(p) => setPage(p)}
              onShowSizeChange={(_, size) => {
                setLimit(size)
                setPage(1)
              }}
              size="small"
            />
          </div>
        )}
      </div>

      <DeleteModal
        open={showDeleteModal}
        itemName={selectedItem?.tenantDetails?.schoolName}
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteModal(false)
          setSelectedItem(null)
        }}
      />

      <MarkPaidModal
        open={!!markPaidRecord}
        record={markPaidRecord}
        onClose={() => setMarkPaidRecord(null)}
        onSuccess={fetchHistory}
      />

      {isAddModalOpen && (
        <SubscriptionModal
          open={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          refresh={fetchHistory}
        />
      )}
    </div>
  )
}

export default SubscriptionHistory
