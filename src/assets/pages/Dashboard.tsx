import { useEffect, useState } from 'react';
import type { ActivityLog } from '../types/Log';
import type { User } from '../types/User';
import { getAllGrades } from '../services/gradeServices';
import { getActivityLogs } from '../services/logService';
import ActivityLogTable from '../components/ActivityLogTable';
import 'bootstrap-icons/font/bootstrap-icons.css'

interface DashboardProps {
  currentUser: User | null;
}

export default function Dashboard({ currentUser }: DashboardProps) {
  const [totalGrades, setTotalGrades] = useState(0);
  const [recentLogs, setRecentLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch grades count
        const gradesResult = await getAllGrades();
        setTotalGrades(gradesResult.length);

        // Fetch recent logs (last 10)
        const logs = await getActivityLogs();
        setRecentLogs(logs.slice(0, 10));
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '32px' }}>Dashboard</h1>
          <p style={{ margin: 0, color: '#6B7280', fontSize: '14px' }}>Welcome back, {currentUser?.name}</p>
        </div>
        <div style={{ 
          padding: '14px 20px', 
          backgroundColor: '#ECFDF5', 
          borderRadius: '12px', 
          border: '1px solid #D1FAE5',
          fontSize: '14px',
          fontWeight: '500',
          color: '#065F46'
        }}>
          <i className="bi bi-person-badge" style={{ marginRight: '8px', fontSize: '16px' }}></i>
          <strong>{currentUser?.name}</strong>
          <span style={{ color: '#6EE7B7', marginLeft: '8px' }}>· {currentUser?.role}</span>
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
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <i className="bi bi-hourglass-split" style={{ fontSize: '32px', color: '#10B981', animation: 'spin 1s linear infinite' }}></i>
          <p style={{ marginTop: '16px', color: '#6B7280' }}>Loading dashboard...</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            <StatCard 
              title="Total Grades" 
              value={totalGrades}
              icon="bi-journal-text"
              color="#10B981"
            />
            <StatCard 
              title="Recent Changes" 
              value={recentLogs.length}
              icon="bi-clock-history"
              color="#0EA5E9"
            />
          </div>

          <div style={{ marginTop: '40px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="bi bi-activity" style={{ fontSize: '24px', color: '#10B981' }}></i>
              Recent Activity
            </h2>
            <ActivityLogTable logs={recentLogs} />
          </div>
        </>
      )}
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) {
  return (
    <div style={{
      padding: '24px',
      border: '1px solid #E5E7EB',
      borderRadius: '12px',
      backgroundColor: '#FFFFFF',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s ease',
      cursor: 'default'
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 15px rgba(0, 0, 0, 0.1)';
      (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
      (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <p style={{ margin: 0, color: '#6B7280', fontSize: '14px', fontWeight: '600' }}>{title}</p>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          backgroundColor: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color,
          fontSize: '20px'
        }}>
          <i className={`bi ${icon}`}></i>
        </div>
      </div>
      <h3 style={{ margin: 0, fontSize: '36px', fontWeight: '700', color: '#111827' }}>{value}</h3>
    </div>
  );
}
