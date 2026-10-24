import React, { useState, useEffect } from 'react'
import { UserPlus, Eye, Phone, Mail, MessageCircle, Globe, Clock, CheckCircle, XCircle, AlertCircle, Trash2 } from 'lucide-react'
import { Pagination, Tag, Empty, Table, Tooltip, Modal } from 'antd'
import toast from 'react-hot-toast'
import { getRequest, deleteRequest } from '../../../Helpers'
import Loader from '../../../components/Loading/Loader'
import LeadDetailModal from './LeadDetailModal'
import LeadsFilters from './LeadsFilters'

// Status badge config
const STATUS_CONFIG = {
  PENDING_VERIFICATION: { color: 'orange',  icon: <Clock size={11} />,        label: 'Pending OTP'   },
  LEAD:                 { color: 'blue',    icon: <AlertCircle size={11} />,   label: 'Lead'          },
  VERIFIED:             { color: 'cyan',    icon: <CheckCircle size={11} />,   label: 'Verified'      },
  PAYMENT_PENDING:      { color: 'gold',    icon: <Clock size={11} />,         label: 'Payment Pending'},
  COMPLETED:            { color: 'green',   icon: <CheckCircle size={11} />,   label: 'Completed'     },
  REJECTED:             { color: 'red',     icon: <XCircle size={11} />,       label: 'Rejected'      },
}

