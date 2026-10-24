
import React, { useContext, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { CContainer, CHeader, CHeaderNav, CHeaderToggler } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilMenu } from '@coreui/icons'

import { AppHeaderDropdown } from './header/index'
import Notification from './header/Notification'

const AppHeader = () => {
  const headerRef = useRef()

  const dispatch = useDispatch()
  const sidebarShow = useSelector((state) => state.sidebarShow)


  return (
    <CHeader position="sticky" className="p-0" ref={headerRef}>
      <CContainer
        fluid
        className="border-bottom px-4 d-flex align-items-center justify-content-between"
        style={{ backgroundColor: '#042954', color: 'white' }}
      >
        {/* LEFT */}
        <div className="d-flex align-items-center gap-3">
          <CHeaderToggler
            onClick={() => dispatch({ type: 'set', sidebarShow: !sidebarShow })}
            style={{ marginInlineStart: '-14px' }}
          >
            <CIcon icon={cilMenu} style={{ color: 'white' }} size="lg" />
          </CHeaderToggler>
        </div>

        {/* RIGHT */}
        <CHeaderNav className="d-flex align-items-center gap-3">
          

          {/* PROFILE + NOTIFICATION */}
        
          <AppHeaderDropdown />
            <Notification />
        </CHeaderNav>
      </CContainer>
    </CHeader>
  )
}

export default AppHeader

