const AUTH_KEY = 'italiano_auth_v1'

const EMAIL = (
  import.meta.env.VITE_AUTH_EMAIL as string | undefined
)?.trim() || 'mathiusjordan97@gmail.com'

const PASSWORD = (
  import.meta.env.VITE_AUTH_PASSWORD as string | undefined
)?.trim() || 'sZH7V163xVAT3d'

export function isLoggedIn(): boolean {
  try {
    return localStorage.getItem(AUTH_KEY) === '1'
  } catch {
    return false
  }
}

export function login(email: string, password: string): boolean {
  const ok =
    email.trim().toLowerCase() === EMAIL.toLowerCase() &&
    password === PASSWORD
  if (!ok) return false
  try {
    localStorage.setItem(AUTH_KEY, '1')
  } catch {
    // ignore quota
  }
  return true
}

export function logout(): void {
  try {
    localStorage.removeItem(AUTH_KEY)
  } catch {
    // ignore
  }
}
