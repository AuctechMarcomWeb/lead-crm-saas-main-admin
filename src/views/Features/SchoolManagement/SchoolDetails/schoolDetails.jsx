/* eslint-disable prettier/prettier */
/* eslint-disable react/react-in-jsx-scope */

import { useEffect, useState } from 'react'
import { getRequest } from '../../../../Helpers'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Building2, Users, UserCheck,
  ShieldCheck, Phone, Mail, Globe, MapPin,
  BadgeCheck, Eye, EyeOff, Copy, Check,
  Database, BarChart3, LogIn, Home, FileText,
  Instagram, Facebook, Youtube, Linkedin, Twitter,
} from 'lucide-react'
import QuickLoginModal from '../QuickLoginModal'
import InstallmentTracker from './InstallmentTracker'
import SubscriptionStatusPanel from './SubscriptionStatusPanel'

/* ─── Stat Card ─────────────────────────────────────────── */
function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm hover:shadow-xl transition-all duration-300 group h-full">
      <div className="flex items-start justify-between gap-5 h-full">
        <div className="flex flex-col justify-between h-full flex-1 min-w-0">
          <p className="text-[18px] font-medium text-slate-800 leading-snug">{title}</p>
          <h2 className="text-xl font-medium text-slate-800 mt-2">{value}</h2>
        </div>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md transition-all duration-300 group-hover:scale-105" style={{ background: color }}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )
}

/* ─── Info Row ───────────────────────────────────────────── */
function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-1 py-1 border-b border-slate-100 last:border-0">
      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-slate-600" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-800 break-words mt-1">{value || '--'}</p>
      </div>
    </div>
  )
}

