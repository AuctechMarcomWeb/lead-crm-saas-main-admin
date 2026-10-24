import React, { useState, useEffect } from 'react'
import { Modal } from 'antd'
import {
  LogIn, Loader2, ExternalLink,
  Check, AlertTriangle, RefreshCw,
  Terminal, UserCog, User,
} from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'
import { getRequest } from '../../../Helpers'

const API_BASE = import.meta.env.VITE_API_BASE_URL

const getSchoolUrl = (subdomain) => {
  const baseUrl = import.meta.env.VITE_SCHOOL_BASE_URL
  if (baseUrl) return baseUrl.replace('{subdomain}', subdomain).replace(/\/$/, '')
  return (import.meta.env.VITE_SCHOOL_PORTAL_URL || 'http://localhost:5179').replace(/\/$/, '')
}

/* ─── Role card ─── */
const RoleCard = ({ label, desc, icon: Icon, selected, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{ fontFamily: 'Inter, sans-serif' }}
    className={`w-full text-left px-4 py-3.5 rounded-2xl border-2 transition-all duration-150 flex items-center gap-4
      ${disabled ? 'opacity-40 cursor-not-allowed border-gray-100 bg-gray-50' : ''}
      ${!disabled && selected
        ? 'border-[#0c3b73] bg-blue-50 shadow-sm'
        : !disabled ? 'border-gray-200 bg-white hover:border-[#0c3b73] hover:bg-blue-50 hover:shadow-sm' : ''
      }`}
  >
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
      selected ? 'bg-[#0c3b73]' : 'bg-gray-100'
    }`}>
      <Icon size={20} className={selected ? 'text-white' : 'text-gray-400'} />
    </div>
    <div className="flex-1 min-w-0">
      <p style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}
        className={selected ? 'text-[#0c3b73]' : 'text-gray-800'}>
        {label}
      </p>
      <p style={{ fontSize: 12, fontWeight: 400, marginTop: 2 }} className="text-gray-400 truncate">
        {desc}
      </p>
    </div>
    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
      selected ? 'bg-[#0c3b73] border-[#0c3b73]' : 'border-gray-300 bg-white'
    }`}>
      {selected && <Check size={11} className="text-white" strokeWidth={3} />}
    </div>
  </button>
)

