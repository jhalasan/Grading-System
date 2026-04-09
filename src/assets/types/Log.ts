import type { User } from './User';

export interface ActivityLog {
  id: string;
  user_id: string;
  action_type: 'LOGIN' | 'LOGOUT' | 'CREATE_GRADE' | 'UPDATE_GRADE' | 'DELETE_GRADE';
  record_id: string;
  old_value: string;
  new_value: string;
  timestamp: string;
  ip_address?: string;
  created: string;
  expand?: {
    user_id?: User;
  };
}
