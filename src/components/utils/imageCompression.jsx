import imageCompression from 'browser-image-compression';

/**
 * Compresse une image avant upload
 * @param {File} file - Le fichier image à compresser
 * @param {Object} options - Options de compression
 * @returns {Promise<File>} - Le fichier compressé
 */
export async function compressImage(file, options = {}) {
  const defaultOptions = {
    maxSizeMB: 0.5,          // Taille max 500KB
    maxWidthOrHeight: 1920,  // Dimension max 1920px
    useWebWorker: true,
    fileType: 'image/jpeg',  // Convertir en JPEG pour meilleure compression
    initialQuality: 0.8      // Qualité à 80%
  };

  const compressionOptions = { ...defaultOptions, ...options };

  try {
    const compressedFile = await imageCompression(file, compressionOptions);
    console.log(`Image compressée: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
    return compressedFile;
  } catch (error) {
    console.error('Erreur de compression:', error);
    return file; // Retourner le fichier original en cas d'erreur
  }
}