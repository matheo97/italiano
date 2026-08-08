import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider } from './lib/store'
import { HomePage } from './pages/HomePage'
import { PacksPage } from './pages/PacksPage'
import { SettingsPage } from './pages/SettingsPage'
import { StudyPage } from './pages/StudyPage'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="shell">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/packs" element={<PacksPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/study/:pack/:mode" element={<StudyPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AppProvider>
  )
}
