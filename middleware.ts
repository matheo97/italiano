import { next } from '@vercel/edge'

export const config = {
  matcher: ['/(.*)'],
}

export default function middleware(request: Request) {
  const user = process.env.BASIC_AUTH_USER
  const pass = process.env.BASIC_AUTH_PASSWORD

  // If env not configured, do not lock the site (local preview safety).
  if (!user || !pass) {
    return next()
  }

  const header = request.headers.get('authorization')
  if (header?.startsWith('Basic ')) {
    try {
      const decoded = atob(header.slice(6))
      const i = decoded.indexOf(':')
      const u = i >= 0 ? decoded.slice(0, i) : decoded
      const p = i >= 0 ? decoded.slice(i + 1) : ''
      if (u === user && p === pass) {
        return next()
      }
    } catch {
      // fall through to 401
    }
  }

  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Italiano", charset="UTF-8"',
      'Cache-Control': 'no-store',
    },
  })
}
