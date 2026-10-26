import React, { useState, useEffect } from 'react'







import {
  Loader2, Check, Users, CreditCard, Building2,
  CalendarDays, Hash, CheckCircle, Clock, XCircle,
  Puzzle, ChevronDown, AlertCircle, Shield,
} from 'lucide-react'
import { Modal } from 'antd'
import toast from 'react-hot-toast'
import { getRequest, postRequest } from '../../../Helpers'

/* ─── colour tokens ─────────────────────────────── */
const C = {
  brand:       '#0c3b73',
  brandLight:  '#e8f0fb',
  brandMid:    '#c8d9f5',
  textDark:    '#111827',
  textMid:     '#374151',
  textSoft:    '#6b7280',
  textMuted:   '#9ca3af',
  border:      '#e5e7eb',
  borderHover: '#d1d5db',
  bg:          '#ffffff',
  bgSoft:      '#f9fafb',
  bgMuted:     '#f3f4f6',
  red:         '#ef4444',
  redBg:       '#fef2f2',
  green:       '#16a34a',
  greenBg:     '#f0fdf4',
  amber:       '#d97706',
  amberBg:     '#fffbeb',
  purple:      '#7c3aed',
  purpleBg:    '#f5f3ff',
}

const FONT = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif"

/* base style applied to every container div in the modal */
const F = { fontFamily: FONT, fontSize: 13, color: C.textDark }

/* ─── atoms ──────────────────────────────────────── */
const Label = ({ children, required, hint }) => (
  <label style={{ display:'block', fontSize:11, fontWeight:700, textTransform:'uppercase',
    letterSpacing:'0.06em', color: C.textMid, marginBottom:6,
    fontFamily: FONT }}>
    {children}
    {required && <span style={{ color: C.red, marginLeft:2 }}>*</span>}
    {hint && <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0,
      color: C.textMuted, marginLeft:6, fontSize:10 }}>{hint}</span>}
  </label>
)

const ErrMsg = ({ msg }) => msg ? (
  <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:4,
    fontSize:11, color: C.red, fontFamily: FONT }}>
    <AlertCircle size={10} />{msg}
  </div>
) : null

const inputStyle = (err) => ({
  width:'100%', height:38, padding:'0 12px', fontSize:13,
  border:`1.5px solid ${err ? C.red : C.border}`,
  borderRadius:8, background: err ? C.redBg : C.bg,
  outline:'none', transition:'border-color .15s',
  color: C.textDark, boxSizing:'border-box',
  fontFamily: FONT,
})

