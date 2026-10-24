import React, { useState, useEffect } from 'react'
import { HelpCircle, Plus, Edit, Trash2, Search, ChevronDown, ChevronUp, Tag } from 'lucide-react'
import { Pagination, Empty, Select, Tooltip } from 'antd'
import toast from 'react-hot-toast'
import { deleteRequest, getRequest } from '../../../Helpers'
import FAQModal from './FAQModal'
import DeleteModal from '../../../components/DeleteModal/DeleteModal'
import Loader from '../../../components/Loading/Loader'

const { Option } = Select

const FAQListing = () => {
  const [data, setData]           = useState([])
  const [loading, setLoading]     = useState(false)
  const [page, setPage]           = useState(1)
  const [limit, setLimit]         = useState(10)
  const [total, setTotal]         = useState(0)

  /* search & filter */
  const [search, setSearch]           = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selCategory, setSelCategory] = useState(null)
  const [categories, setCategories]   = useState([])

  /* expanded accordion row */
  const [expandedId, setExpandedId]   = useState(null)

  /* modals */
  const [isModalOpen, setIsModalOpen]     = useState(false)
  const [selectedItem, setSelectedItem]   = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  /* ── fetch ── */
  const fetchFAQs = () => {
    setLoading(true)
    const params = new URLSearchParams({ page, limit, isPagination: true })
    if (search)      params.append('search',   search)
    if (selCategory) params.append('category', selCategory)

    getRequest(`faq?${params.toString()}`)
      .then(res => {
        const d = res?.data?.data
        setData(d?.faqs || d?.list || [])
        setTotal(d?.total || d?.totalFAQs || 0)
        /* derive unique categories from response */
        const cats = [...new Set((d?.faqs || d?.list || []).map(f => f.category).filter(Boolean))]
        setCategories(prev => [...new Set([...prev, ...cats])])
      })
      .catch(() => toast.error('Failed to load FAQs'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchFAQs() }, [page, limit, search, selCategory])

  /* ── delete ── */
  const confirmDelete = async () => {
    if (!selectedItem) return
    setDeleteLoading(true)
    try {
      await deleteRequest(`faq/${selectedItem._id}`)
      toast.success('FAQ deleted')
      setShowDeleteModal(false)
      setSelectedItem(null)
      fetchFAQs()
    } catch {
      toast.error('Delete failed')
    } finally {
      setDeleteLoading(false)
    }
  }

  /* ── search with debounce ── */
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  /* category colors */
  const CAT_COLORS = ['bg-blue-100 text-blue-700','bg-purple-100 text-purple-700',
    'bg-green-100 text-green-700','bg-orange-100 text-orange-700',
    'bg-rose-100 text-rose-700','bg-cyan-100 text-cyan-700']
  const catColorMap = {}
  categories.forEach((c, i) => { catColorMap[c] = CAT_COLORS[i % CAT_COLORS.length] })

  return (
    <div className="min-h-screen">

      {/* ── Header ── */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
            <HelpCircle size={20} className="text-[#e24028]" />
            FAQ Management
          </h1>
          <p className="text-sm text-gray-500">Manage frequently asked questions</p>
        </div>
        <button
          onClick={() => { setSelectedItem(null); setIsModalOpen(true) }}
          className="bg-[#0c3b73] hover:bg-[#0a2f5c] text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition"
        >
          <Plus size={16} /> Add FAQ
        </button>
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
                placeholder="Search question or answer..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="w-full h-9 pl-8 pr-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0c3b73] focus:border-[#0c3b73] transition"
              />
            </div>
          </div>

          {/* Category filter */}
          <div className="w-full sm:w-[200px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
            <Select
              allowClear
              placeholder="All categories"
              value={selCategory}
              onChange={v => { setSelCategory(v ?? null); setPage(1) }}
              className="w-full"
              size="middle"
            >
              {categories.map(c => <Option key={c} value={c}>{c}</Option>)}
            </Select>
          </div>

          {/* Clear */}
          {(search || selCategory) && (
            <button
              onClick={() => { setSearchInput(''); setSearch(''); setSelCategory(null); setPage(1) }}
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
            <p className="text-sm text-gray-400 mt-2">Loading FAQs...</p>
          </div>
        )}

        <table className="min-w-full border-collapse w-full">
          <thead className="bg-gray-200 text-gray-700">
            <tr>
              <th className="px-4 py-3 text-sm text-center w-14">Sr.</th>
              <th className="px-4 py-3 text-sm text-left w-36">Category</th>
              <th className="px-4 py-3 text-sm text-left">Question</th>
              <th className="px-4 py-3 text-sm text-left">Answer</th>
              <th className="sticky right-0 z-20 bg-gray-200 px-4 py-3 text-sm text-center w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && data.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="flex items-center justify-center py-14">
                    <Empty description="No FAQs found" />
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => {
                const isExpanded = expandedId === item._id
                const answerPreview = item.answer?.length > 80
                  ? item.answer.slice(0, 80) + '...'
                  : item.answer

                return (
                  <tr key={item._id} className="border-t hover:bg-gray-50">
                    {/* Sr */}
                    <td className="px-4 py-3 text-sm text-center text-gray-600">
                      {(page - 1) * limit + index + 1}
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${catColorMap[item.category] || 'bg-gray-100 text-gray-600'}`}>
                        <Tag size={10} />
                        {item.category || '—'}
                      </span>
                    </td>

                    {/* Question */}
                    <td className="px-4 py-3 text-sm font-medium text-gray-800 max-w-xs">
                      {item.question}
                    </td>

                    {/* Answer — expandable */}
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-sm">
                      <div>
                        <span className="leading-relaxed">
                          {isExpanded ? item.answer : answerPreview}
                        </span>
                        {item.answer?.length > 80 && (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : item._id)}
                            className="ml-1 inline-flex items-center gap-0.5 text-[#0c3b73] text-xs font-medium hover:underline"
                          >
                            {isExpanded ? (<><ChevronUp size={12} /> Less</>) : (<><ChevronDown size={12} /> More</>)}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="sticky right-0 z-10 bg-white px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <Tooltip title="Edit">
                          <button
                            onClick={() => { setSelectedItem(item); setIsModalOpen(true) }}
                            className="w-8 h-8 flex items-center justify-center rounded-full text-blue-600 hover:text-white hover:bg-blue-600 transition-all"
                          >
                            <Edit size={15} />
                          </button>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <button
                            onClick={() => { setSelectedItem(item); setShowDeleteModal(true) }}
                            className="w-8 h-8 flex items-center justify-center rounded-full text-red-500 hover:text-white hover:bg-red-500 transition-all"
                          >
                            <Trash2 size={15} />
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                )
              })
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

      {/* ── Modals ── */}
      <FAQModal
        open={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedItem(null) }}
        editData={selectedItem}
        categories={categories}
        refresh={fetchFAQs}
      />

      <DeleteModal
        open={showDeleteModal}
        title="Delete FAQ"
        description="This FAQ will be permanently removed."
        itemName={selectedItem?.question}
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => { setShowDeleteModal(false); setSelectedItem(null) }}
      />
    </div>
  )
}

export default FAQListing
