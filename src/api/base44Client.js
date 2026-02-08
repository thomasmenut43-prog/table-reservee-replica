// Database client - Standalone version (replaces Base44 SDK)
// Uses localStorage for data persistence

import db, { entities, auth, functions } from '@/services/localStorageService';

// Export with same interface as original base44 client
export const base44 = {
  entities,
  auth,
  functions
};

export default base44;