/* ─── Credentials Card ───────────────────────────────────── */
function CredentialsCard({ credentials }) {
  const [showPass, setShowPass] = useState(false)
  const [copied,   setCopied]   = useState(null)
  if (!credentials) return null

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm" style={{ background: '#7C3AED' }}>
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-[18px] font-medium text-slate-800">Super Admin Credentials</h2>
          <p className="text-sm font-medium text-slate-400 mt-0.5">Agency login information</p>
        </div>
      </div>

      {/* User ID */}
      <div className="flex items-center justify-between border border-slate-200 rounded-2xl p-4 mb-3">
        <div>
          <p className="text-xs font-medium text-slate-400">User ID</p>
          <p className="text-sm font-medium text-slate-800 mt-1">{credentials.userId}</p>
        </div>
        <button onClick={() => copyText(credentials.userId, 'user')}
          className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border-0 cursor-pointer active:scale-95 transition-transform flex-shrink-0">
          {copied === 'user' ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-slate-600" />}
        </button>
      </div>

      {/* Password */}
      <div className="flex items-center justify-between border border-slate-200 rounded-2xl p-4">
        <div>
          <p className="text-xs font-medium text-slate-400">Password</p>
          <p className="text-sm font-medium text-slate-800 mt-1 tracking-widest">
            {showPass ? credentials.password : '••••••••'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setShowPass(!showPass)}
            className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border-0 cursor-pointer active:scale-95 transition-transform">
            {showPass ? <EyeOff className="w-5 h-5 text-slate-600" /> : <Eye className="w-5 h-5 text-slate-600" />}
          </button>
          <button onClick={() => copyText(credentials.password, 'pass')}
            className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border-0 cursor-pointer active:scale-95 transition-transform">
            {copied === 'pass' ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-slate-600" />}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Dashboard ─────────────────────────────────────── */
export default function AgencyDashboard() {
  const [loading,        setLoading]        = useState(true)
  const [apiData,        setApiData]        = useState(null)
  const [quickLoginOpen, setQuickLoginOpen] = useState(false)
  const navigate = useNavigate()
  const { id }   = useParams()

  const fetchData = async () => {
    try {
      const res = await getRequest(`tenant/${id}`)
      setApiData(res?.data?.data || null)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading Agency Dashboard...</p>
        </div>
      </div>
    )
  }

  if (!apiData?.tenant) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-slate-700 font-semibold text-lg">Failed to load agency profile</p>
          <p className="text-sm text-slate-400">The agency database may be unavailable or the ID is invalid.</p>
          <button onClick={() => { setLoading(true); fetchData() }}
            className="mt-2 px-5 py-2 bg-[#0c3b73] text-white text-sm rounded-xl hover:bg-[#0a2f5c] transition">
            Retry
          </button>
        </div>
      </div>
    )
  }

  const { tenant, stats, subscription, superAdminCredentials } = apiData
  const totalAgents  = stats?.totalAgents  || 0
  const totalAdmins  = stats?.totalAdmins  || 0
  const activeUsers  = stats?.activeUsers  || 0
  const addr         = tenant.address || {}

  return (
    <div className="min-h-screen space-y-6">

      {/* ── Header ── */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
            <button onClick={() => navigate(-1)}
              className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center border-0 hover:bg-slate-200 cursor-pointer transition flex-shrink-0">
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>

            {tenant.logo ? (
              <img src={tenant.logo} alt="logo" className="w-16 h-16 rounded-2xl object-cover border border-slate-200 flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
            )}

            <div>
              <h1 className="text-2xl font-medium text-slate-800 tracking-tight">{tenant.agencyName}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${tenant.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {tenant.isActive ? 'Active' : 'Inactive'}
                </span>
                {tenant.businessType && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {tenant.businessType}
                  </span>
                )}
                {tenant.reraNo && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
                    RERA: {tenant.reraNo}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="md:text-right w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 flex flex-col items-start md:items-end gap-3">
            <div>
              <p className="text-xs text-slate-400 font-medium">Subdomain</p>
              <p className="text-sm font-medium text-slate-700 mt-1">
                {tenant.subdomain}.yourdomain.com
              </p>
            </div>
            <button onClick={() => setQuickLoginOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#0c3b73] hover:bg-[#0a2f5c] text-white text-sm font-semibold rounded-xl transition shadow-sm">
              <LogIn size={15} /> Quick Login to Agency
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="space-y-6">

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
          <StatCard title="Total Agents"   value={totalAgents}                        icon={Users}      color="#0F3B73" />
          <StatCard title="Admins"         value={totalAdmins}                        icon={UserCheck}  color="#1E4E8C" />
          <StatCard title="Active Users"   value={activeUsers}                        icon={BarChart3}  color="#2F6F4F" />
          <StatCard title="Used Capacity"  value={subscription?.usedAgents || 0}      icon={Database}   color="#8B2E2E" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left block */}
          <div className="lg:col-span-2 space-y-6 flex flex-col">

            {/* Agency info */}
            <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm flex-1">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-[18px] font-medium text-slate-800">Agency Information</h2>
                  <p className="text-sm font-medium text-slate-400 mt-0.5">Contact, address & regulatory details</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <InfoRow icon={Phone}     label="Phone"           value={tenant.agencyPhone}     />
                <InfoRow icon={Phone}     label="Alt Phone"       value={tenant.agencyPhoneAlt}  />
                <InfoRow icon={Mail}      label="Email"           value={tenant.agencyEmail}     />
                <InfoRow icon={Globe}     label="Website"         value={tenant.website}         />
                <InfoRow icon={Phone}     label="WhatsApp"        value={tenant.whatsappNo}      />
                <InfoRow icon={BadgeCheck}label="Business Type"   value={tenant.businessType}    />
                <InfoRow icon={FileText}  label="RERA No."        value={tenant.reraNo}          />
                <InfoRow icon={MapPin}    label="RERA State"      value={tenant.reraState}       />
                <InfoRow icon={BadgeCheck}label="GST No."         value={tenant.gstNo}           />
                <InfoRow icon={BadgeCheck}label="PAN No."         value={tenant.panNo}           />
                <InfoRow icon={BadgeCheck}label="CIN No."         value={tenant.cinNo}           />
                <InfoRow icon={FileText}  label="License No."     value={tenant.licenseNo}       />
                <InfoRow icon={Database}  label="MSME Reg."       value={tenant.msmeRegNo}       />
                <InfoRow icon={ShieldCheck}label="ISO Reg."       value={tenant.isoRegNo}        />
                <InfoRow icon={MapPin}    label="Address"         value={[addr.line1, addr.line2, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')} />
                <InfoRow icon={Home}      label="Est. Year"       value={tenant.establishedYear} />
              </div>

              {/* Operating areas */}
              {(tenant.operatingCities?.length > 0 || tenant.operatingStates?.length > 0) && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Operating Areas</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[...(tenant.operatingCities || []), ...(tenant.operatingStates || [])].map((area, i) => (
                      <span key={i} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">{area}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Property types */}
              {tenant.propertyTypes?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Property Types</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tenant.propertyTypes.map((pt, i) => (
                      <span key={i} className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">{pt}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact persons */}
              {(tenant.contactPerson1?.name || tenant.contactPerson2?.name) && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Contact Persons</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[tenant.contactPerson1, tenant.contactPerson2].map((cp, idx) =>
                      cp?.name ? (
                        <div key={idx} className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                          <p className="text-[11px] font-semibold text-slate-400 uppercase mb-2">Person {idx + 1}</p>
                          <p className="text-sm font-medium text-slate-800">{cp.name}</p>
                          {cp.designation && <p className="text-xs text-slate-500 mt-0.5">{cp.designation}</p>}
                          {(cp.phone || cp.contactNo) && (
                            <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {cp.phone || cp.contactNo}
                            </p>
                          )}
                          {cp.email && (
                            <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {cp.email}
                            </p>
                          )}
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              )}

              {/* Social media */}
              {tenant.social && Object.values(tenant.social).some(Boolean) && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Social Media</p>
                  <div className="flex flex-wrap gap-2">
                    {tenant.social.facebook  && <a href={tenant.social.facebook}  target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800"><Facebook  size={18} /></a>}
                    {tenant.social.instagram && <a href={tenant.social.instagram} target="_blank" rel="noreferrer" className="text-pink-600 hover:text-pink-800"><Instagram size={18} /></a>}
                    {tenant.social.youtube   && <a href={tenant.social.youtube}   target="_blank" rel="noreferrer" className="text-red-600  hover:text-red-800" ><Youtube   size={18} /></a>}
                    {tenant.social.linkedin  && <a href={tenant.social.linkedin}  target="_blank" rel="noreferrer" className="text-blue-700 hover:text-blue-900"><Linkedin  size={18} /></a>}
                    {tenant.social.twitter   && <a href={tenant.social.twitter}   target="_blank" rel="noreferrer" className="text-sky-500  hover:text-sky-700" ><Twitter   size={18} /></a>}
                  </div>
                </div>
              )}
            </div>

            {/* Platform analytics */}
            <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-[18px] font-medium text-slate-800">Platform Statistics</h2>
                  <p className="text-sm font-medium text-slate-400 mt-0.5">Overall agency analytics</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="rounded-2xl bg-slate-50 p-2 text-center">
                  <Users className="w-7 h-7 text-blue-600 mx-auto mb-1" />
                  <p className="text-2xl font-medium text-slate-800">{totalAgents}</p>
                  <p className="text-xs font-medium text-slate-500 mt-1">Agents</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-2 text-center">
                  <UserCheck className="w-7 h-7 text-green-600 mx-auto mb-1" />
                  <p className="text-2xl font-medium text-slate-800">{totalAdmins}</p>
                  <p className="text-xs font-medium text-slate-500 mt-1">Admins</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-2 text-center">
                  <BarChart3 className="w-7 h-7 text-amber-600 mx-auto mb-1" />
                  <p className="text-2xl font-medium text-slate-800">{activeUsers}</p>
                  <p className="text-xs font-medium text-slate-500 mt-1">Active Users</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-2 text-center">
                  <Database className="w-7 h-7 text-violet-600 mx-auto mb-1" />
                  <p className="text-2xl font-medium text-slate-800">{subscription?.usedAgents || 0}</p>
                  <p className="text-xs font-medium text-slate-500 mt-1">Used Capacity</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right block */}
          <div className="space-y-6 flex flex-col">
            <SubscriptionStatusPanel
              tenantId={tenant._id}
              onAssignPlan={() => navigate('/subscription-plans')}
              onAddAddon={() => navigate('/subscription-plans')}
            />
            <CredentialsCard credentials={superAdminCredentials} />
          </div>
        </div>

        {/* Installment tracker */}
        <div className="grid grid-cols-1 gap-6">
          <InstallmentTracker tenantId={tenant._id} schoolName={tenant.agencyName} />
        </div>
      </div>

      <QuickLoginModal open={quickLoginOpen} school={tenant} onClose={() => setQuickLoginOpen(false)} />
    </div>
  )
}
