import { describe, expect, it } from 'vitest';

import { adjustStock, listProducts, saveProduct } from './product.service';
import { CatalogError } from '../shared/catalog-context';
import type { ProductDraft } from './product.types';

const validDraft: ProductDraft = {
  name: 'Yerba Mate',
  slug: 'yerba-mate',
  shortDescription: '',
  description: '',
  sku: '',
  barcode: '',
  categoryIds: [],
  primaryCategoryId: '',
  price: 25000,
  compareAtPrice: null,
  costPrice: null,
  stock: 5,
  lowStockThreshold: null,
  trackStock: true,
  allowBackorder: false,
  featured: false,
  active: true,
};

describe('product.service sin Firebase configurado', () => {
  it('el listado falla con CatalogError entendible', async () => {
    await expect(listProducts()).rejects.toBeInstanceOf(CatalogError);
  });

  it('el guardado valida el borrador antes de tocar Firestore', async () => {
    await expect(
      saveProduct({ draft: { ...validDraft, price: -10 }, images: [] }),
    ).rejects.toMatchObject({ name: 'CatalogError' });
  });

  it('un borrador válido igualmente exige sesión de Firebase', async () => {
    await expect(saveProduct({ draft: validDraft, images: [] })).rejects.toBeInstanceOf(
      CatalogError,
    );
  });

  it('el ajuste de stock valida entero y motivo antes de tocar Firestore', async () => {
    await expect(
      adjustStock({ productId: 'x', newStock: 1.5, reason: 'recuento' }),
    ).rejects.toMatchObject({ name: 'CatalogError' });
    await expect(adjustStock({ productId: 'x', newStock: 3, reason: '  ' })).rejects.toMatchObject({
      name: 'CatalogError',
    });
  });
});
