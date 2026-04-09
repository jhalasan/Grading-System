import { useState, useEffect } from 'react';
import type { Grade } from '../types/Grade';
import type { Student } from '../types/Student';
import { createGrade } from '../services/gradeServices';
import { getAllStudents } from '../services/studentService';
import { getCurrentUserId } from '../services/pocketbase';
import styles from './EditGradeModal.module.css';
import 'bootstrap-icons/font/bootstrap-icons.css'

interface CreateGradeModalProps {
  onClose: () => void;
  onSave: (grade: Grade) => void;
}

export default function CreateGradeModal({ onClose, onSave }: CreateGradeModalProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeValue, setGradeValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const studentList = await getAllStudents();
        setStudents(studentList);
        if (studentList.length > 0) {
          setSelectedStudentId(studentList[0].id);
        }
      } catch (err) {
        setError('Failed to load students');
        console.error(err);
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudentId) {
      setError('Please select a student');
      return;
    }

    if (!subject.trim()) {
      setError('Please enter a subject');
      return;
    }

    if (!gradeValue || Number(gradeValue) < 0 || Number(gradeValue) > 100) {
      setError('Grade must be between 0 and 100');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const currentUserId = getCurrentUserId();
      const newGrade = await createGrade(
        selectedStudentId,
        subject,
        Number(gradeValue),
        currentUserId
      );
      onSave(newGrade);
      onClose();
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to create grade. Please try again.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  if (loadingStudents) {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <i className="bi bi-hourglass-split" style={{ fontSize: '32px', color: '#10B981', animation: 'spin 1s linear infinite' }}></i>
            <p style={{ marginTop: '16px', color: '#6B7280' }}>Loading students...</p>
          </div>
        </div>
      </div>
    );
  }

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
            <i className="bi bi-plus-circle"></i>
          </div>
          <h3 style={{ margin: 0, fontSize: '20px' }}>Add New Grade</h3>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="student" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
              <i className="bi bi-person" style={{ color: '#10B981' }}></i>
              Student <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <select
              id="student"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              disabled={loading}
              required
              style={{ width: '100%' }}
            >
              <option value="">Select a student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.student_name} - {student.course} ({student.section})
                </option>
              ))}
            </select>
          </div>

          {selectedStudent && (
            <>
              <div className={styles.formGroup}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                  <i className="bi bi-book" style={{ color: '#10B981' }}></i>
                  Course
                </label>
                <div style={{ padding: '10px', backgroundColor: '#F9FAFB', borderRadius: '6px', color: '#6B7280' }}>
                  {selectedStudent.course}
                </div>
              </div>
              <div className={styles.formGroup}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                  <i className="bi bi-grid-3x2" style={{ color: '#10B981' }}></i>
                  Section
                </label>
                <div style={{ padding: '10px', backgroundColor: '#F9FAFB', borderRadius: '6px', color: '#6B7280' }}>
                  {selectedStudent.section}
                </div>
              </div>
            </>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="subject" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', marginBottom: '8px' }}>
              <i className="bi bi-chat-left-text" style={{ color: '#10B981' }}></i>
              Subject <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input
              id="subject"
              type="text"
              placeholder="e.g., Exam 1, Assignment 2"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={loading}
              required
              style={{ width: '100%' }}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="grade" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', marginBottom: '8px' }}>
              <i className="bi bi-percent" style={{ color: '#10B981' }}></i>
              Grade (0-100) <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input
              id="grade"
              type="number"
              min="0"
              max="100"
              placeholder="Enter grade"
              value={gradeValue}
              onChange={(e) => setGradeValue(e.target.value)}
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
              borderRadius: '6px',
              padding: '12px 14px',
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
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
