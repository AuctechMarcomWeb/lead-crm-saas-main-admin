import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Modal, Tag, Tooltip } from 'antd'
import {
  Loader2, CheckCircle2, XCircle, Upload, Calculator, Check,
  CreditCard, IndianRupee, Puzzle, PackagePlus, Trash2,
  AlertTriangle, RefreshCw, Clock,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { deleteRequest, fileUpload, getRequest, postRequest, putRequest } from '../../../Helpers'
import { calculatePrice, resolveAmount } from '../PricingConfig/PricingConfig'
import dayjs from 'dayjs'

/* ─── Subscription pricing defaults ─── */
const DEFAULT_PRICING = {
  baseStudentLimit: 350,
  basePrice:        1200,
  extraBlockSize:   50,
  extraBlockPrice:  100,
}

/* ─── Current subscription status banner ─── */
const CurrentSubStatus = ({ tenantId, onRefresh }) => {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  const fetch = async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const res  = await getRequest(`subscription?tenantId=${tenantId}&isPagination=false`)
      const subs = res?.data?.data?.subscriptions || []
      setData(subs[0] || null)
    } catch { setData(null) }
    finally   { setLoading(false) }
  }

  useEffect(() => { fetch() }, [tenantId])
  useEffect(() => { if (onRefresh) onRefresh.current = fetch }, [])

  if (loading) return (
    <div className="flex items-center gap-2 text-gray-400 py-3 text-xs">
      <Loader2 size={13} className="animate-spin" /> Loading current subscription…
    </div>
  )

  const plan     = data?.currentPlan
  const status   = data?.status
  const endDate  = plan?.endDate ? dayjs(plan.endDate) : null
  const daysLeft = endDate ? Math.max(0, endDate.diff(dayjs(), 'day')) : null
  const colorMap = { ACTIVE: 'green', TRIAL: 'gold', EXPIRED: 'red', CANCELLED: 'default', PENDING: 'blue' }

  if (!data || !plan) return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gray-50 border border-dashed border-gray-300 mb-3">
      <XCircle size={15} className="text-gray-400" />
      <div>
        <p className="text-xs font-semibold text-gray-500">No subscription assigned yet</p>
        <p className="text-[11px] text-gray-400">Plan select karke assign karo</p>
      </div>
    </div>
  )

  return (
    <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <CreditCard size={14} className="text-[#0c3b73]" />
          <span className="text-xs font-bold text-[#0c3b73]">Current Subscription</span>
        </div>
        <button onClick={fetch} className="p-1 rounded hover:bg-blue-100 text-blue-400">
          <RefreshCw size={11} />
        </button>
      </div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-gray-600 font-semibold">{plan.name}</span>
        <div className="flex items-center gap-1.5">
          <Tag color={colorMap[status] || 'default'} className="text-[10px] m-0">{status || '—'}</Tag>
          {daysLeft !== null && (
            <span className={`text-[10px] font-bold ${daysLeft <= 30 ? 'text-red-600' : daysLeft <= 60 ? 'text-amber-600' : 'text-green-600'}`}>
              {daysLeft}d left
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-gray-500 mb-1.5">
        <span>{plan.billingCycle}</span>
        {plan.startDate && <span>{dayjs(plan.startDate).format('DD MMM YY')} → {dayjs(plan.endDate).format('DD MMM YY')}</span>}
      </div>
      {daysLeft !== null && daysLeft <= 30 && status !== 'EXPIRED' && (
        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-red-600 font-semibold">
          <AlertTriangle size={11} /> Plan {daysLeft === 0 ? 'expires today' : `expires in ${daysLeft} days`} — renew karo
        </div>
      )}
    </div>
  )
}

/* ─── Addon Manager ─── */
const AddonManager = ({ tenantId, addons, onAddonChange }) => {
  const [availableAddons, setAvailableAddons] = useState([])
  const [selectedAddon,   setSelectedAddon]   = useState('')
  const [quantity,        setQuantity]         = useState(1)
  const [submitting,      setSubmitting]       = useState(false)
  const [removingId,      setRemovingId]       = useState(null)

  useEffect(() => {
    getRequest('subscriptionPlan?planType=Addon')
      .then((res) => setAvailableAddons(res?.data?.data?.plans || []))
      .catch(() => {})
  }, [])

  const handleAssign = async () => {
    if (!selectedAddon) { toast.error('Addon select karo'); return }
    setSubmitting(true)
    try {
      await postRequest({ url: `subscription/${tenantId}/addon`, cred: { addonId: selectedAddon, quantity: Number(quantity) || 1 } })
      toast.success('Add-on assigned')
      setSelectedAddon(''); setQuantity(1)
      onAddonChange?.()
    } catch (err) { toast.error(err?.response?.data?.message || 'Addon assign failed') }
    finally { setSubmitting(false) }
  }

  const handleRemove = async (addonId, name) => {
    setRemovingId(addonId)
    try {
      await deleteRequest(`subscription/${tenantId}/addon/${addonId}`)
      toast.success(`${name} removed`)
      onAddonChange?.()
    } catch (err) { toast.error(err?.response?.data?.message || 'Remove failed') }
    finally { setRemovingId(null) }
  }

  const options = availableAddons.filter(a => !addons.find(ca => String(ca.addonId) === String(a._id)))

  return (
    <div>
      {addons.length > 0 ? (
        <div className="space-y-1.5 mb-3">
          {addons.map((a, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-purple-50 border border-purple-100">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Puzzle size={12} className="text-purple-500 flex-shrink-0" />
                  <span className="text-xs font-semibold text-purple-800 truncate">{a.name}</span>
                  {a.quantity > 1 && <span className="text-[10px] font-bold bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded-full">×{a.quantity}</span>}
                </div>
                <p className="text-[11px] text-purple-600 mt-0.5 pl-5">
                  +{((a.studentLimit || 0) * (a.quantity || 1)).toLocaleString()} agents · ₹{((a.price || 0) * (a.quantity || 1)).toLocaleString('en-IN')}
                </p>
              </div>
              <button onClick={() => handleRemove(String(a.addonId), a.name)} disabled={removingId === String(a.addonId)}
                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition ml-2">
                {removingId === String(a.addonId) ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-3 py-2.5 rounded-lg bg-gray-50 border border-dashed border-gray-200 text-center mb-3">
          <p className="text-xs text-gray-400">No add-ons assigned</p>
        </div>
      )}
      {options.length > 0 && (
        <div className="border border-purple-200 rounded-lg p-3 bg-white">
          <p className="text-xs font-semibold text-purple-700 mb-2 flex items-center gap-1.5">
            <PackagePlus size={13} /> Assign New Add-on
          </p>
          <div className="flex gap-2 flex-wrap">
            <select value={selectedAddon} onChange={e => setSelectedAddon(e.target.value)}
              className="flex-1 h-8 px-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400 min-w-[140px]">
              <option value="">Select add-on…</option>
              {options.map(a => <option key={a._id} value={a._id}>{a.name} — +{a.studentLimit} agents · ₹{a.price?.toLocaleString('en-IN')}</option>)}
            </select>
            <div className="flex items-center gap-1">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-7 h-8 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold">−</button>
              <input type="number" min={1} value={quantity} onChange={e => setQuantity(Math.max(1, Number(e.target.value) || 1))} className="w-12 h-8 text-center text-xs border border-gray-300 rounded" />
              <button onClick={() => setQuantity(q => q + 1)} className="w-7 h-8 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold">+</button>
            </div>
            <button onClick={handleAssign} disabled={submitting || !selectedAddon}
              className="h-8 px-3 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:opacity-60 flex items-center gap-1">
              {submitting ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} Assign
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Price breakdown ─── */
const PriceBreakdown = ({ agentCount, pricingConfig, selectedPlan }) => {
  if (!agentCount || agentCount < 1) return null
  if (selectedPlan && selectedPlan.price > 0 && selectedPlan.pricingModel !== 'PER_STUDENT') {
    return (
      <div className="mt-3 bg-green-50 border border-green-100 rounded-lg p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <IndianRupee size={13} className="text-green-700" />
          <span className="text-xs font-semibold text-green-700">Plan Fixed Price</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">{selectedPlan.name} ({selectedPlan.billingCycle})</span>
          <span className="font-bold text-green-700 text-sm">₹{selectedPlan.price?.toLocaleString('en-IN')}</span>
        </div>
      </div>
    )
  }
  const config  = pricingConfig || DEFAULT_PRICING
  const total   = calculatePrice(agentCount, config)
  const extra   = Math.max(0, agentCount - config.baseStudentLimit)
  const blocks  = extra > 0 ? Math.ceil(extra / config.extraBlockSize) : 0
  return (
    <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Calculator size={13} className="text-[#0c3b73]" />
        <span className="text-xs font-semibold text-[#0c3b73]">Auto-calculated Price</span>
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-500">Base (0–{config.baseStudentLimit} agents)</span>
          <span className="font-medium text-gray-800">₹{config.basePrice?.toLocaleString('en-IN')}</span>
        </div>
        {blocks > 0 && (
          <div className="flex justify-between text-orange-600">
            <span>Extra {extra} agents ({blocks} block{blocks > 1 ? 's' : ''} × ₹{config.extraBlockPrice})</span>
            <span className="font-medium">₹{(blocks * config.extraBlockPrice)?.toLocaleString('en-IN')}</span>
          </div>
        )}
        <div className="border-t border-blue-200 pt-1 flex justify-between">
          <span className="font-bold text-[#0c3b73]">Total Amount</span>
          <span className="font-bold text-[#0c3b73] text-sm">₹{total?.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  )
}

/* ─── Plan card ─── */
const PlanCard = ({ plan, selected, onSelect }) => (
  <div onClick={() => onSelect(plan._id)}
    className={`border rounded-lg p-3 cursor-pointer transition-all ${selected ? 'border-[#0c3b73] bg-blue-50 ring-1 ring-[#0c3b73]' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-800 truncate">{plan.name}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${plan.planType === 'Addon' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{plan.planType}</span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{plan.billingCycle}</span>
        </div>
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <span className="text-sm font-bold text-[#0c3b73]">₹{plan.price?.toLocaleString('en-IN')}</span>
          <span className="text-[11px] text-gray-500">{plan.studentLimit?.toLocaleString('en-IN')} agent limit</span>
        </div>
      </div>
      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${selected ? 'border-[#0c3b73] bg-[#0c3b73]' : 'border-gray-300'}`}>
        {selected && <Check size={10} className="text-white" strokeWidth={3} />}
      </div>
    </div>
  </div>
)

/* ─── Subdomain badge ─── */
const SubdomainBadge = ({ status }) => {
  if (!status || status === 'idle') return null
  const cfg = {
    checking:  { icon: <Loader2 size={11} className="animate-spin" />, text: 'Checking...',   cls: 'text-blue-500'  },
    available: { icon: <CheckCircle2 size={11} />,                     text: 'Available',      cls: 'text-green-600' },
    taken:     { icon: <XCircle size={11} />,                          text: 'Already taken',  cls: 'text-red-500'   },
  }
  const item = cfg[status]
  if (!item) return null
  return (
    <small className={`d-flex align-items-center gap-1 mt-1 ${item.cls}`} style={{ fontSize: 11 }}>
      {item.icon} {item.text}
    </small>
  )
}

/* ─── Defaults ─── */
const EMPTY_CP = { name: '', designation: '', phone: '', email: '', photo: '' }

const EMPTY_FORM = {
  agencyName:       '',
  subdomain:        '',
  logo:             '',
  description:      '',
  establishedYear:  '',
  businessType:     'Proprietorship',

  // Contact
  agencyEmail:      '',
  agencyPhone:      '',
  agencyPhoneAlt:   '',
  whatsappNo:       '',
  website:          '',

  // Regulatory
  reraNo:           '',
  reraState:        '',
  gstNo:            '',
  panNo:            '',
  cinNo:            '',
  licenseNo:        '',
  msmeRegNo:        '',
  isoRegNo:         '',

  // Address
  addressLine1:     '',
  addressLine2:     '',
  city:             '',
  state:            '',
  country:          'India',
  pincode:          '',

  // Operations
  operatingCities:  '',   // comma-separated in form, sent as array
  operatingStates:  '',
  propertyTypes:    [],

  // Social
  facebook:   '',
  instagram:  '',
  youtube:    '',
  linkedin:   '',
  twitter:    '',

  // Branding / payment
  primaryColor:     '#1a73e8',
  razorpayKey:      '',
  razorpaySecret:   '',
  dbUri:            '',
  useCustomDb:      false,
  isActive:         true,

  // Signatory
  signatoryName:        '',
  signatoryDesignation: '',
  signatorySign:        '',
  companySeal:          '',

  contactPerson1: { ...EMPTY_CP },
  contactPerson2: { ...EMPTY_CP },
}

const PROPERTY_TYPE_OPTIONS = ['Residential', 'Commercial', 'Plots', 'Rental', 'Industrial', 'Agricultural', 'Mixed Use']
const BUSINESS_TYPE_OPTIONS  = ['Individual Broker', 'Partnership Firm', 'Proprietorship', 'Private Limited', 'LLP', 'Other']

/* ─── Main component ─── */
const AgencyModal = ({ open, onClose, editData, refresh }) => {
  const isEdit  = !!editData
  const fileRef = useRef(null)
  const subdomainTimer = useRef(null)

  const [activeTab,       setActiveTab]       = useState('identity')
  const [form,            setForm]            = useState({ ...EMPTY_FORM, contactPerson1: { ...EMPTY_CP }, contactPerson2: { ...EMPTY_CP } })
  const [logoPreview,     setLogoPreview]     = useState(null)
  const [errors,          setErrors]          = useState({})
  const [loading,         setLoading]         = useState(false)
  const [uploading,       setUploading]       = useState(false)
  const [subdomainStatus, setSubdomainStatus] = useState('idle')

  /* Subscription tab */
  const subStatusRefreshRef  = useRef(null)
  const [subCurrentAddons,   setSubCurrentAddons]   = useState([])
  const [subPlans,           setSubPlans]           = useState([])
  const [subPlanTab,         setSubPlanTab]         = useState('Plan')
  const [subLoading,         setSubLoading]         = useState(false)
  const [subSubmitting,      setSubSubmitting]      = useState(false)
  const [subPricingConfig,   setSubPricingConfig]   = useState(DEFAULT_PRICING)
  const [subForm, setSubForm] = useState({
    selectedPlan: '', agentCount: '', paidStatus: 'PENDING',
    billingMonth: '', dueDate: '', paymentRef: '',
  })
  const [subErrors, setSubErrors] = useState({})

  /* ── Prefill / reset ── */
  useEffect(() => {
    if (editData) {
      const cp1 = editData.contactPerson1 || {}
      const cp2 = editData.contactPerson2 || {}
      const addr = editData.address || {}
      setForm({
        agencyName:      editData.agencyName || '',
        subdomain:       editData.subdomain  || '',
        logo:            editData.logo       || '',
        description:     editData.description      || '',
        establishedYear: editData.establishedYear  || '',
        businessType:    editData.businessType     || 'Proprietorship',
        agencyEmail:     editData.agencyEmail      || '',
        agencyPhone:     editData.agencyPhone      || '',
        agencyPhoneAlt:  editData.agencyPhoneAlt   || '',
        whatsappNo:      editData.whatsappNo       || '',
        website:         editData.website          || '',
        reraNo:          editData.reraNo           || '',
        reraState:       editData.reraState        || '',
        gstNo:           editData.gstNo            || '',
        panNo:           editData.panNo            || '',
        cinNo:           editData.cinNo            || '',
        licenseNo:       editData.licenseNo        || '',
        msmeRegNo:       editData.msmeRegNo        || '',
        isoRegNo:        editData.isoRegNo         || '',
        addressLine1:    addr.line1    || editData.addressLine1    || '',
        addressLine2:    addr.line2    || editData.addressLine2    || '',
        city:            addr.city     || editData.city            || '',
        state:           addr.state    || editData.state           || '',
        country:         addr.country  || editData.country         || 'India',
        pincode:         addr.pincode  || editData.pincode         || '',
        operatingCities: (editData.operatingCities || []).join(', '),
        operatingStates: (editData.operatingStates || []).join(', '),
        propertyTypes:   editData.propertyTypes || [],
        facebook:        editData.social?.facebook  || '',
        instagram:       editData.social?.instagram || '',
        youtube:         editData.social?.youtube   || '',
        linkedin:        editData.social?.linkedin  || '',
        twitter:         editData.social?.twitter   || '',
        primaryColor:    editData.primaryColor       || '#1a73e8',
        razorpayKey:     editData.razorpayKey        || '',
        razorpaySecret:  editData.razorpaySecret     || '',
        dbUri:           editData.dbUri              || '',
        useCustomDb:     !!editData.dbUri,
        isActive:        editData.isActive ?? true,
        signatoryName:        editData.signatoryName        || '',
        signatoryDesignation: editData.signatoryDesignation || '',
        signatorySign:        editData.signatorySign        || '',
        companySeal:          editData.companySeal          || '',
        contactPerson1: { name: cp1.name||'', designation: cp1.designation||'', phone: cp1.phone||cp1.contactNo||'', email: cp1.email||'', photo: cp1.photo||'' },
        contactPerson2: { name: cp2.name||'', designation: cp2.designation||'', phone: cp2.phone||cp2.contactNo||'', email: cp2.email||'', photo: cp2.photo||'' },
      })
      setLogoPreview(editData.logo || null)
    } else {
      setForm({ ...EMPTY_FORM, contactPerson1: { ...EMPTY_CP }, contactPerson2: { ...EMPTY_CP } })
      setLogoPreview(null)
    }
    setErrors({})
    setSubdomainStatus('idle')
    setActiveTab('identity')
    setSubForm({ selectedPlan: '', agentCount: '', paidStatus: 'PENDING', billingMonth: '', dueDate: '', paymentRef: '' })
    setSubErrors({})
    setSubPlanTab('Plan')
  }, [editData, open])

  /* ── Load subscription data on sub tab open ── */
  useEffect(() => {
    if (activeTab !== 'subscription' || !editData?._id) return
    setSubLoading(true)
    getRequest('subscriptionPlan')
      .then(res  => setSubPlans(res?.data?.data?.plans || []))
      .catch(()  => toast.error('Failed to load plans'))
      .finally(() => setSubLoading(false))

    getRequest('pricing-config')
      .then(res  => { if (res?.data?.data?.current) setSubPricingConfig(res.data.data.current) })
      .catch(()  => {})

    getRequest(`subscription?tenantId=${editData._id}&isPagination=false`)
      .then(res => {
        const subs     = res?.data?.data?.subscriptions || []
        const existing = subs[0]
        if (!existing) return
        setSubPlanTab(existing.currentPlanDetails?.planType || 'Plan')
        setSubCurrentAddons(existing.currentAddons || [])
        setSubForm(p => ({
          ...p,
          selectedPlan: String(existing.currentPlan?.planId || ''),
          paidStatus:   existing.paidStatus  || 'PENDING',
          billingMonth: existing.billingMonth || '',
          dueDate:      existing.dueDate ? new Date(existing.dueDate).toISOString().split('T')[0] : '',
          paymentRef:   existing.paymentRef  || '',
        }))
      })
      .catch(() => {})
  }, [activeTab, editData])

  /* ── Helpers ── */
  const set     = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: undefined })) }
  const setCP   = (person, field, value) => {
    setForm(p  => ({ ...p, [person]: { ...p[person], [field]: value } }))
    setErrors(p => ({ ...p, [`${person}_${field}`]: undefined }))
  }
  const err = field => errors[field] && <small className="text-danger">{errors[field]}</small>

  /* ── Subdomain check ── */
  const checkSubdomain = useCallback((value) => {
    clearTimeout(subdomainTimer.current)
    if (!value || value.length < 3) { setSubdomainStatus('idle'); return }
    setSubdomainStatus('checking')
    subdomainTimer.current = setTimeout(async () => {
      try {
        const res = await postRequest({ url: 'onboarding/check-subdomain', cred: { subdomain: value } })
        const av  = res?.data?.data?.available
        if (typeof av === 'boolean') { setSubdomainStatus(av ? 'available' : 'taken'); return }
        const msg = (res?.data?.message || '').toLowerCase()
        setSubdomainStatus(msg.includes('available') ? 'available' : msg.includes('taken') ? 'taken' : 'idle')
      } catch (e) {
        const msg = (e?.response?.data?.message || '').toLowerCase()
        setSubdomainStatus(msg.includes('taken') ? 'taken' : 'idle')
      }
    }, 600)
  }, [])

  /* ── Logo upload ── */
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/'))  { toast.error('Please upload a valid image'); return }
    if (file.size > 2 * 1024 * 1024)     { toast.error('Logo must be under 2 MB'); return }
    setLogoPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fileUpload({ url: 'upload/uploadImage', cred: fd, isFormData: true })
      const url = res?.data?.data?.imageUrl
      if (!url) throw new Error('No URL')
      setLogoPreview(url); set('logo', url); toast.success('Logo uploaded')
    } catch { toast.error('Upload failed'); setLogoPreview(form.logo || null) }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  /* ── Validation ── */
  const validate = () => {
    const e = {}
    if (!form.agencyName.trim())    e.agencyName   = 'Required'
    if (!isEdit && !form.subdomain.trim()) e.subdomain = 'Required'
    if (!isEdit && form.subdomain && !/^[a-z0-9-]+$/.test(form.subdomain)) e.subdomain = 'Only lowercase letters, numbers & hyphens'
    if (!isEdit && subdomainStatus === 'taken') e.subdomain = 'This subdomain is already taken'
    if (!form.agencyEmail.trim())   e.agencyEmail  = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.agencyEmail)) e.agencyEmail = 'Enter valid email'
    if (!form.agencyPhone.trim())   e.agencyPhone  = 'Required'
    else if (!/^\d{10}$/.test(form.agencyPhone)) e.agencyPhone = 'Enter valid 10-digit number'
    if (form.agencyPhoneAlt && !/^\d{10}$/.test(form.agencyPhoneAlt)) e.agencyPhoneAlt = 'Enter valid 10-digit number'
    if (!form.city.trim())    e.city    = 'Required'
    if (!form.state.trim())   e.state   = 'Required'
    if (!form.pincode.trim()) e.pincode = 'Required'
    const cp1 = form.contactPerson1
    if (cp1.phone && !/^\d{10}$/.test(cp1.phone)) e.contactPerson1_phone = 'Enter valid 10-digit number'
    if (cp1.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cp1.email)) e.contactPerson1_email = 'Enter valid email'
    const cp2 = form.contactPerson2
    if (cp2.phone && !/^\d{10}$/.test(cp2.phone)) e.contactPerson2_phone = 'Enter valid 10-digit number'
    if (cp2.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cp2.email)) e.contactPerson2_email = 'Enter valid email'
    return e
  }

  /* ── Build payload ── */
  const buildPayload = () => {
    const t = v => (typeof v === 'string' ? v.trim() : v)
    const payload = {
      agencyName:      t(form.agencyName),
      agencyEmail:     t(form.agencyEmail),
      agencyPhone:     t(form.agencyPhone),
      businessType:    form.businessType,
      isActive:        form.isActive,
      address: {
        line1:   t(form.addressLine1),
        line2:   t(form.addressLine2),
        city:    t(form.city),
        state:   t(form.state),
        country: t(form.country),
        pincode: t(form.pincode),
      },
    }
    if (!isEdit) payload.subdomain = t(form.subdomain)

    const optional = ['logo','description','establishedYear','agencyPhoneAlt','whatsappNo','website',
      'reraNo','reraState','gstNo','panNo','cinNo','licenseNo','msmeRegNo','isoRegNo',
      'primaryColor','signatoryName','signatoryDesignation','signatorySign','companySeal']
    optional.forEach(k => { if (t(form[k])) payload[k] = t(form[k]) })

    if (form.useCustomDb && t(form.dbUri)) payload.dbUri = t(form.dbUri)
    if (form.razorpayKey)    payload.razorpayKey    = t(form.razorpayKey)
    if (form.razorpaySecret) payload.razorpaySecret = t(form.razorpaySecret)

    // Arrays
    const cities = form.operatingCities.split(',').map(s => s.trim()).filter(Boolean)
    const states = form.operatingStates.split(',').map(s => s.trim()).filter(Boolean)
    if (cities.length) payload.operatingCities = cities
    if (states.length) payload.operatingStates = states
    if (form.propertyTypes?.length) payload.propertyTypes = form.propertyTypes

    // Social
    const social = {}
    ;['facebook','instagram','youtube','linkedin','twitter'].forEach(k => { if (t(form[k])) social[k] = t(form[k]) })
    if (Object.keys(social).length) payload.social = social

    // Contact persons
    const buildCP = cp => {
      const o = {}
      if (cp.name.trim())        o.name        = cp.name.trim()
      if (cp.designation.trim()) o.designation = cp.designation.trim()
      if (cp.phone.trim())       o.phone       = cp.phone.trim()
      if (cp.email.trim())       o.email       = cp.email.trim()
      if (cp.photo.trim())       o.photo       = cp.photo.trim()
      return Object.keys(o).length ? o : null
    }
    const cp1 = buildCP(form.contactPerson1); if (cp1) payload.contactPerson1 = cp1
    const cp2 = buildCP(form.contactPerson2); if (cp2) payload.contactPerson2 = cp2

    return payload
  }

  /* ── Submit agency form ── */
  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length) {
      setErrors(e)
      toast.error('Please fix the errors before submitting')
      const tab1Keys = ['agencyName','subdomain','agencyEmail','agencyPhone']
      const tab2Keys = ['city','state','pincode','agencyPhoneAlt','contactPerson1_phone','contactPerson1_email','contactPerson2_phone','contactPerson2_email']
      if      (Object.keys(e).some(k => tab1Keys.includes(k))) setActiveTab('identity')
      else if (Object.keys(e).some(k => tab2Keys.includes(k))) setActiveTab('address')
      else setActiveTab('regulatory')
      return
    }
    setLoading(true)
    try {
      const payload = buildPayload()
      if (isEdit) { await putRequest({ url: `tenant/${editData._id}`, cred: payload }); toast.success('Agency updated') }
      else        { await postRequest({ url: 'tenant', cred: payload });                 toast.success('Agency registered 🚀') }
      refresh(); onClose()
    } catch (er) { toast.error(er?.response?.data?.message || (isEdit ? 'Update failed' : 'Registration failed')) }
    finally { setLoading(false) }
  }

  /* ── Submit subscription ── */
  const handleSubSubmit = async () => {
    const e = {}
    if (!subForm.selectedPlan)   e.selectedPlan = 'Please select a plan'
    if (!subForm.billingMonth)   e.billingMonth  = 'Select billing month'
    if (Object.keys(e).length) { setSubErrors(e); toast.error('Please complete required fields'); return }
    const planData      = subPlans.find(p => String(p._id) === String(subForm.selectedPlan))
    const computedAmt   = resolveAmount(planData, Number(subForm.agentCount), subPricingConfig)
    setSubSubmitting(true)
    try {
      await postRequest({
        url:  'subscription/admin-assign',
        cred: {
          tenantId:     editData._id,
          planId:       subForm.selectedPlan,
          studentCount: Number(subForm.agentCount) || 0,
          totalAmount:  computedAmt,
          paidStatus:   subForm.paidStatus,
          billingMonth: subForm.billingMonth,
          ...(subForm.dueDate   ? { dueDate:   subForm.dueDate   } : {}),
          ...(subForm.paymentRef ? { paymentRef: subForm.paymentRef } : {}),
        },
      })
      toast.success('Subscription assigned')
      refresh?.()
    } catch (er) { toast.error(er?.response?.data?.message || 'Failed to assign subscription') }
    finally { setSubSubmitting(false) }
  }

  const TABS = [
    { key: 'identity',   label: 'Agency Identity'  },
    { key: 'address',    label: 'Address & Contact' },
    { key: 'regulatory', label: 'Regulatory & Docs' },
    { key: 'payment',    label: 'Payment & DB'      },
    ...(isEdit ? [{ key: 'subscription', label: '💳 Subscription' }] : []),
  ]

  return (
    <Modal open={open} onCancel={onClose} footer={null} width={980} destroyOnClose
      title={
        <div>
          <p className="mb-0" style={{ fontSize: 18, fontWeight: 600, color: '#1e293b' }}>
            {isEdit ? 'Edit Agency' : 'Register Agency'}
          </p>
          <p className="mb-0 text-muted" style={{ fontSize: 13, fontWeight: 400 }}>
            {isEdit ? 'Update agency details below' : 'Fill in the required details to register a new agency'}
          </p>
        </div>
      }
    >
      {/* ── Tabs ── */}
      <div style={{ borderBottom: '1px solid #dee2e6', marginBottom: 16 }}>
        <ul className="nav nav-tabs" style={{ borderBottom: 'none' }}>
          {TABS.map(({ key, label }) => (
            <li className="nav-item" key={key}>
              <button type="button" className={`nav-link ${activeTab === key ? 'active' : ''}`}
                style={{ fontSize: 13, color: '#0c3b73' }} onClick={() => setActiveTab(key)}>
                {label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* ══════════ TAB 1 — Agency Identity ══════════ */}
      {activeTab === 'identity' && (
        <div className="container-fluid px-0">

          {/* Logo */}
          <div className="card mb-3">
            <div className="card-header !bg-[#0c3b73] text-white">Agency Logo</div>
            <div className="card-body">
              <div className="d-flex align-items-center gap-4">
                <div onClick={() => !uploading && fileRef.current?.click()}
                  style={{ width: 80, height: 80, border: '2px dashed #cbd5e1', borderRadius: 12, overflow: 'hidden', cursor: uploading ? 'wait' : 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                  {uploading ? <Loader2 size={22} className="text-primary animate-spin" />
                    : logoPreview ? <img src={logoPreview} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
                    : <div className="text-center"><Upload size={20} className="text-muted mb-1" /><div style={{ fontSize: 10, color: '#94a3b8' }}>Upload</div></div>}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="d-none" onChange={handleFileUpload} />
                <div className="flex-1">
                  <p className="mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Upload or paste a logo URL</p>
                  <p className="text-muted mb-2" style={{ fontSize: 11 }}>PNG, JPG or SVG · Max 2 MB</p>
                  <input className="form-control form-control-sm" value={form.logo}
                    onChange={e => { set('logo', e.target.value); setLogoPreview(e.target.value || null) }}
                    placeholder="https://example.com/logo.png" />
                  {logoPreview && !uploading && (
                    <button className="btn btn-link btn-sm text-danger p-0 mt-1" style={{ fontSize: 11 }}
                      onClick={() => { set('logo', ''); setLogoPreview(null); if (fileRef.current) fileRef.current.value = '' }}>
                      Remove logo
                    </button>
                  )}
                  {uploading && <p className="text-primary mb-0 mt-1" style={{ fontSize: 11 }}>Uploading...</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="card mb-3">
            <div className="card-header !bg-[#0c3b73] text-white">Basic Information</div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Agency Name <span className="text-danger">*</span></label>
                  <input className={`form-control form-control-sm ${errors.agencyName ? 'is-invalid' : ''}`}
                    value={form.agencyName} onChange={e => set('agencyName', e.target.value)} placeholder="e.g. Prime Realty Pvt Ltd" />
                  {err('agencyName')}
                </div>
                <div className="col-md-4">
                  <label className="form-label">Subdomain <span className="text-danger">*</span></label>
                  <div className="input-group input-group-sm">
                    <input className={`form-control form-control-sm ${errors.subdomain ? 'is-invalid' : ''}`}
                      value={form.subdomain}
                      onChange={e => { const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''); set('subdomain', v); if (!isEdit) checkSubdomain(v) }}
                      placeholder="e.g. prime-realty" disabled={isEdit} />
                    <span className="input-group-text" style={{ fontSize: 11 }}>.yourdomain.com</span>
                  </div>
                  {!isEdit && <SubdomainBadge status={subdomainStatus} />}
                  {isEdit  && <small className="text-muted">Subdomain cannot be changed</small>}
                  {err('subdomain')}
                </div>
                <div className="col-md-4">
                  <label className="form-label">Business Type</label>
                  <select className="form-select form-select-sm" value={form.businessType} onChange={e => set('businessType', e.target.value)}>
                    {BUSINESS_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Register Email <span className="text-danger">*</span></label>
                  <input type="email" className={`form-control form-control-sm ${errors.agencyEmail ? 'is-invalid' : ''}`}
                    value={form.agencyEmail} onChange={e => set('agencyEmail', e.target.value)} placeholder="office@agency.com" />
                  {err('agencyEmail')}
                </div>
                <div className="col-md-4">
                  <label className="form-label">Phone No. <span className="text-danger">*</span></label>
                  <input className={`form-control form-control-sm ${errors.agencyPhone ? 'is-invalid' : ''}`}
                    value={form.agencyPhone} onChange={e => set('agencyPhone', e.target.value.replace(/\D/g,'').slice(0,10))} placeholder="10-digit number" />
                  {err('agencyPhone')}
                </div>
                <div className="col-md-4">
                  <label className="form-label">Alt. Phone</label>
                  <input className={`form-control form-control-sm ${errors.agencyPhoneAlt ? 'is-invalid' : ''}`}
                    value={form.agencyPhoneAlt} onChange={e => set('agencyPhoneAlt', e.target.value.replace(/\D/g,'').slice(0,10))} placeholder="10-digit number" />
                  {err('agencyPhoneAlt')}
                </div>
                <div className="col-md-4">
                  <label className="form-label">WhatsApp No.</label>
                  <input className="form-control form-control-sm" value={form.whatsappNo}
                    onChange={e => set('whatsappNo', e.target.value.replace(/\D/g,'').slice(0,10))} placeholder="10-digit number" />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Website</label>
                  <input className="form-control form-control-sm" value={form.website}
                    onChange={e => set('website', e.target.value)} placeholder="https://agencyname.com" />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Established Year</label>
                  <input className="form-control form-control-sm" value={form.establishedYear}
                    onChange={e => set('establishedYear', e.target.value)} placeholder="e.g. 2005" />
                </div>
                <div className="col-12">
                  <label className="form-label">Description / Tagline</label>
                  <textarea className="form-control form-control-sm" rows={2} value={form.description}
                    onChange={e => set('description', e.target.value)} placeholder="Brief agency description..." />
                </div>
              </div>
            </div>
          </div>

          {/* Property Types */}
          <div className="card mb-3">
            <div className="card-header !bg-[#0c3b73] text-white">Property Types & Operations</div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Property Types Handled</label>
                  <div className="d-flex flex-wrap gap-2">
                    {PROPERTY_TYPE_OPTIONS.map(pt => (
                      <label key={pt} className="d-flex align-items-center gap-1 cursor-pointer" style={{ fontSize: 13 }}>
                        <input type="checkbox" checked={form.propertyTypes.includes(pt)}
                          onChange={e => set('propertyTypes', e.target.checked ? [...form.propertyTypes, pt] : form.propertyTypes.filter(x => x !== pt))} />
                        {pt}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Operating Cities <small className="text-muted">(comma separated)</small></label>
                  <input className="form-control form-control-sm" value={form.operatingCities}
                    onChange={e => set('operatingCities', e.target.value)} placeholder="Mumbai, Pune, Nashik" />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Operating States <small className="text-muted">(comma separated)</small></label>
                  <input className="form-control form-control-sm" value={form.operatingStates}
                    onChange={e => set('operatingStates', e.target.value)} placeholder="Maharashtra, Gujarat" />
                </div>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="card mb-3">
            <div className="card-header !bg-[#0c3b73] text-white">Social Media</div>
            <div className="card-body">
              <div className="row g-3">
                {['facebook','instagram','youtube','linkedin','twitter'].map(s => (
                  <div className="col-md-4" key={s}>
                    <label className="form-label text-capitalize">{s}</label>
                    <input className="form-control form-control-sm" value={form[s]}
                      onChange={e => set(s, e.target.value)} placeholder={`https://${s}.com/...`} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Brand color */}
          <div className="card mb-3">
            <div className="card-header !bg-[#0c3b73] text-white">Branding</div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Primary Color</label>
                  <div className="d-flex align-items-center gap-2">
                    <input type="color" className="form-control form-control-sm p-1" style={{ width: 48, height: 32 }}
                      value={form.primaryColor} onChange={e => set('primaryColor', e.target.value)} />
                    <input className="form-control form-control-sm" value={form.primaryColor}
                      onChange={e => set('primaryColor', e.target.value)} placeholder="#1a73e8" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {isEdit && (
            <div className="card mb-3">
              <div className="card-header !bg-[#0c3b73] text-white">Status</div>
              <div className="card-body">
                <div className="d-flex align-items-center gap-3">
                  <input type="checkbox" className="form-check-input" id="isActiveCheck"
                    checked={form.isActive} onChange={e => set('isActive', e.target.checked)} />
                  <label className="form-check-label" htmlFor="isActiveCheck">Agency is Active</label>
                </div>
              </div>
            </div>
          )}

          <div className="d-flex justify-content-end gap-2 mt-3">
            <button className="btn btn-light btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-sm text-white" style={{ background: '#0c3b73' }}
              onClick={() => setActiveTab('address')}>Next →</button>
          </div>
        </div>
      )}

      {/* ══════════ TAB 2 — Address & Contact ══════════ */}
      {activeTab === 'address' && (
        <div className="container-fluid px-0">
          {/* Address */}
          <div className="card mb-3">
            <div className="card-header !bg-[#0c3b73] text-white">Office Address</div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-8">
                  <label className="form-label">Address Line 1</label>
                  <input className="form-control form-control-sm" value={form.addressLine1}
                    onChange={e => set('addressLine1', e.target.value)} placeholder="Shop/Office No, Building Name, Street" />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Address Line 2</label>
                  <input className="form-control form-control-sm" value={form.addressLine2}
                    onChange={e => set('addressLine2', e.target.value)} placeholder="Area, Landmark" />
                </div>
                <div className="col-md-3">
                  <label className="form-label">City <span className="text-danger">*</span></label>
                  <input className={`form-control form-control-sm ${errors.city ? 'is-invalid' : ''}`}
                    value={form.city} onChange={e => set('city', e.target.value)} placeholder="Mumbai" />
                  {err('city')}
                </div>
                <div className="col-md-3">
                  <label className="form-label">State <span className="text-danger">*</span></label>
                  <input className={`form-control form-control-sm ${errors.state ? 'is-invalid' : ''}`}
                    value={form.state} onChange={e => set('state', e.target.value)} placeholder="Maharashtra" />
                  {err('state')}
                </div>
                <div className="col-md-3">
                  <label className="form-label">Country</label>
                  <input className="form-control form-control-sm" value={form.country}
                    onChange={e => set('country', e.target.value)} placeholder="India" />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Pincode <span className="text-danger">*</span></label>
                  <input className={`form-control form-control-sm ${errors.pincode ? 'is-invalid' : ''}`}
                    value={form.pincode} onChange={e => set('pincode', e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="400001" />
                  {err('pincode')}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Person 1 */}
          <div className="card mb-3">
            <div className="card-header !bg-[#0c3b73] text-white">Primary Contact Person</div>
            <div className="card-body">
              <div className="row g-3">
                {[['name','Name','e.g. Rajesh Kumar'],['designation','Designation','e.g. Director, Broker'],['phone','Phone','10-digit'],['email','Email','person@agency.com']].map(([field, label, placeholder]) => (
                  <div className="col-md-3" key={field}>
                    <label className="form-label">{label}</label>
                    <input
                      className={`form-control form-control-sm ${errors[`contactPerson1_${field}`] ? 'is-invalid' : ''}`}
                      value={form.contactPerson1[field]}
                      onChange={e => setCP('contactPerson1', field, field === 'phone' ? e.target.value.replace(/\D/g,'').slice(0,10) : e.target.value)}
                      placeholder={placeholder} />
                    {err(`contactPerson1_${field}`)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Person 2 */}
          <div className="card mb-3">
            <div className="card-header !bg-[#0c3b73] text-white">Secondary Contact Person</div>
            <div className="card-body">
              <div className="row g-3">
                {[['name','Name','e.g. Priya Sharma'],['designation','Designation','e.g. Manager'],['phone','Phone','10-digit'],['email','Email','person@agency.com']].map(([field, label, placeholder]) => (
                  <div className="col-md-3" key={field}>
                    <label className="form-label">{label}</label>
                    <input
                      className={`form-control form-control-sm ${errors[`contactPerson2_${field}`] ? 'is-invalid' : ''}`}
                      value={form.contactPerson2[field]}
                      onChange={e => setCP('contactPerson2', field, field === 'phone' ? e.target.value.replace(/\D/g,'').slice(0,10) : e.target.value)}
                      placeholder={placeholder} />
                    {err(`contactPerson2_${field}`)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-3">
            <button className="btn btn-light btn-sm" onClick={() => setActiveTab('identity')}>← Back</button>
            <button className="btn btn-light btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-sm text-white" style={{ background: '#0c3b73' }}
              onClick={() => setActiveTab('regulatory')}>Next →</button>
          </div>
        </div>
      )}

      {/* ══════════ TAB 3 — Regulatory & Docs ══════════ */}
      {activeTab === 'regulatory' && (
        <div className="container-fluid px-0">
          <div className="card mb-3">
            <div className="card-header !bg-[#0c3b73] text-white">Regulatory & Compliance</div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">RERA Registration No.</label>
                  <input className="form-control form-control-sm" value={form.reraNo}
                    onChange={e => set('reraNo', e.target.value)} placeholder="e.g. MH/RERA/01234" />
                </div>
                <div className="col-md-4">
                  <label className="form-label">RERA State</label>
                  <input className="form-control form-control-sm" value={form.reraState}
                    onChange={e => set('reraState', e.target.value)} placeholder="e.g. Maharashtra" />
                </div>
                <div className="col-md-4">
                  <label className="form-label">GST No.</label>
                  <input className="form-control form-control-sm" value={form.gstNo}
                    onChange={e => set('gstNo', e.target.value.toUpperCase())} placeholder="27AAAAA0000A1Z5" />
                </div>
                <div className="col-md-4">
                  <label className="form-label">PAN No.</label>
                  <input className="form-control form-control-sm" value={form.panNo}
                    onChange={e => set('panNo', e.target.value.toUpperCase())} placeholder="AAAAA0000A" />
                </div>
                <div className="col-md-4">
                  <label className="form-label">CIN No. <small className="text-muted">(if company)</small></label>
                  <input className="form-control form-control-sm" value={form.cinNo}
                    onChange={e => set('cinNo', e.target.value)} placeholder="U70100MH2005PTC123456" />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Trade / Local License No.</label>
                  <input className="form-control form-control-sm" value={form.licenseNo}
                    onChange={e => set('licenseNo', e.target.value)} placeholder="LIC/2020/001" />
                </div>
                <div className="col-md-4">
                  <label className="form-label">MSME Reg. No.</label>
                  <input className="form-control form-control-sm" value={form.msmeRegNo}
                    onChange={e => set('msmeRegNo', e.target.value)} placeholder="UDYAM-MH-00-0000000" />
                </div>
                <div className="col-md-4">
                  <label className="form-label">ISO Reg. No.</label>
                  <input className="form-control form-control-sm" value={form.isoRegNo}
                    onChange={e => set('isoRegNo', e.target.value)} placeholder="ISO 9001:2015" />
                </div>
              </div>
            </div>
          </div>

          {/* Signatory */}
          <div className="card mb-3">
            <div className="card-header !bg-[#0c3b73] text-white">Signatory / Documents</div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Signatory Name</label>
                  <input className="form-control form-control-sm" value={form.signatoryName}
                    onChange={e => set('signatoryName', e.target.value)} placeholder="Authorized Signatory Name" />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Signatory Designation</label>
                  <input className="form-control form-control-sm" value={form.signatoryDesignation}
                    onChange={e => set('signatoryDesignation', e.target.value)} placeholder="Director / Proprietor" />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Signature Image URL</label>
                  <input className="form-control form-control-sm" value={form.signatorySign}
                    onChange={e => set('signatorySign', e.target.value)} placeholder="https://cdn.../sign.png" />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Company Seal URL</label>
                  <input className="form-control form-control-sm" value={form.companySeal}
                    onChange={e => set('companySeal', e.target.value)} placeholder="https://cdn.../seal.png" />
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-3">
            <button className="btn btn-light btn-sm" onClick={() => setActiveTab('address')}>← Back</button>
            <button className="btn btn-light btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-sm text-white" style={{ background: '#0c3b73' }}
              onClick={() => setActiveTab('payment')}>Next →</button>
          </div>
        </div>
      )}

      {/* ══════════ TAB 4 — Payment & DB ══════════ */}
      {activeTab === 'payment' && (
        <div className="container-fluid px-0">
          <div className="card mb-3">
            <div className="card-header !bg-[#0c3b73] text-white">Payment Gateway (Razorpay)</div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Razorpay Key ID</label>
                  <input className="form-control form-control-sm" value={form.razorpayKey}
                    onChange={e => set('razorpayKey', e.target.value)} placeholder="rzp_live_..." />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Razorpay Key Secret</label>
                  <input type="password" className="form-control form-control-sm" value={form.razorpaySecret}
                    onChange={e => set('razorpaySecret', e.target.value)} placeholder="••••••••••••••••" />
                </div>
              </div>
            </div>
          </div>

          <div className="card mb-3">
            <div className="card-header !bg-[#0c3b73] text-white">Database Configuration</div>
            <div className="card-body">
              <div className="form-check mb-3">
                <input type="checkbox" className="form-check-input" id="customDbCheck"
                  checked={form.useCustomDb} onChange={e => set('useCustomDb', e.target.checked)} />
                <label className="form-check-label" htmlFor="customDbCheck">Use custom MongoDB URI</label>
              </div>
              {form.useCustomDb && (
                <input className="form-control form-control-sm" value={form.dbUri}
                  onChange={e => set('dbUri', e.target.value)} placeholder="mongodb+srv://..." />
              )}
              {!form.useCustomDb && (
                <small className="text-muted">A dedicated database will be auto-created for this agency.</small>
              )}
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-3">
            <button className="btn btn-light btn-sm" onClick={() => setActiveTab('regulatory')}>← Back</button>
            <button className="btn btn-light btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-sm text-white d-flex align-items-center gap-2" style={{ background: '#0c3b73' }}
              onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Update Agency' : 'Register Agency'}
            </button>
          </div>
        </div>
      )}

      {/* ══════════ TAB 5 — Subscription (edit only) ══════════ */}
      {activeTab === 'subscription' && isEdit && (
        <div className="container-fluid px-0">
          <CurrentSubStatus tenantId={editData._id} onRefresh={subStatusRefreshRef} />

          {/* Plan selection */}
          <div className="card mb-3">
            <div className="card-header !bg-[#0c3b73] text-white d-flex align-items-center gap-2">
              <CreditCard size={15} /> Assign / Update Subscription
            </div>
            <div className="card-body">
              {/* Plan type tabs */}
              <div className="d-flex gap-2 mb-3">
                {['Plan','Addon'].map(t => (
                  <button key={t} type="button"
                    className={`btn btn-sm ${subPlanTab === t ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setSubPlanTab(t)} style={{ fontSize: 12 }}>
                    {t === 'Plan' ? 'Subscription Plans' : 'Add-ons'}
                  </button>
                ))}
              </div>

              {subLoading ? (
                <div className="text-center py-4"><Loader2 size={20} className="animate-spin text-primary" /></div>
              ) : (
                <>
                  {subPlanTab === 'Plan' && (
                    <div className="space-y-2">
                      {subPlans.filter(p => p.planType !== 'Addon').map(plan => (
                        <PlanCard key={plan._id} plan={plan}
                          selected={String(subForm.selectedPlan) === String(plan._id)}
                          onSelect={v => { setSubForm(p => ({ ...p, selectedPlan: v })); setSubErrors(p => ({ ...p, selectedPlan: undefined })) }} />
                      ))}
                      {subErrors.selectedPlan && <small className="text-danger">{subErrors.selectedPlan}</small>}
                    </div>
                  )}

                  {subPlanTab === 'Addon' && (
                    <AddonManager tenantId={editData._id} addons={subCurrentAddons}
                      onAddonChange={() => { subStatusRefreshRef.current?.(); setSubCurrentAddons([]) }} />
                  )}
                </>
              )}

              {subPlanTab === 'Plan' && (
                <>
                  <PriceBreakdown
                    agentCount={Number(subForm.agentCount)}
                    pricingConfig={subPricingConfig}
                    selectedPlan={subPlans.find(p => String(p._id) === String(subForm.selectedPlan))} />

                  <div className="row g-3 mt-1">
                    <div className="col-md-4">
                      <label className="form-label">Billing Month <span className="text-danger">*</span></label>
                      <input type="month" className={`form-control form-control-sm ${subErrors.billingMonth ? 'is-invalid' : ''}`}
                        value={subForm.billingMonth} onChange={e => { setSubForm(p => ({ ...p, billingMonth: e.target.value })); setSubErrors(p => ({ ...p, billingMonth: undefined })) }} />
                      {subErrors.billingMonth && <small className="text-danger">{subErrors.billingMonth}</small>}
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Payment Status</label>
                      <select className="form-select form-select-sm" value={subForm.paidStatus}
                        onChange={e => setSubForm(p => ({ ...p, paidStatus: e.target.value }))}>
                        {['PENDING','PAID','OVERDUE','UNPAID'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Due Date</label>
                      <input type="date" className="form-control form-control-sm"
                        value={subForm.dueDate} onChange={e => setSubForm(p => ({ ...p, dueDate: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Payment Reference</label>
                      <input className="form-control form-control-sm" value={subForm.paymentRef}
                        onChange={e => setSubForm(p => ({ ...p, paymentRef: e.target.value }))} placeholder="Transaction ID / Ref No." />
                    </div>
                  </div>

                  <div className="d-flex justify-content-end gap-2 mt-3">
                    <button className="btn btn-light btn-sm" onClick={onClose}>Close</button>
                    <button className="btn btn-sm text-white d-flex align-items-center gap-2" style={{ background: '#0c3b73' }}
                      onClick={handleSubSubmit} disabled={subSubmitting}>
                      {subSubmitting && <Loader2 size={13} className="animate-spin" />}
                      Assign Subscription
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default AgencyModal
