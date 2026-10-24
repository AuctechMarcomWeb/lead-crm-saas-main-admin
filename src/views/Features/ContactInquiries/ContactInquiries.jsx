import React, { useState, useEffect } from 'react'
import { Mail, Search, Trash2, Eye } from 'lucide-react'
import { Pagination, Empty, Select, Tooltip, Modal } from 'antd'
import toast from 'react-hot-toast'
import { deleteRequest, getRequest, putRequest } from '../../../Helpers'
import DeleteModal from '../../../components/DeleteModal/DeleteModal'
import Loader from '../../../components/Loading/Loader'

const { Option } = Select

const STATUS_COLORS = {
  PENDING:  'bg-yellow-100 text-yellow-700',
  REVIEWED: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-green-100 text-green-700',
}

const ContactInquiries = () => {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage]       = useState(1)
  const [limit, setLimit]     = useState(10)
  const [total, setTotal]     = useState(0)

  /* filters */
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState(null)

  /* detail modal */
  const [viewItem, setViewItem]   = useState(null)
  const [viewOpen, setViewOpen]   = useState(false)

  /* delete modal */
  const [deleteItem, setDeleteItem]     = useState(null)
  const [showDelete, setShowDelete]     = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  /* status update loading */
  const [statusLoading, setStatusLoading] = useState(false)

  /* ── fetch ── */
  const fetchData = () => {
    setLoading(true)
    const params = new URLSearchParams({ page, limit })
    if (search)       params.append('search', search)
    if (statusFilter) params.append('status', statusFilter)

    getRequest(`contact/all?${params.toString()}`)
      .then(res => {
        const d = res?.data?.data
        setData(d?.inquiries || [])
        setTotal(d?.total || 0)
      })
      .catch(() => toast.error('Failed to load inquiries'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [page, limit, search, statusFilter])

  /* debounce search */
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  /* ── delete ── */
  const confirmDelete = async () => {
    if (!deleteItem) return
    setDeleteLoading(true)
    try {
      await deleteRequest(`contact/delete/${deleteItem._id}`)
      toast.success('Inquiry deleted')
      setShowDelete(false)
      setDeleteItem(null)
      fetchData()
    } catch {
      toast.error('Delete failed')
    } finally {
      setDeleteLoading(false)
    }
  }

  /* ── update status ── */
  const updateStatus = async (id, status) => {
    setStatusLoading(true)
    try {
      await putRequest({ url: `contact/update/${id}`, cred: { status } })
      toast.success(`Marked as ${status}`)
      fetchData()
      /* update viewItem if detail modal open */
      if (viewItem?._id === id) setViewItem(prev => ({ ...prev, status }))
    } catch {
      toast.error('Status update failed')
    } finally {
      setStatusLoading(false)
    }
  }

  return (
    <div className="min-h-screen">

      {/* ── Header ── */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
            <Mail size={20} className="text-[#e24028]" />
            Contact Inquiries
          </h1>
          <p className="text-sm text-gray-500">Messages received from the website contact form</p>
        </div>
        <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full border border-blue-200">
          {total} total
        </span>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end">

          {/* Search */}
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email or message..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="w-full h-9 pl-8 pr-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0c3b73] focus:border-[#0c3b73] transition"
              />
            </div>
          </div>

          {/* Status filter */}
          <div className="w-full sm:w-[180px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <Select
              allowClear
              placeholder="All statuses"
              value={statusFilter}
              onChange={v => { setStatusFilter(v ?? null); setPage(1) }}
              className="w-full"
              size="middle"
            >
              <Option value="PENDING">Pending</Option>
              <Option value="REVIEWED">Reviewed</Option>
              <Option value="RESOLVED">Resolved</Option>
            </Select>
          </div>

          {/* Clear */}
          {(search || statusFilter) && (
            <button
              onClick={() => { setSearchInput(''); setSearch(''); setStatusFilter(null); setPage(1) }}
              className="h-9 px-4 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="relative bg-white border border-gray-200 rounded-lg overflow-x-auto min-h-[200px]">
        {loading && (
          <div className="absolute inset-0 z-30 bg-white/70 flex flex-col items-center justify-center">
            <Loader />
            <p className="text-sm text-gray-400 mt-2">Loading inquiries...</p>
          </div>
        )}

        <table className="min-w-full border-collapse w-full">
          <thead className="bg-gray-200 text-gray-700">
            <tr>
              <th className="px-4 py-3 text-sm text-center w-14">Sr.</th>
              <th className="px-4 py-3 text-sm text-left">Name</th>
              <th className="px-4 py-3 text-sm text-left">Email</th>
              <th className="px-4 py-3 text-sm text-left">Message</th>
              <th className="px-4 py-3 text-sm text-center w-32">Status</th>
              <th className="px-4 py-3 text-sm text-center w-28">Date</th>
              <th className="sticky right-0 z-20 bg-gray-200 px-4 py-3 text-sm text-center w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && data.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="flex items-center justify-center py-14">
                    <Empty description="No inquiries found" />
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr key={item._id} className="border-t hover:bg-gray-50">

                  {/* Sr */}
                  <td className="px-4 py-3 text-sm text-center text-gray-600">
                    {(page - 1) * limit + index + 1}
                  </td>

                  {/* Name */}
                  <td className="px-4 py-3 text-sm font-medium text-gray-800 whitespace-nowrap">
                    {item.name}
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    <a href={`mailto:${item.email}`} className="text-blue-600 hover:underline">
                      {item.email}
                    </a>
                  </td>

                  {/* Message preview */}
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                    <span className="line-clamp-2">
                      {item.message?.length > 80 ? item.message.slice(0, 80) + '…' : item.message}
                    </span>
                  </td>

                  {/* Status badge */}
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-600'}`}>
                      {item.status}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-sm text-gray-500 text-center whitespace-nowrap">
                    {new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>

                  {/* Actions */}
                  <td className="sticky right-0 z-10 bg-white px-4 py-3 text-center">
                    <div className="flex justify-center gap-2">
                      <Tooltip title="View Details">
                        <button
                          onClick={() => { setViewItem(item); setViewOpen(true) }}
                          className="w-8 h-8 flex items-center justify-center rounded-full text-blue-600 hover:text-white hover:bg-blue-600 transition-all"
                        >
                          <Eye size={15} />
                        </button>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <button
                          onClick={() => { setDeleteItem(item); setShowDelete(true) }}
                          className="w-8 h-8 flex items-center justify-center rounded-full text-red-500 hover:text-white hover:bg-red-500 transition-all"
                        >
                          <Trash2 size={15} />
                        </button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
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
              onChange={p => setPage(p)}
              onShowSizeChange={(_, s) => { setLimit(s); setPage(1) }}
              size="small"
            />
          </div>
        )}
      </div>

      {/* ── Detail Modal ── */}
      <Modal
        open={viewOpen}
        onCancel={() => { setViewOpen(false); setViewItem(null) }}
        footer={null}
        title={
          <div className="flex items-center gap-2 text-gray-800">
            <Mail size={18} className="text-[#e24028]" />
            Contact Inquiry Details
          </div>
        }
        width={520}
      >
        {viewItem && (
          <div className="space-y-4 pt-2">

            {/* Name + Email */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Name</p>
                <p className="text-sm text-gray-800 font-semibold">{viewItem.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Email</p>
                <a href={`mailto:${viewItem.email}`} className="text-sm text-blue-600 hover:underline">
                  {viewItem.email}
                </a>
              </div>
            </div>

            {/* Message */}
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Message</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed whitespace-pre-wrap border border-gray-100">
                {viewItem.message}
              </p>
            </div>

            {/* Status + Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Status</p>
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[viewItem.status] || 'bg-gray-100 text-gray-600'}`}>
                  {viewItem.status}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Received</p>
                <p className="text-sm text-gray-700">
                  {new Date(viewItem.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {/* Status actions */}
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Update Status</p>
              <div className="flex gap-2 flex-wrap">
                {['PENDING', 'REVIEWED', 'RESOLVED'].map(s => (
                  <button
                    key={s}
                    disabled={viewItem.status === s || statusLoading}
                    onClick={() => updateStatus(viewItem._id, s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition
                      ${viewItem.status === s
                        ? 'bg-[#0c3b73] text-white border-[#0c3b73] cursor-default'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-[#0c3b73] hover:text-[#0c3b73]'
                      }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Delete Modal ── */}
      <DeleteModal
        open={showDelete}
        title="Delete Inquiry"
        description="This contact inquiry will be permanently deleted."
        itemName={deleteItem?.name}
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => { setShowDelete(false); setDeleteItem(null) }}
      />
    </div>
  )
}

export default ContactInquiries
