import React, { useState, useEffect } from 'react'
import { CreditCard, Plus, Edit, Trash2, Puzzle } from 'lucide-react'
import { Pagination, Tag, Empty, Switch, Table } from 'antd'
import toast from 'react-hot-toast'
import { deleteRequest, getRequest, patchRequest } from '../../../Helpers'
import SubscriptionFilters from './SubscriptionPlanFilter'
import SubscriptionModal from './AddSubscriptionPlanModal'
import DeleteModal from '../../../components/DeleteModal/DeleteModal'
import Loader from '../../../components/Loading/Loader'

// Matches schema enum
const CYCLE_COLORS = { Monthly: 'blue', Yearly: 'green' }

const TABS = [
  { key: 'Plan', label: 'Subscription Plans', icon: CreditCard },
  { key: 'Addon', label: 'Add-ons', icon: Puzzle },
]

const SubscriptionListing = () => {
  const [activeTab, setActiveTab] = useState('Plan')

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)

  const [togglingId, setTogglingId] = useState(null)
  const [appliedFilters, setAppliedFilters] = useState({
    billingCycle: null,
    minPrice: '',
    maxPrice: '',
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  /* ── Fetch ── */
  const fetchPlans = () => {
    setLoading(true)
    const params = { page, limit, planType: activeTab }

    getRequest(`subscriptionPlan?${new URLSearchParams(params).toString()}`)
      .then((res) => {
        setData(res?.data?.data?.plans || res?.data?.data?.list || [])
        setTotal(
          res?.data?.data?.totalPlans || res?.data?.data?.total || res?.data?.totalPlans || res?.data?.total || 0,
        )
      })
      .catch(() => toast.error('Failed to load records'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchPlans()
  }, [appliedFilters, page, limit, activeTab])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setPage(1)
    setAppliedFilters({ billingCycle: null, minPrice: '', maxPrice: '' })
  }

  /* ── Toggle ── */
  const handleToggle = async (row) => {
    setTogglingId(row._id)
    try {
      await patchRequest({ url: `subscriptionPlan/${row._id}/toggle` })
      toast.success(
        `${row.planType === 'Addon' ? 'Add-on' : 'Plan'} ${row.isActive ? 'deactivated' : 'activated'}`,
      )
      fetchPlans()
    } catch {
      toast.error('Failed to toggle status')
    } finally {
      setTogglingId(null)
    }
  }

  /* ── Delete ── */
  const confirmDelete = async () => {
    if (!selectedItem) return
    setDeleteLoading(true)
    try {
      await deleteRequest(`subscriptionPlan/${selectedItem._id}`)
      toast.success(`${selectedItem.planType === 'Addon' ? 'Add-on' : 'Plan'} deleted`)
      setShowDeleteModal(false)
      setSelectedItem(null)
      fetchPlans()
    } catch {
      toast.error('Delete failed')
    } finally {
      setDeleteLoading(false)
    }
  }

  /* ── Shared action column (used in both tables) ── */
  const actionColumn = {
    title: 'Actions',
    key: 'actions',
    align: 'center',
    width: 100,
    render: (_, row) => (
      <div className="flex justify-center gap-1">
        <button
          onClick={() => {
            setSelectedItem(row)
            setIsModalOpen(true)
          }}
          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md"
          title="Edit"
        >
          <Edit size={15} />
        </button>
        <button
          onClick={() => {
            setSelectedItem(row)
            setShowDeleteModal(true)
          }}
          className="p-1.5 text-red-500 hover:bg-red-50 rounded-md"
          title="Delete"
        >
          <Trash2 size={15} />
        </button>
      </div>
    ),
  }

  /* ── Shared status toggle column ── */
  const statusColumn = {
    title: 'Status',
    dataIndex: 'isActive',
    align: 'center',
    width: 100,
    render: (val, row) => (
      <Switch
        size="small"
        checked={!!val}
        loading={togglingId === row._id}
        onChange={() => handleToggle(row)}
        checkedChildren="Active"
        unCheckedChildren="Inactive"
      />
    ),
  }

  /* ── Sr. column ── */
  const srColumn = {
    title: 'Sr.',
    key: 'sr',
    align: 'center',
    width: 60,
    render: (_, __, index) => (page - 1) * limit + index + 1,
  }

  /* ══════════════════════════════
     PLANS TABLE COLUMNS
  ══════════════════════════════ */
  const planColumns = [
    srColumn,
    {
      title: 'Plan',
      dataIndex: 'name',
      key: 'name',
      render: (_, row) => (
        <div className="flex items-center gap-3">
         
          <div>
            <p className="font-medium text-gray-800 leading-tight">{row.name}</p>
            {/* {row.description && (
              <p className="text-xs text-gray-400 truncate max-w-[180px]">{row.description}</p>
            )} */}
          </div>
        </div>
      ),
    },
    {
      title: 'Billing Cycle',
      dataIndex: 'billingCycle',
      align: 'center',
      render: (cycle) =>
        cycle ? (
          <Tag color={CYCLE_COLORS[cycle] || 'default'}>{cycle}</Tag>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      align: 'center',
      render: (price) => (
        <span className="font-semibold text-gray-800">
          ₹{Number(price).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      title: 'Student Limit',
      dataIndex: 'studentLimit',
      align: 'center',
      render: (val) =>
        val != null ? (
          <span className="text-sm text-gray-700 font-medium">{val.toLocaleString('en-IN')}</span>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        ),
    },
    {
      title: 'Trial Days',
      dataIndex: 'trialDays',
      align: 'center',
      render: (val) =>
        val > 0 ? (
          <Tag color="orange">{val} days</Tag>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        ),
    },
    {
      title: 'Features',
      dataIndex: 'features',
      render: (features) =>
        Array.isArray(features) && features.length > 0 ? (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {features.slice(0, 3).map((f, i) => (
              <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {f}
              </span>
            ))}
            {features.length > 3 && (
              <span className="text-xs text-gray-400">+{features.length - 3} more</span>
            )}
          </div>
        ) : (
          '—'
        ),
    },
    statusColumn,
    actionColumn,
  ]

  /* ══════════════════════════════
     ADDONS TABLE COLUMNS
  ══════════════════════════════ */
  const addonColumns = [
    srColumn,
    {
      title: 'Add-on',
      dataIndex: 'name',
      key: 'name',
      render: (_, row) => (
        <div className="flex items-center ">

            <p className="font-medium text-gray-800 ">{row.name}</p>
            {/* {row.description && (
              <p className="text-xs text-gray-400 truncate max-w-[180px]">{row.description}</p>
            )} */}
        </div>
      ),
    },
    {
      title: 'Billing Cycle',
      dataIndex: 'billingCycle',
      align: 'center',
      render: (cycle) =>
        cycle ? (
          <Tag color={CYCLE_COLORS[cycle] || 'default'}>{cycle}</Tag>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      align: 'center',
      render: (price) => (
        <span className="font-semibold text-gray-800">
          ₹{Number(price).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      title: 'Students Added',
      dataIndex: 'studentLimit',
      align: 'center',
      render: (val) =>
        val != null ? (
          <Tag color="purple">+{val.toLocaleString('en-IN')}</Tag>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        ),
    },
    {
      title: 'Features',
      dataIndex: 'features',
      render: (features) =>
        Array.isArray(features) && features.length > 0 ? (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {features.slice(0, 3).map((f, i) => (
              <span
                key={i}
                className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full"
              >
                {f}
              </span>
            ))}
            {features.length > 3 && (
              <span className="text-xs text-gray-400">+{features.length - 3} more</span>
            )}
          </div>
        ) : (
          '—'
        ),
    },
    statusColumn,
    actionColumn,
  ]

  const activeColumns = activeTab === 'Plan' ? planColumns : addonColumns

  return (
    <div className="min-h-screen">
      {/* ── Header ── */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
            <CreditCard size={20} className="text-[#e24028]" />
            Subscription Management
          </h1>
          <p className="text-sm text-gray-500">Manage plans and add-ons</p>
        </div>

        <div className="flex items-center gap-2">


          <button
            onClick={() => {
              setSelectedItem(null)
              setIsModalOpen(true)
            }}
            className="bg-[#0c3b73] hover:bg-[#0a2f5c] text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition"
          >
            <Plus size={16} />
            {activeTab === 'Plan' ? 'Add Plan' : 'Add Add-on'}
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <SubscriptionFilters
        appliedFilters={appliedFilters}
        onApply={(f) => {
          setAppliedFilters(f)
          setPage(1)
        }}
        onClear={() => {
          setAppliedFilters({ billingCycle: null, minPrice: '', maxPrice: '' })
          setPage(1)
        }}
      />
      {/* ── Tabs ── */}
      <div className="bg-white rounded-lg border border-gray-200 mb-4">
        <div className="flex border-b border-gray-200">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === key
                  ? 'border-[#0c3b73] text-[#0c3b73]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>
      {/* ── Table ── */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center">
            <Loader />
            <p className="text-sm text-gray-400 mt-2">Loading records...</p>
          </div>
        ) : (
          <Table
            columns={activeColumns}
            dataSource={data}
            rowKey="_id"
            pagination={false}
            locale={{
              emptyText: (
                <Empty
                  description={`No ${activeTab === 'Plan' ? 'subscription plans' : 'add-ons'} found`}
                />
              ),
            }}
          />
        )}

        {!loading && data.length > 0 && (
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

      {/* ── Modals ── */}
      <DeleteModal
        open={showDeleteModal}
        itemName={selectedItem?.name}
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteModal(false)
          setSelectedItem(null)
        }}
      />

      {isModalOpen && (
        <SubscriptionModal
          key={selectedItem?._id || 'new'}
          open={isModalOpen}
          editData={selectedItem}
          planType={activeTab}
          onClose={() => setIsModalOpen(false)}
          refresh={() => {
            setPage(1)
            fetchPlans()
          }}
        />
      )}
    </div>
  )
}

export default SubscriptionListing
