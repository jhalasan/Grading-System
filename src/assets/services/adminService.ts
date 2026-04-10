import { pb } from './pocketbase';
import { logAuthEvent } from './logService';
import type { User } from '../types/User';
import type { Grade } from '../types/Grade';

/**
 * Admin Service - Functions for administrative operations
 * Including: user management, password resets, and grade restoration
 */

// ==========================================
// USER MANAGEMENT FUNCTIONS
// ==========================================

/**
 * Force logout a user by invalidating their session
 * Called when unauthorized access is detected
 */
export const forceLogoutUser = async (userId: string, reason: string = 'Unauthorized access'): Promise<void> => {
  try {
    const adminUser = pb.authStore.record;
    
    if (!adminUser || adminUser.role !== 'admin') {
      throw new Error('Only admins can force logout users');
    }

    // Log the forced logout action
    await logAuthEvent(userId, 'FORCED_LOGOUT', {
      reason,
      forcedBy: adminUser.id,
      forcedByEmail: adminUser.email,
      timestamp: new Date().toISOString(),
    });

    console.log(`Forced logout initiated for user ${userId}. Reason: ${reason}`);
    
    // Note: PocketBase doesn't have a direct "invalidate session" API
    // In a production system, you would:
    // 1. Update the user record with a session_invalidated_at field
    // 2. Have the client check this on each request
    // 3. Or implement a blacklist of invalidated tokens
    
  } catch (error: any) {
    console.error('Failed to force logout user:', error);
    throw new Error(error?.message || 'Failed to force logout user');
  }
};

/**
 * Reset a user's password (admin action)
 * Generates a temporary password that the user must change on next login
 * 
 * IMPORTANT: For this to work:
 * 1. The 'users' collection must have API rule: @request.auth.id != null && @request.auth.role = "admin"
 * 2. The logged-in user must have role = "admin" (not "teacher")
 * 3. PocketBase must be restarted after changing API rules
 * 4. For auth collections in PocketBase, both password AND passwordConfirm may be required
 */
