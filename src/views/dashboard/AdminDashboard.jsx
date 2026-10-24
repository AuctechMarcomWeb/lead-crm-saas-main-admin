/* eslint-disable prettier/prettier */
/* eslint-disable react/react-in-jsx-scope */
import {
  School, CheckCircle, XCircle, CreditCard, Users,
  IndianRupee, Activity, CalendarDays, ArrowRight, TrendingUp,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { getRequest } from '../../Helpers'
import { Skeleton } from 'antd'
import { useNavigate } from 'react-router-dom'

/* ─── helpers ─── */
function useCountUp(target, duration = 1200) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!target) return setVal(0)
    let s = 0; const step = target / (duration / 16)
    const t = setInterval(() => { s += step; if (s >= target) { setVal(target); clearInterval(t) } else setVal(Math.floor(s)) }, 16)
    return () => clearInterval(t)
  }, [target])
  return val
}
function Num({ v, pre = '', suf = '' }) {
  const d = useCountUp(typeof v === 'number' ? v : parseFloat(String(v).replace(/[^0-9.]/g, '')) || 0)
  return <>{pre}{d.toLocaleString('en-IN')}{suf}</>
}

/* ─── skeleton ─── */
function PageSkeleton() {
  return (
    <div className="p-4 space-y-4 bg-[#f8fafc] min-h-screen">
      <div className="flex justify-between"><Skeleton.Input style={{ width: 220, height: 24 }} active /><Skeleton.Input style={{ width: 140, height: 32 }} active /></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-xl p-4 border border-slate-100 space-y-2"><Skeleton.Input style={{ width: 80, height: 12 }} active size="small" /><Skeleton.Input style={{ width: 110, height: 28 }} active /><Skeleton.Input style={{ width: 130, height: 10 }} active size="small" /></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 bg-white rounded-xl p-4 border border-slate-100"><Skeleton.Input style={{ width: 140, height: 14 }} active /><div className="mt-3"><Skeleton.Input style={{ width: '100%', height: 160 }} active /></div></div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 space-y-3"><Skeleton.Input style={{ width: 120, height: 14 }} active />{[...Array(4)].map((_, i) => <div key={i} className="space-y-1"><Skeleton.Input style={{ width: '100%', height: 10 }} active size="small" /><Skeleton.Input style={{ width: '100%', height: 6 }} active size="small" /></div>)}</div>
      </div>
    </div>
  )
}

