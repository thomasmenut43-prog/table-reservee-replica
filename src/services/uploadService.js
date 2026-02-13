/**
 * Service d'upload de fichiers vers Supabase Storage.
 * Remplace base44.integrations.Core.UploadFile.
 */

import { supabase } from '@/lib/supabaseClient';

const BUCKET_NAME = 'uploads';

/**
 * Génère un chemin unique pour éviter les collisions
 * @param {File} file
 * @param {string} [folder] - Sous-dossier (ex: 'restaurants', 'design')
 */
function getUploadPath(file, folder = 'misc') {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return `${folder}/${safeName}.${ext}`;
}

/**
 * Upload un fichier vers Supabase Storage.
 * @param {Object} options
 * @param {File} options.file - Fichier à uploader
 * @param {string} [options.folder] - Sous-dossier (restaurants, design, etc.)
 * @returns {Promise<{ file_url: string }>} URL publique du fichier
 */
export async function uploadFile({ file, folder = 'misc' }) {
  if (!file || !(file instanceof File)) {
    throw new Error('Un fichier valide est requis');
  }

  const path = getUploadPath(file, folder);
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Upload error:', error);
    throw new Error(error.message || 'Échec de l\'upload');
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return { file_url: urlData.publicUrl };
}

/**
 * Upload pour une photo de restaurant (cover ou galerie).
 * Utilise le dossier "restaurants".
 */
export async function uploadRestaurantImage({ file }) {
  return uploadFile({ file, folder: 'restaurants' });
}

/**
 * Upload pour le design (logo, bannière).
 * Utilise le dossier "design".
 */
export async function uploadDesignImage({ file }) {
  return uploadFile({ file, folder: 'design' });
}

export default { uploadFile, uploadRestaurantImage, uploadDesignImage };
