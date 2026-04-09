import { useState, useEffect } from 'react';
import type { Grade } from '../types/Grade';
import styles from './GradeTable.module.css';
import EditGradeModal from './EditGradeModal';
import { getUserName } from '../services/gradeServices';
import { deleteGrade } from '../services/gradeServices';
import { getCurrentUserId } from '../services/pocketbase';
import 'bootstrap-icons/font/bootstrap-icons.css'

interface GradeTableProps {
  grades: Grade[];
  onGradeUpdated: (grade: Grade) => void;
  onRefresh: () => void;
  onDelete?: () => void;
}

export default function GradeTable({ grades, onGradeUpdated, onRefresh, onDelete }: GradeTableProps) {
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch user names for all unique user IDs in grades as a fallback
    const uniqueUserIds = new Set(grades.map(g => g.last_modified_by).filter(Boolean));
    
    const fetchUserNames = async () => {
      const names: Record<string, string> = {};
      for (const userId of uniqueUserIds) {
        try {
          const name = await getUserName(userId);
          names[userId] = name;
        } catch (error) {
          console.error(`Failed to fetch user ${userId}:`, error);
          names[userId] = '(User Deleted)';
        }
      }
      setUserNames(names);
    };

    if (uniqueUserIds.size > 0) {
      fetchUserNames();
    }
  }, [grades]);

  const handleEditClick = (grade: Grade) => {
    setSelectedGrade(grade);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedGrade(null);
  };

  const handleSaveGrade = (updatedGrade: Grade) => {
    onGradeUpdated(updatedGrade);
    handleModalClose();
    onRefresh();
  };

  const handleDeleteGrade = async (gradeId: string) => {
    if (!window.confirm('Are you sure you want to delete this grade? This action cannot be undone.')) {
      return;
    }

    setDeletingId(gradeId);
    try {
      const currentUserId = getCurrentUserId();
      await deleteGrade(gradeId, currentUserId);
      onRefresh();
      onDelete?.();
    } catch (error: any) {
      console.error('Failed to delete grade:', error);
      const errorMessage = error?.message || 'Failed to delete grade. Please try again.';
      alert(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  const getStudentName = (grade: Grade): string => {
    if (grade.expand?.student_id?.student_name) {
      return grade.expand.student_id.student_name;
    }
    return '(Student Deleted)';
  };

  const getModifierName = (grade: Grade): string => {
    // First, try to use expanded user data
    if (grade.expand?.last_modified_by?.name) {
      return grade.expand.last_modified_by.name;
    }
    
    // Fallback to fetched user names
    if (userNames[grade.last_modified_by]) {
      return userNames[grade.last_modified_by];
    }
    
    return '(User Deleted)';
  };

  return (
    <>
      <div className={styles.container}>
        <h2>Student Grades</h2>
        {grades.length === 0 ? (
          <p className={styles.emptyState}>No grades found</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Course</th>
                <th>Section</th>
                <th>Subject</th>
                <th>Grade</th>
                <th>Last Modified By</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((grade) => (
                <tr key={grade.id}>
                  <td>{getStudentName(grade)}</td>
                  <td>{grade.expand?.student_id?.course || '-'}</td>
                  <td>{grade.expand?.student_id?.section || '-'}</td>
                  <td>{grade.subject}</td>
                  <td className={styles.gradeValue}>{grade.grade_value}</td>
                  <td>{getModifierName(grade)}</td>
                  <td>{new Date(grade.updated).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className={styles.editBtn}
                        onClick={() => handleEditClick(grade)}
                        disabled={deletingId === grade.id}
                        title="Edit grade"
                      >
                        <i className="bi bi-pencil"></i> Edit
                      </button>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDeleteGrade(grade.id)}
                        disabled={deletingId === grade.id}
                        title="Delete grade"
                      >
                        <i className={`bi ${deletingId === grade.id ? 'bi-trash' : 'bi-trash'}`}></i>
                        {deletingId === grade.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && selectedGrade && (
        <EditGradeModal
          grade={selectedGrade}
          onClose={handleModalClose}
          onSave={handleSaveGrade}
        />
      )}
    </>
  );
}