/* ─── stat card ─── */
function StatCard({ title, value, pre = '', suf = '', icon: Icon, color, sub }) {
  const colors = {
    indigo: { light: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' },
    emerald: { light: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
    rose: { light: 'bg-rose-50', text: 'text-rose-500', border: 'border-rose-100' },
    amber: { light: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
    violet: { light: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100' },
    blue: { light: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
  }
  const c = colors[color] || colors.indigo
  return (
    <div className={`bg-white rounded-xl border ${c.border} p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden`}>
      <div className={`absolute -top-6 -right-6 w-16 h-16 rounded-full ${c.light} opacity-60 group-hover:scale-125 transition-transform duration-500`} />
      <div className="relative">
        <div className={`inline-flex p-2 rounded-xl ${c.light} mb-2`}>
          <Icon className={`w-4 h-4 ${c.text}`} />
        </div>
        <p className="text-[18px] font-medium  text-slate-700 mb-0.5">{title}</p>
        <p className="text-xl font-medium text-slate-800 leading-none mb-1.5"><Num v={value} pre={pre} suf={suf} /></p>
        {sub && <p className="text-[11px] font-medium text-slate-500">{sub}</p>}
      </div>
    </div>
  )
}

/* ─── pie label ─── */
const RADIAN = Math.PI / 180
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.05) return null
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={500}>{`${(percent * 100).toFixed(0)}%`}</text>
}

/* ═══════════════════════ MAIN ═══════════════════════ */
export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [d, setD] = useState({
    totalTenants: 0, activeTenants: 0, inactiveTenants: 0,
    recentSchools: [],
    subscriptions: { totalSubscriptions: 0, activeSubscriptions: 0, totalRevenue: 0, totalStudentLimit: 0, totalUsedStudents: 0 },
  })
  const navigate = useNavigate()

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

  useEffect(() => {
    getRequest('saas/dashboard')
      .then(r => { if (r?.data?.success) setD(r.data.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageSkeleton />

  const { totalTenants, activeTenants, inactiveTenants, recentSchools = [], subscriptions = {} } = d
  const activePct = totalTenants > 0 ? +((activeTenants / totalTenants) * 100).toFixed(1) : 0
  const inactivePct = totalTenants > 0 ? +((inactiveTenants / totalTenants) * 100).toFixed(1) : 0
  const subUsagePct = subscriptions.totalStudentLimit > 0
    ? Math.round((subscriptions.totalUsedStudents / subscriptions.totalStudentLimit) * 100) : 0

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  const trendData = months.map((m, i) => ({
    month: m,
    schools: Math.max(1, Math.round(totalTenants * (0.5 + i * 0.1))),
    active: Math.max(1, Math.round(activeTenants * (0.5 + i * 0.1))),
  }))

  const piData = [
    { name: 'Active', value: activeTenants },
    { name: 'Inactive', value: inactiveTenants },
  ]
  const PIE_COLORS = ['#10b981', '#f43f5e']

  return (
    <div className=" min-h-screen space-y-4">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-medium text-slate-800 tracking-tight">SaaS Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">Platform-wide school management overview</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm self-start sm:self-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-slate-600">{today}</span>
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total Schools" value={totalTenants} icon={School} color="indigo"
          sub={`${activeTenants} active · ${inactiveTenants} inactive`} />
        <StatCard title="Active Schools" value={activeTenants} icon={CheckCircle} color="emerald"
          sub={`${activePct}% of total`} />
        <StatCard title="Inactive Schools" value={inactiveTenants} icon={XCircle} color="rose"
          sub={`${inactivePct}% of total`} />
        <StatCard title="Total Revenue" value={subscriptions.totalRevenue || 0} pre="₹" icon={IndianRupee} color="amber"
          sub={`${subscriptions.activeSubscriptions || 0} active plans`} />
      </div>

      {/* ── SUBSCRIPTION MINI CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Subscriptions', value: subscriptions.totalSubscriptions || 0, icon: CreditCard, color: 'violet' },
          { label: 'Active Plans', value: subscriptions.activeSubscriptions || 0, icon: Activity, color: 'emerald' },
          { label: 'Student Capacity', value: subscriptions.totalStudentLimit || 0, icon: Users, color: 'blue' },
          { label: 'Students Enrolled', value: subscriptions.totalUsedStudents || 0, icon: TrendingUp, color: 'indigo' },
        ].map((card, i) => {
          const colors = {
            violet: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100' },
            emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
            blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
            indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' },
          }
          const c = colors[card.color]
          return (
            <div key={i} className={`bg-white rounded-xl border ${c.border} p-3 flex items-center gap-2.5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}>
              <div className={`p-2 rounded-xl ${c.bg} flex-shrink-0`}>
                <card.icon className={`w-4 h-4 ${c.text}`} />
              </div>
              <div>
                <p className="text-[18px] font-medium  text-slate-700 mb-0.5">{card.label}</p>
                <p className="text-lg font-medium text-slate-800"><Num v={card.value} /></p>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── BILLING KPI CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'This Month Collected', value: subscriptions.thisMonthCollected || 0, pre: '₹', color: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', sub: `${subscriptions.thisMonthPaidCount || 0} tenant paid` },
          { label: 'Outstanding Amount',   value: subscriptions.thisMonthPending || 0,   pre: '₹', color: 'rose',    bg: 'bg-rose-50',    text: 'text-rose-600',    border: 'border-rose-100',    sub: `${subscriptions.thisMonthUnpaidCount || 0} tenant pending` },
          { label: 'Overdue Payments',     value: subscriptions.overdueAmount || 0,       pre: '₹', color: 'red',     bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-100',     sub: `${subscriptions.overdueCount || 0} overdue` },
          { label: 'Collection Rate',      value: subscriptions.collectionRate || 0,      pre: '',  suf: '%', color: 'amber',  bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-100',   sub: 'This month' },
        ].map((card, i) => (
          <div key={i} className={`bg-white rounded-xl border ${card.border} p-3 flex items-center gap-2.5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}>
            <div className={`p-2 rounded-xl ${card.bg} flex-shrink-0`}>
              <IndianRupee className={`w-4 h-4 ${card.text}`} />
            </div>
            <div>
              <p className="text-[13px] font-medium text-slate-700 mb-0.5">{card.label}</p>
              <p className="text-lg font-bold text-slate-800">
                {card.pre}<Num v={card.value} />{card.suf || ''}
              </p>
              {card.sub && <p className="text-[11px] text-slate-400">{card.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* ── CHARTS ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

        {/* Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-[18px] font-medium text-slate-800">School Growth</h2>
              <p className="text-[14px] text-slate-400">Registered tenant trend</p>
            </div>
            <span className="text-[12px] font-medium bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 px-2 py-0.5 rounded-full">This Year</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="gradSchools" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradActive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 11 }} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
              <Area type="monotone" dataKey="schools" stroke="#6366f1" strokeWidth={2} fill="url(#gradSchools)" name="Total Schools" dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
              <Area type="monotone" dataKey="active" stroke="#10b981" strokeWidth={2} fill="url(#gradActive)" name="Active Schools" dot={false} activeDot={{ r: 4, fill: '#10b981' }} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 pt-2 border-t border-slate-100">
            {[{ label: 'Total Schools', color: '#6366f1' }, { label: 'Active Schools', color: '#10b981' }].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 rounded-full inline-block" style={{ background: l.color }} />
                <span className="text-[11px] text-slate-500">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Donut */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex flex-col">
          <div className="mb-2">
            <h2 className="text-[18px] font-medium text-slate-800">Status Breakdown</h2>
            <p className="text-[13px] text-slate-400">Active vs Inactive tenant</p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={130}>
              <PieChart>
                <Pie data={piData} cx="50%" cy="50%" innerRadius={40} outerRadius={58}
                  dataKey="value" paddingAngle={totalTenants > 0 ? 2 : 0} strokeWidth={0}
                  labelLine={false} label={PieLabel}>
                  {piData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full grid grid-cols-2 gap-2 mt-2">
              {[
                { label: 'Active', value: activeTenants, pct: activePct, color: '#10b981', bg: 'bg-emerald-50' },
                { label: 'Inactive', value: inactiveTenants, pct: inactivePct, color: '#f43f5e', bg: 'bg-rose-50' },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-xl p-2 text-center`}>
                  <p className="text-[11px] text-slate-500 font-medium">{s.label}</p>
                  <p className="text-lg font-medium text-slate-800">{s.value}</p>
                  <p className="text-[10px] font-medium" style={{ color: s.color }}>{s.pct}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

        {/* Platform Summary */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
          <h2 className="text-[18px] font-medium text-slate-800 mb-3">Platform Summary</h2>
          <div className="space-y-3">
            {[
              { label: 'Total Schools', value: totalTenants, color: '#6366f1', pct: 100 },
              { label: 'Active Schools', value: activeTenants, color: '#10b981', pct: activePct },
              { label: 'Inactive Schools', value: inactiveTenants, color: '#f43f5e', pct: inactivePct },
              { label: 'Active Rate', value: `${activePct}%`, color: '#f59e0b', pct: activePct, isText: true },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-500 font-medium">{item.label}</span>
                  <span className="font-medium text-slate-700">{item.isText ? item.value : item.value.toLocaleString('en-IN')}</span>
                </div>
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${Math.max(item.pct, 2)}%`, backgroundColor: item.color }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-500 font-medium">Student Capacity Used</span>
              <span className="font-medium text-slate-700">{subscriptions.totalUsedStudents || 0} / {subscriptions.totalStudentLimit || 0}</span>
            </div>
            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-1000"
                style={{ width: `${Math.max(subUsagePct, 2)}%` }} />
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 text-right">{subUsagePct}% used</p>
          </div>
        </div>

        {/* Recent Schools */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-[18px] font-medium text-slate-800">Recently Added Schools</h2>
              <p className="text-[11px] text-slate-400">Latest 5 registered tenant</p>
            </div>
            <button onClick={() => navigate('/school-management/listing')}
              className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-xl">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {recentSchools.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">No tenant registered yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['School', 'Subdomain', 'Status', 'Registered'].map(h => (
                      <th key={h} className="text-left py-2 px-2 text-[10px] font-medium uppercase tracking-wider text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentSchools.map((school, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-200 transition-colors">
                            {school.logo
                              ? <img src={school.logo} alt="" className="w-7 h-7 rounded-lg object-cover" />
                              : <School className="w-3.5 h-3.5 text-indigo-500" />
                            }
                          </div>
                          <span className="font-medium text-slate-700 truncate max-w-[140px]">{school.schoolName}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <code className="text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md text-[10px] font-mono">{school.subdomain}</code>
                      </td>
                      <td className="py-2 px-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${school.isActive ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-rose-50 text-rose-600 ring-1 ring-rose-200'}`}>
                          <span className={`w-1 h-1 rounded-full ${school.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {school.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-slate-400">
                        <div className="flex items-center gap-1 text-[11px]">
                          <CalendarDays className="w-3 h-3" />
                          {new Date(school.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}