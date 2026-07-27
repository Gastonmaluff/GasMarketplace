import { describe, expect, it } from 'vitest';

import { buildImagePath, validateImageFile } from './images';

function fakeFile(type: string, sizeBytes: number): File {
  const file = new File(['x'], 'foto original con espacios.png', { type });
  Object.defineProperty(file, 'size', { value: sizeBytes });
  return file;
}

describe('validateImageFile', () => {
  it('acepta JPEG, PNG y WebP dentro del límite', () => {
    for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
      expect(validateImageFile(fakeFile(type, 1024))).toBeNull();
    }
  });

  it('rechaza otros MIME', () => {
    expect(validateImageFile(fakeFile('image/gif', 1024))).toMatch(/JPEG/);
    expect(validateImageFile(fakeFile('application/pdf', 1024))).toMatch(/JPEG/);
  });

  it('rechaza archivos de más de 5 MB', () => {
    expect(validateImageFile(fakeFile('image/png', 6 * 1024 * 1024))).toMatch(/5 MB/);
  });
});

describe('buildImagePath', () => {
  it('genera nombres seguros bajo el prefijo indicado, sin usar el nombre original', () => {
    const path = buildImagePath('categories/abc123', fakeFile('image/webp', 10));
    expect(path).toMatch(/^categories\/abc123\/[0-9a-f-]{36}\.webp$/u);
    expect(path).not.toContain('foto original');
  });
});
