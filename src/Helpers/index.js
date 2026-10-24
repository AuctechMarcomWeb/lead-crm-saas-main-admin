import { deleteCookie } from '../Hooks/cookie'
import axios from 'axios'
import Cookies from 'js-cookie'
import { confirmDialog } from 'primereact/confirmdialog'

// ── Base URL ──────────────────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_BASE_URL

// ── Static token export (for legacy use) ─────────────────────────────────────
export const token = Cookies.get('multitenant')

/* ─── Central 401 handler ────────────────────────────────────────────────────
   Logout only when:
   1. Server actually responded (not a network error)
   2. Status is exactly 401
   3. Cookie still exists (prevents double-logout loop)
   4. NOT a data/resource API — those fail silently
─────────────────────────────────────────────────────────────────────────────*/
const SILENT_401_PATTERNS = [
  /subscription/,
  /session-billing/,
  /monthly-billing/,
  /installment/,
  /schools\//,
  /pricing-config/,
]

const isSilent401 = (url = '') =>
  SILENT_401_PATTERNS.some((p) => p.test(url))

const handle401 = (error, url = '') => {
  const status = error?.response?.status
  if (status === 401 && Cookies.get('multitenant') && !isSilent401(url)) {
    deleteCookie('multitenant')
    console.error('Session expired — logging out')
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }
}

// ── Build common headers ──────────────────────────────────────────────────────
const getHeaders = () => {
  const tok = Cookies.get('multitenant')
  const headers = {}
  if (tok) headers['Authorization'] = `Bearer ${tok}`
  return headers
}

// ── Axios instance ────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
})

// Inject fresh auth headers before every request
api.interceptors.request.use((config) => {
  config.headers = {
    ...config.headers,
    ...getHeaders(),
  }
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    handle401(err, err?.config?.url || '')
    return Promise.reject(err)
  },
)

// ── Authenticated request helpers ─────────────────────────────────────────────

export const request = ({ method, url, cred }) =>
  api[method](url, cred)

export const getRequest = (url) =>
  api.get(url)

export const postRequest = ({ url, cred }) =>
  api.post(url, cred)

export const putRequest = ({ url, cred }) =>
  api.put(url, cred)

export const patchRequest = ({ url, cred }) =>
  api.patch(url, cred)

export const deleteRequest = (url) =>
  api.delete(url)

export const deleteRequest1 = async (url) => {
  const confirmed = await confirmDeletion('Are you sure you want to delete this item?')
  if (!confirmed) throw new Error('Deletion cancelled')
  return api.delete(url)
}

export const fileUpload = ({ url, cred }) =>
  api.post(url, cred, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

// ── No-token helpers (public endpoints) ──────────────────────────────────────

const publicApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
})

export const noTokenGetRequest = (url) =>
  publicApi.get(url)

export const noTokenPostRequest = ({ url, cred }) =>
  publicApi.post(url, cred)

export const noTokenPutRequest = ({ url, cred }) =>
  publicApi.put(url, cred)

export const noTokenPatchRequest = ({ url, cred }) =>
  publicApi.patch(url, cred)

export const noTokenDeleteRequest = (url) =>
  publicApi.delete(url)

export const noTokenfileUpload = ({ url, cred }) =>
  publicApi.post(url, cred, {
    responseType: 'arraybuffer',
    headers: { 'Content-Type': 'multipart/form-data' },
  })

// ── Helpers ───────────────────────────────────────────────────────────────────

const confirmDeletion = (message) =>
  new Promise((resolve) => {
    confirmDialog({
      message,
      header: 'Confirm Deletion',
      icon: 'warning',
      acceptClassName: 'p-button-danger',
      acceptText: 'Delete',
      accept: () => resolve(true),
      reject: () => resolve(false),
    })
  })
