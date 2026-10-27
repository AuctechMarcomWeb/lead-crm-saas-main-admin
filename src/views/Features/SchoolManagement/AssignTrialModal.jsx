import React, { useState, useEffect } from 'react'
import { Gift, Zap, Loader2, Clock, CheckCircle, XCircle } from 'lucide-react'
import { Modal, Switch } from 'antd'
import toast from 'react-hot-toast'
import { getRequest, postRequest } from '../../../Helpers'

/* ── Reusable UI helpers (same pattern as subscriptionAddModal) ── */
const SectionHeader = ({ title }) => (
  <div style={{ backgroundColor: '#0c3b73' }} className="px-4 py-2 rounded-t-md">
    <span className="text-sm font-semibold text-white tracking-wide">{title}</span>
  </div>
)

const SectionBody = ({ children }) => (
  <div className="border border-gray-200 rounded-b-md p-4 mb-5">{children}</div>
)

/* ── Package Option Card ── */
const PackageCard = ({ pkg, selected, onSelect }) => (
  <div
    onClick={() => onSelect(pkg._id)}
    className={`border rounded-lg p-3 cursor-pointer transition-all ${
      selected
        ? 'border-[#0c3b73] bg-blue-50 ring-1 ring-[#0c3b73]'
        : 'border-gray-200 hover:border-gray-300 bg-white'
    }`}
  >
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-800 truncate">{pkg.name}</span>
          {pkg.isDefault && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
              ★ Default
            </span>
          )}
        </div>
        {pkg.description && (
          <p className="text-[11px] text-gray-400 mt-0.5 truncate">{pkg.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <span className="flex items-center gap-1 text-[11px] text-gray-600 font-medium">
            <Clock size={11} className="text-[#0c3b73]" />
            {pkg.durationDays} days
          </span>
          <span className="flex items-center gap-1 text-[11px] font-medium">
            {pkg.eligibleOnce ? (
              <>
                <CheckCircle size={11} className="text-orange-500" />
                <span className="text-orange-600">One-time only</span>
              </>
            ) : (
              <>
                <XCircle size={11} className="text-green-500" />
                <span className="text-green-600">Multiple allowed</span>
              </>
            )}
          </span>
        </div>
        {pkg.features?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {pkg.features.slice(0, 3).map((f, i) => (
              <span key={i} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                {f}
              </span>
            ))}
            {pkg.features.length > 3 && (
              <span className="text-[10px] text-gray-400">+{pkg.features.length - 3} more</span>
            )}
          </div>
        )}
      </div>
      {/* Radio dot */}
      <div
        className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
          selected ? 'border-[#0c3b73] bg-[#0c3b73]' : 'border-gray-300'
        }`}
      >
        {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
      </div>
    </div>
  </div>
)

/* ════════════════════════════════════════════════
   ASSIGN TRIAL MODAL
════════════════════════════════════════════════ */
const AssignTrialModal = ({ open, school: agency, onClose, onSuccess }) => {
  const [packages, setPackages] = useState([])
  const [pkgLoading, setPkgLoading] = useState(false)
  const [selectedPkg, setSelectedPkg] = useState(null)
  const [force, setForce] = useState(false)
  const [assigning, setAssigning] = useState(false)

  /* ── Load active packages when modal opens ── */
  useEffect(() => {
    if (!open) return
    setSelectedPkg(null)
    setForce(false)
    setPkgLoading(true)
    getRequest('free-trial-packages?isActive=true&isPagination=false')
      .then((res) => setPackages(res?.data?.data?.packages || []))
      .catch(() => toast.error('Failed to load trial packages'))
      .finally(() => setPkgLoading(false))
  }, [open])

  if (!agency) return null

  const chosen = packages.find((p) => p._id === selectedPkg)

  const handleAssign = async () => {
    if (!selectedPkg) {
      toast.error('Please select a trial package')
      return
    }
    setAssigning(true)
    try {
      await postRequest({
        url: `free-trial-packages/${selectedPkg}/assign/${agency._id}`,
        cred: { force },
      })
      toast.success(
        `Trial "${chosen?.name}" assigned to "${agency.agencyName || agency.schoolName || agency.name}" successfully`,
      )
      onSuccess?.()
      onClose()
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to assign trial'
      toast.error(msg)
      if (msg.toLowerCase().includes('already used')) {
        toast('Tip: Enable "Force Override" to bypass the one-time restriction', {
          icon: '💡',
          duration: 4000,
        })
      }
    } finally {
      setAssigning(false)
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={540}
      destroyOnClose
      styles={{ header: { borderBottom: '1px solid #f1f5f9', paddingBottom: 12 } }}
      title={
        <div className="flex items-center gap-3">
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#0c3b73',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Gift size={18} color="#fff" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 leading-tight m-0">
              Assign Free Trial
            </p>
            <p className="text-xs text-gray-400 font-normal mt-0.5 m-0">
              Select a trial package to assign to this Agency
            </p>
          </div>
        </div>
      }
    >
      <div className="max-h-[72vh] overflow-y-auto pr-1 mt-3">
        {/* ── School Info ── */}
        <SectionHeader title="Agency" />
        <SectionBody>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {agency.logo ? (
                <img src={agency.logo} alt="" className="w-full h-full object-contain p-0.5" />
              ) : (
                <span className="text-xs font-bold text-[#0c3b73]">
                  {(agency.agencyName || agency.schoolName || agency.name || 'AG')
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {agency.agencyName || agency.schoolName || agency.name}
              </p>
              <p className="text-[11px] text-gray-400 font-mono">{agency.subdomain}</p>
            </div>
            <span
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                agency.isActive
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-600 border border-red-200'
              }`}
            >
              {agency.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          {agency.planStatus && (
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <Zap size={12} className="text-[#0c3b73]" />
              Current subscription status:
              <span className="font-semibold text-gray-700">{agency.planStatus}</span>
              {agency.planName && <span className="text-gray-400">({agency.planName})</span>}
            </div>
          )}
        </SectionBody>

        {/* ── Package Selection ── */}
        <SectionHeader title="Select Trial Package" />
        <SectionBody>
          {pkgLoading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Loading packages…</span>
            </div>
          ) : packages.length === 0 ? (
            <div className="text-center py-6 text-sm text-gray-400">
              No active trial packages found.
              <br />
              <span className="text-xs">Create one from the Free Trial Packages section.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {packages.map((pkg) => (
                <PackageCard
                  key={pkg._id}
                  pkg={pkg}
                  selected={selectedPkg === pkg._id}
                  onSelect={setSelectedPkg}
                />
              ))}
            </div>
          )}
        </SectionBody>

        {/* ── Options ── */}
        <SectionHeader title="Options" />
        <SectionBody>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-700 leading-tight">Force Override</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Enable this if the Agency has already used this trial package. It bypasses the
                "one-time eligibility" restriction.
              </p>
            </div>
            <Switch
              checked={force}
              onChange={setForce}
              checkedChildren="On"
              unCheckedChildren="Off"
            />
          </div>
        </SectionBody>

        {/* ── Summary ── */}
        {chosen && (
          <>
            <SectionHeader title="Assignment Summary" />
            <SectionBody>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                {[
                  ['Agency', agency.agencyName || agency.schoolName || agency.name],
                  ['Package', chosen.name],
                  ['Duration', `${chosen.durationDays} days`],
                  ['One-Time', chosen.eligibleOnce ? 'Yes (once only)' : 'No'],
                  ['Force Override', force ? 'Yes' : 'No'],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between py-1 border-b border-gray-50 text-xs"
                  >
                    <span className="text-gray-400">{k}</span>
                    <span className="font-semibold text-gray-800 text-right">{v}</span>
                  </div>
                ))}
              </div>
            </SectionBody>
          </>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-gray-100">
        <button
          onClick={onClose}
          className="px-5 py-2 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          onClick={handleAssign}
          disabled={assigning || pkgLoading || !selectedPkg}
          className="px-6 py-2 text-sm rounded bg-[#0c3b73] text-white hover:bg-[#0a2f5c] transition flex items-center gap-2 disabled:opacity-60 font-semibold"
        >
          {assigning && <Loader2 size={14} className="animate-spin" />}
          {assigning ? 'Assigning…' : 'Assign Trial'}
        </button>
      </div>
    </Modal>
  )
}

export default AssignTrialModal
