/* eslint-disable prettier/prettier */
/**
 * SubscriptionStatusPanel
 *
 * Chargebee / Stripe billing dashboard jaise — ek hi nazar mein admin dekh sake:
 *  • Plan active hai ya expired / no plan
 *  • Addon count + breakdown
 *  • Student capacity usage (progress bar)
 *  • Price breakdown (base + addons)
 *  • Days remaining badge
 *  • Quick action buttons (Assign Plan / Add Addon)
 */
import React, { useState, useEffect } from 'react'
import {
  CreditCard, PackagePlus, Users, IndianRupee, CalendarDays,
  AlertTriangle, CheckCircle2, XCircle, Clock3, Puzzle,
  Loader2, RefreshCw, TrendingUp, ShieldCheck,
} from 'lucide-react'
import { Tag, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { getRequest } from '../../../../Helpers'

/* ── helpers ─────────────────────────────────────────────── */
const fmt   = (n) => Number(n || 0).toLocaleString('en-IN')
const fmtRs = (n) => `₹${fmt(n)}`

/** Days left — green > 60, amber 30-60, red < 30 */
const daysConfig = (days) => {
  if (days === null || days === undefined) return null
  if (days > 60) return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 }
  if (days > 30) return { color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   icon: Clock3 }
  return             { color: 'text-red-600',         bg: 'bg-red-50',     border: 'border-red-200',     icon: AlertTriangle }
}