/* ─── searchable school dropdown ────────────────── */
const SchoolSelect = ({ value, onChange, options, loading, error }) => {
  const [open, setOpen] = useState(false)
  const [q, setQ]       = useState('')
  const sel      = options.find(o => o.value === value)
  const filtered = q
    ? options.filter(o => o.label.toLowerCase().includes(q.toLowerCase()))
    : options

  return (
    <div style={{ position:'relative' }}>
      <button type="button"
        onClick={() => !loading && setOpen(p => !p)}
        style={{ width:'100%', height:38, padding:'0 10px', fontSize:13,
          border:`1.5px solid ${error ? C.red : C.border}`,
          borderRadius:8, background: C.bg, display:'flex',
          alignItems:'center', justifyContent:'space-between',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? .6 : 1, color: C.textDark,
          boxSizing:'border-box' }}>
        {sel ? (
          <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0, flex:1 }}>
            <div style={{ width:22, height:22, borderRadius:5, background: C.brandLight,
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
              overflow:'hidden' }}>
              {sel.logo ? (
                <img
                  src={sel.logo}
                  alt=""
                  onError={e => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextSibling.style.display = 'block'
                  }}
                  style={{ width:'100%', height:'100%', objectFit:'contain', padding:2 }}
                />
              ) : null}
              <Building2 size={11} color={C.brand} style={{ display: sel.logo ? 'none' : 'block' }} />
            </div>
            <span style={{ fontWeight:600, color: C.textDark, overflow:'hidden',
              textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{sel.label}</span>
            <span style={{ fontSize:11, color: C.textMuted, marginLeft:'auto',
              flexShrink:0 }}>{sel.sub}</span>
          </div>
        ) : (
          <span style={{ color: C.textMuted }}>{loading ? 'Loading…' : 'Select an Agency'}</span>
        )}
        {loading
          ? <Loader2 size={13} color={C.textMuted} style={{ animation:'spin 1s linear infinite', marginLeft:6 }} />
          : <ChevronDown size={13} color={C.textMuted} style={{ marginLeft:6,
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition:'transform .15s' }} />}
      </button>

      {open && !loading && (
        <>
          <div style={{ position:'absolute', zIndex:9999, top:'calc(100% + 4px)', left:0,
            width:'100%', background: C.bg, border:`1.5px solid ${C.border}`,
            borderRadius:10, boxShadow:'0 8px 30px rgba(0,0,0,.12)', overflow:'hidden' }}>
            <div style={{ padding:8, borderBottom:`1px solid ${C.border}` }}>
              <input autoFocus type="text" value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search agency name…"
                style={{ width:'100%', height:32, padding:'0 10px', fontSize:12,
                  border:`1.5px solid ${C.border}`, borderRadius:6,
                  background: C.bgSoft, color: C.textDark, outline:'none',
                  boxSizing:'border-box' }} />
            </div>
            <div style={{ maxHeight:176, overflowY:'auto' }}>
              {filtered.length === 0
                ? <div style={{ padding:'16px 0', textAlign:'center', fontSize:12, color: C.textMuted }}>No results</div>
                : filtered.map(o => (
                  <div key={o.value}
                    onClick={() => { onChange(o.value); setOpen(false); setQ('') }}
                    style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                      padding:'8px 12px', cursor:'pointer',
                      background: value === o.value ? C.brandLight : 'transparent' }}
                    onMouseEnter={e => { if(value !== o.value) e.currentTarget.style.background = C.bgSoft }}
                    onMouseLeave={e => { if(value !== o.value) e.currentTarget.style.background = 'transparent' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
                      <div style={{ width:26, height:26, borderRadius:6, flexShrink:0,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        background: value === o.value ? C.brand : C.bgMuted,
                        overflow:'hidden' }}>
                        {o.logo ? (
                          <img
                            src={o.logo}
                            alt=""
                            onError={e => {
                              e.currentTarget.style.display = 'none'
                              e.currentTarget.nextSibling.style.display = 'flex'
                            }}
                            style={{ width:'100%', height:'100%', objectFit:'contain', padding:2 }}
                          />
                        ) : null}
                        <Building2
                          size={12}
                          color={value === o.value ? '#fff' : C.textMuted}
                          style={{ display: o.logo ? 'none' : 'block' }}
                        />
                      </div>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:600,
                          color: value === o.value ? C.brand : C.textDark,
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o.label}</div>
                        <div style={{ fontSize:10, color: C.textMuted }}>{o.sub}</div>
                      </div>
                    </div>
                    {value === o.value && <Check size={13} color={C.brand} strokeWidth={2.5} />}
                  </div>
                ))}
            </div>
          </div>
          <div style={{ position:'fixed', inset:0, zIndex:9998 }}
            onClick={() => { setOpen(false); setQ('') }} />
        </>
      )}
    </div>
  )
}

