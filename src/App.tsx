import { useState, useEffect } from 'react'
import './App.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import Dashboard from './assets/pages/Dashboard'
import Grades from './assets/pages/Grades'
import Logs from './assets/pages/Logs'
import LoginModal from './assets/components/LoginModal'
import { isAuthenticated, logout, getAuthenticatedUser } from './assets/services/authService'
import type { User } from './assets/types/User'

type Page = 'dashboard' | 'grades' | 'logs'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated
    if (isAuthenticated()) {
      const user = getAuthenticatedUser()
      setCurrentUser(user)
      setIsLoggedIn(true)
    }
    setLoading(false)
  }, [])

  const handleLoginSuccess = () => {
    const user = getAuthenticatedUser()
    setCurrentUser(user)
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    logout()
    setIsLoggedIn(false)
    setCurrentUser(null)
    setCurrentPage('dashboard')
  }

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading...</div>
  }

  if (!isLoggedIn) {
    return <LoginModal onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>Academic Grading System</h1>
        </div>
        <ul className="navbar-menu">
          <li>
            <button
              className={currentPage === 'dashboard' ? 'nav-btn active' : 'nav-btn'}
              onClick={() => setCurrentPage('dashboard')}
            >
              <i className="bi bi-speedometer2"></i>
              Dashboard
            </button>
          </li>
          <li>
            <button
              className={currentPage === 'grades' ? 'nav-btn active' : 'nav-btn'}
              onClick={() => setCurrentPage('grades')}
            >
              <i className="bi bi-journal-text"></i>
              Grades
            </button>
          </li>
          <li>
            <button
              className={currentPage === 'logs' ? 'nav-btn active' : 'nav-btn'}
              onClick={() => setCurrentPage('logs')}
            >
              <i className="bi bi-clock-history"></i>
              Activity Logs
            </button>
          </li>
          <li className="navbar-user-info">
            <div className="navbar-user-text">
              <i className="bi bi-person-circle" style={{ fontSize: '16px' }}></i>
              <span>{currentUser?.name}</span>
              <span className="navbar-user-role">({currentUser?.role})</span>
            </div>
            <button
              className="nav-btn navbar-logout-btn"
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-right"></i>
              Logout
            </button>
          </li>
        </ul>
      </nav>


      <main className="main-content">
        {currentPage === 'dashboard' && <Dashboard currentUser={currentUser} />}
        {currentPage === 'grades' && <Grades currentUser={currentUser} />}
        {currentPage === 'logs' && <Logs />}
      </main>

      <footer className="footer">
        <p>© 2026 Notre Dame University - Academic Grading System</p>
      </footer>
    </div>
  )
}

export default App
