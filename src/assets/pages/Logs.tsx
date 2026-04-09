import { useEffect, useState } from 'react';
import type { ActivityLog } from '../types/Log';
import { getActivityLogs } from '../services/logService';
import ActivityLogTable from '../components/ActivityLogTable';
import 'bootstrap-icons/font/bootstrap-icons.css'

export default function Logs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getActivityLogs();
      setLogs(data);
    } catch (err) {
      setError('Failed to load activity logs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h1 style={{ margin: '0 0 12px 0', fontSize: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <i className="bi bi-clock-history" style={{ fontSize: '28px', color: '#10B981' }}></i>
              Activity Logs
            </h1>
            <p style={{ margin: 0, color: '#6B7280', fontSize: '14px' }}>
              <i className="bi bi-info-circle" style={{ marginRight: '6px' }}></i>
              All changes to grades are tracked here. Monitor who made what changes and when.
            </p>
          </div>
          <button
            onClick={fetchLogs}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#10B981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600
            }}
          >
            <i className="bi bi-arrow-clockwise" style={{ fontSize: '16px' }}></i>
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          color: '#DC2626',
          marginBottom: '20px',
          padding: '14px 16px',
          backgroundColor: '#FEE2E2',
          borderRadius: '12px',
          border: '1px solid #FECACA',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          <i className="bi bi-exclamation-circle" style={{ marginTop: '2px', fontSize: '18px', flexShrink: 0 }}></i>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <i className="bi bi-hourglass-split" style={{ fontSize: '32px', color: '#10B981', animation: 'spin 1s linear infinite' }}></i>
          <p style={{ marginTop: '16px', color: '#6B7280' }}>Loading activity logs...</p>
        </div>
      ) : (
        <ActivityLogTable logs={logs} />
      )}
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
