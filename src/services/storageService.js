
import { supabase } from '@/lib/supabaseClient';
import { compressImage } from '@/components/utils/imageCompression';
import { toast } from 'sonner';

// Mapping "Human Name" -> "Bucket ID"
// Based on user screenshot:
// "Image app" -> image-app
// "logo restaurant" -> logo-restaurant
// "image restaurant" -> image-restaurant
export const BUCKETS = {
    APP: 'image-app',
    LOGO: 'logo-restaurant',
    RESTAURANT: 'image-restaurant'
};

/**
 * Upload a file to Supabase Storage
 * @param {File} file - The file to upload
 * @param {string} bucketId - The bucket ID
 * @param {string} folderPath - Optional path/folder within the bucket
 * @returns {Promise<string>} - Public URL of the uploaded file
 */
export async function uploadImage(file, bucketId, folderPath = '') {
    try {
        if (!file) throw new Error('Aucun fichier sélectionné');

        // 1. Compress image
        const compressedFile = await compressImage(file);

        // 2. Generate unique path
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

        // 3. Upload to Supabase
        const { data, error } = await supabase.storage
            .from(bucketId)
            .upload(filePath, compressedFile, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error(`Upload error to bucket "${bucketId}":`, error);
            throw new Error(`Erreur upload (${bucketId}): ${error.message}`);
        }

        // 4. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucketId)
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (error) {
        console.error('Storage Service Error:', error);
        throw error;
    }
}

export const storageService = {
    // Upload generic app image (Hero, Banner)
    uploadAppImage: async (file) => {
        return uploadImage(file, BUCKETS.APP);
    },

    // Upload Logo
    uploadLogo: async (file) => {
        return uploadImage(file, BUCKETS.LOGO);
    },

    // Upload Restaurant Photo (Cover, Gallery)
    uploadRestaurantImage: async (file, restaurantId) => {
        const path = restaurantId ? `restaurants/${restaurantId}` : 'temp';
        return uploadImage(file, BUCKETS.RESTAURANT, path);
    }
};

export default storageService;
