import type { ActivityLog } from '../types/Log';
import styles from './ActivityLogTable.module.css';
import 'bootstrap-icons/font/bootstrap-icons.css'

interface ActivityLogTableProps {
  logs: ActivityLog[];
}

export default function ActivityLogTable({ logs }: ActivityLogTableProps) {
  const parseValue = (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      return data.grade_value !== undefined ? data.grade_value : JSON.stringify(data);
    } catch {
      return jsonString;
    }
  };

  const getActionBadgeClass = (actionType: string): string => {
    switch (actionType) {
      case 'LOGIN':
        return styles.actionLogin;
      case 'LOGOUT':
        return styles.actionLogout;
      case 'CREATE_GRADE':
        return styles.actionCreate;
      case 'UPDATE_GRADE':
        return styles.actionUpdate;
      case 'DELETE_GRADE':
        return styles.actionDelete;
      default:
        return '';
    }
  };

  const getActionIcon = (actionType: string): string => {
    switch (actionType) {
      case 'LOGIN':
        return 'bi-box-arrow-in-right';
      case 'LOGOUT':
        return 'bi-box-arrow-right';
      case 'CREATE_GRADE':
        return 'bi-plus-circle';
      case 'UPDATE_GRADE':
        return 'bi-pencil-square';
      case 'DELETE_GRADE':
        return 'bi-trash';
      default:
        return 'bi-gear';
    }
  };

  const getUserName = (log: ActivityLog): string => {
    if (log.expand?.user_id?.name) {
      return log.expand.user_id.name;
    }
    return '(User Deleted)';
  };

  return (
    <div className={styles.container}>
      {logs.length === 0 ? (
        <p className={styles.emptyState}>No activity logs found</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>User</th>
              <th>Action</th>
              <th>Old Value</th>
              <th>New Value</th>
              <th>IP Address</th>
              <th>Device</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="bi bi-person" style={{ color: '#10B981' }}></i>
                    {getUserName(log)}
                  </div>
                </td>
                <td>
                  <span className={`${styles.actionBadge} ${getActionBadgeClass(log.action_type)}`}>
                    <i className={`bi ${getActionIcon(log.action_type)}`} style={{ marginRight: '4px' }}></i>
                    {log.action_type}
                  </span>
                </td>
                <td className={styles.value}>{parseValue(log.old_value)}</td>
                <td className={styles.value}>{parseValue(log.new_value)}</td>
                <td>
                  <span style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    padding: '4px 8px',
                    backgroundColor: '#F3F4F6',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: '#374151'
                  }}>
                    <i className="bi bi-globe" style={{ fontSize: '14px' }}></i>
                    {log.ip_address || 'N/A'}
                  </span>
                </td>
                <td>
                  <span style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    padding: '4px 8px',
                    backgroundColor: '#E0F2FE',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: '#0369A1'
                  }}>
                    <i className="bi bi-laptop" style={{ fontSize: '14px' }}></i>
                    {log.device || 'N/A'}
                  </span>
                </td>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}