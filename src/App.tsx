import { useState, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider } from './lib/store'
import { isLoggedIn } from './lib/auth'
import { HomePage } from './pages/HomePage'
import { PacksPage } from './pages/PacksPage'
import { SettingsPage } from './pages/SettingsPage'
import { StudyPage } from './pages/StudyPage'
import { LoginPage } from './pages/LoginPage'

function RequireAuth({
  authed,
  children,
}: {
  authed: boolean
  children: ReactNode
}) {
  if (!authed) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const [authed, setAuthed] = useState(() => isLoggedIn())

  return (
    <AppProvider>
      <BrowserRouter>
        <div className={`shell ${authed ? '' : 'shell-auth'}`}>
          <Routes>
            <Route
              path="/login"
              element={
                authed ? (
                  <Navigate to="/" replace />
                ) : (
                  <LoginPage onSuccess={() => setAuthed(true)} />
                )
              }
            />
            <Route
              path="/"
              element={
                <RequireAuth authed={authed}>
                  <HomePage />
                </RequireAuth>
              }
            />
            <Route
              path="/packs"
              element={
                <RequireAuth authed={authed}>
                  <PacksPage />
                </RequireAuth>
              }
            />
            <Route
              path="/settings"
              element={
                <RequireAuth authed={authed}>
                  <SettingsPage onLogout={() => setAuthed(false)} />
                </RequireAuth>
              }
            />
            <Route
              path="/study/:pack/:mode"
              element={
                <RequireAuth authed={authed}>
                  <StudyPage />
                </RequireAuth>
              }
            />
            <Route
              path="*"
              element={<Navigate to={authed ? '/' : '/login'} replace />}
            />
          </Routes>
        </div>
      </BrowserRouter>
    </AppProvider>
  )
}
