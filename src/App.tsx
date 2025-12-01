import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { GoogleMapsProvider } from './contexts/GoogleMapsContext'
import { RoutesDashboard } from './pages/RoutesDashboard'
import { RecordRoutePage } from './pages/RecordRoutePage'
import { ViewRoutePage } from './pages/ViewRoutePage'
import { ProfilePage } from './pages/ProfilePage'

function App() {
  return (
    <AuthProvider>
      <GoogleMapsProvider>
        <Router>
          <Routes>
            <Route path="/dashboard" element={<RoutesDashboard />} />
            <Route path="/record" element={<RecordRoutePage />} />
            <Route path="/routes/:id/view" element={<ViewRoutePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </GoogleMapsProvider>
    </AuthProvider>
  )
}

export default App
