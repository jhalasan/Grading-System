import { useState, useEffect } from 'react'
import './App.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import Dashboard from './assets/pages/Dashboard'
import Grades from './assets/pages/Grades'
import Logs from './assets/pages/Logs'
import TeacherMonitor from './assets/pages/TeacherMonitor'
import AdminPage from './assets/pages/Admin'
import LoginModal from './assets/components/LoginModal'
import { isAuthenticated, logout, getAuthenticatedUser } from './assets/services/authService'
import type { User } from './assets/types/User'

type Page = 'dashboard' | 'grades' | 'logs' | 'teacher-monitor' | 'admin'

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

  // Redirect teachers to grades page on login
  useEffect(() => {
    if (isLoggedIn && currentUser?.role === 'teacher' && currentPage === 'logs') {
      setCurrentPage('grades')
    }
  }, [isLoggedIn, currentUser?.role])

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

  const isAdmin = currentUser?.role === 'admin'
  const isTeacher = currentUser?.role === 'teacher'

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>Academic Grading System</h1>
        </div>
        <ul className="navbar-menu">
          {/* Dashboard - for admins and teachers */}
          {(isAdmin || isTeacher) && (
            <li>
              <button
                className={currentPage === 'dashboard' ? 'nav-btn active' : 'nav-btn'}
                onClick={() => setCurrentPage('dashboard')}
              >
                <i className="bi bi-speedometer2"></i>
                Dashboard
              </button>
            </li>
          )}
          
          {/* Grades - visible to all */}
          <li>
            <button
              className={currentPage === 'grades' ? 'nav-btn active' : 'nav-btn'}
              onClick={() => setCurrentPage('grades')}
            >
              <i className="bi bi-journal-text"></i>
              Grades
            </button>
          </li>
          
          {/* Activity Logs - only for admins */}
          {isAdmin && (
            <li>
              <button
                className={currentPage === 'logs' ? 'nav-btn active' : 'nav-btn'}
                onClick={() => setCurrentPage('logs')}
              >
                <i className="bi bi-clock-history"></i>
                Activity Logs
              </button>
            </li>
          )}
          
          {/* Teacher Monitor - only for admins */}
          {isAdmin && (
            <li>
              <button
                className={currentPage === 'teacher-monitor' ? 'nav-btn active' : 'nav-btn'}
                onClick={() => setCurrentPage('teacher-monitor')}
              >
                <i className="bi bi-people-fill"></i>
                Teacher Monitor
              </button>
            </li>
          )}
          
          {/* Admin Panel - only for admins */}
          {isAdmin && (
            <li>
              <button
                className={currentPage === 'admin' ? 'nav-btn active' : 'nav-btn'}
                onClick={() => setCurrentPage('admin')}
              >
                <i className="bi bi-shield-lock"></i>
                Admin Panel
              </button>
            </li>
          )}
          
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
        {/* Dashboard - admins and teachers */}
        {currentPage === 'dashboard' && (isAdmin || isTeacher) && <Dashboard currentUser={currentUser} />}
        
        {/* Grades - admins and teachers */}
        {currentPage === 'grades' && <Grades currentUser={currentUser} />}
        
        {/* Logs - admins only */}
        {currentPage === 'logs' && isAdmin && <Logs />}
        {currentPage === 'logs' && isTeacher && (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>Access Denied</h2>
            <p>Only admins can view activity logs.</p>
          </div>
        )}

        {/* Teacher Monitor - admins only */}
        {currentPage === 'teacher-monitor' && isAdmin && <TeacherMonitor />}
        {currentPage === 'teacher-monitor' && isTeacher && (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>Access Denied</h2>
            <p>Only admins can view teacher monitoring.</p>
          </div>
        )}

        {/* Admin Panel - admins only */}
        {currentPage === 'admin' && isAdmin && <AdminPage />}
        {currentPage === 'admin' && isTeacher && (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>Access Denied</h2>
            <p>Only admins can access the admin panel.</p>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>© 2026 Notre Dame University - Academic Grading System</p>
      </footer>
    </div>
  )
}

export default App