/** Status pill ─────────────────────────────────────────── */
const StatusPill = ({ status, isTrial }) => {
  const map = {
    ACTIVE:    { label: 'Active',    cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    TRIAL:     { label: 'Trial',     cls: 'bg-amber-100   text-amber-700   border-amber-200' },
    EXPIRED:   { label: 'Expired',   cls: 'bg-red-100     text-red-700     border-red-200' },
    CANCELLED: { label: 'Cancelled', cls: 'bg-gray-100    text-gray-600    border-gray-200' },
    PENDING:   { label: 'Pending',   cls: 'bg-blue-100    text-blue-700    border-blue-200' },
    NO_PLAN:   { label: 'No Plan',   cls: 'bg-gray-100    text-gray-500    border-gray-200' },
  }
  const key = isTrial ? 'TRIAL' : (status || 'NO_PLAN')
  const cfg = map[key] || map.NO_PLAN
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

/* ── Usage Bar ───────────────────────────────────────────── */
const UsageBar = ({ used, total }) => {
  if (!total) return null
  const pct     = Math.min(100, Math.round((used / total) * 100))
  const barColor = pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-400' : 'bg-emerald-500'
  return (
    <div className="w-full">
      <div className="flex justify-between text-[11px] text-gray-500 mb-1">
        <span>{fmt(used)} used</span>
        <span className={pct >= 90 ? 'text-red-600 font-bold' : 'text-gray-500'}>{pct}%</span>
      </div>
      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[11px] mt-1">
        <span className="text-gray-400">{fmt(total - used)} remaining</span>
        <span className="text-gray-400">of {fmt(total)}</span>
      </div>
    </div>
  )
}

/* ── effective addon price helper (mirrors backend logic) ────────── */
const effectiveAddonPrice = (addonPrice, addonCycle, planCycle, quantity = 1) => {
  const unitPrice = (addonPrice || 0) * (quantity || 1)
  if (!addonCycle || !planCycle || addonCycle === planCycle) return unitPrice
  if (planCycle === 'Yearly' && addonCycle === 'Monthly') return unitPrice * 12
  if (planCycle === 'Monthly' && addonCycle === 'Yearly') return Math.round(unitPrice / 12)
  return unitPrice
}

/* ── Addon Badge Row ─────────────────────────────────────── */
const AddonRow = ({ addon, planCycle }) => {
  const addonCycle = addon.billingCycle || 'Monthly'  // default Monthly if not stored
  const rawPrice  = (addon.price || 0) * (addon.quantity || 1)
  const effPrice  = effectiveAddonPrice(addon.price, addonCycle, planCycle, addon.quantity || 1)
  const mismatch  = planCycle && addonCycle !== planCycle

  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-purple-50 border border-purple-100">
      <div className="flex items-center gap-2 min-w-0">
        <Puzzle size={13} className="text-purple-500 flex-shrink-0" />
        <span className="text-xs font-semibold text-purple-800 truncate">{addon.name}</span>
        {addon.quantity > 1 && (
          <span className="text-[10px] font-bold bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded-full flex-shrink-0">
            ×{addon.quantity}
          </span>
        )}
        {/* Billing cycle badge — show only if different from plan */}
        {addon.billingCycle && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${
            mismatch ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {addon.billingCycle}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0 ml-2">
        <span className="text-[11px] text-purple-600 font-semibold">
          +{fmt(addon.studentLimit * (addon.quantity || 1))} students
        </span>
        <div className="text-right">
          <span className="text-[11px] text-purple-700 font-bold">{fmtRs(effPrice)}</span>
          {/* Show original price if converted */}
          {mismatch && (
            <p className="text-[9px] text-amber-600 leading-none mt-0.5">
              {fmtRs(rawPrice)}/{addon.billingCycle === 'Monthly' ? 'mo' : 'yr'} × {planCycle === 'Yearly' ? '12' : '÷12'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Price Breakdown Row ─────────────────────────────────── */
const PriceRow = ({ label, value, highlight, muted }) => (
  <div className={`flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0 ${highlight ? 'pt-2' : ''}`}>
    <span className={`text-xs ${muted ? 'text-gray-400' : 'text-gray-600'}`}>{label}</span>
    <span className={`text-xs font-bold ${highlight ? 'text-[#0c3b73] text-sm' : muted ? 'text-gray-400' : 'text-gray-800'}`}>
      {value}
    </span>
  </div>
)

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
const SubscriptionStatusPanel = ({ tenantId, onAssignPlan, onAddAddon }) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [lastFetched, setLastFetched] = useState(null)

  const fetchStatus = async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const res = await getRequest(`subscription?tenantId=${tenantId}&isPagination=false`)
      const subs = res?.data?.data?.subscriptions || []
      setData(subs[0] || null)
      setLastFetched(new Date())
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStatus() }, [tenantId])

  /* ── derived values ── */
  const plan      = data?.currentPlan || null
  const addons    = data?.currentAddons || []
  const hasAddon  = addons.length > 0
  const status    = data?.status || null
  const isTrial   = data?.isTrial || false

  const endDate   = plan?.endDate ? dayjs(plan.endDate) : null
  const daysLeft  = endDate ? Math.max(0, endDate.diff(dayjs(), 'day')) : null
  const dayCfg    = daysConfig(daysLeft)

  const basePlanPrice  = plan?.price || 0
  const addonTotalPrice = addons.reduce(
    // billingCycle nahi stored toh 'Monthly' default — most addons Monthly hote hain
    (s, a) => s + effectiveAddonPrice(a.price, a.billingCycle || 'Monthly', plan?.billingCycle, a.quantity || 1),
    0
  )
  // ALWAYS recalculate — database mein stale totalAmount ho sakta hai
  const totalPrice = basePlanPrice + addonTotalPrice

  const usedStudents  = data?.usedStudents || 0
  const totalCapacity = data?.totalStudentLimit || 0
  const baseCapacity  = plan?.studentLimit || 0
  const addonCapacity = addons.reduce((s, a) => s + (a.studentLimit || 0) * (a.quantity || 1), 0)

  /* ── loading skeleton ── */
  if (loading && !data) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex items-center justify-center gap-2 text-gray-400 min-h-[200px]">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">Loading subscription…</span>
      </div>
    )
  }

  /* ── No subscription ── */
  if (!data || !plan) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <CreditCard size={18} className="text-gray-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Subscription</h3>
              <p className="text-xs text-slate-400">No active plan assigned</p>
            </div>
          </div>
          <StatusPill status="NO_PLAN" />
        </div>

        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4 text-center">
          <XCircle size={28} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-500">No Subscription Assigned</p>
          <p className="text-xs text-gray-400 mt-1">School ko plan assign karo to activate karein</p>
        </div>

        {onAssignPlan && (
          <button
            onClick={onAssignPlan}
            className="mt-4 w-full py-2 text-sm bg-[#0c3b73] hover:bg-[#0a2f5c] text-white rounded-xl transition flex items-center justify-center gap-2"
          >
            <CreditCard size={14} /> Assign Plan
          </button>
        )}
      </div>
    )
  }

  /* ── Active subscription ── */
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#0c3b73' }}>
            <CreditCard size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Subscription</h3>
            <p className="text-xs text-slate-400">
              {plan.billingCycle} · {plan.pricingModel === 'PER_STUDENT' ? 'Per-Student' : 'Fixed'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusPill status={status} isTrial={isTrial} />
          <Tooltip title={lastFetched ? `Last updated: ${dayjs(lastFetched).format('HH:mm:ss')}` : ''}>
            <button
              onClick={fetchStatus}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* ── Plan Name + Days Left ─────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 px-3 py-3 rounded-xl bg-slate-50 border border-slate-100">
        <div className="min-w-0">
          <p className="text-xs text-gray-400 font-medium">Current Plan</p>
          <p className="text-sm font-bold text-slate-800 truncate mt-0.5">{plan.name}</p>
          {isTrial && (
            <p className="text-[10px] text-amber-600 font-semibold mt-0.5">⚡ Trial Active</p>
          )}
        </div>

        {/* Days left badge */}
        {dayCfg && daysLeft !== null && (
          <div className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border ${dayCfg.bg} ${dayCfg.border}`}>
            <dayCfg.icon size={14} className={dayCfg.color} />
            <p className={`text-lg font-black leading-tight ${dayCfg.color}`}>{daysLeft}</p>
            <p className={`text-[10px] font-semibold ${dayCfg.color}`}>days left</p>
          </div>
        )}
      </div>

      {/* ── Date range ───────────────────────────────────────── */}
      {plan.startDate && plan.endDate && (
        <div className="flex items-center gap-2 text-[11px] text-gray-400">
          <CalendarDays size={11} />
          <span>
            {dayjs(plan.startDate).format('DD MMM YYYY')} → {dayjs(plan.endDate).format('DD MMM YYYY')}
          </span>
        </div>
      )}

      {/* ── Student Capacity Usage ───────────────────────────── */}
      <div className="px-3 py-3 rounded-xl bg-blue-50 border border-blue-100">
        <div className="flex items-center gap-2 mb-2.5">
          <Users size={13} className="text-blue-600" />
          <span className="text-xs font-semibold text-blue-800">Student Capacity</span>
          {hasAddon && (
            <Tooltip title={`Base: ${fmt(baseCapacity)} + Addons: ${fmt(addonCapacity)}`}>
              <span className="text-[10px] bg-purple-100 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded-full font-bold cursor-help">
                +{fmt(addonCapacity)} addon
              </span>
            </Tooltip>
          )}
        </div>
        <UsageBar used={usedStudents} total={totalCapacity} />
      </div>

      {/* ── Add-ons Section ──────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Puzzle size={13} className="text-purple-500" />
            <span className="text-xs font-semibold text-gray-700">Add-ons</span>
            {hasAddon ? (
              <span className="text-[10px] font-bold bg-purple-600 text-white px-1.5 py-0.5 rounded-full">
                {addons.length}
              </span>
            ) : (
              <span className="text-[10px] text-gray-400">none</span>
            )}
          </div>
          {onAddAddon && (
            <button
              onClick={onAddAddon}
              className="flex items-center gap-1 text-[11px] text-purple-600 hover:text-purple-800 font-semibold transition"
            >
              <PackagePlus size={12} /> Add
            </button>
          )}
        </div>

        {hasAddon ? (
          <div className="space-y-1.5">
            {addons.map((addon, i) => (
              <AddonRow key={addon.addonId || i} addon={addon} planCycle={plan?.billingCycle} />
            ))}
          </div>
        ) : (
          <div className="px-3 py-2.5 rounded-xl bg-gray-50 border border-dashed border-gray-200 text-center">
            <p className="text-xs text-gray-400">No add-ons assigned</p>
          </div>
        )}
      </div>

      {/* ── Price Breakdown ──────────────────────────────────── */}
      <div className="px-3 py-3 rounded-xl bg-slate-50 border border-slate-100">
        <div className="flex items-center gap-2 mb-2">
          <IndianRupee size={13} className="text-slate-600" />
          <span className="text-xs font-semibold text-slate-700">Price Breakdown</span>
          <span className="text-[10px] text-slate-400 font-normal">({plan.billingCycle})</span>
        </div>

        <PriceRow label={`Base Plan (${plan.name})`} value={fmtRs(basePlanPrice)} />

        {addons.map((addon, i) => {
          const addonCycle = addon.billingCycle || 'Monthly'
          const effPrice = effectiveAddonPrice(addon.price, addonCycle, plan?.billingCycle, addon.quantity || 1)
          const mismatch = plan?.billingCycle && addonCycle !== plan.billingCycle
          return (
            <PriceRow
              key={i}
              label={
                mismatch
                  ? `${addon.name}${addon.quantity > 1 ? ` ×${addon.quantity}` : ''} (${addonCycle} × ${plan.billingCycle === 'Yearly' ? '12' : '÷12'})`
                  : `${addon.name}${addon.quantity > 1 ? ` ×${addon.quantity}` : ''}`
              }
              value={fmtRs(effPrice)}
              muted
            />
          )
        })}

        {/* Divider + Total */}
        <div className="border-t border-slate-200 mt-1 pt-1">
          <PriceRow label="Total" value={fmtRs(totalPrice)} highlight />
        </div>
      </div>

      {/* ── Payment Status ───────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={13} className={
            data.paidStatus === 'PAID' ? 'text-emerald-500' :
            data.paidStatus === 'OVERDUE' ? 'text-red-500' : 'text-amber-500'
          } />
          <span className="text-xs text-gray-600 font-medium">Payment</span>
        </div>
        <Tag
          color={
            data.paidStatus === 'PAID' ? 'green' :
            data.paidStatus === 'OVERDUE' ? 'red' :
            data.paidStatus === 'UNPAID' ? 'volcano' : 'orange'
          }
          className="text-[11px] font-bold"
        >
          {data.paidStatus || 'PENDING'}
        </Tag>
      </div>

      {/* ── Expiry warning banner ────────────────────────────── */}
      {daysLeft !== null && daysLeft <= 30 && status !== 'EXPIRED' && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200">
          <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 font-medium">
            {daysLeft === 0
              ? 'Plan aaj expire ho raha hai!'
              : `Plan ${daysLeft} din mein expire hoga — renew karo`}
          </p>
        </div>
      )}
      {status === 'EXPIRED' && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200">
          <XCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 font-medium">
            Subscription expire ho chuki hai. School ka access blocked ho sakta hai.
          </p>
        </div>
      )}

      {/* ── Upgrade/Assign button ─────────────────────────────── */}
      {onAssignPlan && (
        <button
          onClick={onAssignPlan}
          className="w-full py-2 text-sm text-[#0c3b73] border border-[#0c3b73] hover:bg-blue-50 rounded-xl transition flex items-center justify-center gap-2 font-semibold"
        >
          <TrendingUp size={14} /> Change / Upgrade Plan
        </button>
      )}
    </div>
  )
}

export default SubscriptionStatusPanel
