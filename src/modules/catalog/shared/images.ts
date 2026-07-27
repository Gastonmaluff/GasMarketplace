import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
  type FirebaseStorage,
} from 'firebase/storage';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const EXTENSIONS: Readonly<Record<string, string>> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export interface StoredImage {
  url: string;
  path: string;
}

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return 'Solo se permiten imágenes JPEG, PNG o WebP.';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'La imagen supera el máximo de 5 MB.';
  }
  return null;
}

/** Nombre seguro generado; nunca se usa el nombre original del archivo. */
export function buildImagePath(prefix: string, file: File): string {
  const extension = EXTENSIONS[file.type] ?? 'bin';
  return `${prefix}/${crypto.randomUUID()}.${extension}`;
}

export function uploadImage(
  storage: FirebaseStorage,
  path: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<StoredImage> {
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(ref(storage, path), file, { contentType: file.type });
    task.on(
      'state_changed',
      (snapshot) => {
        onProgress?.(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
      },
      reject,
      () => {
        getDownloadURL(task.snapshot.ref)
          .then((url) => resolve({ url, path }))
          .catch(reject);
      },
    );
  });
}

/** Borrado best-effort: los huérfanos no deben romper el flujo principal. */
export async function deleteImageQuietly(storage: FirebaseStorage, path: string): Promise<void> {
  try {
    await deleteObject(ref(storage, path));
  } catch {
    // El objeto puede no existir; se ignora deliberadamente.
  }
}
