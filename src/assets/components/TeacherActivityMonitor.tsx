import { useEffect, useState } from 'react';
import { getTeacherActivityStatus, type TeacherActivityStatus } from '../services/logService';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function TeacherActivityMonitor() {
  const [teachers, setTeachers] = useState<TeacherActivityStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    const fetchTeachers = async () => {
      setLoading(true);
      setError(null);
      try {
        const teacherData = await getTeacherActivityStatus();
        setTeachers(teacherData);
      } catch (err) {
        setError('Failed to load teacher activity data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
    // Refresh every 30 seconds
    const interval = setInterval(fetchTeachers, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredTeachers = teachers.filter((teacher) => {
    if (filterStatus === 'active') return teacher.isActive;
    if (filterStatus === 'inactive') return !teacher.isActive;
    return true;
  });

  const activeCount = teachers.filter((t) => t.isActive).length;
  const inactiveCount = teachers.filter((t) => !t.isActive).length;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const secondsAgo = (now.getTime() - date.getTime()) / 1000;

    if (secondsAgo < 60) return 'Just now';
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
    if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`;
    return `${Math.floor(secondsAgo / 86400)}d ago`;
  };

  return (
    <div style={{ marginTop: '40px' }}>
      <h2
        style={{
          fontSize: '20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <i
          className="bi bi-people-fill"
          style={{ fontSize: '24px', color: '#10B981' }}
        ></i>
        Teacher Activity Monitor
      </h2>

      {error && (
        <div
          style={{
            color: '#DC2626',
            marginBottom: '20px',
            padding: '14px 16px',
            backgroundColor: '#FEE2E2',
            borderRadius: '12px',
            border: '1px solid #FECACA',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <i
            className="bi bi-exclamation-circle"
            style={{ marginTop: '2px', fontSize: '18px', flexShrink: 0 }}
          ></i>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <i
            className="bi bi-hourglass-split"
            style={{
              fontSize: '32px',
              color: '#10B981',
              animation: 'spin 1s linear infinite',
            }}
          ></i>
          <p style={{ marginTop: '16px', color: '#6B7280' }}>
            Loading teacher activity...
          </p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            <StatCard
              title="Total Teachers"
              value={teachers.length}
              icon="bi-people"
              color="#0EA5E9"
            />
            <StatCard
              title="Active Now"
              value={activeCount}
              icon="bi-check-circle-fill"
              color="#10B981"
            />
            <StatCard
              title="Inactive"
              value={inactiveCount}
              icon="bi-x-circle-fill"
              color="#EF4444"
            />
          </div>

          {/* Filter Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {['all', 'active', 'inactive'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as 'all' | 'active' | 'inactive')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border:
                    filterStatus === status
                      ? '2px solid #10B981'
                      : '1px solid #E5E7EB',
                  backgroundColor:
                    filterStatus === status ? '#ECFDF5' : '#FFFFFF',
                  color: filterStatus === status ? '#10B981' : '#6B7280',
                  cursor: 'pointer',
                  fontWeight: filterStatus === status ? '600' : '500',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (filterStatus !== status) {
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      '#F9FAFB';
                  }
                }}
                onMouseLeave={(e) => {
                  if (filterStatus !== status) {
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      '#FFFFFF';
                  }
                }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {/* Teacher Table */}
          {filteredTeachers.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px',
                backgroundColor: '#F9FAFB',
                borderRadius: '12px',
                border: '1px solid #E5E7EB',
              }}
            >
              <i
                className="bi bi-inbox"
                style={{ fontSize: '32px', color: '#9CA3AF', marginBottom: '12px', display: 'block' }}
              ></i>
              <p style={{ color: '#6B7280', margin: 0 }}>No teachers found</p>
            </div>
          ) : (
            <div
              style={{
                overflowX: 'auto',
                borderRadius: '12px',
                border: '1px solid #E5E7EB',
                backgroundColor: '#FFFFFF',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '14px',
                  tableLayout: 'fixed',
                }}
              >
                <colgroup>
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '27%' }} />
                </colgroup>
                <thead>
                  <tr
                    style={{
                      backgroundColor: '#F9FAFB',
                      borderBottom: '1px solid #E5E7EB',
                    }}
                  >
                    <th
                      style={{
                        padding: '16px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Name
                    </th>
                    <th
                      style={{
                        padding: '16px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Email
                    </th>
                    <th
                      style={{
                        padding: '16px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Status
                    </th>
                    <th
                      style={{
                        padding: '16px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Last Activity
                    </th>
                    <th
                      style={{
                        padding: '16px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Last Activity Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.map((teacher, index) => (
                    <tr
                      key={teacher.userId}
                      style={{
                        borderBottom:
                          index < filteredTeachers.length - 1
                            ? '1px solid #E5E7EB'
                            : 'none',
                        backgroundColor:
                          index % 2 === 0 ? '#FFFFFF' : '#F9FAFB',
                        transition: 'background-color 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor =
                          '#F3F4F6';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor =
                          index % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
                      }}
                    >
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <i
                            className="bi bi-person-circle"
                            style={{
                              fontSize: '20px',
                              color: '#10B981',
                              flexShrink: 0,
                            }}
                          ></i>
                          <span style={{ fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={teacher.teacherName}>{teacher.teacherName}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={teacher.teacherEmail}>
                        {teacher.teacherEmail}
                      </td>
                      <td
                        style={{
                          padding: '16px',
                          textAlign: 'left',
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontWeight: '500',
                            fontSize: '13px',
                            backgroundColor: teacher.isActive
                              ? '#DCFCE7'
                              : '#FEE2E2',
                            color: teacher.isActive ? '#15803D' : '#991B1B',
                          }}
                        >
                          <i
                            className={`bi ${teacher.isActive
                              ? 'bi-check-circle-fill'
                              : 'bi-x-circle-fill'
                              }`}
                          ></i>
                          {teacher.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: '#6B7280' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <i
                            className={`bi ${teacher.lastActivityType === 'LOGIN'
                              ? 'bi-box-arrow-in-right'
                              : 'bi-box-arrow-right'
                              }`}
                            style={{
                              color:
                                teacher.lastActivityType === 'LOGIN'
                                  ? '#10B981'
                                  : '#EF4444',
                            }}
                          ></i>
                          <span>
                            {teacher.lastActivityType === 'LOGIN'
                              ? 'Logged In'
                              : 'Logged Out'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px', color: '#6B7280' }}>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                          }}
                        >
                          <span style={{ fontWeight: '500' }}>
                            {getTimeAgo(teacher.lastActivityTime)}
                          </span>
                          <span
                            style={{
                              fontSize: '12px',
                              color: '#9CA3AF',
                            }}
                            title={formatDate(teacher.lastActivityTime)}
                          >
                            {formatDate(teacher.lastActivityTime)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: string;
  color: string;
}) {
  return (
    <div
      style={{
        padding: '20px',
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        backgroundColor: '#FFFFFF',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          '0 10px 15px rgba(0, 0, 0, 0.1)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          '0 1px 3px rgba(0, 0, 0, 0.1)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <p
          style={{
            margin: 0,
            color: '#6B7280',
            fontSize: '13px',
            fontWeight: '600',
          }}
        >
          {title}
        </p>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
            fontSize: '18px',
          }}
        >
          <i className={`bi ${icon}`}></i>
        </div>
      </div>
      <h3 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#111827' }}>
        {value}
      </h3>
    </div>
  );
}
