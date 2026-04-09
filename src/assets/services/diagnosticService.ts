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
