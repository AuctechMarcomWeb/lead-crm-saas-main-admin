import React, { useState, useEffect } from 'react'
import { Building2, Plus, Eye, Edit, Trash2, CreditCard, Clock, LogIn, Gift } from 'lucide-react'
import { Tag, Switch, Tooltip } from 'antd'
import toast from 'react-hot-toast'
import { deleteRequest, getRequest, patchRequest } from '../../../Helpers'
import AgencyFilters from './SchoolFilters'
import AgencyModal from './SchoolRegisterModal'
import DeleteModal from '../../../components/DeleteModal/DeleteModal'
import AppTable, { Td } from '../../../components/AppTable'
import { useNavigate } from 'react-router-dom'
import SubscriptionModal from './subscriptionAddModal'
import QuickLoginModal from './QuickLoginModal'
import AssignTrialModal from './AssignTrialModal'

const AgencyListing = () => {
  const navigate = useNavigate()

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)

  const [appliedFilters, setAppliedFilters] = useState({ search: '', isActive: null })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubModalOpen, setIsSubModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [quickLoginAgency, setQuickLoginAgency] = useState(null)
  const [assignTrialAgency, setAssignTrialAgency] = useState(null)

  /* ── Fetch ── */
  const fetchAgencies = () => {
    setLoading(true)
    const params = { page, limit, isPagination: true }
    if (appliedFilters.search)   params.search   = appliedFilters.search
    if (appliedFilters.isActive !== null) params.isActive = appliedFilters.isActive

    getRequest(`tenant?${new URLSearchParams(params).toString()}`)
      .then((res) => {
        setData(res?.data?.data?.tenants || res?.data?.data?.list || [])
        setTotal(res?.data?.data?.total  || res?.data?.data?.pagination?.totalRows || 0)
      })
      .catch(() => toast.error('Failed to load agencies'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAgencies() }, [appliedFilters, page, limit])

  /* ── Delete ── */
  const confirmDelete = async () => {
    if (!selectedItem) return
    setDeleteLoading(true)
    try {
      await deleteRequest(`tenant/${selectedItem._id}`)
      toast.success('Agency deleted')
      setShowDeleteModal(false)
      setSelectedItem(null)
      fetchAgencies()
    } catch {
      toast.error('Delete failed')
    } finally {
      setDeleteLoading(false)
    }
  }

  /* ── Toggle status ── */
  const handleStatusChange = async (checked, record) => {
    try {
      const res = await patchRequest({ url: `tenant/toggle-status/${record._id}` })
      toast.success(res?.data?.message || 'Agency status updated')
      fetchAgencies()
    } catch {
      toast.error('Failed to update status')
    }
  }

  /* ── Plan cell ── */
  const PlanCell = ({ row }) => {
    if (!row.planName) return <span className="text-gray-400 text-xs">No Plan</span>
    const colorMap = { ACTIVE: 'green', TRIAL: 'blue', EXPIRED: 'red', CANCELLED: 'volcano', PENDING: 'orange' }
    const isExpired = row.planEndDate && new Date(row.planEndDate) < new Date()
    const daysLeft  = row.planEndDate
      ? Math.ceil((new Date(row.planEndDate) - new Date()) / 86400000)
      : null
    return (
      <Tooltip title={row.planEndDate ? `Expires: ${new Date(row.planEndDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}` : ''}>
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5">
            <CreditCard size={12} className="text-gray-400" />
            <span className="text-xs font-medium text-gray-700">{row.planName}</span>
            {row.isTrial && <Tag color="cyan" className="text-[10px] px-1 py-0 leading-tight ml-0.5">Trial</Tag>}
          </div>
          <div className="flex items-center gap-1">
            <Tag
              color={isExpired ? 'red' : colorMap[row.planStatus] || 'default'}
              className="text-[10px] px-1.5 py-0 leading-tight m-0"
            >
              {isExpired ? 'EXPIRED' : (row.planStatus || '—')}
            </Tag>
            {daysLeft !== null && !isExpired && daysLeft <= 30 && (
              <span className="text-[10px] text-orange-500 flex items-center gap-0.5">
                <Clock size={10} /> {daysLeft}d left
              </span>
            )}
          </div>
          {row.agentLimit > 0 && (
            <span className="text-[10px] text-gray-400">{row.agentLimit.toLocaleString()} agents</span>
          )}
        </div>
      </Tooltip>
    )
  }

  /* ── Columns ── */
  const COLUMNS = [
    { key: 'sr',         label: 'Sr.',        align: 'center', width: 60,  sticky: 'left'  },
    { key: 'agency',     label: 'Agency',     align: 'left',   width: 240 },
    { key: 'subdomain',  label: 'Subdomain',  align: 'center', width: 180 },
    { key: 'rera',       label: 'RERA No.',   align: 'center', width: 160 },
    { key: 'plan',       label: 'Plan',       align: 'center', width: 180 },
    { key: 'status',     label: 'Status',     align: 'center', width: 120 },
    { key: 'registered', label: 'Registered', align: 'center', width: 130 },
    { key: 'actions',    label: 'Actions',    align: 'center', width: 200, sticky: 'right' },
  ]

  return (
    <div className="min-h-screen">
      {/* ── Header ── */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
            <Building2 size={20} className="text-[#e24028]" />
            Agency Management
          </h1>
          <p className="text-sm text-gray-500">Manage all registered real estate agencies</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setSelectedItem(null); setIsSubModalOpen(true) }}
            className="bg-[#0c3b73] hover:bg-[#0a2f5c] text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition"
          >
            <Plus size={16} /> Add Subscription
          </button>
          <button
            onClick={() => { setSelectedItem(null); setIsModalOpen(true) }}
            className="bg-[#0c3b73] hover:bg-[#0a2f5c] text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition"
          >
            <Plus size={16} /> Register Agency
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <AgencyFilters
        appliedFilters={appliedFilters}
        onApply={(f) => { setAppliedFilters(f); setPage(1) }}
        onClear={() => { setAppliedFilters({ search: '', isActive: null }); setPage(1) }}
      />

      {/* ── Table ── */}
      <AppTable
        columns={COLUMNS}
        data={data}
        loading={loading}
        emptyText="No agencies found"
        page={page}
        limit={limit}
        total={total}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(size) => { setLimit(size); setPage(1) }}
        rowKey={(row) => row._id}
        onRowClick={(row) => navigate(`/school-management/details/${row._id}`)}
      >
        {(row, index) => (
          <>
            {/* Sr */}
            <Td align="center" sticky="left">{(page - 1) * limit + index + 1}</Td>

            {/* Agency */}
            <Td>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 flex-shrink-0">
                  {row.logo
                    ? <img src={row.logo} alt="" className="w-full h-full object-contain p-0.5" />
                    : <Building2 size={16} className="text-gray-400" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 leading-tight">{row.agencyName || row.name}</p>
                  {row.agencyEmail && <p className="text-xs text-gray-400 truncate max-w-[180px]">{row.agencyEmail}</p>}
                </div>
              </div>
            </Td>

            {/* Subdomain */}
            <Td align="center">
              {row.subdomain
                ? <span className="font-mono text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-200">{row.subdomain}</span>
                : <span className="text-gray-400 text-xs">—</span>}
            </Td>

            {/* RERA */}
            <Td align="center">
              {row.reraNo
                ? <span className="text-xs text-gray-700 font-medium">{row.reraNo}</span>
                : <span className="text-gray-400 text-xs">—</span>}
            </Td>

            {/* Plan */}
            <Td align="center"><PlanCell row={row} /></Td>

            {/* Status */}
            <Td align="center" onClick={(e) => e.stopPropagation()}>
              <Switch
                checked={row.isActive}
                checkedChildren="Active"
                unCheckedChildren="Inactive"
                onChange={(checked) => handleStatusChange(checked, row)}
              />
            </Td>

            {/* Registered */}
            <Td align="center">
              {row.createdAt
                ? <span className="text-xs text-gray-500">{new Date(row.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                : <span className="text-gray-400 text-xs">—</span>}
            </Td>

            {/* Actions */}
            <Td align="center" sticky="right" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-center gap-2">
                <Tooltip title="Quick Login">
                  <button className="w-8 h-8 flex items-center justify-center rounded-full text-[#0c3b73] hover:text-white hover:bg-[#0c3b73] transition-all" onClick={() => setQuickLoginAgency(row)}>
                    <LogIn className="w-4 h-4" />
                  </button>
                </Tooltip>
                <Tooltip title="Assign Free Trial">
                  <button className="w-8 h-8 flex items-center justify-center rounded-full text-blue-600 hover:text-white hover:bg-blue-600 transition-all" onClick={() => setAssignTrialAgency(row)}>
                    <Gift className="w-4 h-4" />
                  </button>
                </Tooltip>
                <Tooltip title="View Details">
                  <button className="w-8 h-8 flex items-center justify-center rounded-full text-green-600 hover:text-white hover:bg-green-600 transition-all" onClick={() => navigate(`/school-management/details/${row._id}`)}>
                    <Eye className="w-4 h-4" />
                  </button>
                </Tooltip>
                <Tooltip title="Edit">
                  <button className="w-8 h-8 flex items-center justify-center rounded-full text-blue-600 hover:text-white hover:bg-blue-600 transition-all" onClick={() => { setSelectedItem(row); setIsModalOpen(true) }}>
                    <Edit className="w-4 h-4" />
                  </button>
                </Tooltip>
                <Tooltip title="Delete">
                  <button className="w-8 h-8 flex items-center justify-center rounded-full text-red-600 hover:text-white hover:bg-red-600 transition-all" onClick={() => { setSelectedItem(row); setShowDeleteModal(true) }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </Tooltip>
              </div>
            </Td>
          </>
        )}
      </AppTable>

      {/* ── Modals ── */}
      <DeleteModal
        open={showDeleteModal}
        itemName={selectedItem?.agencyName || selectedItem?.name}
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => { setShowDeleteModal(false); setSelectedItem(null) }}
      />

      {isModalOpen && (
        <AgencyModal
          key={selectedItem?._id || 'new'}
          open={isModalOpen}
          editData={selectedItem}
          onClose={() => setIsModalOpen(false)}
          refresh={() => { setPage(1); fetchAgencies() }}
        />
      )}

      {isSubModalOpen && (
        <SubscriptionModal
          open={isSubModalOpen}
          onClose={() => setIsSubModalOpen(false)}
          refresh={() => { setPage(1); fetchAgencies() }}
        />
      )}

      <QuickLoginModal
        open={!!quickLoginAgency}
        school={quickLoginAgency}
        onClose={() => setQuickLoginAgency(null)}
      />

      <AssignTrialModal
        open={!!assignTrialAgency}
        school={assignTrialAgency}
        onClose={() => setAssignTrialAgency(null)}
        onSuccess={() => { setAssignTrialAgency(null); fetchAgencies() }}
      />
    </div>
  )
}

export default AgencyListing
