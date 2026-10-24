import React from 'react'
import { Modal, Tag, Divider } from 'antd'
import {
  User, Phone, MessageCircle, Mail, Globe, Building2,
  MapPin, Calendar, CheckCircle, XCircle, Clock, AlertCircle,
} from 'lucide-react'

const STATUS_CONFIG = {
  PENDING_VERIFICATION: { color: 'orange', icon: <Clock size={13} />,        label: 'Pending OTP Verification' },
  LEAD:                 { color: 'blue',   icon: <AlertCircle size={13} />,   label: 'Lead — OTP Verified'      },
  VERIFIED:             { color: 'cyan',   icon: <CheckCircle size={13} />,   label: 'Email Verified'           },
  PAYMENT_PENDING:      { color: 'gold',   icon: <Clock size={13} />,         label: 'Payment Pending'          },
  COMPLETED:            { color: 'green',  icon: <CheckCircle size={13} />,   label: 'School Created'           },
  REJECTED:             { color: 'red',    icon: <XCircle size={13} />,       label: 'Rejected'                 },
}

const Row = ({ icon, label, value, mono = false }) => {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="mt-0.5 flex-shrink-0 text-gray-400">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide leading-none mb-1">{label}</p>
        <p className={`text-sm text-gray-800 break-all ${mono ? 'font-mono' : 'font-medium'}`}>{value}</p>
      </div>
    </div>
  )
}

const LeadDetailModal = ({ open, data, onClose }) => {
  if (!data) return null

  const cfg = STATUS_CONFIG[data.status] || { color: 'default', label: data.status, icon: null }

  const formatDate = (d) =>
    d ? new Date(d).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }) : null

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
      title={
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#0c3b73]/10 flex items-center justify-center border border-[#0c3b73]/20">
            <span className="text-sm font-bold text-[#0c3b73] uppercase">
              {(data.contactName || data.schoolName || '?')[0]}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-base leading-tight">
              {data.contactName || data.schoolName || 'Lead Details'}
            </p>
            <p className="text-xs text-gray-400 font-normal">{data.schoolEmail}</p>
          </div>
        </div>
      }
    >
      {/* Status */}
      <div className="flex items-center gap-2 mb-4 pt-1">
        <Tag color={cfg.color} className="flex items-center gap-1.5 text-sm px-3 py-1">
          {cfg.icon} {cfg.label}
        </Tag>
        {data.isEmailVerified && (
          <Tag color="green" className="text-xs">Email Verified ✓</Tag>
        )}
        {data.source && (
          <Tag color="geekblue" className="text-xs capitalize ml-auto">{data.source}</Tag>
        )}
      </div>

      {/* Step 1 — Contact Info */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Step 1 — Contact Person Details
        </p>
        <Row icon={<User size={15} />}       label="Name"       value={data.contactName} />
        <Row icon={<Phone size={15} />}       label="Mobile No"  value={data.mobileNo || data.schoolContact} />
        <Row icon={<MessageCircle size={15} />} label="WhatsApp" value={data.whatsappNo} />
        <Row icon={<Mail size={15} />}        label="Email"      value={data.schoolEmail} />
        <Row icon={<Globe size={15} />}       label="Subdomain"  value={data.subdomain ? `${data.subdomain}.schoolcloudx.com` : null} mono />
      </div>

      {/* Step 2 — School Info (only if filled) */}
      {data.status === 'COMPLETED' && (
        <div className="bg-green-50/60 rounded-xl p-4 mb-4 border border-green-100">
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-3">
            Step 2 — School Details
          </p>
          <Row icon={<Building2 size={15} />} label="School Name"       value={data.schoolName} />
          <Row icon={<MapPin size={15} />}    label="Address"            value={data.schoolAddress} />
          <Row icon={<MapPin size={15} />}    label="City / State"
            value={[data.city, data.state, data.pincode].filter(Boolean).join(', ') || null} />
          <Row icon={<Building2 size={15} />} label="Affiliation Board"  value={data.affiliationLine} />
          <Row icon={<Building2 size={15} />} label="Affiliation No"     value={data.affiliationNo} />
          <Row icon={<Building2 size={15} />} label="School Medium"      value={data.schoolMedium} />
        </div>
      )}

      {/* Timestamps */}
      <div className="flex gap-4 text-xs text-gray-400 pt-2">
        <div className="flex items-center gap-1">
          <Calendar size={12} />
          <span>Created: {formatDate(data.createdAt)}</span>
        </div>
        {data.updatedAt && data.updatedAt !== data.createdAt && (
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>Updated: {formatDate(data.updatedAt)}</span>
          </div>
        )}
      </div>

      {/* Rejection reason */}
      {data.rejectionReason && (
        <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100 text-sm text-red-700">
          <strong>Rejection Reason:</strong> {data.rejectionReason}
        </div>
      )}
    </Modal>
  )
}

export default LeadDetailModal
