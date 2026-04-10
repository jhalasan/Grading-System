/**
 * Diagnostic Service for Activity Logs Debugging
 */

import { pb } from './pocketbase';

export const diagnosActivityLogs = async () => {
  const diagnostics = {
    collectionExists: false,
    collectionName: 'activity_logs',
    totalLogs: 0,
    recentLogs: [] as any[],
    errors: [] as string[],
    deleteLogs: [] as any[],
  };

  try {
    // Check if collection exists and count records
    const allLogs = await pb.collection('activity_logs').getFullList();
    diagnostics.collectionExists = true;
    diagnostics.totalLogs = allLogs.length;
    diagnostics.recentLogs = allLogs.slice(-5).reverse();

    // Filter for delete logs specifically
    diagnostics.deleteLogs = allLogs.filter(log => (log as any).action_type === 'DELETE_GRADE').slice(-5);

  } catch (error: any) {
    if (error.status === 404) {
      diagnostics.errors.push('activity_logs collection does not exist in PocketBase');
    } else if (error.status === 403) {
      diagnostics.errors.push('Permission denied - user cannot access activity_logs collection');
    } else {
      diagnostics.errors.push(`Error accessing activity_logs: ${error.message}`);
    }
  }

  console.log('=== Activity Logs Diagnostic Report ===');
  console.log('Collection Exists:', diagnostics.collectionExists);
  console.log('Total Logs:', diagnostics.totalLogs);
  console.log('Recent 5 Logs:', diagnostics.recentLogs);
  console.log('Recent DELETE_GRADE Logs:', diagnostics.deleteLogs);
  if (diagnostics.errors.length > 0) {
    console.error('Errors:', diagnostics.errors);
  }
  console.log('======================================');

  return diagnostics;
};

export const testDeleteLogging = async (userId: string) => {
  try {
    console.log('Testing delete logging...');
    const testLog = await pb.collection('activity_logs').create({
      user_id: userId,
      action_type: 'DELETE_GRADE',
      record_id: 'test-grade-id',
      old_value: JSON.stringify({ grade_value: 100, subject: 'Math' }),
      new_value: JSON.stringify({}),
      timestamp: new Date().toISOString(),
      ip_address: '127.0.0.1',
    });
    console.log('✓ Test log created successfully:', testLog);
    return { success: true, log: testLog };
  } catch (error: any) {
    console.error('✗ Failed to create test log:', error);
    return { success: false, error: error.message, details: error.response?.data };
  }
};

/**
 * Diagnostic tool to check password reset configuration
 * Usage: Call this in browser console to get detailed diagnostics
 * Example: await diagnosePasswordResetIssue()
 */
export const diagnosePasswordResetIssue = async () => {
  console.group('🔍 PASSWORD RESET DIAGNOSTIC');

  try {
    // 1. Check current auth status
    console.group('1️⃣ Authentication Status');
    const currentUser = pb.authStore.record;
    console.log('Current user:', {
      authenticated: pb.authStore.isValid,
      userId: currentUser?.id,
      email: currentUser?.email,
      role: currentUser?.role,
      token: pb.authStore.token ? '✅ Present' : '❌ Missing',
    });
    console.groupEnd();

    // 2. Check if user has admin role
    console.group('2️⃣ Admin Role Check');
    if (!currentUser || currentUser.role !== 'admin') {
      console.error('❌ FAILED: Current user is NOT an admin!');
      console.log('Current role:', currentUser?.role);
      console.log('✓ Fix: Log in with an admin account');
    } else {
      console.log('✅ PASSED: Current user is admin');
    }
    console.groupEnd();

    // 3. Test basic user fetch
    console.group('3️⃣ Users Collection Read Access');
    try {
      const users = await pb.collection('users').getFullList({ limit: 1 });
      console.log('✅ Can fetch users:', users.length > 0 ? `Found ${users.length}` : 'No users');
      if (users.length > 0) {
        console.log('Sample user:', { id: users[0].id, email: users[0].email, role: users[0].role });
      }
    } catch (err: any) {
      console.error('❌ Cannot fetch users:', err.message);
    }
    console.groupEnd();

    // 4. Test updating own user record (safe test)
    console.group('4️⃣ Update Permission Test (empty update)');
    if (!currentUser) {
      console.error('❌ No current user to test with');
    } else {
      try {
        console.log('Testing update with empty data (safe, checks permissions only)...');
        await pb.collection('users').update(currentUser.id, {});
        console.log('✅ PASSED: Users collection allows updates');
      } catch (err: any) {
        console.error('❌ FAILED: Users collection does not allow updates');
        console.error('Error:', err.message);
        console.error('Status:', err.status);
        console.error('Data:', err.data);
      }
    }
    console.groupEnd();

    // 5. Test password field update
    console.group('5️⃣ Password Field Update Test');
    if (!currentUser) {
      console.error('❌ No current user to test with');
    } else {
      try {
        // Create a valid test password
        const testPassword = 'TestPassword123!@#';
        console.log('Testing password field update with test password...');
        
        const response = await pb.collection('users').update(currentUser.id, {
          password: testPassword,
        });
        console.log('✅ PASSED: Can update password field');
        console.log('Response ID:', response.id);
      } catch (err: any) {
        console.error('❌ FAILED: Cannot update password field');
        console.error('Message:', err.message);
        console.error('Status:', err.status);
        console.error('Data:', err.data);
        if (err.status === 400) {
          console.error('ℹ️ 400 Error - Likely causes:');
          console.error('  1. API rule "Update records" is still set to "false"');
          console.error('  2. API rule was not saved properly in PocketBase');
          console.error('  3. PocketBase needs to be restarted');
          console.error('  4. User does not actually have admin role in database');
        } else if (err.status === 403) {
          console.error('ℹ️ 403 Error - Permission denied by API rules');
        }
      }
    }
    console.groupEnd();

    // 6. Check PocketBase connectivity
    console.group('6️⃣ PocketBase Connectivity');
    try {
      const health = await pb.health.check();
      console.log('✅ PocketBase is running and responding');
      console.log('Health status:', health);
    } catch (err: any) {
      console.error('❌ Cannot connect to PocketBase');
      console.error('Error:', err.message);
      console.error('URL:', pb.baseUrl);
    }
    console.groupEnd();

  } catch (error) {
    console.error('Diagnostic error:', error);
  }

  console.groupEnd();
  console.log('📋 Diagnostic complete. Check the logs above for issues.');
  console.log('💡 Next steps: Fix any ❌ FAILED items in the diagnostic above');
};
