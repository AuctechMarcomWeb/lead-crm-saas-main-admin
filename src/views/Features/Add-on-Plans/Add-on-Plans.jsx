import React, { useState } from 'react'
import { PackagePlus, Plus, Eye, Edit, Trash2 } from 'lucide-react'
import { Pagination, Tag, Empty } from 'antd'
import toast from 'react-hot-toast'
// import { deleteRequest, getRequest } from '../../../../../Helpers'
import AddOnFilters from './AddonFilters'
import AddOnModal from './CreateAddonModal'
import DeleteModal from '../../../components/DeleteModal/DeleteModal'
import Loader from '../../../components/Loading/Loader'
import { useRoles } from '../../../Context/AuthContext'
import { Table } from 'antd'

const CYCLE_COLORS = {
  Monthly: 'blue',
  Quarterly: 'purple',
  Yearly: 'green',
}
const addons = [
  {
    _id: 'addon1',
    planName: 'Extra Video Consultations',
    price: 199,
    features: ['per 10 calls'],
    billingCycle: 'Monthly',
  },
  {
    _id: 'addon2',
    planName: 'SMS Notifications',
    price: 99,
    features: ['per month'],
    billingCycle: 'Monthly',
  },
  {
    _id: 'addon3',
    planName: 'Advanced Reports',
    price: 299,
    features: ['per month'],
    billingCycle: 'Monthly',
  },
]
const AddOnListing = () => {
  const { role } = useRoles()
  const isSuperAdmin = role === 'SuperAdmin'

  const [data, setData] = useState([...addons])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)

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
  const fetchAddOns = () => {
    // setLoading(true)
    // const params = { page, limit }
    // if (appliedFilters.billingCycle) params.billingCycle = appliedFilters.billingCycle
    // if (appliedFilters.minPrice) params.minPrice = appliedFilters.minPrice
    // if (appliedFilters.maxPrice) params.maxPrice = appliedFilters.maxPrice
    // getRequest(`addon-plans?${new URLSearchParams(params).toString()}`)
    //   .then((res) => {
    //     setData(res?.data?.data?.list || [])
    //     setTotal(res?.data?.data?.pagination?.totalRows || 0)
    //   })
    //   .catch(() => toast.error('Failed to load add-on plans'))
    //   .finally(() => setLoading(false))
  }

  // useEffect(() => {
  //   fetchAddOns()
  // }, [appliedFilters, page, limit])

  /* ── Delete ── */
  const confirmDelete = async () => {
    // if (!selectedItem) return
    // setDeleteLoading(true)
    // try {
    //   await deleteRequest(`addon-plans/${selectedItem._id}`)
    //   toast.success('Add-on deleted')
    //   setData((prev) => prev.filter((d) => d._id !== selectedItem._id))
    //   setShowDeleteModal(false)
    //   setSelectedItem(null)
    // } catch {
    //   toast.error('Delete failed')
    // } finally {
    //   setDeleteLoading(false)
    // }
  }

  const columns = [
    {
      title: 'Sr.',
      key: 'sr',
      align: 'center',
      width: 60,
      render: (_, __, index) => (page - 1) * limit + index + 1,
    },
    {
      title: 'Add-On Plan',
      dataIndex: 'planName',
      key: 'plan',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
            <PackagePlus size={16} className="text-gray-400" />
          </div>
          <div>
            <p className="font-medium text-gray-800 leading-tight">{row.planName}</p>
            <p className="text-xs text-gray-400">{row.features?.length || 0} features</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Billing Cycle',
      dataIndex: 'billingCycle',
      align: 'center',
      render: (cycle) => <Tag color={CYCLE_COLORS[cycle] || 'default'}>{cycle}</Tag>,
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
      title: 'Features',
      dataIndex: 'features',
      key: 'features',
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
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      width: 120,
      render: (_, row) => (
        <div className="flex justify-center gap-1">
          {/* <button className="p-1.5 text-green-600 hover:bg-green-50 rounded-md">
            <Eye size={15} />
          </button> */}
          {isSuperAdmin && (
            <button
              onClick={() => {
                setSelectedItem(row)
                setIsModalOpen(true)
              }}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md"
            >
              <Edit size={15} />
            </button>
          )}
          {isSuperAdmin && (
            <button
              onClick={() => {
                setSelectedItem(row)
                setShowDeleteModal(true)
              }}
              className="p-1.5 text-red-500 hover:bg-red-50 rounded-md"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen">
      {/* ── Header ── */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
            <PackagePlus size={20} className="text-[#e24028]" />
            Add-On Plans
          </h1>
          <p className="text-sm text-gray-500">Manage all add-on plans</p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => {
              setSelectedItem(null)
              setIsModalOpen(true)
            }}
            className="bg-[#0c3b73] hover:bg-[#0a2f5c] text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition"
          >
            <Plus size={16} />
            Add Plan
          </button>
        )}
      </div>

      {/* ── Filters ── */}
      <AddOnFilters
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

      {/* ── Table ── */}
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
            locale={{
              emptyText: <Empty description="No add-on plans found" />,
            }}
          />
        )}

        {/* Pagination */}
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
        itemName={selectedItem?.planName}
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteModal(false)
          setSelectedItem(null)
        }}
      />

      {isModalOpen && (
        <AddOnModal
          key={selectedItem?._id || 'new'}
          open={isModalOpen}
          editData={selectedItem}
          onClose={() => setIsModalOpen(false)}
          refresh={() => {
            setPage(1)
            fetchAddOns()
          }}
        />
      )}
    </div>
  )
}

export default AddOnListing
