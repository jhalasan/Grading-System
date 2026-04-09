import { useState } from 'react';
import type { Grade } from '../types/Grade';
import { updateGrade } from '../services/gradeServices';
import { getCurrentUserId } from '../services/pocketbase';
import styles from './EditGradeModal.module.css';
import 'bootstrap-icons/font/bootstrap-icons.css'

interface EditGradeModalProps {
  grade: Grade;
  onClose: () => void;
  onSave: (grade: Grade) => void;
}

export default function EditGradeModal({ grade, onClose, onSave }: EditGradeModalProps) {
  const [gradeValue, setGradeValue] = useState(grade.grade_value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStudentName = (): string => {
    if (grade.expand?.student_id?.student_name) {
      return grade.expand.student_id.student_name;
    }
    return 'Unknown Student';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (gradeValue < 0 || gradeValue > 100) {
      setError('Grade must be between 0 and 100');
      return;
    }

    if (gradeValue === grade.grade_value) {
      onClose();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const currentUserId = getCurrentUserId();
      const updatedGrade = await updateGrade(grade.id, gradeValue, currentUserId);
      onSave(updatedGrade as Grade);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to update grade. Please try again.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: '#10B981',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '20px'
          }}>
            <i className="bi bi-pencil-square"></i>
          </div>
          <h3 style={{ margin: 0, fontSize: '20px' }}>Edit Grade</h3>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
              <i className="bi bi-person-badge" style={{ color: '#10B981' }}></i>
              Student
            </label>
            <div style={{ padding: '10px', backgroundColor: '#F9FAFB', borderRadius: '6px', color: '#6B7280' }}>
              {getStudentName()}
            </div>
          </div>
          <div className={styles.formGroup}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
              <i className="bi bi-book" style={{ color: '#10B981' }}></i>
              Course
            </label>
            <div style={{ padding: '10px', backgroundColor: '#F9FAFB', borderRadius: '6px', color: '#6B7280' }}>
              {grade.expand?.student_id?.course || '-'}
            </div>
          </div>
          <div className={styles.formGroup}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
              <i className="bi bi-grid-3x2" style={{ color: '#10B981' }}></i>
              Section
            </label>
            <div style={{ padding: '10px', backgroundColor: '#F9FAFB', borderRadius: '6px', color: '#6B7280' }}>
              {grade.expand?.student_id?.section || '-'}
            </div>
          </div>
          <div className={styles.formGroup}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
              <i className="bi bi-chat-left-text" style={{ color: '#10B981' }}></i>
              Subject
            </label>
            <div style={{ padding: '10px', backgroundColor: '#F9FAFB', borderRadius: '6px', color: '#6B7280' }}>
              {grade.subject}
            </div>
          </div>
          <div className={styles.formGroup}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', marginBottom: '8px' }}>
              <i className="bi bi-percent" style={{ color: '#10B981' }}></i>
              Grade Value
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={gradeValue}
              onChange={(e) => setGradeValue(Number(e.target.value))}
              disabled={loading}
              style={{ width: '100%' }}
            />
          </div>
          {error && (
            <div style={{
              color: '#DC2626',
              backgroundColor: '#FEE2E2',
              border: '1px solid #FECACA',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              fontSize: '14px'
            }}>
              <i className="bi bi-exclamation-circle" style={{ marginTop: '2px', flexShrink: 0 }}></i>
              {error}
            </div>
          )}
          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={loading}
            >
              <i className="bi bi-x-lg"></i> Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              <i className={`bi ${loading ? 'bi-arrow-repeat' : 'bi-check-lg'}`}></i>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
