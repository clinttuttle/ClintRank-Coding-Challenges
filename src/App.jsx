import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ChallengeList from './pages/ChallengeList'
import ChallengePage from './pages/ChallengePage'
import AdminLogin from './pages/AdminLogin'
import AdminPanel from './pages/AdminPanel'

function PrivateRoute({ children }) {
  return localStorage.getItem('admin_token') ? children : <Navigate to="/admin/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChallengeList />} />
        <Route path="/challenges/:id" element={<ChallengePage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<PrivateRoute><AdminPanel /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
