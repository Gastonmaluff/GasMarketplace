import { describe, expect, it } from 'vitest';

import { listCategories, saveCategory } from './category.service';
import { CatalogError } from '../shared/catalog-context';

const validDraft = {
  name: 'Bebidas',
  slug: 'bebidas',
  description: '',
  icon: '' as const,
  order: 0,
  active: true,
};

describe('category.service sin Firebase configurado', () => {
  it('el listado falla con CatalogError entendible', async () => {
    await expect(listCategories()).rejects.toBeInstanceOf(CatalogError);
  });

  it('el guardado valida el borrador antes de tocar Firestore', async () => {
    await expect(
      saveCategory({ draft: { ...validDraft, slug: 'Bebidas!' } }),
    ).rejects.toMatchObject({ name: 'CatalogError' });
  });

  it('un borrador válido igualmente exige sesión de Firebase', async () => {
    await expect(saveCategory({ draft: validDraft })).rejects.toBeInstanceOf(CatalogError);
  });
});
