import PocketBase from "pocketbase";

export const pb = new PocketBase("http://127.0.0.1:8090");

// optional auto cancel duplicate requests
pb.autoCancellation(false);

// Get current authenticated user
export const getCurrentUser = () => {
  return pb.authStore.record;
};

// Get current user ID
export const getCurrentUserId = (): string => {
  const user = pb.authStore.record;
  if (!user?.id) {
    throw new Error('No authenticated user found. Please log in first.');
  }
  return user.id;
};

// Validate that user exists in database
export const validateUserExists = async (userId: string): Promise<boolean> => {
  try {
    await pb.collection('users').getOne(userId);
    return true;
  } catch (error) {
    console.error(`User ${userId} not found in database:`, error);
    return false;
  }
};