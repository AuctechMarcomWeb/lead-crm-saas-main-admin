import React, { useState, useEffect } from 'react'
import { Mail, Search, Trash2, UserCheck, UserX, Send } from 'lucide-react'
import { Pagination, Empty, Select, Tooltip, Modal } from 'antd'
import toast from 'react-hot-toast'
import { deleteRequest, getRequest, postRequest } from '../../../Helpers'
import DeleteModal from '../../../components/DeleteModal/DeleteModal'
import Loader from '../../../components/Loading/Loader'

const { Option } = Select

const NewsletterSubscribers = () => {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage]       = useState(1)
  const [limit, setLimit]     = useState(10)
  const [total, setTotal]     = useState(0)

  /* filters */
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch]           = useState('')
  const [activeFilter, setActiveFilter] = useState(null)

  /* delete */
  const [deleteItem, setDeleteItem]       = useState(null)
  const [showDelete, setShowDelete]       = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  /* send newsletter modal */
  const [sendOpen, setSendOpen]       = useState(false)
  const [sendSubject, setSendSubject] = useState('')
  const [sendMessage, setSendMessage] = useState('')
  const [sendLoading, setSendLoading] = useState(false)
  const [sendResult, setSendResult]   = useState(null)   // { sent, failed, total }

  /* ── fetch ── */
  const fetchData = () => {
    setLoading(true)
    const params = new URLSearchParams({ page, limit })
    if (search)                params.append('search',   search)
    if (activeFilter !== null) params.append('isActive', activeFilter)

    getRequest(`newsletter/all?${params.toString()}`)
      .then(res => {
        const d = res?.data?.data
        setData(d?.subscribers || [])
        setTotal(d?.total || 0)
      })
      .catch(() => toast.error('Failed to load subscribers'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [page, limit, search, activeFilter])

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
      await deleteRequest(`newsletter/delete/${deleteItem._id}`)
      toast.success('Subscriber removed')
      setShowDelete(false)
      setDeleteItem(null)
      fetchData()
    } catch {
      toast.error('Delete failed')
    } finally {
      setDeleteLoading(false)
    }
  }

  /* ── send newsletter ── */
  const handleSend = async () => {
    if (!sendSubject.trim() || !sendMessage.trim()) {
      toast.error('Subject aur message dono required hain')
      return
    }
    setSendLoading(true)
    setSendResult(null)
    try {
      const res = await postRequest({
        url:  'newsletter/send',
        cred: { subject: sendSubject.trim(), message: sendMessage.trim() },
      })
      const result = res?.data?.data
      setSendResult(result)
      toast.success(res?.data?.message || 'Newsletter sent!')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Send failed')
    } finally {
      setSendLoading(false)
    }
  }

  const closeSendModal = () => {
    setSendOpen(false)
    setSendSubject('')
    setSendMessage('')
    setSendResult(null)
  }

  return (
    <div className="min-h-screen">

      {/* ── Header ── */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
            <Mail size={20} className="text-[#e24028]" />
            Newsletter Subscribers
          </h1>
          <p className="text-sm text-gray-500">Emails subscribed from the website footer</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full border border-green-200 flex items-center gap-1">
            <UserCheck size={12} /> {total} total
          </span>
          <button
            onClick={() => setSendOpen(true)}
            className="bg-[#0c3b73] hover:bg-[#0a2f5c] text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition"
          >
            <Send size={15} /> Send Newsletter
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by email..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="w-full h-9 pl-8 pr-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0c3b73] focus:border-[#0c3b73] transition"
              />
            </div>
          </div>

          <div className="w-full sm:w-[180px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <Select
              allowClear
              placeholder="All subscribers"
              value={activeFilter}
              onChange={v => { setActiveFilter(v ?? null); setPage(1) }}
              className="w-full"
              size="middle"
            >
              <Option value="true">Active</Option>
              <Option value="false">Unsubscribed</Option>
            </Select>
          </div>

          {(search || activeFilter !== null) && (
            <button
              onClick={() => { setSearchInput(''); setSearch(''); setActiveFilter(null); setPage(1) }}
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
            <p className="text-sm text-gray-400 mt-2">Loading subscribers...</p>
          </div>
        )}

        <table className="min-w-full border-collapse w-full">
          <thead className="bg-gray-200 text-gray-700">
            <tr>
              <th className="px-4 py-3 text-sm text-center w-14">Sr.</th>
              <th className="px-4 py-3 text-sm text-left">Email</th>
              <th className="px-4 py-3 text-sm text-center w-32">Status</th>
              <th className="px-4 py-3 text-sm text-center w-36">Subscribed On</th>
              <th className="sticky right-0 z-20 bg-gray-200 px-4 py-3 text-sm text-center w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && data.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="flex items-center justify-center py-14">
                    <Empty description="No subscribers found" />
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr key={item._id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-center text-gray-600">
                    {(page - 1) * limit + index + 1}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                        <Mail size={13} className="text-blue-500" />
                      </div>
                      <a href={`mailto:${item.email}`} className="text-blue-600 hover:underline font-medium">
                        {item.email}
                      </a>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        <UserCheck size={11} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                        <UserX size={11} /> Unsubscribed
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 text-center whitespace-nowrap">
                    {new Date(item.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                  </td>
                  <td className="sticky right-0 z-10 bg-white px-4 py-3 text-center">
                    <Tooltip title="Delete">
                      <button
                        onClick={() => { setDeleteItem(item); setShowDelete(true) }}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-red-500 hover:text-white hover:bg-red-500 transition-all mx-auto"
                      >
                        <Trash2 size={15} />
                      </button>
                    </Tooltip>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {!loading && total > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
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

      {/* ── Send Newsletter Modal ── */}
      <Modal
        open={sendOpen}
        onCancel={closeSendModal}
        footer={null}
        title={
          <div className="flex items-center gap-2 text-gray-800">
            <Send size={17} className="text-[#0c3b73]" />
            Send Newsletter to All Active Subscribers
          </div>
        }
        width={560}
        destroyOnClose
      >
        {sendResult ? (
          /* ── Result screen ── */
          <div className="py-4 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto">
              <Send size={28} className="text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Newsletter Sent!</h3>
            <div className="flex justify-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{sendResult.sent}</p>
                <p className="text-xs text-gray-500 mt-1">Delivered</p>
              </div>
              {sendResult.failed > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-500">{sendResult.failed}</p>
                  <p className="text-xs text-gray-500 mt-1">Failed</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-700">{sendResult.total}</p>
                <p className="text-xs text-gray-500 mt-1">Total</p>
              </div>
            </div>
            {sendResult.errors?.length > 0 && (
              <div className="text-left bg-red-50 border border-red-100 rounded-lg p-3 max-h-28 overflow-y-auto">
                {sendResult.errors.map((e, i) => (
                  <p key={i} className="text-xs text-red-600">{e}</p>
                ))}
              </div>
            )}
            <button
              onClick={closeSendModal}
              className="mt-2 px-6 py-2 bg-[#0c3b73] text-white rounded-lg text-sm font-medium hover:bg-[#0a2f5c] transition"
            >
              Done
            </button>
          </div>
        ) : (
          /* ── Compose screen ── */
          <div className="space-y-4 pt-2">
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 text-sm text-blue-700">
              📧 Will be sent to all <strong>active</strong> subscribers
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Subject *
              </label>
              <input
                type="text"
                placeholder="e.g. New Features in School CloudX"
                value={sendSubject}
                onChange={e => setSendSubject(e.target.value)}
                className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0c3b73]/30 focus:border-[#0c3b73] transition"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Message *
              </label>
              <textarea
                rows={7}
                placeholder="Write your newsletter content here..."
                value={sendMessage}
                onChange={e => setSendMessage(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0c3b73]/30 focus:border-[#0c3b73] transition resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">Plain text — line breaks will be preserved</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-1">
              <button
                onClick={closeSendModal}
                className="px-5 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sendLoading || !sendSubject.trim() || !sendMessage.trim()}
                className="px-5 py-2 text-sm bg-[#0c3b73] text-white rounded-lg font-medium hover:bg-[#0a2f5c] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                {sendLoading ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
                ) : (
                  <><Send size={14} /> Send Now</>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Delete Modal ── */}
      <DeleteModal
        open={showDelete}
        title="Remove Subscriber"
        description="This email will be permanently removed from the newsletter list."
        itemName={deleteItem?.email}
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => { setShowDelete(false); setDeleteItem(null) }}
      />
    </div>
  )
}

export default NewsletterSubscribers
