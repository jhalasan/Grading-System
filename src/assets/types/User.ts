export interface User {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'admin';
  created: string;
  updated: string;
}
