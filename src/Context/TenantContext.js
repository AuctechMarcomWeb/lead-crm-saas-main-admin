/* eslint-disable prettier/prettier */
import React, { createContext, useContext, useEffect, useState } from 'react'

const TenantContext = createContext()

// Routes that should NOT be treated as subdomains
const KNOWN_ROUTES = [
  'login', 'register', '404', '500', 'dashboard',
  'school-management', 'subscription-plans', 'addon-plans',
  'subscription-history', 'support',
]

/**
 * Reads subdomain ONLY from:
 * 1. hostname subdomain → adityapublicschoo9157.localhost:5004
 * 2. localStorage (set explicitly after login)
 * NOT from URL path (to avoid treating route names as subdomains)
 */
const getSubdomainFromURL = () => {
  // Subdomain-based: subdomain.localhost or subdomain.domain.com
  const host = window.location.hostname
  const parts = host.split('.')
  if (parts.length >= 2 && parts[0] !== 'localhost' && parts[0] !== 'www') {
    return parts[0]
  }
  return null
}

export const TenantProvider = ({ children }) => {
  const [subdomain, setSubdomain] = useState(() => {
    const fromURL = getSubdomainFromURL()
    if (fromURL) return fromURL
    const stored = localStorage.getItem('x-tenant-id') || ''
    // Don't use stored value if it looks like a route name
    if (stored && !KNOWN_ROUTES.includes(stored)) return stored
    return null
  })

  const saveTenant = (sub) => {
    setSubdomain(sub)
    localStorage.setItem('x-tenant-id', sub)
  }

  const clearTenant = () => {
    setSubdomain(null)
    localStorage.removeItem('x-tenant-id')
  }

  return (
    <TenantContext.Provider value={{ subdomain, saveTenant, clearTenant }}>
      {children}
    </TenantContext.Provider>
  )
}

export const useTenant = () => useContext(TenantContext)
