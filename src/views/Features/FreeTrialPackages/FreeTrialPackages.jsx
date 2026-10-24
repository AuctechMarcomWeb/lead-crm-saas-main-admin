import React, { useState, useEffect } from 'react'
import { Gift, Plus, Edit, Trash2, Star, CheckCircle, XCircle } from 'lucide-react'
import { Pagination, Tag, Empty, Switch, Table, Tooltip } from 'antd'
import toast from 'react-hot-toast'
import { deleteRequest, getRequest, patchRequest } from '../../../Helpers'
import FreeTrialPackageModal from './FreeTrialPackageModal'
import DeleteModal from '../../../components/DeleteModal/DeleteModal'
import Loader from '../../../components/Loading/Loader'

/* ── helpers ── */
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const FreeTrialPackages = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')

  const [togglingId, setTogglingId] = useState(null)
  const [settingDefaultId, setSettingDefaultId] = useState(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  /* ── Fetch ── */
  const fetchPackages = () => {
    setLoading(true)
    const params = { page, limit }
    if (search.trim()) params.search = search.trim()

    getRequest(`free-trial-packages?${new URLSearchParams(params).toString()}`)
      .then((res) => {
        setData(res?.data?.data?.packages || [])
        setTotal(res?.data?.data?.total || 0)
      })
      .catch(() => toast.error('Failed to load free trial packages'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchPackages()
  }, [page, limit, search])

  /* ── Toggle Active/Inactive ── */
  const handleToggle = async (row) => {
    setTogglingId(row._id)
    try {
      await patchRequest({ url: `free-trial-packages/${row._id}/toggle` })
      toast.success(`Package "${row.name}" ${row.isActive ? 'deactivated' : 'activated'}`)
      fetchPackages()
    } catch {
      toast.error('Failed to toggle status')
    } finally {
      setTogglingId(null)
    }
  }

  /* ── Set as Default ── */
  const handleSetDefault = async (row) => {
    if (row.isDefault) return
    if (!row.isActive) {
      toast.error('Activate this package before setting it as default')
      return
    }
    setSettingDefaultId(row._id)
    try {
      await patchRequest({ url: `free-trial-packages/${row._id}/set-default` })
      toast.success(`"${row.name}" is now the default trial package`)
      fetchPackages()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to set default')
    } finally {
      setSettingDefaultId(null)
    }
  }

  /* ── Delete ── */
  const confirmDelete = async () => {
    if (!selectedItem) return
    setDeleteLoading(true)
    try {
      await deleteRequest(`free-trial-packages/${selectedItem._id}`)
      toast.success(`Package "${selectedItem.name}" deleted`)
      setShowDeleteModal(false)
      setSelectedItem(null)
      fetchPackages()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Delete failed')
    } finally {
      setDeleteLoading(false)
    }
  }

  /* ── Columns ── */
  const columns = [
    {
      title: 'Sr.',
      key: 'sr',
      align: 'center',
      width: 55,
      render: (_, __, index) => (page - 1) * limit + index + 1,
    },
    {
      title: 'Package Name',
      dataIndex: 'name',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <div>
            <p className="font-semibold text-gray-800 leading-tight">{row.name}</p>
            {row.description && (
              <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{row.description}</p>
            )}
          </div>
          {row.isDefault && (
            <Tooltip title="Default trial package — assigned to every new school">
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-300 ml-1 whitespace-nowrap">
                <Star size={10} className="fill-amber-500 stroke-amber-500" /> Default
              </span>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: 'Duration',
      dataIndex: 'durationDays',
      align: 'center',
      width: 110,
      render: (val) => (
        <Tag color="blue" className="font-semibold">{val} days</Tag>
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
          <span className="text-gray-400 text-xs">—</span>
        ),
    },
    {
      title: 'One-Time',
      dataIndex: 'eligibleOnce',
      align: 'center',
      width: 100,
      render: (val) =>
        val ? (
          <Tooltip title="User receives this trial only once">
            <CheckCircle size={16} className="text-green-500 mx-auto" />
          </Tooltip>
        ) : (
          <Tooltip title="User can receive this trial multiple times">
            <XCircle size={16} className="text-gray-300 mx-auto" />
          </Tooltip>
        ),
    },
    {
      title: 'Set Default',
      key: 'setDefault',
      align: 'center',
      width: 110,
      render: (_, row) => (
        <Tooltip title={row.isDefault ? 'Currently the default' : 'Click to set as default'}>
          <button
            onClick={() => handleSetDefault(row)}
            disabled={row.isDefault || settingDefaultId === row._id || !row.isActive}
            className={`px-2 py-1 text-xs rounded-md font-semibold transition ${
              row.isDefault
                ? 'bg-amber-100 text-amber-700 border border-amber-300 cursor-default'
                : row.isActive
                ? 'bg-white border border-gray-300 text-gray-600 hover:bg-amber-50 hover:border-amber-400 hover:text-amber-700'
                : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
            }`}
          >
            {settingDefaultId === row._id ? '...' : row.isDefault ? '★ Default' : 'Set Default'}
          </button>
        </Tooltip>
      ),
    },
    {
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
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      width: 90,
      render: (_, row) => (
        <div className="flex justify-center gap-1">
          <button
            onClick={() => { setSelectedItem(row); setIsModalOpen(true) }}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md"
            title="Edit"
          >
            <Edit size={15} />
          </button>
          <button
            onClick={() => { setSelectedItem(row); setShowDeleteModal(true) }}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded-md"
            title="Delete"
            disabled={row.isDefault}
          >
            <Trash2 size={15} className={row.isDefault ? 'opacity-30' : ''} />
          </button>
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
            <Gift size={20} className="text-[#e24028]" />
            Free Trial Packages
          </h1>
          <p className="text-sm text-gray-500">
            Configure dynamic free trial packages assigned to new tenant
          </p>
        </div>
        <button
          onClick={() => { setSelectedItem(null); setIsModalOpen(true) }}
          className="bg-[#0c3b73] hover:bg-[#0a2f5c] text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition"
        >
          <Plus size={16} />
          Add Package
        </button>
      </div>

      {/* ── Info Banner ── */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4 flex items-start gap-3">
        <Gift size={18} className="text-blue-500 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-800">
          <strong>How it works:</strong> When a new agency registers, the system automatically assigns the{' '}
          <span className="font-semibold text-amber-700">★ Default</span> active package as their free trial.
          Only one package can be default at a time. If no default is set, the agency is created with a
          PENDING subscription and admin must assign a plan manually.
        </div>
      </div>

      {/* ── Search ── */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4 flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search packages by name…"
          className="flex-1 border border-gray-200 rounded-md px-3 py-1.5 text-sm outline-none focus:border-[#0c3b73] transition"
        />
        {search && (
          <button
            onClick={() => { setSearch(''); setPage(1) }}
            className="text-xs text-gray-500 hover:text-red-500 transition"
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center">
            <Loader />
            <p className="text-sm text-gray-400 mt-2">Loading packages…</p>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={data}
            rowKey="_id"
            pagination={false}
            rowClassName={(row) => row.isDefault ? 'bg-amber-50' : ''}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No free trial packages found. Click 'Add Package' to create one."
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
              pageSizeOptions={['5', '10', '20']}
              showSizeChanger
              onChange={(p) => setPage(p)}
              onShowSizeChange={(_, size) => { setLimit(size); setPage(1) }}
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
        onCancel={() => { setShowDeleteModal(false); setSelectedItem(null) }}
      />

      {isModalOpen && (
        <FreeTrialPackageModal
          key={selectedItem?._id || 'new'}
          open={isModalOpen}
          editData={selectedItem}
          onClose={() => setIsModalOpen(false)}
          refresh={() => { setPage(1); fetchPackages() }}
        />
      )}
    </div>
  )
}

export default FreeTrialPackages
