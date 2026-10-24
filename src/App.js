/* eslint-disable prettier/prettier */
import React, { Suspense, useEffect } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { CSpinner } from '@coreui/react'
import { ConfigProvider } from 'antd'
import './scss/style.scss'
import './App.css'
// import "./scss/examples.scss";
import { Toaster } from 'react-hot-toast'
import ScrollToTop from './components/ScrollToTop'
import ProtectedRoute from './components/ProtectedRoute'
// Containers
const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'))
// Pages
const Login = React.lazy(() => import('./views/pages/login/Login'))
const Register = React.lazy(() => import('./views/pages/register/Register'))
const Page404 = React.lazy(() => import('./views/pages/page404/Page404'))
const Page500 = React.lazy(() => import('./views/pages/page500/Page500'))

/* ── Brand theme — matches SAAS-ADMIN-FRONTEND ── */
const antTheme = {
  token: {
    colorPrimary: '#0c3b73',
    colorPrimaryHover: '#0a2f5c',
    colorPrimaryActive: '#08254a',
    colorLink: '#0c3b73',
    colorLinkHover: '#0a2f5c',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 13,
    borderRadius: 6,
  },
  components: {
    Button: {
      colorPrimary: '#0c3b73',
      colorPrimaryHover: '#0a2f5c',
      colorPrimaryActive: '#08254a',
      primaryColor: '#ffffff',
    },
    Table: {
      headerBg: '#e5e7eb',
      headerColor: '#374151',
      headerSortActiveBg: '#d1d5db',
      headerFilterHoverBg: '#d1d5db',
      rowHoverBg: '#f9fafb',
      fontSize: 13,
    },
    Select: {
      colorPrimary: '#0c3b73',
      colorPrimaryHover: '#0a2f5c',
    },
    Pagination: {
      colorPrimary: '#0c3b73',
      colorPrimaryHover: '#0a2f5c',
    },
    Switch: {
      colorPrimary: '#0c3b73',
      colorPrimaryHover: '#0a2f5c',
    },
    Input: {
      colorPrimary: '#0c3b73',
      activeBorderColor: '#0c3b73',
      hoverBorderColor: '#0a2f5c',
    },
    DatePicker: {
      colorPrimary: '#0c3b73',
      activeBorderColor: '#0c3b73',
    },
    Tabs: {
      inkBarColor: '#0c3b73',
      itemActiveColor: '#0c3b73',
      itemSelectedColor: '#0c3b73',
      itemHoverColor: '#0a2f5c',
    },
  },
}

const App = () => {
  return (
    <ConfigProvider theme={antTheme}>
      <>
      <div>
        <Toaster />
      </div>
      <BrowserRouter>
        <ScrollToTop />
        <Suspense
          fallback={
            <div className="pt-3 text-center">
              <CSpinner color="primary" variant="grow" />
            </div>
          }
        >
          <Routes>
            <Route exact path="/login" name="Login Page" element={<Login />} />
            <Route exact path="/register" name="Register Page" element={<Register />} />
            <Route exact path="/404" name="Page 404" element={<Page404 />} />
            <Route exact path="/500" name="Page 500" element={<Page500 />} />
            <Route path="*" name="Home" element={<DefaultLayout />} />
            {/* <Route
              path="*"
              element={
                <ProtectedRoute>
                  <DefaultLayout />
                </ProtectedRoute>
              }
            /> */}
          </Routes>
        </Suspense>
      </BrowserRouter>
      </>
    </ConfigProvider>
  )
}

export default App