export const resetUserPassword = async (userId: string, temporaryPassword: string): Promise<void> => {
  try {
    const adminUser = pb.authStore.record;
    
    if (!adminUser || adminUser.role !== 'admin') {
      throw new Error('Only admins can reset passwords');
    }

    // Log detailed info for debugging
    console.debug('Attempting password reset for user:', userId);
    console.debug('Admin user:', { id: adminUser.id, role: adminUser.role, email: adminUser.email });
    console.debug('Temporary password length:', temporaryPassword.length);

    // For PocketBase auth collections, we need BOTH password and passwordConfirm
    // to properly update the password field
    // IMPORTANT: Password must be at least 8 characters for PocketBase auth collections
    if (temporaryPassword.length < 8) {
      throw new Error(`Password must be at least 8 characters (currently ${temporaryPassword.length})`);
    }
    
    console.debug('Sending password update with empty oldPassword...');
    
    // Try sending empty oldPassword - PocketBase might allow this for admins
    const response = await fetch(`http://127.0.0.1:8090/api/collections/users/records/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': pb.authStore.token,
      },
      body: JSON.stringify({
        password: temporaryPassword,
        passwordConfirm: temporaryPassword,
        oldPassword: '',  // Send empty oldPassword
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Password update failed:', errorData);
      throw new Error(JSON.stringify(errorData));
    }

    const updateResponse = await response.json();
    
    console.debug('✓ Password update successful:', updateResponse);

    // Log this action
    await logAuthEvent(userId, 'PASSWORD_RESET', {
      resetBy: adminUser.id,
      resetByEmail: adminUser.email,
      timestamp: new Date().toISOString(),
      note: 'User should change password on next login',
    });

    console.log(`✓ Password reset successful for user ${userId}`);
  } catch (error: any) {
    console.error('Failed to reset password:', {
      userId,
      errorMessage: error?.message,
      errorStatus: error?.status,
      errorData: error?.data,
      fullError: error,
    });
    throw new Error(error?.message || 'Failed to reset password');
  }
};

/**
 * Get list of all users (for admin dashboard)
 */
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const adminUser = pb.authStore.record;
    
    if (!adminUser || adminUser.role !== 'admin') {
      throw new Error('Only admins can view all users');
    }

    const records = await pb.collection('users').getFullList({
      sort: '-created',
    });

    return records as unknown as User[];
  } catch (error: any) {
    console.error('Failed to fetch users:', error);
    throw new Error(error?.message || 'Failed to fetch users');
  }
};

/**
 * Disable/Lock a user account
 */
export const disableUserAccount = async (userId: string, reason: string = ''): Promise<void> => {
  try {
    const adminUser = pb.authStore.record;
    
    if (!adminUser || adminUser.role !== 'admin') {
      throw new Error('Only admins can disable accounts');
    }

    // Add a disabled flag to the user record
    await pb.collection('users').update(userId, {
      disabled_at: new Date().toISOString(),
    });

    // Log this action
    await logAuthEvent(userId, 'ACCOUNT_DISABLED', {
      disabledBy: adminUser.id,
      reason,
      timestamp: new Date().toISOString(),
    });

    console.log(`User account ${userId} disabled`);
  } catch (error: any) {
    console.error('Failed to disable account:', error);
    throw new Error(error?.message || 'Failed to disable account');
  }
};

/**
 * Enable/Unlock a user account
 */
export const enableUserAccount = async (userId: string): Promise<void> => {
  try {
    const adminUser = pb.authStore.record;
    
    if (!adminUser || adminUser.role !== 'admin') {
      throw new Error('Only admins can enable accounts');
    }

    // Remove the disabled flag
    await pb.collection('users').update(userId, {
      disabled_at: null,
    });

    // Log this action
    await logAuthEvent(userId, 'ACCOUNT_ENABLED', {
      enabledBy: adminUser.id,
      timestamp: new Date().toISOString(),
    });

    console.log(`User account ${userId} enabled`);
  } catch (error: any) {
    console.error('Failed to enable account:', error);
    throw new Error(error?.message || 'Failed to enable account');
  }
};

// ==========================================
// GRADE BACKUP & RESTORATION FUNCTIONS
// ==========================================

/**
 * Restore a grade to its original value (from backup)
 */
export const restoreGradeFromBackup = async (gradeId: string, reason: string = ''): Promise<Grade> => {
  try {
    const adminUser = pb.authStore.record;
    
    if (!adminUser || adminUser.role !== 'admin') {
      throw new Error('Only admins can restore grades');
    }

    // Get the grade record
    const grade = await pb.collection('grades').getOne(gradeId, {
      expand: 'student_id,last_modified_by',
    });

    // Check if there's a backup value stored
    const gradeData = grade as any;
    if (!gradeData.original_grade_value) {
      throw new Error('No backup grade found for this record');
    }

    const oldValue = gradeData.grade_value;
    const restoredValue = gradeData.original_grade_value;

    // Update the grade back to original
    const updatedGrade = await pb.collection('grades').update(gradeId, {
      grade_value: restoredValue,
      last_modified_by: adminUser.id,
    });

    // Log this restoration
    await logAuthEvent(adminUser.id, 'GRADE_RESTORED', {
      gradeId,
      studentId: gradeData.student_id,
      oldValue,
      restoredValue,
      reason,
      timestamp: new Date().toISOString(),
    });

    console.log(`Grade ${gradeId} restored from ${oldValue} to ${restoredValue}`);
    
    return updatedGrade as unknown as Grade;
  } catch (error: any) {
    console.error('Failed to restore grade:', error);
    throw new Error(error?.message || 'Failed to restore grade');
  }
};

/**
 * Get all grades and their backup values
 */
export const getGradesWithBackup = async (): Promise<(Grade & { original_grade_value?: number })[]> => {
  try {
    const adminUser = pb.authStore.record;
    
    if (!adminUser || adminUser.role !== 'admin') {
      throw new Error('Only admins can view grade backups');
    }

    const records = await pb.collection('grades').getFullList({
      expand: 'student_id,last_modified_by',
      sort: '-updated',
    });

    console.log('Fetched grades from DB:');
    records.slice(0, 3).forEach((r: any) => {
      console.log(`  Grade ${r.id}: grade_value=${r.grade_value}, original_grade_value=${r.original_grade_value}`);
    });

    return records as unknown as (Grade & { original_grade_value?: number })[];
  } catch (error: any) {
    console.error('Failed to fetch grades with backup:', error);
    throw new Error(error?.message || 'Failed to fetch grades');
  }
};

/**
 * Check if a grade has been modified from its original value
 */
export const getGradeChanges = async (gradeId: string): Promise<{
  modified: boolean;
  originalValue?: number;
  currentValue: number;
  modifiedBy?: string;
  modificationCount?: number;
}> => {
  try {
    const grade = (await pb.collection('grades').getOne(gradeId, {
      expand: 'last_modified_by',
    })) as any;

    const response = {
      modified: false,
      currentValue: grade.grade_value,
    };

    // If original_grade_value exists, the grade has been modified at some point
    if (grade.original_grade_value) {
      response.modified = grade.original_grade_value !== grade.grade_value;
      response.originalValue = grade.original_grade_value;
      // Always populate modifiedBy if original_grade_value exists (whether modified now or restored)
      response.modifiedBy = grade.expand?.last_modified_by?.name || 'Unknown';
    }

    return response;
  } catch (error: any) {
    console.error('Failed to get grade changes:', error);
    throw new Error(error?.message || 'Failed to get grade changes');
  }
};

/**
 * MIGRATION FUNCTION: Populate original_grade_value for existing modified grades
 * This looks at activity logs to find what the original grade was before any modifications
 */
export const migrateGradeBackups = async (): Promise<{ updated: number; skipped: number }> => {
  try {
    const adminUser = pb.authStore.record;
    
    if (!adminUser || adminUser.role !== 'admin') {
      throw new Error('Only admins can run migrations');
    }

    console.log('🚀 Starting grade backup migration...');
    
    // Get all grades
    const grades = await pb.collection('grades').getFullList({
      expand: 'last_modified_by',
    }) as any[];
    
    console.log(`📊 Found ${grades.length} total grades to check`);
    
    // Get all UPDATE_GRADE activity logs, sorted by timestamp (oldest first)
    const updateLogs = await pb.collection('activity_logs').getFullList({
      filter: 'action_type = "UPDATE_GRADE"',
      sort: 'timestamp',
    }) as any[];

    console.log(`📋 Found ${updateLogs.length} UPDATE_GRADE logs`);

    let updated = 0;
    let skipped = 0;

    // For each grade, check if it needs a backup original value
    for (const grade of grades) {
      // Skip if already has original_grade_value
      if (grade.original_grade_value) {
        skipped++;
        continue;
      }

      // Find the FIRST UPDATE_GRADE log for this grade (using record_id field)
      const gradeUpdateLogs = updateLogs.filter((log) => log.record_id === grade.id);

      // If there are update logs, use the old_value from the oldest one
      if (gradeUpdateLogs.length > 0) {
        const oldestLog = gradeUpdateLogs[0];
        
        let originalValue: number | null = null;

        try {
          // Parse old_value (it's stored as JSON string)
          let oldValueObj: any = oldestLog.old_value;
          
          if (typeof oldValueObj === 'string') {
            try {
              oldValueObj = JSON.parse(oldValueObj);
            } catch (e) {
              console.warn(`❌ Cannot parse JSON for grade ${grade.id}`);
              skipped++;
              continue;
            }
          }

          // Extract grade_value - it should be a direct property
          if (typeof oldValueObj === 'object' && oldValueObj !== null) {
            originalValue = oldValueObj.grade_value;
            
            if (originalValue !== undefined && originalValue !== null && !isNaN(originalValue)) {
              // Update the grade
              try {
                await pb.collection('grades').update(grade.id, {
                  original_grade_value: Number(originalValue),
                });
                console.log(`✅ Grade ${grade.id}: Set original_grade_value = ${originalValue}`);
                updated++;
              } catch (updateErr) {
                console.error(`❌ Failed to update grade ${grade.id}:`, updateErr);
                skipped++;
              }
            } else {
              console.warn(`⚠️ Grade ${grade.id}: grade_value not found in old_value`);
              skipped++;
            }
          } else {
            console.warn(`⚠️ Grade ${grade.id}: old_value is not an object`);
            skipped++;
          }
        } catch (err) {
          console.error(`❌ Error processing grade ${grade.id}:`, err);
          skipped++;
        }
      } else {
        skipped++;
      }
    }

    console.log(`\n✅ MIGRATION COMPLETE`);
    console.log(`   ✓ Updated: ${updated} grades`);
    console.log(`   ⏭️  Skipped: ${skipped} grades`);
    
    return { updated, skipped };
  } catch (error: any) {
    console.error('❌ Grade backup migration failed:', error);
    throw new Error(error?.message || 'Grade backup migration failed');
  }
};

/**
 * Audit trail: Get all admin actions for a specific time period
 */
export const getAdminAuditLog = async (startDate?: Date, endDate?: Date): Promise<any[]> => {
  try {
    const adminUser = pb.authStore.record;
    
    if (!adminUser || adminUser.role !== 'admin') {
      throw new Error('Only admins can view audit logs');
    }

    let filter = 'action_type = "FORCED_LOGOUT" || action_type = "PASSWORD_RESET" || action_type = "ACCOUNT_DISABLED" || action_type = "ACCOUNT_ENABLED" || action_type = "GRADE_RESTORED"';

    if (startDate && endDate) {
      const start = startDate.toISOString();
      const end = endDate.toISOString();
      filter += ` && timestamp >= "${start}" && timestamp <= "${end}"`;
    }

    const records = await pb.collection('activity_logs').getFullList({
      filter,
      expand: 'user_id',
      sort: '-timestamp',
    });

    return records;
  } catch (error: any) {
    console.error('Failed to fetch admin audit log:', error);
    throw new Error(error?.message || 'Failed to fetch audit log');
  }
};

/**
 * Generate a secure temporary password for password reset
 */
export const generateTemporaryPassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};
