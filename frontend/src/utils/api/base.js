const envBase = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
const publicBase = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')

const defaultOrigin = (() => {
  if (typeof window === 'undefined') return 'http://127.0.0.1:3000'
  const { protocol, hostname } = window.location
  if (hostname.endsWith('github.io')) {
    return 'https://story-game-backup-2026-03-25.vercel.app/_/backend'
  }
  if (hostname.endsWith('vercel.app')) {
    return `${protocol}//${hostname}/_/backend`
  }
  return `${protocol}//${hostname || '127.0.0.1'}:3000`
})()

export const API_ORIGIN = envBase || defaultOrigin
export const API_BASE_URL = `${API_ORIGIN}/api`

export function apiUrl(path) {
  if (!path) return API_ORIGIN
  if (/^https?:\/\//.test(path)) return path
  return `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`
}

export function normalizeAssetUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//.test(url)) return url
  return apiUrl(url)
}

export function publicAssetUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path

  const [assetPath, query = ''] = String(path).split('?')
  const cleanPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`
  return `${publicBase}${cleanPath}${query ? `?${query}` : ''}`
}
