import { useState } from 'react';
import { login } from '../services/authService';
import styles from './EditGradeModal.module.css';
import 'bootstrap-icons/font/bootstrap-icons.css'

interface LoginModalProps {
  onLoginSuccess: () => void;
}

export default function LoginModal({ onLoginSuccess }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    try {
      await login(email, password);
      onLoginSuccess();
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} style={{ background: 'linear-gradient(135deg, #0D6E46 0%, rgba(13, 110, 70, 0.9) 100%)' }}>
      <div className={styles.modal} style={{ maxWidth: '420px', boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: '#10B981',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '32px',
            color: 'white',
            boxShadow: '0 8px 16px rgba(16, 185, 129, 0.3)'
          }}>
            <i className="bi bi-mortarboard"></i>
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '28px', color: '#111827' }}>Welcome</h3>
          <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: 0 }}>
            Sign in to your teacher account
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="email" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
              <i className="bi bi-envelope" style={{ fontSize: '16px' }}></i>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="teacher@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              style={{ width: '100%' }}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
              <i className="bi bi-lock" style={{ fontSize: '16px' }}></i>
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              style={{ width: '100%' }}
            />
          </div>

          {error && (
            <div style={{
              color: '#DC2626',
              backgroundColor: '#FEE2E2',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px'
            }}>
              <i className="bi bi-exclamation-circle" style={{ flexShrink: 0, marginTop: '2px' }}></i>
              {error}
            </div>
          )}

          <div className={styles.buttonGroup} style={{ justifyContent: 'center', marginBottom: '16px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'linear-gradient(135deg, #0D6E46 0%, #10B981 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <i className={`bi ${loading ? 'bi-arrow-repeat' : 'bi-box-arrow-in-right'}`} style={{ fontSize: '16px' }}></i>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