/* ─── plan card ──────────────────────────────────── */
const PlanCard = ({ plan, selected, onSelect }) => {
  const isAddon = plan.planType === 'Addon'
  const [hovered, setHovered] = useState(false)
  return (
    <div onClick={() => onSelect(plan._id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position:'relative', borderRadius:12, cursor:'pointer', userSelect:'none',
        border: `2px solid ${selected ? C.brand : hovered ? C.borderHover : C.border}`,
        background: selected ? C.brandLight : C.bg,
        padding:14, transition:'border-color .15s, box-shadow .15s',
        boxShadow: selected ? '0 2px 12px rgba(12,59,115,.12)' : hovered ? '0 1px 6px rgba(0,0,0,.06)' : 'none' }}>

      <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
        {/* icon */}
        <div style={{ width:40, height:40, borderRadius:10, flexShrink:0,
          display:'flex', alignItems:'center', justifyContent:'center',
          background: selected ? C.brand : isAddon ? C.purpleBg : C.bgMuted,
          transition:'background .15s' }}>
          {isAddon
            ? <Puzzle size={17} color={selected ? '#fff' : C.purple} />
            : <CreditCard size={17} color={selected ? '#fff' : C.textSoft} />}
        </div>

        {/* text */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:2 }}>
            <span style={{ fontSize:14, fontWeight:700, color: C.textDark }}>{plan.name}</span>
            <span style={{ fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:20,
              textTransform:'uppercase', letterSpacing:'.05em',
              background: isAddon ? '#ede9fe' : '#dbeafe',
              color: isAddon ? C.purple : '#1d4ed8' }}>{plan.billingCycle}</span>
            {plan.isPopular && (
              <span style={{ fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:20,
                background:'#fef3c7', color:'#b45309' }}>Popular</span>
            )}
          </div>
          {plan.description && (
            <p style={{ fontSize:11, color: C.textSoft, margin:'0 0 8px',
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{plan.description}</p>
          )}
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ display:'flex', alignItems:'baseline', gap:2 }}>
              <span style={{ fontSize:11, color: C.textSoft }}>₹</span>
              <span style={{ fontSize:16, fontWeight:800,
                color: selected ? C.brand : C.textDark }}>{plan.price?.toLocaleString('en-IN')}</span>
              <span style={{ fontSize:10, color: C.textSoft, marginLeft:2 }}>
                /{plan.billingCycle === 'Yearly' ? 'yr' : 'mo'}
              </span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color: C.textSoft }}>
              <Users size={10} />
              {plan.studentLimit > 0 ? plan.studentLimit.toLocaleString('en-IN') + ' students' : 'Unlimited'}
            </div>
          </div>
          {plan.features?.length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:8 }}>
              {plan.features.slice(0, 3).map((f, i) => (
                <span key={i} style={{ fontSize:10, background: C.bgMuted,
                  color: C.textSoft, padding:'2px 7px', borderRadius:5 }}>{f}</span>
              ))}
              {plan.features.length > 3 && (
                <span style={{ fontSize:10, color: C.textMuted }}>+{plan.features.length - 3}</span>
              )}
            </div>
          )}
        </div>

        {/* radio */}
        <div style={{ width:18, height:18, borderRadius:'50%', flexShrink:0, marginTop:2,
          border:`2px solid ${selected ? C.brand : C.borderHover}`,
          background: selected ? C.brand : 'transparent',
          display:'flex', alignItems:'center', justifyContent:'center',
          transition:'all .15s' }}>
          {selected && <div style={{ width:7, height:7, borderRadius:'50%', background:'#fff' }} />}
        </div>
      </div>
    </div>
  )
}

/* ─── overflow warning block ────────────────────── */
const OverflowWarning = ({ planData, count }) => {
  if (!planData || !count) return null
  const limit    = planData.studentLimit
  const current  = Number(count) || 0
  if (!limit || limit === 0 || current <= limit) {
    return (
      <p style={{ margin:'5px 0 0', fontSize:11, color: C.textSoft }}>
        Plan limit:&nbsp;
        <strong style={{ color: C.textMid }}>
          {limit > 0 ? limit.toLocaleString('en-IN') : 'Unlimited'}
        </strong>
        &nbsp;students
      </p>
    )
  }
  const extra       = current - limit
  const SLOT_SIZE   = 50
  const SLOT_PRICE  = 100
  const slots       = Math.ceil(extra / SLOT_SIZE)
  const extraCost   = slots * SLOT_PRICE

  return (
    <div style={{ marginTop:8, borderRadius:10, border:'1.5px solid #fbbf24',
      background:'#fffbeb', overflow:'hidden' }}>
      {/* header */}
      <div style={{ display:'flex', alignItems:'center', gap:8,
        padding:'8px 12px', borderBottom:'1px solid #fde68a',
        background:'#fff7ed' }}>
        <AlertCircle size={13} color='#d97706' style={{ flexShrink:0 }} />
        <span style={{ fontSize:12, fontWeight:700, color:'#92400e' }}>
          Student count exceeds plan limit
        </span>
      </div>
      {/* stats */}
      <div style={{ padding:'10px 12px' }}>
        <div style={{ display:'flex', gap:20, marginBottom:10 }}>
          {[
            { lbl:'Plan Limit',       val: limit.toLocaleString('en-IN'),    clr: C.textDark  },
            { lbl:'Your Students',    val: current.toLocaleString('en-IN'),  clr:'#d97706'    },
            { lbl:'Exceeds By',       val:`+${extra.toLocaleString('en-IN')}`, clr:'#dc2626'  },
          ].map(({ lbl, val, clr }) => (
            <div key={lbl}>
              <div style={{ fontSize:9, color: C.textMuted, textTransform:'uppercase',
                letterSpacing:'.05em', marginBottom:2 }}>{lbl}</div>
              <div style={{ fontSize:15, fontWeight:800, color: clr }}>{val}</div>
            </div>
          ))}
        </div>
        {/* addon suggestion */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
          gap:8, padding:'8px 10px', borderRadius:8, background:'#fff',
          border:'1px solid #fde68a' }}>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <Puzzle size={13} color='#d97706' style={{ flexShrink:0 }} />
            <div>
              <p style={{ margin:0, fontSize:11, fontWeight:700, color:'#92400e' }}>
                {slots} add-on slot{slots > 1 ? 's' : ''} needed
                &nbsp;·&nbsp; +{(slots * SLOT_SIZE).toLocaleString('en-IN')} students capacity
              </p>
              <p style={{ margin:'2px 0 0', fontSize:10, color: C.textSoft }}>
                {slots} × {SLOT_SIZE} students × ₹{SLOT_PRICE} = ₹{extraCost.toLocaleString('en-IN')}/mo
              </p>
            </div>
          </div>
          <span style={{ fontSize:14, fontWeight:800, color:'#d97706',
            flexShrink:0, background:'#fff7ed', padding:'4px 8px',
            borderRadius:7, border:'1px solid #fcd34d' }}>
            +₹{extraCost.toLocaleString('en-IN')}
          </span>
        </div>
        <p style={{ margin:'7px 0 0', fontSize:10, color: C.textSoft, lineHeight:1.5 }}>
          Assign this plan now and add the required add-on separately to cover all students.
        </p>
      </div>
    </div>
  )
}

