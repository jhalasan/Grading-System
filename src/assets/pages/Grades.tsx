import { useEffect, useState } from 'react';
import type { Grade } from '../types/Grade';
import { getAllGrades } from '../services/gradeServices';
import GradeTable from '../components/GradeTable';
import CreateGradeModal from '../components/CreateGradeModal';
import type { User } from '../types/User';
import 'bootstrap-icons/font/bootstrap-icons.css'

interface GradesProps {
  currentUser: User | null;
}

export default function Grades({ currentUser }: GradesProps) {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await getAllGrades();
      setGrades(records);
    } catch (err) {
      setError('Failed to load grades');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeCreated = (newGrade: Grade) => {
    setGrades([newGrade, ...grades]);
    setShowCreateModal(false);
  };

  const handleGradeUpdated = (updatedGrade: Grade) => {
    setGrades(grades.map(g => g.id === updatedGrade.id ? updatedGrade : g));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '32px' }}>Grades Management</h1>
          <p style={{ margin: 0, color: '#6B7280', fontSize: '14px' }}>
            <i className="bi bi-person-check" style={{ marginRight: '6px' }}></i>
            Logged in as: <strong>{currentUser?.name || 'Unknown'}</strong> · {currentUser?.role}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '12px 20px',
            background: 'linear-gradient(135deg, #0D6E46 0%, #10B981 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
          }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.4)';
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
          }}
        >
          <i className="bi bi-plus-lg" style={{ fontSize: '18px' }}></i>
          Add Grade
        </button>
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
        <p>Loading grades...</p>
      ) : (
        <>
          <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#e0f2fe', borderRadius: '8px', border: '1px solid #bae6fd' }}>
            <strong>Total Grades:</strong> {grades.length}
          </div>
          <GradeTable
            grades={grades}
            onGradeUpdated={handleGradeUpdated}
            onRefresh={fetchGrades}
            onDelete={fetchGrades}
          />
        </>
      )}

      {showCreateModal && (
        <CreateGradeModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleGradeCreated}
        />
      )}
    </div>
  );
}
