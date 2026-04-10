export interface User {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'admin';
  created: string;
  updated: string;
  disabled_at?: string | null; // null when enabled, ISO timestamp when disabled
}