/* ─── payment status picker ──────────────────────── */
const PAY_OPTS = [
  { v:'PAID',    label:'Paid',    Icon:CheckCircle, color:C.green,  bg:C.greenBg,  border:'#86efac' },
  { v:'PENDING', label:'Pending', Icon:Clock,       color:C.amber,  bg:C.amberBg,  border:'#fcd34d' },
  { v:'UNPAID',  label:'Unpaid',  Icon:XCircle,     color:'#dc2626', bg:C.redBg,   border:'#fca5a5' },
]
const PayPicker = ({ value, onChange }) => (
  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
    {PAY_OPTS.map(({ v, label, Icon, color, bg, border }) => {
      const active = value === v
      return (
        <button key={v} type="button" onClick={() => onChange(v)}
          style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5,
            padding:'10px 0', borderRadius:10, cursor:'pointer',
            border: `2px solid ${active ? border : C.border}`,
            background: active ? bg : C.bg,
            color: active ? color : C.textMuted,
            fontSize:12, fontWeight:600, transition:'all .15s' }}>
          <Icon size={15} />
          {label}
        </button>
      )
    })}
  </div>
)

/* ─── summary sidebar ────────────────────────────── */
const SummaryPanel = ({ school, plan, tab, studentCount, billingMonth, paidStatus, addonQty }) => {
  if (!school || !plan) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', height:'100%', padding:'40px 20px', textAlign:'center', gap:12 }}>
      <div style={{ width:48, height:48, borderRadius:14, background: C.bgMuted,
        display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Shield size={22} color={C.borderHover} />
      </div>
      <p style={{ fontSize:13, fontWeight:600, color: C.textSoft, margin:0 }}>Summary will appear here</p>
      <p style={{ fontSize:11, color: C.textMuted, margin:0 }}>Select a Agency and plan to continue</p>
    </div>
  )

  const isAddon   = tab === 'Addon'
  const amount    = isAddon ? plan.price * addonQty : plan.price
  const students  = isAddon ? plan.studentLimit * addonQty : (Number(studentCount) || 0)
  const payColor  = { PAID: C.green, PENDING: C.amber, UNPAID: '#dc2626' }[paidStatus] || C.textMid

  /* overflow calculation */
  const SLOT_SIZE   = 50
  const SLOT_PRICE  = 100
  const planLimit   = plan.studentLimit || 0
  const overflow    = !isAddon && planLimit > 0 && students > planLimit
  const extraSlots  = overflow ? Math.ceil((students - planLimit) / SLOT_SIZE) : 0
  const addonCost   = extraSlots * SLOT_PRICE

  const rows = isAddon
    ? [['Add-on', plan.name], ['Quantity', `×${addonQty}`]]
    : [['Plan', plan.name], ['Billing Cycle', plan.billingCycle],
       ['Billing Month', billingMonth || '—'],
       ['Payment', paidStatus]]

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* school strip */}
      <div style={{ padding:'14px 16px', borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:9, background: C.brandLight,
            border:`1px solid ${C.brandMid}`,
            display:'flex', alignItems:'center', justifyContent:'center',
            flexShrink:0, overflow:'hidden' }}>
            {school.logo
              ? <img
                  src={school.logo}
                  alt=""
                  onError={e => { e.currentTarget.style.display='none'; e.currentTarget.nextSibling.style.display='flex' }}
                  style={{ width:'100%', height:'100%', objectFit:'contain', padding:3 }}
                />
              : null}
            <span style={{
              fontSize:10, fontWeight:800, color: C.brand,
              display: school.logo ? 'none' : 'flex',
              width:'100%', height:'100%', alignItems:'center', justifyContent:'center'
            }}>
              {school.schoolName?.slice(0,2).toUpperCase()}
            </span>
          </div>
          <div style={{ minWidth:0 }}>
            <p style={{ margin:0, fontSize:13, fontWeight:700, color: C.textDark,
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{school.schoolName || 'Agency'}</p>
            <p style={{ margin:0, fontSize:10, color: C.textMuted }}>{school.subdomain}.app</p>
          </div>
        </div>
      </div>

      {/* amount hero */}
      <div style={{ padding:'20px 16px', textAlign:'center',
        borderBottom:`1px solid ${C.border}`, background: C.bgSoft }}>
        <p style={{ margin:'0 0 4px', fontSize:10, fontWeight:700, textTransform:'uppercase',
          letterSpacing:'.08em', color: C.textMuted }}>Total Amount</p>
        <p style={{ margin:0, fontSize:28, fontWeight:900,
          color: overflow ? '#d97706' : C.brand, lineHeight:1 }}>
          ₹{amount.toLocaleString('en-IN')}
        </p>
        <p style={{ margin:'4px 0 0', fontSize:11, color: C.textSoft }}>
          {isAddon ? `${addonQty} add-on${addonQty > 1 ? 's' : ''}` : `per ${plan.billingCycle === 'Yearly' ? 'year' : 'month'}`}
        </p>
        {overflow && (
          <div style={{ marginTop:8, padding:'6px 10px', borderRadius:8,
            background:'#fff7ed', border:'1px solid #fbbf24',
            display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
            <AlertCircle size={11} color='#d97706' />
            <span style={{ fontSize:11, fontWeight:700, color:'#92400e' }}>
              +₹{addonCost.toLocaleString('en-IN')} addon needed
            </span>
          </div>
        )}
      </div>

      {/* rows */}
      <div style={{ flex:1, overflowY:'auto', padding:'8px 16px' }}>
        {rows.map(([label, val]) => (
          <div key={label} style={{ display:'flex', justifyContent:'space-between',
            alignItems:'center', padding:'7px 0',
            borderBottom:`1px solid ${C.bgMuted}` }}>
            <span style={{ fontSize:11, color: C.textMuted }}>{label}</span>
            <span style={{ fontSize:12, fontWeight:600,
              color: label === 'Payment' ? payColor
                   : label === 'Overflow' ? '#dc2626'
                   : label === 'Students' && overflow ? '#d97706'
                   : C.textDark,
              maxWidth:110, textAlign:'right', overflow:'hidden',
              textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{val}</span>
          </div>
        ))}
      </div>

      {/* bottom chip */}
      <div style={{ padding:'12px 16px' }}>
        <div style={{ padding:'8px 0', borderRadius:10, textAlign:'center',
          fontSize:11, fontWeight:700,
          background: isAddon ? '#ede9fe' : C.brandLight,
          color: isAddon ? C.purple : C.brand }}>
          {isAddon ? 'Add-on Assignment' : 'Plan Assignment'}
        </div>
      </div>
    </div>
  )
}

/* ─── main modal ─────────────────────────────────── */
const SubscriptionModal = ({ open, onClose, refresh, preSelectedSchoolId = null }) => {
  const [schools, setSchools]       = useState([])
  const [plans, setPlans]           = useState([])
  const [loadingSchools, setLS]     = useState(false)
  const [loadingPlans, setLP]       = useState(false)
  const [loadingCount, setLC]       = useState(false)
  const [submitting, setSub]        = useState(false)

  const [selSchool, setSelSchool]   = useState(preSelectedSchoolId || '')
  const [selPlan,   setSelPlan]     = useState('')
  const [count,     setCount]       = useState('')
  const [countSrc,  setCountSrc]    = useState(null)
  const [addonQty,  setQty]         = useState(1)
  const [paidStatus,setPaid]        = useState('PENDING')
  const [dueDate,   setDue]         = useState('')
  const [billMonth, setMonth]       = useState('')
  const [payRef,    setRef]         = useState('')
  const [activeTab, setTab]         = useState('Plan')
  const [errors,    setErrors]      = useState({})

  useEffect(() => {
    if (!selSchool) { setCount(''); setCountSrc(null); return }
    setLC(true); setCountSrc(null)
    getRequest(`tenant/${selSchool}`)
      .then(r => {
        const n = r?.data?.data?.stats?.totalStudents
        n != null ? (setCount(String(n)), setCountSrc('auto')) : (setCount(''), setCountSrc(null))
        setErrors(p => ({ ...p, studentCount: undefined }))
      })
      .catch(() => { setCount(''); setCountSrc(null) })
      .finally(() => setLC(false))
  }, [selSchool])

  useEffect(() => {
    if (!open) return
    setSelSchool(preSelectedSchoolId || ''); setSelPlan(''); setCount(''); setCountSrc(null)
    setQty(1); setPaid('PENDING'); setDue(''); setMonth(''); setRef(''); setErrors({})
    setLS(true)
    getRequest('tenant?isPagination=false')
      .then(r => setSchools(r?.data?.data?.tenants || []))
      .catch(() => toast.error('Failed to load tenant'))
      .finally(() => setLS(false))
    setLP(true)
    getRequest('subscriptionPlan')
      .then(r => setPlans(r?.data?.data?.plans || []))
      .catch(() => toast.error('Failed to load plans'))
      .finally(() => setLP(false))
  }, [open, preSelectedSchoolId])

  const validate = () => {
    const e = {}
    if (!selSchool) e.school = 'Select a school'
    if (!selPlan)   e.plan   = 'Select a plan'
    if (activeTab === 'Plan') {
      if (!count || Number(count) < 1) e.studentCount = 'Enter student count'
      if (!billMonth) e.billingMonth = 'Select billing month'
    }
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); toast.error('Please fill required fields'); return }
    setSub(true)
    try {
      if (activeTab === 'Addon') {
        await postRequest({ url: `subscription/${selSchool}/addon`,
          cred: { addonId: selPlan, quantity: Number(addonQty) || 1 } })
        toast.success('Add-on assigned successfully')
      } else {
        await postRequest({ url: 'subscription/admin-assign',
          cred: { tenantId: selSchool, planId: selPlan, studentCount: Number(count),
            paidStatus, billingMonth: billMonth,
            ...(dueDate ? { dueDate } : {}), ...(payRef ? { paymentRef: payRef } : {}) } })
        toast.success('Subscription assigned successfully')
      }
      refresh?.(); onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to assign subscription')
    } finally { setSub(false) }
  }

  const schoolOpts   = schools.map(s => ({ value: s._id, label: s.schoolName, sub: s.subdomain + '.app', ...s }))
  const planData     = plans.find(p => String(p._id) === String(selPlan))
  const schoolData   = schools.find(s => String(s._id) === String(selSchool))
  const filteredPlans = plans.filter(p => p.planType === activeTab)

  /* shared input style with icon padding */
  const inp = (err, pl = 12) => ({ ...inputStyle(err), paddingLeft: pl })

  return (
    <Modal open={open} onCancel={onClose} footer={null} width={860} destroyOnClose
      styles={{
        body:    { padding:0, fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", fontSize:13 },
        header:  { padding:'16px 20px 14px', borderBottom:`1px solid ${C.border}`,
                   fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
        content: { fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", fontSize:13 },
      }}
      title={
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:10, background: C.brand,
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <CreditCard size={17} color="#fff" />
          </div>
          <div>
            <p style={{ margin:0, fontSize:15, fontWeight:700, color: C.textDark, fontFamily: FONT }}>Assign Subscription</p>
            <p style={{ margin:0, fontSize:12, color: C.textMuted, fontWeight:400, fontFamily: FONT }}>
              Configure and assign a plan or add-on to an agency
            </p>
          </div>
        </div>
      }>

      <div style={{ display:'flex', minHeight:520, ...F }}>

        {/* ── LEFT FORM ── */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px 24px', maxHeight:'76vh' }}>

          {/* AGENCY */}
          <div style={{ marginBottom:22 }}>
            <Label required>Agency</Label>
            <SchoolSelect value={selSchool} loading={loadingSchools} error={errors.school}
              options={schoolOpts}
              onChange={v => { setSelSchool(v); setCount(''); setCountSrc(null); setErrors(p => ({ ...p, school: undefined })) }} />
            <ErrMsg msg={errors.school} />

            {schoolData && (
              <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:10,
                padding:'10px 12px', background: C.bgSoft,
                borderRadius:10, border:`1px solid ${C.border}` }}>
                <div style={{ width:34, height:34, borderRadius:8, background: C.brandLight,
                  border:`1px solid ${C.brandMid}`, display:'flex', alignItems:'center',
                  justifyContent:'center', flexShrink:0, overflow:'hidden' }}>
                  {schoolData.logo
                    ? <img
                        src={schoolData.logo}
                        alt=""
                        onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex' }}
                        style={{ width:'100%', height:'100%', objectFit:'contain', padding:3 }}
                      />
                    : null}
                  <span style={{
                    fontSize:10, fontWeight:800, color: C.brand,
                    display: schoolData.logo ? 'none' : 'flex',
                    width:'100%', height:'100%', alignItems:'center', justifyContent:'center'
                  }}>
                    {schoolData.subdomain?.slice(0,2).toUpperCase()}
                  </span>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:0, fontSize:13, fontWeight:700, color: C.textDark,
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{schoolData.schoolName}</p>
                  <p style={{ margin:0, fontSize:10, color: C.textMuted }}>
                    {schoolData.subdomain}.app &nbsp;
                    <span style={{ padding:'1px 6px', borderRadius:10, fontSize:9, fontWeight:700,
                      background: schoolData.isActive ? C.greenBg : C.redBg,
                      color: schoolData.isActive ? C.green : C.red }}>
                      {schoolData.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
                {loadingCount
                  ? <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color: C.textMuted }}>
                      <Loader2 size={11} style={{ animation:'spin 1s linear infinite' }} /> Loading…
                    </div>
                  : countSrc === 'auto' && count && (
                    <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0,
                      background: C.bg, border:`1px solid ${C.border}`,
                      borderRadius:8, padding:'6px 10px' }}>
                      <Users size={12} color={C.brand} />
                      <div>
                        <p style={{ margin:0, fontSize:9, color: C.textMuted, lineHeight:1 }}>Students</p>
                        <p style={{ margin:0, fontSize:14, fontWeight:800, color: C.brand, lineHeight:1.2 }}>
                          {Number(count).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* PLAN */}
          <div style={{ marginBottom:22 }}>
            <Label required>Plan</Label>
            {/* tab switcher */}
            <div style={{ display:'flex', background: C.bgMuted, borderRadius:10, padding:4, marginBottom:12 }}>
              {[{ k:'Plan', label:'Subscription Plans', Icon:CreditCard },
                { k:'Addon', label:'Add-ons', Icon:Puzzle }].map(({ k, label, Icon }) => (
                <button key={k} type="button"
                  onClick={() => { setTab(k); setSelPlan(''); setErrors(p => ({ ...p, plan: undefined })) }}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                    padding:'7px 0', fontSize:12, fontWeight:600, borderRadius:7, border:'none',
                    cursor:'pointer', transition:'all .15s',
                    background: activeTab === k ? C.bg : 'transparent',
                    color: activeTab === k ? C.brand : C.textMuted,
                    boxShadow: activeTab === k ? '0 1px 4px rgba(0,0,0,.08)' : 'none' }}>
                  <Icon size={12} />{label}
                </button>
              ))}
            </div>

            {loadingPlans
              ? <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
                  gap:8, padding:'32px 0', color: C.textMuted, fontSize:13 }}>
                  <Loader2 size={15} style={{ animation:'spin 1s linear infinite' }} /> Loading plans…
                </div>
              : filteredPlans.length === 0
              ? <div style={{ padding:'28px 0', textAlign:'center', fontSize:13, color: C.textMuted,
                  border:`2px dashed ${C.border}`, borderRadius:10 }}>
                  No {activeTab === 'Addon' ? 'add-ons' : 'plans'} found
                </div>
              : <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {filteredPlans.map(p => (
                    <PlanCard key={p._id} plan={p} selected={selPlan === p._id}
                      onSelect={id => { setSelPlan(id); setErrors(e => ({ ...e, plan: undefined })) }} />
                  ))}
                </div>
            }
            <ErrMsg msg={errors.plan} />
          </div>

          {/* BILLING DETAILS */}
          <div>
            <Label>Billing Details</Label>
            {activeTab === 'Addon' ? (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {planData && (
                  <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                    background: C.purpleBg, borderRadius:10, border:'1px solid #ddd6fe' }}>
                    <Puzzle size={16} color={C.purple} style={{ flexShrink:0 }} />
                    <div>
                      <p style={{ margin:0, fontSize:13, fontWeight:700, color:'#4c1d95' }}>{planData.name}</p>
                      <p style={{ margin:0, fontSize:11, color: C.purple }}>
                        ₹{(planData.price * addonQty).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                )}
                <div>
                  <Label>Quantity</Label>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))}
                      style={{ width:36, height:36, borderRadius:8, border:`1.5px solid ${C.border}`,
                        background: C.bg, color: C.textDark, fontSize:18, fontWeight:700,
                        cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                    <input type="number" min={1} value={addonQty}
                      onChange={e => setQty(Math.max(1, Number(e.target.value)||1))}
                      style={{ width:60, height:36, textAlign:'center', fontSize:14, fontWeight:600,
                        border:`1.5px solid ${C.border}`, borderRadius:8, background: C.bg,
                        color: C.textDark, outline:'none', boxSizing:'border-box' }} />
                    <button type="button" onClick={() => setQty(q => q + 1)}
                      style={{ width:36, height:36, borderRadius:8, border:`1.5px solid ${C.border}`,
                        background: C.bg, color: C.textDark, fontSize:18, fontWeight:700,
                        cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {/* month + due */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <Label required>Billing Month</Label>
                    <div style={{ position:'relative' }}>
                      <span style={{ position:'absolute', left:10, top:'50%',
                        transform:'translateY(-50%)', pointerEvents:'none', display:'flex' }}>
                        <CalendarDays size={12} color={C.textMuted} />
                      </span>
                      <input type="month" value={billMonth}
                        onChange={e => { setMonth(e.target.value); setErrors(p => ({ ...p, billingMonth: undefined })) }}
                        style={{ ...inputStyle(errors.billingMonth), paddingLeft:30 }} />
                    </div>
                    <ErrMsg msg={errors.billingMonth} />
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <div style={{ position:'relative' }}>
                      <span style={{ position:'absolute', left:10, top:'50%',
                        transform:'translateY(-50%)', pointerEvents:'none', display:'flex' }}>
                        <CalendarDays size={12} color={C.textMuted} />
                      </span>
                      <input type="date" value={dueDate} onChange={e => setDue(e.target.value)}
                        style={{ ...inputStyle(false), paddingLeft:30 }} />
                    </div>
                  </div>
                </div>

                {/* payment status */}
                <div>
                  <Label>Payment Status</Label>
                  <PayPicker value={paidStatus} onChange={setPaid} />
                </div>

                {/* ref */}
                {paidStatus === 'PAID' && (
                  <div>
                    <Label hint="UTR / Cheque / TXN ID">Payment Reference</Label>
                    <div style={{ position:'relative' }}>
                      <span style={{ position:'absolute', left:10, top:'50%',
                        transform:'translateY(-50%)', pointerEvents:'none', display:'flex' }}>
                        <Hash size={12} color={C.textMuted} />
                      </span>
                      <input type="text" value={payRef} placeholder="e.g. NEFT12345678"
                        onChange={e => setRef(e.target.value)}
                        style={{ ...inputStyle(false), paddingLeft:30 }} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* ── RIGHT SUMMARY ── */}
        <div style={{ width:220, flexShrink:0, borderLeft:`1px solid ${C.border}`,
          background: C.bgSoft, overflowY:'auto', maxHeight:'76vh' }}>
          <SummaryPanel school={schoolData} plan={planData} tab={activeTab}
            studentCount={count} billingMonth={billMonth}
            paidStatus={paidStatus} addonQty={addonQty} />
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'12px 24px', borderTop:`1px solid ${C.border}`, background: C.bg,
        fontFamily: FONT }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color: C.textMuted, fontFamily: FONT }}>
          {schoolData && (
            <><Building2 size={11} color={C.textMuted} />
            <span style={{ fontWeight:600, color: C.textSoft, fontFamily: FONT }}>{schoolData.schoolName}</span></>
          )}
          {planData && (
            <><span style={{ color: C.border, margin:'0 2px' }}>·</span>
            <CreditCard size={11} color={C.textMuted} />
            <span style={{ fontFamily: FONT }}>{planData.name}</span></>
          )}
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose}
            style={{ padding:'8px 20px', fontSize:13, fontWeight:600, borderRadius:8,
              border:`1.5px solid ${C.border}`, background: C.bg,
              color: C.textMid, cursor:'pointer', fontFamily: FONT }}>
            Cancel
          </button>
          <button onClick={handleSubmit}
            disabled={submitting || loadingSchools || loadingPlans}
            style={{ padding:'8px 22px', fontSize:13, fontWeight:700, borderRadius:8,
              border:'none', background: C.brand, color:'#fff', cursor:'pointer',
              display:'flex', alignItems:'center', gap:6,
              opacity: (submitting || loadingSchools || loadingPlans) ? .55 : 1,
              boxShadow:'0 2px 8px rgba(12,59,115,.25)', fontFamily: FONT }}>
            {submitting
              ? <><Loader2 size={13} style={{ animation:'spin 1s linear infinite' }} />Assigning…</>
              : activeTab === 'Addon'
              ? <><Puzzle size={13} />Assign Add-on</>
              : <><CreditCard size={13} />Assign Subscription</>}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default SubscriptionModal