/* ════════════════════════════════════════════════
   QUICK LOGIN MODAL
════════════════════════════════════════════════ */
const QuickLoginModal = ({ open, onClose, school }) => {
  const [step, setStep] = useState('idle')
  const [allCreds, setAllCreds] = useState(null)
  const [selectedRole, setSelectedRole] = useState('SuperAdmin')
  const [errorMsg, setErrorMsg] = useState('')
  const [debugInfo, setDebugInfo] = useState(null)
  const [showDebug, setShowDebug] = useState(false)

  useEffect(() => {
    if (open && school?._id) {
      setStep('fetching')
      setAllCreds(null)
      setSelectedRole('SuperAdmin')
      setErrorMsg('')
      setDebugInfo(null)
      setShowDebug(false)
      doFetchCredentials()
    }
  }, [open, school?._id])

  const doFetchCredentials = async () => {
    try {
      const res = await getRequest(`tenant/${school._id}`)
      const data = res?.data?.data
      const superAdmin = data?.superAdminCredentials || data?.credentials
      const admin      = data?.adminCredentials
      if (!superAdmin && !admin) throw new Error('No credentials returned from backend for this agency.')
      setAllCreds({ superAdmin, admin })
      setStep('choose')
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to fetch credentials'
      setErrorMsg(msg)
      setDebugInfo({ type: 'fetch', url: `${API_BASE}tenant/${school._id}`, error: msg })
      setStep('error')
    }
  }

  const handleRoleConfirm = () => {
    const creds = selectedRole === 'SuperAdmin' ? allCreds?.superAdmin : allCreds?.admin
    if (!creds) {
      setErrorMsg(`No ${selectedRole} credentials found for this school.`)
      setStep('error')
      return
    }
    setStep('logging-in')
    handleLoginWithCreds(creds)
  }

  const handleLoginWithCreds = async (creds) => {
    const userId = creds?.userId || creds?.email || ''
    const password = creds?.password || ''
    const subdomain = school.subdomain || ''
    try {
      const res = await axios.post(
        `${API_BASE}auth/loginWithPassword`,
        { userId, password },
        { headers: { 'x-tenant-id': subdomain } }
      )
      const token = res?.data?.data?.authToken || res?.data?.data?.token
      if (!token) throw new Error('Login succeeded but no token returned')
      openPortal(token)
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Login failed. Please check credentials.'
      setErrorMsg(msg)
      setDebugInfo({
        type: 'login',
        tried: [`POST ${API_BASE}auth/loginWithPassword → { userId: "${userId}" } Header: x-tenant-id: "${subdomain}"`],
        error: msg,
      })
      setStep('error')
    }
  }

  const openPortal = (token) => {
    setStep('done')
    const displayName = school.agencyName || school.schoolName || school.name || 'Agency'
    toast.success(`Opening ${displayName}…`)
    const schoolUrl = getSchoolUrl(school.subdomain || '')
    const targetUrl = `${schoolUrl}/auto-login?token=${encodeURIComponent(token)}`
    setTimeout(() => {
      window.open(targetUrl, '_blank', 'noopener,noreferrer')
      handleClose()
    }, 600)
  }

  const handleClose = () => {
    setStep('idle')
    setAllCreds(null)
    setErrorMsg('')
    setDebugInfo(null)
    setShowDebug(false)
    onClose()
  }

  if (!school) return null

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      width={500}
      destroyOnClose
      styles={{
        content: { borderRadius: 20, padding: 0, overflow: 'hidden', fontFamily: 'Inter, sans-serif' },
        header: { padding: '20px 24px 0 24px', marginBottom: 0, background: 'transparent' },
        body: { padding: '16px 24px 24px 24px' },
      }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'Inter, sans-serif' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: '#0c3b73', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <LogIn size={18} color="white" />
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              Quick Login to Agency
            </p>
            <p style={{ fontSize: 12, fontWeight: 400, color: '#94a3b8', margin: 0, marginTop: 2 }}>
              Choose a role to open the agency portal
            </p>
          </div>
        </div>
      }
    >
      <div style={{ fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── School card ── */}
        <div style={{
          background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16,
          padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14
        }}>
          {school.logo ? (
            <img src={school.logo} alt=""
              style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'contain', border: '1px solid #e2e8f0', background: '#fff', padding: 3, flexShrink: 0 }} />
          ) : (
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: '#eff6ff',
              border: '1px solid #dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#0c3b73' }}>
                {(school.agencyName || school.schoolName || school.name || 'AG').slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {school.agencyName || school.schoolName || school.name}
            </p>
            <p style={{ fontSize: 11, fontWeight: 400, color: '#94a3b8', margin: 0, marginTop: 3, fontFamily: 'monospace' }}>
              {school.subdomain}
            </p>
          </div>
          <span style={{
            padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, flexShrink: 0,
            ...(school.isActive
              ? { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }
              : { background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3' })
          }}>
            {school.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* ── FETCHING ── */}
        {step === 'fetching' && (
          <div style={{ padding: '32px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Loader2 size={26} className="text-[#0c3b73] animate-spin" />
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Fetching agency data…</p>
          </div>
        )}

        {/* ── CHOOSE ROLE ── */}
        {step === 'choose' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
              Select Login Role
            </p>
            <RoleCard
              label="Super Admin"
              desc="Full agency control — settings, subscriptions, agents"
              icon={UserCog}
              selected={selectedRole === 'SuperAdmin'}
              disabled={!allCreds?.superAdmin}
              onClick={() => setSelectedRole('SuperAdmin')}
            />
            <RoleCard
              label="Admin"
              desc="Day-to-day operations — leads, listings, reports"
              icon={User}
              selected={selectedRole === 'Admin'}
              disabled={!allCreds?.admin}
              onClick={() => setSelectedRole('Admin')}
            />
          </div>
        )}

        {/* ── LOGGING IN ── */}
        {step === 'logging-in' && (
          <div style={{ padding: '32px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
            <Loader2 size={26} className="text-[#0c3b73] animate-spin" />
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>
              Logging in as {selectedRole === 'SuperAdmin' ? 'Super Admin' : 'Admin'}…
            </p>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Opening school portal in new tab</p>
          </div>
        )}

        {/* ── DONE ── */}
        {step === 'done' && (
          <div style={{ padding: '32px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: 99, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ExternalLink size={24} color="#16a34a" />
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>
              Opening {school.agencyName || school.schoolName || school.name} in new tab…
            </p>
          </div>
        )}

        {/* ── ERROR ── */}
        {step === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 14, padding: '12px 16px', display: 'flex', gap: 10 }}>
              <AlertTriangle size={16} color="#e11d48" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#be123c', margin: 0 }}>Login Failed</p>
                <p style={{ fontSize: 12, color: '#e11d48', margin: 0, marginTop: 4, whiteSpace: 'pre-wrap' }}>{errorMsg}</p>
              </div>
            </div>
            {debugInfo && (
              <div>
                <button
                  onClick={() => setShowDebug(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <Terminal size={11} />
                  {showDebug ? 'Hide' : 'Show'} debug info
                </button>
                {showDebug && (
                  <div style={{ marginTop: 8, background: '#0f172a', borderRadius: 10, padding: '10px 14px', fontSize: 11, fontFamily: 'monospace', color: '#4ade80', overflowX: 'auto' }}>
                    {debugInfo.tried?.map((line, i) => <p key={i} style={{ margin: 0 }}>tried: {line}</p>)}
                    <p style={{ margin: 0, color: '#f87171' }}>error: {debugInfo.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── FOOTER BUTTONS ── */}
        <div style={{ display: 'flex', gap: 10, paddingTop: 4, borderTop: '1px solid #f1f5f9', marginTop: 4 }}>
          <button
            onClick={handleClose}
            style={{
              flex: 1, padding: '11px 0', fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif',
              border: '1.5px solid #e2e8f0', borderRadius: 12, color: '#475569',
              background: 'white', cursor: 'pointer', transition: 'all 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.background = 'white'}
          >
            Cancel
          </button>

          {step === 'choose' && (
            <button
              onClick={handleRoleConfirm}
              style={{
                flex: 2, padding: '11px 0', fontSize: 13, fontWeight: 700, fontFamily: 'Inter, sans-serif',
                border: 'none', borderRadius: 12, color: 'white',
                background: '#0c3b73', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                letterSpacing: '-0.01em', transition: 'background 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#0a2f5c'}
              onMouseLeave={e => e.currentTarget.style.background = '#0c3b73'}
            >
              <LogIn size={15} />
              Open as {selectedRole === 'SuperAdmin' ? 'Super Admin' : 'Admin'}
            </button>
          )}

          {(step === 'logging-in' || step === 'done') && (
            <button
              disabled
              style={{
                flex: 2, padding: '11px 0', fontSize: 13, fontWeight: 700, fontFamily: 'Inter, sans-serif',
                border: 'none', borderRadius: 12, color: 'white',
                background: '#0c3b73', opacity: 0.6, cursor: 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
            >
              <Loader2 size={14} className="animate-spin" /> Opening…
            </button>
          )}

          {step === 'error' && (
            <button
              onClick={() => { setErrorMsg(''); setDebugInfo(null); setShowDebug(false); setStep('fetching'); doFetchCredentials() }}
              style={{
                flex: 2, padding: '11px 0', fontSize: 13, fontWeight: 700, fontFamily: 'Inter, sans-serif',
                border: 'none', borderRadius: 12, color: 'white',
                background: '#0c3b73', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#0a2f5c'}
              onMouseLeave={e => e.currentTarget.style.background = '#0c3b73'}
            >
              <RefreshCw size={14} /> Retry
            </button>
          )}
        </div>

      </div>
    </Modal>
  )
}

export default QuickLoginModal
