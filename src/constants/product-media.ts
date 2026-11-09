import type { ImageSource } from 'expo-image';

/** Fotografías autorizadas por ID de public.platos, sin cambiar el esquema.
 * Ejemplo de incorporación futura: 'uuid-del-plato': require('@/assets/images/foto-autorizada.jpg').
 * Sin fotografía, ProductArt muestra una ilustración local identificada como tal.
 */
export const productPhotos: Record<string, ImageSource> = {};
