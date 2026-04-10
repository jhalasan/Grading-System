import React, { useEffect, useState } from 'react';
import {
  forceLogoutUser,
  resetUserPassword,
  getAllUsers,
  disableUserAccount,
  enableUserAccount,
  restoreGradeFromBackup,
  getGradesWithBackup,
  getGradeChanges,
  generateTemporaryPassword,
  migrateGradeBackups,
} from '../services/adminService';
import { getTeacherActivityStatus, type TeacherActivityStatus } from '../services/logService';
import type { User } from '../types/User';
import type { Grade } from '../types/Grade';

interface GradeWithChanges extends Grade {
  original_grade_value?: number;
  isModified?: boolean;
  modifiedBy?: string;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [grades, setGrades] = useState<GradeWithChanges[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'grades'>('users');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<GradeWithChanges | null>(null);
  const [restoreReason, setRestoreReason] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [activityStatusMap, setActivityStatusMap] = useState<Map<string, TeacherActivityStatus>>(new Map());

  // Helper function to fetch and process grades with changes
  const refreshGradesWithChanges = async () => {
    try {
      const gradesData = await getGradesWithBackup();
      
      // Check which grades have been modified
      const gradesWithStatus = await Promise.all(
        gradesData.map(async (grade) => {
          try {
            const changes = await getGradeChanges(grade.id);
            return {
              ...grade,
              isModified: changes.modified,
              modifiedBy: changes.modifiedBy,
            };
          } catch {
            return grade;
          }
        })
      );

      setGrades(gradesWithStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh grades');
      console.error(err);
    }
  };

  // Fetch users and grades
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [usersData, gradesData, activityData] = await Promise.all([
          getAllUsers(),
          getGradesWithBackup(),
          getTeacherActivityStatus(),
        ]);
        setUsers(usersData);

        // Create a map of user ID to activity status
        const activityMap = new Map<string, TeacherActivityStatus>();
        activityData.forEach((status) => {
          activityMap.set(status.userId, status);
        });
        setActivityStatusMap(activityMap);

        // Check which grades have been modified
        const gradesWithStatus = await Promise.all(
          gradesData.map(async (grade) => {
            try {
              const changes = await getGradeChanges(grade.id);
              return {
                ...grade,
                isModified: changes.modified,
                modifiedBy: changes.modifiedBy,
              };
            } catch {
              return grade;
            }
          })
        );

        setGrades(gradesWithStatus);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleForceLogout = async (userId: string) => {
    // Don't do anything if user is already logged out
    if (!activityStatusMap.get(userId)?.isActive) {
      return;
    }

    if (!confirm('Force logout this user? This will log them out immediately.')) return;

    try {
      setError(null);
      await forceLogoutUser(userId, 'Admin action - forced logout');
      alert('User has been logged out');
      // Refresh users list and activity status
      const [updatedUsers, activityData] = await Promise.all([
        getAllUsers(),
        getTeacherActivityStatus(),
      ]);
      setUsers(updatedUsers);
      const activityMap = new Map<string, TeacherActivityStatus>();
      activityData.forEach((status) => {
        activityMap.set(status.userId, status);
      });
      setActivityStatusMap(activityMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to force logout');
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    if (!tempPassword.trim()) {
      alert('Please enter a temporary password');
      return;
    }

    try {
      setError(null);
      await resetUserPassword(selectedUser.id, tempPassword);
      alert(`Password reset for ${selectedUser.name}. Temporary password: ${tempPassword}`);
      setShowResetModal(false);
      setTempPassword('');
      setSelectedUser(null);
      // Refresh activity status
      const activityData = await getTeacherActivityStatus();
      const activityMap = new Map<string, TeacherActivityStatus>();
      activityData.forEach((status) => {
        activityMap.set(status.userId, status);
      });
      setActivityStatusMap(activityMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    }
  };

  const handleGeneratePassword = () => {
    setTempPassword(generateTemporaryPassword());
  };

  const handleToggleAccount = async (userId: string, isDisabled: boolean) => {
    try {
      setError(null);
      if (isDisabled) {
        await enableUserAccount(userId);
      } else {
        await disableUserAccount(userId, 'Admin action');
      }

      const [updatedUsers, activityData] = await Promise.all([
        getAllUsers(),
        getTeacherActivityStatus(),
      ]);
      setUsers(updatedUsers);
      const activityMap = new Map<string, TeacherActivityStatus>();
      activityData.forEach((status) => {
        activityMap.set(status.userId, status);
      });
      setActivityStatusMap(activityMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update account status');
    }
  };

  const handleRestoreGrade = async () => {
    if (!selectedGrade || !selectedGrade.original_grade_value) return;
    if (!confirm(`Restore grade from ${selectedGrade.grade_value} to ${selectedGrade.original_grade_value}?`)) {
      return;
    }

    try {
      setError(null);
      await restoreGradeFromBackup(selectedGrade.id, restoreReason || 'Admin restoration');
      alert('Grade restored successfully');
      setShowRestoreModal(false);
      setSelectedGrade(null);
      setRestoreReason('');

      // Refresh grades with changes
      await refreshGradesWithChanges();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore grade');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '30px', color: '#1F2937' }}>
        <i className="bi bi-shield-lock" style={{ marginRight: '10px', fontSize: '24px' }}></i>
        Admin Dashboard
      </h1>

      {error && (
        <div
          style={{
            padding: '16px',
            marginBottom: '20px',
            backgroundColor: '#FEE2E2',
            border: '1px solid #FECACA',
            borderRadius: '8px',
            color: '#DC2626',
          }}
        >
          <i className="bi bi-exclamation-circle" style={{ marginRight: '8px' }}></i>
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #E5E7EB' }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '10px 20px',
            border: 'none',
            backgroundColor: activeTab === 'users' ? '#10B981' : 'transparent',
            color: activeTab === 'users' ? 'white' : '#6B7280',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'users' ? '600' : '400',
            borderRadius: '8px 8px 0 0',
          }}
        >
          <i className="bi bi-people-fill" style={{ marginRight: '8px' }}></i>
          User Management
        </button>
        <button
          onClick={() => setActiveTab('grades')}
          style={{
            padding: '10px 20px',
            border: 'none',
            backgroundColor: activeTab === 'grades' ? '#10B981' : 'transparent',
            color: activeTab === 'grades' ? 'white' : '#6B7280',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'grades' ? '600' : '400',
            borderRadius: '8px 8px 0 0',
          }}
        >
          <i className="bi bi-file-earmark-text-fill" style={{ marginRight: '8px' }}></i>
          Grade Backup & Restore
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          <h2 style={{ marginBottom: '20px', fontSize: '18px', color: '#374151' }}>
            User Access Control
          </h2>
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Role</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: index < users.length - 1 ? '1px solid #E5E7EB' : 'none',
                      backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F9FAFB',
                    }}
                  >
                    <td style={{ padding: '12px' }}>{user.name}</td>
                    <td style={{ padding: '12px', color: '#6B7280' }}>{user.email}</td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: user.role === 'admin' ? '#DBEAFE' : '#ECFDF5',
                          color: user.role === 'admin' ? '#0C4A6E' : '#065F46',
                        }}
                      >
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: activityStatusMap.get(user.id)?.isActive ? '#ECFDF5' : '#FEE2E2',
                          color: activityStatusMap.get(user.id)?.isActive ? '#10B981' : '#DC2626',
                        }}
                      >
                        {activityStatusMap.get(user.id)?.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowResetModal(true);
                          setTempPassword('');
                        }}
                        style={{
                          padding: '6px 12px',
                          marginRight: '8px',
                          border: '1px solid #3B82F6',
                          backgroundColor: '#3B82F6',
                          color: 'white',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500',
                        }}
                        title="Reset user password"
                      >
                        <i className="bi bi-key-fill" style={{ marginRight: '4px' }}></i>
                        Reset Password
                      </button>
                      <button
                        onClick={() => handleForceLogout(user.id)}
                        style={{
                          padding: '6px 12px',
                          marginRight: '8px',
                          border: '1px solid #F59E0B',
                          backgroundColor: '#F59E0B',
                          color: 'white',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500',
                        }}
                        title="Force logout user"
                      >
                        <i className="bi bi-box-arrow-right" style={{ marginRight: '4px' }}></i>
                        Force Logout
                      </button>
                      <button
                        onClick={() => handleToggleAccount(user.id, !!user.disabled_at)}
                        style={{
                          padding: '6px 12px',
                          border: `1px solid ${user.disabled_at ? '#10B981' : '#DC2626'}`,
                          backgroundColor: user.disabled_at ? '#10B981' : '#DC2626',
                          color: 'white',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500',
                        }}
                        title={user.disabled_at ? 'Enable account' : 'Disable account'}
                      >
                        <i
                          className={`bi ${user.disabled_at ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`}
                          style={{ marginRight: '4px' }}
                        ></i>
                        {user.disabled_at ? 'Enable' : 'Disable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grades Tab */}
      {activeTab === 'grades' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', color: '#374151', margin: 0 }}>
              Grade Backup & Restoration
            </h2>
            <button
              onClick={async () => {
                if (!confirm('Repair grade backups? This will populate original values from activity logs.')) return;
                try {
                  setError(null);
                  const result = await migrateGradeBackups();
                  alert(`Migration complete!\nUpdated: ${result.updated} grades\nSkipped: ${result.skipped} grades`);
                  // Refresh grades with changes
                  await refreshGradesWithChanges();
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Migration failed');
                }
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#8B5CF6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
              }}
              title="Repairs grade backups for existing modified grades"
            >
              <i className="bi bi-wrench" style={{ marginRight: '4px' }}></i>
              Repair Backups
            </button>
          </div>
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Student</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Subject</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Current Grade</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Original Grade</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Modified By</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((grade, index) => (
                  <tr
                    key={grade.id}
                    style={{
                      borderBottom: index < grades.length - 1 ? '1px solid #E5E7EB' : 'none',
                      backgroundColor: grade.isModified ? '#FEF3C7' : index % 2 === 0 ? '#FFFFFF' : '#F9FAFB',
                    }}
                  >
                    <td style={{ padding: '12px' }}>
                      {grade.expand?.student_id?.student_name || 'Unknown'}
                    </td>
                    <td style={{ padding: '12px' }}>{grade.subject}</td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>
                      {grade.grade_value}
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        textAlign: 'center',
                        color: grade.original_grade_value ? '#6B7280' : '#D1D5DB',
                      }}
                    >
                      {grade.original_grade_value || '-'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {grade.isModified ? (
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: '#FEE2E2',
                            color: '#DC2626',
                          }}
                        >
                          Modified
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: '#ECFDF5',
                            color: '#10B981',
                          }}
                        >
                          Original
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px', color: '#6B7280' }}>
                      {grade.modifiedBy || '-'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {grade.isModified && grade.original_grade_value && (
                        <button
                          onClick={() => {
                            setSelectedGrade(grade);
                            setShowRestoreModal(true);
                            setRestoreReason('');
                          }}
                          style={{
                            padding: '6px 12px',
                            border: '1px solid #10B981',
                            backgroundColor: '#10B981',
                            color: 'white',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500',
                          }}
                          title="Restore to original grade"
                        >
                          <i className="bi bi-arrow-counterclockwise" style={{ marginRight: '4px' }}></i>
                          Restore
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showResetModal && selectedUser && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '500px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            }}
          >
            <h2 style={{ marginBottom: '20px', color: '#1F2937' }}>Reset Password</h2>
            <p style={{ marginBottom: '20px', color: '#6B7280' }}>
              Reset password for: <strong>{selectedUser.name}</strong> ({selectedUser.email})
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                Temporary Password
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  placeholder="Enter or generate password"
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
                <button
                  onClick={handleGeneratePassword}
                  style={{
                    padding: '10px 16px',
                    border: '1px solid #3B82F6',
                    backgroundColor: '#3B82F6',
                    color: 'white',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  <i className="bi bi-arrow-repeat" style={{ marginRight: '4px' }}></i>
                  Generate
                </button>
              </div>
            </div>

            <p style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#FFFBEB', borderRadius: '6px', color: '#92400E', fontSize: '13px' }}>
              <i className="bi bi-info-circle" style={{ marginRight: '8px' }}></i>
              User must change this password on next login.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setSelectedUser(null);
                  setTempPassword('');
                }}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #D1D5DB',
                  backgroundColor: 'white',
                  color: '#374151',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                <i className="bi bi-check-lg" style={{ marginRight: '4px' }}></i>
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grade Restore Modal */}
      {showRestoreModal && selectedGrade && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '500px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            }}
          >
            <h2 style={{ marginBottom: '20px', color: '#1F2937' }}>Restore Grade</h2>
            <p style={{ marginBottom: '20px', color: '#6B7280' }}>
              Restore grade for: <strong>{selectedGrade.expand?.student_id?.student_name || 'Unknown'}</strong>
            </p>

            <div
              style={{
                padding: '16px',
                backgroundColor: '#FEF3C7',
                borderRadius: '8px',
                marginBottom: '20px',
              }}
            >
              <div style={{ marginBottom: '12px', color: '#374151' }}>
                <strong>Current Grade:</strong> {selectedGrade.grade_value}
              </div>
              <div style={{ marginBottom: '12px', color: '#374151' }}>
                <strong>Original Grade:</strong> {selectedGrade.original_grade_value}
              </div>
              <div style={{ color: '#92400E' }}>
                <i className="bi bi-arrow-down" style={{ marginRight: '8px' }}></i>
                This will restore the grade to its original value.
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                Reason for Restoration (Optional)
              </label>
              <textarea
                value={restoreReason}
                onChange={(e) => setRestoreReason(e.target.value)}
                placeholder="e.g., Grade changed prematurely, user requested correction"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  minHeight: '80px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowRestoreModal(false);
                  setSelectedGrade(null);
                  setRestoreReason('');
                }}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #D1D5DB',
                  backgroundColor: 'white',
                  color: '#374151',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRestoreGrade}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  backgroundColor: '#10B981',
                  color: 'white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                <i className="bi bi-arrow-counterclockwise" style={{ marginRight: '4px' }}></i>
                Restore Grade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
