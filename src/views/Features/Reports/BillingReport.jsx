import React, { useState, useEffect, useCallback } from 'react'
import {
  BarChart2, Download, CheckCircle, XCircle, Clock, AlertCircle,
  IndianRupee, Building2, TrendingUp, Filter, X,
  FileText, RefreshCw, Zap, Info
} from 'lucide-react'
import { Table, Pagination, Empty, Select, Tooltip, Modal } from 'antd'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { getRequest, patchRequest, postRequest } from '../../../Helpers'
import { calculatePrice } from '../PricingConfig/PricingConfig'
import InvoiceModal from '../MonthlyBilling/InvoiceModal'

const { Option } = Select

/* ─── Status config ─── */
const STATUS_CONFIG = {
  PAID:     { color: 'green',   icon: <CheckCircle size={12} />,  label: 'Paid',     bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200' },
  UNPAID:   { color: 'red',     icon: <XCircle size={12} />,      label: 'Unpaid',   bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200'   },
  PENDING:  { color: 'orange',  icon: <Clock size={12} />,        label: 'Pending',  bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200'},
  OVERDUE:  { color: 'volcano', icon: <AlertCircle size={12} />,  label: 'Overdue',  bg: 'bg-rose-50',   text: 'text-rose-700',   border: 'border-rose-200'  },
}

/* ─── KPI Card ─── */
const KPICard = ({ label, value, sub, icon: Icon, color }) => {
  const colors = {
    green:  { bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-green-100' },
    red:    { bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-100'   },
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-100'  },
    amber:  { bg: 'bg-amber-50',  text: 'text-amber-600',  border: 'border-amber-100' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100'},
  }
  const c = colors[color] || colors.blue
  return (
    <div className={`bg-white rounded-xl border ${c.border} p-4 flex items-center gap-3`}>
      <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${c.text}`} />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-gray-800 leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

/* ─── Status Badge ─── */
const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.icon}{cfg.label}
    </span>
  )
}

/* ═══════════════════════════════════════════════
   GENERATE BILLS MODAL
   — fetches all active tenant + their live lead
     counts, shows preview, then sends to backend
═══════════════════════════════════════════════ */
const GenerateBillsModal = ({ open, onClose, onSuccess }) => {
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'))
  const [dueDate, setDueDate] = useState(
    dayjs().endOf('month').format('YYYY-MM-DD')
  )
  const [step, setStep] = useState('config')
  const [preview, setPreview] = useState([])
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generatedResult, setGeneratedResult] = useState(null)
  const [pricingConfig, setPricingConfig] = useState(null)

  // month options — last 3 + next 1
  const monthOptions = Array.from({ length: 4 }, (_, i) => {
    const d = dayjs().subtract(i - 1, 'month')
    return { value: d.format('YYYY-MM'), label: d.format('MMM YYYY') }
  }).reverse()

  useEffect(() => {
    if (!open) { setStep('config'); setPreview([]); setGeneratedResult(null) }
  }, [open])

  /* Step 1 → Step 2: Fetch all tenant + their live lead counts + subscription addons */
  const handlePreview = async () => {
    setLoadingPreview(true)
    try {
      // Fetch pricing config
      const cfgRes = await getRequest('pricing-config')
      const cfg = cfgRes?.data?.data?.current || {
        baseStudentLimit: 350, basePrice: 1200,
        extraBlockSize: 50, extraBlockPrice: 100,
      }
      setPricingConfig(cfg)

      // Fetch all active tenant
      const schoolsRes = await getRequest('tenant?isPagination=false&isActive=true')
      const schools = schoolsRes?.data?.data?.tenants || []

      // For each school fetch lead count + subscription addons concurrently
      const rows = await Promise.all(
        schools.map(async (school) => {
          try {
            const [detailRes] = await Promise.all([
              getRequest(`tenant/${school._id}`),
              // prefetch ignored — recalculated below with real lead count
              Promise.resolve(null),
            ])

            const count = detailRes?.data?.data?.stats?.totalStudents || 0

            // Use backend preview (includes subscription addons) if available
            // Otherwise fall back to local calculatePrice (slot-only)
            const previewData = await postRequest({
              url: 'monthly-billing/preview',
              cred: { tenantId: school._id, studentCount: count },
            }).catch(() => null)

            const amount = previewData?.data?.data?.totalAmount ?? calculatePrice(count, cfg)
            const subscriptionAddonAmount = previewData?.data?.data?.subscriptionAddonAmount ?? 0
            const subAddons = previewData?.data?.data?.subscriptionAddonsSnapshot ?? []

            return {
              _id: school._id,
              schoolName: school.schoolName,
              subdomain: school.subdomain,
              logo: school.logo,
              studentCount: count,
              amount,
              subscriptionAddonAmount,
              subAddons,
              isActive: school.isActive,
            }
          } catch {
            return {
              _id: school._id,
              schoolName: school.schoolName,
              subdomain: school.subdomain,
              logo: school.logo,
              studentCount: 0,
              amount: cfg.basePrice,
              subscriptionAddonAmount: 0,
              subAddons: [],
              isActive: school.isActive,
            }
          }
        })
      )
      setPreview(rows)
      setStep('preview')
    } catch (err) {
      toast.error('Failed to load preview. Please try again.')
    } finally {
      setLoadingPreview(false)
    }
  }

  /* Allow admin to override individual lead count — re-fetch preview from backend */
  const updateCount = async (id, val) => {
    const count = Number(val) || 0
    // Optimistically update count first
    setPreview((prev) =>
      prev.map((r) => r._id === id ? { ...r, studentCount: count } : r)
    )
    // Re-fetch preview from backend to get accurate amount with addons
    try {
      const res = await postRequest({
        url: 'monthly-billing/preview',
        cred: { tenantId: id, studentCount: count },
      })
      const d = res?.data?.data
      setPreview((prev) =>
        prev.map((r) =>
          r._id === id
            ? {
                ...r,
                studentCount: count,
                amount: d?.totalAmount ?? calculatePrice(count, pricingConfig),
                subscriptionAddonAmount: d?.subscriptionAddonAmount ?? 0,
                subAddons: d?.subscriptionAddonsSnapshot ?? [],
              }
            : r
        )
      )
    } catch {
      // fallback to local calculate if backend fails
      setPreview((prev) =>
        prev.map((r) =>
          r._id === id
            ? { ...r, amount: calculatePrice(count, pricingConfig) }
            : r
        )
      )
    }
  }

  /* Step 2 → Step 3: Generate bills — individual per agency so overrides work */
  const handleGenerate = async () => {
    setGenerating(true)
    setStep('generating')
    let created = 0
    let skipped = 0
    const errors = []

    try {
      for (const row of preview) {
        try {
          await postRequest({
            url: 'monthly-billing/generate',
            cred: {
              tenantId:     row._id,
              billingMonth: month,
              studentCount: row.studentCount,
            },
          })
          created++
        } catch (err) {
          if (err?.response?.status === 409) skipped++
          else errors.push(row.schoolName)
        }
      }
      setGeneratedResult({ created, skipped, errors: errors.length })
      setStep('done')
      toast.success('Bills generated successfully!')
    } catch (err) {
      toast.error('Failed to generate bills')
      setStep('preview')
    } finally {
      setGenerating(false)
    }
  }

  const totalAmount = preview.reduce((s, r) => s + r.amount, 0)

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={680}
      destroyOnClose
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#0c3b73] flex items-center justify-center">
            <Zap size={15} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Generate Monthly Bills</p>
            <p className="text-xs text-gray-400 font-normal">
              Auto-fetch student counts from all tenant and create billing records
            </p>
          </div>
        </div>
      }
    >
      <div className="mt-3">

        {/* ── STEP INDICATOR ── */}
        <div className="flex items-center gap-0 mb-5">
          {[
            { key: 'config',     label: '1. Configure' },
            { key: 'preview',    label: '2. Preview'   },
            { key: 'generating', label: '3. Generate'  },
            { key: 'done',       label: '4. Done'      },
          ].map((s, i, arr) => {
            const stepOrder = ['config','preview','generating','done']
            const active = step === s.key
            const done = stepOrder.indexOf(step) > stepOrder.indexOf(s.key)
            return (
              <React.Fragment key={s.key}>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  active ? 'bg-[#0c3b73] text-white' :
                  done   ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'
                }`}>
                  {done ? <CheckCircle size={12} /> : null}
                  {s.label}
                </div>
                {i < arr.length - 1 && <div className="flex-1 h-[2px] bg-gray-200 mx-1" />}
              </React.Fragment>
            )
          })}
        </div>

        {/* ── STEP 1: CONFIG ── */}
        {step === 'config' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-2">
              <Info size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                This will fetch <strong>live lead counts</strong> from each agency's LMS,
                calculate the price using current pricing rules, and create pending billing
                records for all active tenant in one click.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  Billing Month <span className="text-red-500">*</span>
                </label>
                <Select value={month} onChange={setMonth} className="w-full" size="middle">
                  {monthOptions.map((m) => (
                    <Option key={m.value} value={m.value}>{m.label}</Option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full h-8 px-3 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#0c3b73]"
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={handlePreview}
                disabled={loadingPreview}
                className="flex items-center gap-2 px-6 py-2 bg-[#0c3b73] hover:bg-[#0a2f5c] text-white text-sm rounded-lg transition disabled:opacity-60"
              >
                {loadingPreview
                  ? <><RefreshCw size={14} className="animate-spin" /> Fetching from schools…</>
                  : <><Zap size={14} /> Preview Bills</>
                }
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: PREVIEW ── */}
        {step === 'preview' && (
          <div>
            {/* Summary bar */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Agencies</p>
                <p className="text-lg font-bold text-[#0c3b73]">{preview.length}</p>
              </div>
              <div className="bg-violet-50 border border-violet-100 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Total Leads</p>
                <p className="text-lg font-bold text-violet-700">
                  {preview.reduce((s, r) => s + r.studentCount, 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Total Billed</p>
                <p className="text-lg font-bold text-green-700">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
              <Info size={11} /> You can override lead counts below before generating.
            </p>

            {/* School preview table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0">
                  <tr style={{ backgroundColor: '#0c3b73' }}>
                    <th className="text-left text-white px-3 py-2 font-medium">Agency</th>
                    <th className="text-center text-white px-3 py-2 font-medium w-32">Leads (live)</th>
                    <th className="text-center text-white px-3 py-2 font-medium w-28">Sub. Addons</th>
                    <th className="text-right text-white px-3 py-2 font-medium w-28">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={row._id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {row.logo ? (
                            <img src={row.logo} alt="" className="w-6 h-6 rounded object-contain border border-gray-100 flex-shrink-0" />
                          ) : (
                            <div className="w-6 h-6 rounded bg-blue-50 flex items-center justify-center text-[9px] font-bold text-blue-500 flex-shrink-0 border border-blue-100">
                              {row.schoolName?.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-800 text-xs">{row.schoolName}</p>
                            <p className="text-[10px] text-gray-400">{row.subdomain}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number"
                          min={0}
                          value={row.studentCount}
                          onChange={(e) => updateCount(row._id, e.target.value)}
                          className="w-24 h-7 text-center text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#0c3b73] focus:border-[#0c3b73]"
                        />
                      </td>
                      {/* Subscription addons column */}
                      <td className="px-3 py-2 text-center">
                        {(row.subscriptionAddonAmount ?? 0) > 0 ? (
                          <Tooltip
                            title={
                              row.subAddons?.length
                                ? row.subAddons.map((a) => `${a.name}: ₹${a.monthlyPrice}/mo`).join(' | ')
                                : `₹${row.subscriptionAddonAmount}`
                            }
                          >
                            <span className="text-amber-600 font-semibold cursor-help">
                              +₹{(row.subscriptionAddonAmount).toLocaleString('en-IN')}
                            </span>
                          </Tooltip>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span className="font-bold text-[#0c3b73]">
                          ₹{row.amount.toLocaleString('en-IN')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 border-t-2 border-gray-300">
                    <td className="px-3 py-2 font-bold text-gray-700 text-xs">Total</td>
                    <td className="px-3 py-2 text-center font-bold text-gray-700 text-xs">
                      {preview.reduce((s, r) => s + r.studentCount, 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-3 py-2 text-center font-bold text-amber-600 text-xs">
                      +₹{preview.reduce((s, r) => s + (r.subscriptionAddonAmount || 0), 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-[#0c3b73] text-sm">
                      ₹{totalAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-between items-center pt-4 mt-2 border-t border-gray-100">
              <button onClick={() => setStep('config')}
                className="px-4 py-2 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50">
                ← Back
              </button>
              <button onClick={handleGenerate}
                disabled={generating}
                className="flex items-center gap-2 px-6 py-2 bg-[#0c3b73] hover:bg-[#0a2f5c] text-white text-sm rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed">
                <Zap size={14} />
                Generate {preview.length} Bills for {dayjs(month + '-01').format('MMM YYYY')}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: GENERATING ── */}
        {step === 'generating' && (
          <div className="py-10 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
              <RefreshCw size={24} className="text-[#0c3b73] animate-spin" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">Generating bills…</p>
              <p className="text-sm text-gray-400 mt-1">Creating billing records for all tenant</p>
            </div>
          </div>
        )}

        {/* ── STEP 4: DONE ── */}
        {step === 'done' && generatedResult && (
          <div className="py-8 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800">Bills Generated!</p>
              <p className="text-sm text-gray-500 mt-1">
                {dayjs(month + '-01').format('MMMM YYYY')} billing is ready
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 w-full mt-2">
              <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500">Created</p>
                <p className="text-2xl font-bold text-green-600">{generatedResult.created ?? preview.length}</p>
              </div>
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500">Skipped</p>
                <p className="text-2xl font-bold text-orange-500">{generatedResult.skipped ?? 0}</p>
                <p className="text-[10px] text-gray-400">Already billed</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500">Total Amount</p>
                <p className="text-lg font-bold text-[#0c3b73]">₹{totalAmount.toLocaleString('en-IN')}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={onClose}
                className="px-5 py-2 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50">
                Close
              </button>
              <button onClick={() => { onSuccess(); onClose() }}
                className="px-5 py-2 text-sm bg-[#0c3b73] hover:bg-[#0a2f5c] text-white rounded-lg">
                View Billing Report →
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

/* ─── Mark Paid Modal ─── */
const MarkPaidModal = ({ open, record, onClose, onSuccess }) => {
  const [paidDate, setPaidDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [paymentRef, setPaymentRef] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await patchRequest({
        url: `monthly-billing/${record._id}/mark-paid`,
        cred: { paidAt: paidDate, paymentRef }
      })
      toast.success('Marked as paid successfully')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to mark as paid')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={400}
      title={<div className="flex items-center gap-2 text-green-700"><CheckCircle size={16} /><span>Mark as Paid</span></div>}
    >
      {record && (
        <div className="space-y-3 mt-3">
          <div className="bg-gray-50 rounded-lg p-3 text-sm border border-gray-100">
            <p className="font-semibold text-gray-800">{record.tenantDetails?.schoolName}</p>
            <p className="text-gray-500 text-xs mt-0.5">Amount: ₹{record.totalAmount?.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Payment Date *</label>
            <input
              type="date"
              value={paidDate}
              onChange={(e) => setPaidDate(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#0c3b73]"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Payment Reference (optional)</label>
            <input
              type="text"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="UTR/Cheque/Transaction ID"
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#0c3b73]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2 text-sm bg-[#0c3b73] hover:bg-[#0a2f5c] text-white rounded flex items-center gap-2 disabled:opacity-60"
            >
              {loading && <RefreshCw size={13} className="animate-spin" />}
              Confirm Payment
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

/* ═══ MAIN COMPONENT ═══ */
const BillingReport = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState(null)
  const [schools, setSchools] = useState([])
  const [generateBillsOpen, setGenerateBillsOpen] = useState(false)

  // Filters — month default null taaki pehle load pe sab records aayein
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedSchool, setSelectedSchool] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState(null)
  const [appliedFilters, setAppliedFilters] = useState({
    month: '',       // empty = no month filter = show all
    tenantId: null,
    status: null,
  })

  // Mark Paid
  const [markPaidRecord, setMarkPaidRecord] = useState(null)
  // Invoice
  const [invoiceBillId, setInvoiceBillId] = useState(null)

  // Generate month options (last 24 months)
  const monthOptions = Array.from({ length: 24 }, (_, i) => {
    const d = dayjs().subtract(i, 'month')
    return { value: d.format('YYYY-MM'), label: d.format('MMM YYYY') }
  })

  /* ── Fetch tenant ── */
  useEffect(() => {
    getRequest('tenant?isPagination=false')
      .then((res) => setSchools(res?.data?.data?.tenants || []))
      .catch(() => {})
  }, [])

  /* ── Fetch report ── */
  const fetchReport = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page, limit })
    if (appliedFilters.month)    params.append('billingMonth', appliedFilters.month)
    if (appliedFilters.tenantId) params.append('tenantId',     appliedFilters.tenantId)
    if (appliedFilters.status)   params.append('status',       appliedFilters.status)

    getRequest(`monthly-billing?${params.toString()}`)
      .then((res) => {
        const bills = res?.data?.data?.bills || []
        setData(bills)
        setTotal(res?.data?.data?.total || 0)

        // Compute summary from returned bills (backend getBills doesn't return summary)
        const totalAmt     = bills.reduce((s, r) => s + (r.totalAmount || 0), 0)
        const collected    = bills.filter((r) => r.status === 'PAID').reduce((s, r) => s + (r.totalAmount || 0), 0)
        const paidCount    = bills.filter((r) => r.status === 'PAID').length
        const unpaidCount  = bills.filter((r) => r.status !== 'PAID').length
        setSummary({
          totalSchools:     res?.data?.data?.total || bills.length,
          totalAmount:      totalAmt,
          collectedAmount:  collected,
          pendingAmount:    totalAmt - collected,
          paidCount,
          unpaidCount,
        })
      })
      .catch(() => {
        toast.error('Failed to load billing report')
        setData([])
        setSummary(null)
      })
      .finally(() => setLoading(false))
  }, [appliedFilters, page, limit])

  useEffect(() => { fetchReport() }, [fetchReport])

  const handleApply = () => {
    setAppliedFilters({ month: selectedMonth, tenantId: selectedSchool, status: selectedStatus })
    setPage(1)
  }

  const handleClear = () => {
    setSelectedMonth('')
    setSelectedSchool(null)
    setSelectedStatus(null)
    setAppliedFilters({ month: '', tenantId: null, status: null })
    setPage(1)
  }

  /* ── Export Excel ── */
  const exportExcel = () => {
    if (!data.length) { toast.error('No data to export'); return }
    const rows = data.map((row, i) => ({
      'Sr.': i + 1,
      'Agency': row.tenantDetails?.schoolName || '—',
      'Subdomain': row.tenantDetails?.subdomain || '—',
      'Month': row.billingMonth || '—',
      'Leads': row.studentCount || 0,
      'Amount (₹)': row.totalAmount || 0,
      'Status': row.status || '—',
      'Due Date': row.dueDate ? dayjs(row.dueDate).format('DD MMM YYYY') : '—',
      'Paid Date': row.paidAt  ? dayjs(row.paidAt).format('DD MMM YYYY')  : '—',
      'Payment Ref': row.paymentRef || '—',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Billing Report')
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    saveAs(new Blob([buf], { type: 'application/octet-stream' }),
      `billing-report-${appliedFilters.month || 'all'}.xlsx`)
    toast.success('Excel exported successfully')
  }

  /* ── Export PDF ── */
  const exportPDF = () => {
    if (!data.length) { toast.error('No data to export'); return }
    const doc = new jsPDF({ orientation: 'landscape' })
    doc.setFontSize(14)
    doc.text(
      `Billing Report${appliedFilters.month ? ' — ' + dayjs(appliedFilters.month + '-01').format('MMMM YYYY') : ' — All Months'}`,
      14, 15
    )
    if (summary) {
      doc.setFontSize(9)
      doc.text(`Total Billed: ₹${summary.totalAmount?.toLocaleString('en-IN')}  |  Collected: ₹${summary.collectedAmount?.toLocaleString('en-IN')}  |  Outstanding: ₹${summary.pendingAmount?.toLocaleString('en-IN')}`, 14, 23)
    }
    doc.autoTable({
      startY: 28,
      head: [['Sr', 'Agency', 'Month', 'Leads', 'Amount', 'Status', 'Due Date', 'Paid Date']],
      body: data.map((row, i) => [
        i + 1,
        row.tenantDetails?.schoolName || '—',
        row.billingMonth || '—',
        row.studentCount || 0,
        `₹${(row.totalAmount || 0).toLocaleString('en-IN')}`,
        row.status || '—',
        row.dueDate ? dayjs(row.dueDate).format('DD MMM YYYY') : '—',
        row.paidAt  ? dayjs(row.paidAt).format('DD MMM YYYY')  : '—',
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [12, 59, 115] },
    })
    doc.save(`billing-report-${appliedFilters.month || 'all'}.pdf`)
    toast.success('PDF exported successfully')
  }

  /* ── Table Columns ── */
  const columns = [
    {
      title: 'Sr.',
      key: 'sr',
      align: 'center',
      width: 55,
      render: (_, __, i) => (page - 1) * limit + i + 1,
    },
    {
      title: 'Agency',
      key: 'school',
      render: (_, row) => {
        const s = row.tenantDetails
        return (
          <div className="flex items-center gap-2">
            {s?.logo ? (
              <img src={s.logo} alt="" className="w-8 h-8 rounded-lg object-contain border border-gray-100 flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200 text-xs font-bold text-gray-500 flex-shrink-0">
                {s?.schoolName?.slice(0, 2).toUpperCase() || '--'}
              </div>
            )}
            <div>
              <p className="font-medium text-gray-800 text-sm leading-tight">{s?.schoolName || '—'}</p>
              <p className="text-xs text-gray-400">{s?.subdomain}</p>
            </div>
          </div>
        )
      },
    },
    {
      title: 'Month',
      dataIndex: 'billingMonth',
      align: 'center',
      render: (m) => m ? (
        <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
          {dayjs(m + '-01').format('MMM YYYY')}
        </span>
      ) : '—',
    },
    {
      title: 'Leads',
      dataIndex: 'studentCount',
      align: 'center',
      render: (v) => <span className="text-sm font-medium text-gray-700">{v ?? '—'}</span>,
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      align: 'center',
      render: (v) => (
        <span className="font-bold text-gray-800">₹{Number(v || 0).toLocaleString('en-IN')}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      align: 'center',
      render: (status) => <StatusBadge status={status} />,
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      align: 'center',
      render: (d, row) => {
        const isOverdue = d && new Date(d) < new Date() && row.status !== 'PAID'
        return d ? (
          <Tooltip title={isOverdue ? 'Overdue!' : ''}>
            <span className={`text-xs ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
              {dayjs(d).format('DD MMM YYYY')}
            </span>
          </Tooltip>
        ) : '—'
      },
    },
    {
      title: 'Paid Date',
      dataIndex: 'paidAt',
      align: 'center',
      render: (d) => d ? (
        <span className="text-xs text-green-600 font-medium">{dayjs(d).format('DD MMM YYYY')}</span>
      ) : <span className="text-gray-300 text-xs">—</span>,
    },
    {
      title: 'Payment Ref',
      dataIndex: 'paymentRef',
      align: 'center',
      render: (ref) => ref ? (
        <span className="text-xs font-mono text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">{ref}</span>
      ) : <span className="text-gray-300 text-xs">—</span>,
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      width: 130,
      render: (_, row) => (
        <div className="flex items-center justify-center gap-1">
          {/* Invoice button */}
          <Tooltip title="View Invoice">
            <button
              onClick={() => setInvoiceBillId(row._id)}
              className="p-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-[#0c3b73] transition"
            >
              <FileText size={13} />
            </button>
          </Tooltip>
          {row.status !== 'PAID' && (
            <Tooltip title="Mark as Paid">
              <button
                onClick={() => setMarkPaidRecord(row)}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-[#0c3b73] hover:bg-[#0a2f5c] text-white rounded transition"
              >
                <CheckCircle size={11} /> Paid
              </button>
            </Tooltip>
          )}
          {row.status === 'PAID' && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle size={11} /> Done
            </span>
          )}
        </div>
      ),
    },
  ]

  const collectionRate = summary?.totalAmount > 0
    ? Math.round((summary.collectedAmount / summary.totalAmount) * 100)
    : 0

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
            <BarChart2 size={20} className="text-[#e24028]" />
            Billing Report
          </h1>
          <p className="text-sm text-gray-500">Monthly agency-wise billing and payment tracking</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* ⚡ MAIN ACTION — Generate Bills */}
          <button
            onClick={() => setGenerateBillsOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[#0c3b73] hover:bg-[#0a2f5c] text-white rounded-lg transition font-semibold shadow-sm"
          >
            <Zap size={15} />
            Generate Monthly Bills
          </button>
          <button onClick={exportExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-xs bg-[#0c3b73] hover:bg-[#0a2f5c] text-white rounded-lg transition">
            <Download size={13} /> Excel
          </button>
          <button onClick={exportPDF}
            className="flex items-center gap-1.5 px-3 py-2 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg transition">
            <FileText size={13} /> PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          <KPICard label="Total Agencies" value={summary.totalSchools || 0} icon={Building2} color="blue" />
          <KPICard label="Total Billed" value={`₹${(summary.totalAmount || 0).toLocaleString('en-IN')}`} icon={IndianRupee} color="violet" />
          <KPICard label="Collected" value={`₹${(summary.collectedAmount || 0).toLocaleString('en-IN')}`} sub={`${summary.paidCount || 0} tenant paid`} icon={CheckCircle} color="green" />
          <KPICard label="Outstanding" value={`₹${(summary.pendingAmount || 0).toLocaleString('en-IN')}`} sub={`${summary.unpaidCount || 0} tenant pending`} icon={XCircle} color="red" />
          <KPICard label="Collection Rate" value={`${collectionRate}%`} sub={`${summary.paidCount || 0}/${summary.totalSchools || 0} tenant`} icon={TrendingUp} color="amber" />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={15} className="text-orange-500" />
          <span className="text-sm font-semibold text-gray-700">Filters</span>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Month</label>
            <Select
              allowClear
              placeholder="All months"
              value={selectedMonth || undefined}
              onChange={(v) => setSelectedMonth(v || '')}
              className="w-36"
              size="middle"
            >
              {monthOptions.map((m) => (
                <Option key={m.value} value={m.value}>{m.label}</Option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Agency</label>
            <Select
              allowClear showSearch placeholder="All tenant"
              value={selectedSchool} onChange={setSelectedSchool}
              className="w-52" size="middle" optionFilterProp="label"
            >
              {schools.map((s) => (
                <Option key={s._id} value={s._id} label={s.schoolName}>
                  <span className="text-sm">{s.schoolName}</span>
                </Option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Payment Status</label>
            <Select allowClear placeholder="All statuses" value={selectedStatus} onChange={setSelectedStatus} className="w-36" size="middle">
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <Option key={k} value={k}>{v.label}</Option>
              ))}
            </Select>
          </div>
          <div className="flex gap-2 pb-0.5">
            <button onClick={handleApply}
              className="h-8 px-5 rounded-md bg-[#0c3b73] text-white text-sm hover:bg-[#0a2f5c] transition">
              Apply
            </button>
            <button onClick={handleClear}
              className="h-8 px-4 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm transition flex items-center gap-1.5">
              <X size={13} /> Clear
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="_id"
          loading={loading}
          pagination={false}
          locale={{ emptyText: <Empty description="No billing records found" /> }}
          scroll={{ x: 'max-content' }}
          rowClassName={(row) =>
            row.status === 'OVERDUE' ? 'bg-red-50/30' :
            row.status === 'PAID'    ? 'bg-green-50/20' : ''
          }
        />
        {!loading && total > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </p>
            <Pagination
              current={page} pageSize={limit} total={total}
              pageSizeOptions={['10', '20', '50']}
              showSizeChanger
              onChange={(p) => setPage(p)}
              onShowSizeChange={(_, s) => { setLimit(s); setPage(1) }}
              size="small"
            />
          </div>
        )}
      </div>

      {/* Mark Paid Modal */}
      <MarkPaidModal
        open={!!markPaidRecord}
        record={markPaidRecord}
        onClose={() => setMarkPaidRecord(null)}
        onSuccess={fetchReport}
      />

      {/* Generate Bills Modal */}
      <GenerateBillsModal
        open={generateBillsOpen}
        onClose={() => setGenerateBillsOpen(false)}
        onSuccess={() => {
          setAppliedFilters({ month: selectedMonth, tenantId: null, status: null })
          fetchReport()
        }}
      />

      {/* Invoice Modal */}
      <InvoiceModal
        open={!!invoiceBillId}
        billId={invoiceBillId}
        onClose={() => setInvoiceBillId(null)}
      />
    </div>
  )
}

export default BillingReport
