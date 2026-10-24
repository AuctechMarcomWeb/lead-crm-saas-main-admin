/* eslint-disable prettier/prettier */
/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
import { useState, useRef, forwardRef, useEffect, useImperativeHandle, useContext } from 'react'
import { Modal, Button, message } from 'antd'

import BasicInformation from './enrolmentModal/BasicInformation'
import SchoolInformation from './enrolmentModal/SchoolInformation'
import ConcessionAndTransport from './enrolmentModal/ConcessionAndTransport'
import { postRequest, putRequest } from '../Helpers'
import { SessionContext } from '../Context/Seesion'

// ── Tab config (defined outside so it never re-creates on render) ─────────────
const TABS = [
  { key: 'basic',  label: 'Basic Information'  },
  { key: 'school', label: 'School Information' },
  { key: 'other',  label: 'Other Information'  },
]

// ─────────────────────────────────────────────────────────────────────────────

const EnrollmentFormModal = forwardRef(
  ({ isModalOpen, setIsModalOpen, modalData, setModalData, onSuccess }, ref) => {

    const { currentSession } = useContext(SessionContext)

    const [activeTab,  setActiveTab]  = useState('basic')
    const [submitting, setSubmitting] = useState(false)

    // basicData is passed from BasicInformation → SchoolInformation
    // so SchoolInformation can pre-fill the "Current Class" field
    const [basicData, setBasicData] = useState(null)

    // Refs give us access to each tab's validateAndGetData() method
    const basicRef      = useRef()
    const schoolRef     = useRef()
    const concessionRef = useRef()

    const refByTab = { basic: basicRef, school: schoolRef, other: concessionRef }

    // ── Expose open/close to parent via ref ───────────────────────────────────
    useImperativeHandle(ref, () => ({
      openModal:  () => setIsModalOpen(true),
      closeModal: () => handleClose(),
    }))

    // ── Reset everything when modal closes ────────────────────────────────────
    const handleClose = () => {
      setIsModalOpen(false)
      setModalData(null)
      setBasicData(null)
      setActiveTab('basic')
    }

    // ── Warn if session is not loaded yet ─────────────────────────────────────
    useEffect(() => {
      if (isModalOpen && !currentSession?._id) {
        message.warning('Session is loading, please wait...')
      }
    }, [isModalOpen, currentSession])

    // ── Validate current tab, then move to the requested tab ─────────────────
    // Backward navigation (e.g. school → basic) is always allowed without validation.
    const goToTab = (targetTab) => {
      const currentIndex = TABS.findIndex((t) => t.key === activeTab)
      const targetIndex  = TABS.findIndex((t) => t.key === targetTab)

      // Going back — no validation needed
      if (targetIndex < currentIndex) {
        setActiveTab(targetTab)
        return
      }

      // Going forward — validate the current tab first
      const result = refByTab[activeTab]?.current?.submitForm()
      if (!result?.valid) {
        message.error('Please fill all required fields before proceeding')
        return
      }

      setActiveTab(targetTab)
    }

    const goNext = () => {
      const currentIndex = TABS.findIndex((t) => t.key === activeTab)
      const nextTab      = TABS[currentIndex + 1]?.key
      if (nextTab) goToTab(nextTab)
    }

    // ── Final submit — validate all tabs, then call the API ──────────────────
    const handleSubmit = async () => {
      const basic      = basicRef.current?.submitForm()
      const school     = schoolRef.current?.submitForm()
      const concession = concessionRef.current?.submitForm()

      if (!basic?.valid || !school?.valid || !concession?.valid) {
        message.error('Please fill all required fields before submitting')
        return
      }

      if (!currentSession?._id) {
        message.error('Session not available. Please wait and try again.')
        return
      }

      const payload = {
        ...basic.data,
        ...school.data,
        ...concession.data,
        session: currentSession._id,
      }

      setSubmitting(true)
      try {
        let apiRes
        if (modalData?._id) {
          // Edit mode
          const res = await putRequest({ url: `studentEnrollment/${modalData._id}`, cred: payload })
          apiRes = res?.data
        } else {
          // Add mode
          const res = await postRequest({ url: 'studentEnrollment', cred: payload })
          apiRes = res?.data
        }

        if (apiRes?.success) {
          message.success(
            apiRes?.message || (modalData?._id ? 'Student updated successfully' : 'Student enrolled successfully')
          )
          onSuccess?.()
          setTimeout(handleClose, 300)
        } else {
          message.error(apiRes?.message || 'Operation failed')
        }
      } catch (err) {
        console.error('Enrollment error:', err)
        message.error(err?.response?.data?.message || 'Something went wrong. Please try again.')
      } finally {
        setSubmitting(false)
      }
    }

    // ── Derived values ────────────────────────────────────────────────────────
    const isLastTab      = activeTab === TABS[TABS.length - 1].key
    const modalTitle     = modalData ? 'Edit Student Enrollment' : 'Student Enrollment'
    const currentTabIndex = TABS.findIndex((t) => t.key === activeTab)

    // ── Render ────────────────────────────────────────────────────────────────
    return (
      <Modal
        title={modalTitle}
        open={isModalOpen}
        onCancel={handleClose}
        footer={null}
        width={1000}
        className="max-h-[720px] overflow-y-auto"
      >

        {/* ── Tab bar + session badge ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #dee2e6',
            marginBottom: 12,
          }}
        >
          {/* Tabs */}
          <ul className="nav nav-tabs" style={{ borderBottom: 'none' }}>
            {TABS.map(({ key, label }, index) => (
              <li className="nav-item" key={key}>
                <button
                  type="button"
                  // Allow clicking tabs that are at or before the current tab.
                  // Forward tabs require going through Next (so validation runs).
                  onClick={() => index <= currentTabIndex ? setActiveTab(key) : goToTab(key)}
                  className={`nav-link !text-[#0c3b73] ${activeTab === key ? 'active' : ''}`}
                  style={{ fontSize: 13 }}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>

          {/* Session badge */}
          <div style={{ fontSize: 13 }}>
            <strong>Session:</strong>{' '}
            {currentSession
              ? <span style={{ color: '#0c3b73' }}>{currentSession.sessionName}</span>
              : <span style={{ color: 'red' }}>Not Available</span>
            }
          </div>
        </div>

        {/* ── Tab panels (mount all, show/hide via CSS to preserve state) ── */}
        <div style={{ display: activeTab === 'basic'  ? 'block' : 'none' }}>
          <BasicInformation ref={basicRef} modalData={modalData} onChange={setBasicData} />
        </div>

        <div style={{ display: activeTab === 'school' ? 'block' : 'none' }}>
          <SchoolInformation ref={schoolRef} modalData={modalData} basicData={basicData} />
        </div>

        <div style={{ display: activeTab === 'other'  ? 'block' : 'none' }}>
          <ConcessionAndTransport ref={concessionRef} modalData={modalData} />
        </div>

        {/* ── Footer ── */}
        <div className="text-end mt-4" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={handleClose}>
            Cancel
          </Button>

          {isLastTab ? (
            // On the last tab: show the final Submit / Update button
            <Button
              type="primary"
              className="!bg-[#0c3b73]"
              onClick={handleSubmit}
              loading={submitting}
              disabled={submitting}
            >
              {modalData ? 'Update' : 'Submit'}
            </Button>
          ) : (
            // On any other tab: show Next to validate and advance
            <Button
              type="primary"
              className="!bg-[#0c3b73]"
              onClick={goNext}
            >
              Next →
            </Button>
          )}
        </div>

      </Modal>
    )
  }
)

export default EnrollmentFormModal
