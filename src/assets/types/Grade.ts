import type { User } from './User.ts';
import type { Student } from './Student.ts';

export interface Grade {
  id: string;
  student_id: string;
  subject: string;
  grade_value: number;
  last_modified_by: string;
  created: string;
  updated: string;
  expand?: {
    student_id?: Student;
    last_modified_by?: User;
  };
}
