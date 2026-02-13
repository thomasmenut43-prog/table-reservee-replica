// Database client - Standalone version (replaces Base44 SDK)
// Uses Supabase (DB + Storage) for persistence

import db, { entities, auth, functions } from '@/services/localStorageService';
import { uploadFile } from '@/services/uploadService';

// Export with same interface as original base44 client
export const base44 = {
  entities,
  auth,
  functions,
  integrations: {
    Core: {
      /**
       * Upload un fichier vers Supabase Storage.
       * @param {{ file: File, folder?: string }} options
       * @returns {Promise<{ file_url: string }>}
       */
      UploadFile: async ({ file, folder }) => {
        return uploadFile({ file, folder: folder || 'misc' });
      },
      InvokeLLM: async () => {
        console.warn('Core.InvokeLLM non implémenté (ex-base44)');
        return null;
      }
    }
  }
};

export default base44;
