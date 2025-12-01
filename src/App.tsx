import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { CreateJourneyPage } from './pages/CreateJourneyPage'
import { ViewJourneyPage } from './pages/ViewJourneyPage'
import { EditJourneyPage } from './pages/EditJourneyPage'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/journey/new" element={<ProtectedRoute><CreateJourneyPage /></ProtectedRoute>} />
          <Route path="/journey/:id" element={<ProtectedRoute><ViewJourneyPage /></ProtectedRoute>} />
          <Route path="/journey/:id/edit" element={<ProtectedRoute><EditJourneyPage /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
