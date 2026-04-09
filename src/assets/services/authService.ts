import { pb } from './pocketbase';
import { getClientIpAddressSync } from './ipService';
import type { User } from '../types/User';

export const login = async (email: string, password: string): Promise<User> => {
  try {
    const authData = await pb.collection('users').authWithPassword(email, password);
    const user = authData.record as unknown as User;
    
    // Log successful login
    try {
      await pb.collection('activity_logs').create({
        user_id: user.id,
        action_type: 'LOGIN',
        record_id: user.id,
        old_value: JSON.stringify({}),
        new_value: JSON.stringify({ email: user.email, name: user.name }),
        timestamp: new Date().toISOString(),
        ip_address: getClientIpAddressSync(),
      });
    } catch (logError) {
      console.warn('Failed to log login activity (non-fatal):', logError);
    }
    
    return user;
  } catch (error: any) {
    console.error('Login failed:', error);
    throw new Error(error?.message || 'Login failed');
  }
};

export const logout = async (): Promise<void> => {
  try {
    pb.authStore.clear();
  } catch (error) {
    console.error('Logout failed:', error);
    throw new Error('Logout failed');
  }
};

export const isAuthenticated = (): boolean => {
  return pb.authStore.isValid;
};

export const getAuthenticatedUser = (): User | null => {
  const user = pb.authStore.record;
  return user ? (user as unknown as User) : null;
};

export const autoRefreshAuth = (): void => {
  pb.collection('users').authRefresh().catch(() => {
    // Auth refresh failed, user needs to log in again
    pb.authStore.clear();
  });
};