const LeadsListing = () => {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage]       = useState(1)
  const [limit, setLimit]     = useState(10)
  const [total, setTotal]     = useState(0)
  const [selected, setSelected] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [filters, setFilters] = useState({ search: '', status: null })

  const fetchLeads = () => {
    setLoading(true)
    const params = { page, limit, isPagination: true }
    if (filters.search)  params.search = filters.search
    if (filters.status)  params.status = filters.status

    getRequest(`onboarding/registrations?${new URLSearchParams(params).toString()}`)
      .then((res) => {
        setData(res?.data?.data?.registrations || [])
        setTotal(res?.data?.data?.total || 0)
      })
      .catch(() => toast.error('Failed to load leads'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchLeads() }, [filters, page, limit])

  const handleDelete = () => {
    if (!deleteTarget) return
    setDeleting(true)
    deleteRequest(`onboarding/registrations/${deleteTarget._id}`)
      .then(() => {
        toast.success('Registration deleted successfully')
        setDeleteTarget(null)
        fetchLeads()
      })
      .catch((err) => toast.error(err?.response?.data?.message || 'Failed to delete'))
      .finally(() => setDeleting(false))
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
      title: 'Contact Person',
      key: 'contact',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#0c3b73]/10 flex items-center justify-center flex-shrink-0 border border-[#0c3b73]/20">
            <span className="text-sm font-semibold text-[#0c3b73] uppercase">
              {(row.contactName || row.schoolName || '?')[0]}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-800 text-sm leading-tight">
              {row.contactName || row.schoolName || '—'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {row.schoolEmail}
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Subdomain',
      dataIndex: 'subdomain',
      align: 'center',
      render: (sub) =>
        sub ? (
          <div className="flex items-center justify-center gap-1">
            <Globe size={11} className="text-gray-400" />
            <span className="font-mono text-xs text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
              {sub}
            </span>
          </div>
        ) : <span className="text-gray-400 text-xs">—</span>,
    },
    {
      title: 'Mobile / WhatsApp',
      key: 'mobile',
      align: 'center',
      render: (_, row) => (
        <div className="flex flex-col items-center gap-1">
          {row.mobileNo && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Phone size={11} className="text-gray-400" />
              {row.mobileNo}
            </div>
          )}
          {row.whatsappNo && row.whatsappNo !== row.mobileNo && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <MessageCircle size={11} />
              {row.whatsappNo}
            </div>
          )}
          {(!row.mobileNo && !row.whatsappNo) && (
            <span className="text-gray-400 text-xs">—</span>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      align: 'center',
      render: (status) => {
        const cfg = STATUS_CONFIG[status] || { color: 'default', label: status, icon: null }
        return (
          <Tag color={cfg.color} className="flex items-center gap-1 w-fit mx-auto text-xs px-2 py-0.5">
            {cfg.icon}
            {cfg.label}
          </Tag>
        )
      },
    },
    {
      title: 'School Name',
      key: 'schoolName',
      render: (_, row) =>
        row.status === 'COMPLETED' && row.schoolName
          ? <span className="text-xs font-medium text-gray-700">{row.schoolName}</span>
          : <span className="text-xs text-gray-400 italic">Not filled yet</span>,
    },
    {
      title: 'Source',
      dataIndex: 'source',
      align: 'center',
      render: (src) => (
        <Tag color="geekblue" className="text-xs capitalize">
          {src || 'website'}
        </Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      align: 'center',
      render: (date) =>
        date ? (
          <Tooltip title={new Date(date).toLocaleString('en-IN')}>
            <span className="text-xs text-gray-500">
              {new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </Tooltip>
        ) : '—',
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      width: 90,
      render: (_, row) => (
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setSelected(row); setModalOpen(true) }}
            className="p-1.5 text-[#0c3b73] hover:bg-[#0c3b73]/10 rounded-md transition"
            title="View details"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(row) }}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition"
            title="Delete registration"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
            <UserPlus size={20} className="text-[#e24028]" />
            Leads & Registrations
          </h1>
          <p className="text-sm text-gray-500">
            Website registrations — OTP verified leads and completed tenant
          </p>
        </div>
        {/* Stats badges */}
        <div className="flex gap-2 flex-wrap">
          {[
            { label: 'Total', val: total,                      color: 'bg-gray-100 text-gray-700' },
          ].map(({ label, val, color }) => (
            <span key={label} className={`text-xs font-semibold px-3 py-1.5 rounded-full ${color}`}>
              {label}: {val}
            </span>
          ))}
        </div>
      </div>

      {/* Filters */}
      <LeadsFilters
        appliedFilters={filters}
        onApply={(f) => { setFilters(f); setPage(1) }}
        onClear={() => { setFilters({ search: '', status: null }); setPage(1) }}
      />

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center"><Loader /><p className="text-sm text-gray-400 mt-2">Loading...</p></div>
        ) : (
          <Table
            columns={columns}
            dataSource={data}
            rowKey="_id"
            pagination={false}
            locale={{ emptyText: <Empty description="No leads found" /> }}
            scroll={{ x: 'max-content' }}
            onRow={(row) => ({
              onClick: () => { setSelected(row); setModalOpen(true) },
              style: { cursor: 'pointer' },
            })}
            rowClassName={(row) =>
              row.status === 'LEAD' ? 'bg-blue-50/30' :
              row.status === 'COMPLETED' ? 'bg-green-50/20' : ''
            }
          />
        )}

        {!loading && data.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </p>
            <Pagination
              current={page}
              pageSize={limit}
              total={total}
              pageSizeOptions={['10', '20', '50']}
              showSizeChanger
              onChange={(p) => setPage(p)}
              onShowSizeChange={(_, s) => { setLimit(s); setPage(1) }}
              size="small"
            />
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {modalOpen && (
        <LeadDetailModal
          open={modalOpen}
          data={selected}
          onClose={() => { setModalOpen(false); setSelected(null) }}
          onRefresh={fetchLeads}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteTarget}
        onCancel={() => !deleting && setDeleteTarget(null)}
        onOk={handleDelete}
        okText="Yes, Delete"
        cancelText="Cancel"
        okButtonProps={{
          danger: true,
          loading: deleting,
        }}
        title={
          <div className="flex items-center gap-2 text-red-600">
            <Trash2 size={17} />
            <span>Delete Registration</span>
          </div>
        }
        centered
        width={420}
      >
        {deleteTarget && (
          <div className="py-2">
            <p className="text-gray-700 text-sm mb-3">
              Are you sure you want to delete this registration? This action cannot be undone.
            </p>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-sm space-y-1">
              <p className="font-semibold text-gray-800">{deleteTarget.contactName || deleteTarget.schoolName || '—'}</p>
              <p className="text-gray-500 text-xs">{deleteTarget.schoolEmail}</p>
              {deleteTarget.subdomain && (
                <p className="text-gray-400 text-xs font-mono">{deleteTarget.subdomain}.schoolcloudx.com</p>
              )}
              {deleteTarget.status === 'COMPLETED' && (
                <p className="text-red-500 text-xs mt-2 font-medium">
                  ⚠️ This is a completed school — deletion will be blocked by the server.
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default LeadsListing
