import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { DashboardPage } from './pages/DashboardPage'
import { CreateJourneyPage } from './pages/CreateJourneyPage'
import { ViewJourneyPage } from './pages/ViewJourneyPage'
import { EditJourneyPage } from './pages/EditJourneyPage'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/journey/new" element={<CreateJourneyPage />} />
          <Route path="/journey/:id" element={<ViewJourneyPage />} />
          <Route path="/journey/:id/edit" element={<EditJourneyPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
