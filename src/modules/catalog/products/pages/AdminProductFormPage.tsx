import { useEffect, useId, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { appConfig } from '../../../../config/app.config';
import { Alert } from '../../../../components/ui/Alert';
import { Button } from '../../../../components/ui/Button';
import { Icon } from '../../../../components/ui/Icon';
import { LoadingState } from '../../../../components/ui/LoadingState';
import { NumericInput } from '../../../../components/ui/inputs/NumericInput';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { TextField } from '../../../../components/ui/TextField';
import { Toast } from '../../../../components/ui/Toast';
import { slugify } from '../../shared/text';
import { CatalogError } from '../../shared/catalog-context';
import { CategoryQuickCreateModal } from '../../categories/components/CategoryQuickCreateModal';
import { listCategories } from '../../categories/category.service';
import type { Category } from '../../categories/category.types';
import { SupplierQuickCreateModal } from '../../suppliers/components/SupplierQuickCreateModal';
import { listSuppliers } from '../../suppliers/supplier.service';
import type { Supplier } from '../../suppliers/supplier.types';
import { ProductImagesEditor } from '../components/ProductImagesEditor';
import { adjustStock, getProduct, listStockMovements, saveProduct } from '../product.service';
import {
  MAX_PRODUCT_CATEGORIES,
  type EditableProductImage,
  type ProductDraft,
  type StockMovement,
} from '../product.types';

const emptyDraft: ProductDraft = {
  name: '',
  slug: '',
  shortDescription: '',
  description: '',
  sku: '',
  barcode: '',
  categoryIds: [],
  primaryCategoryId: '',
  price: null,
  compareAtPrice: null,
  costPrice: null,
  supplierId: '',
  supplierName: '',
  internalNotes: '',
  stock: 0,
  lowStockThreshold: null,
  trackStock: true,
  allowBackorder: false,
  featured: false,
  active: true,
};

function formatMovementDate(millis?: number): string {
  if (!millis) return '—';
  return new Intl.DateTimeFormat(appConfig.locale, {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: appConfig.timezone,
  }).format(new Date(millis));
}

export function AdminProductFormPage() {
  const navigate = useNavigate();
  const descriptionId = useId();
  const { id: productId } = useParams<{ id: string }>();
  const isNew = productId === undefined;

  const [draft, setDraft] = useState<ProductDraft | null>(isNew ? emptyDraft : null);
  const [images, setImages] = useState<EditableProductImage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [dirty, setDirty] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [imageProgress, setImageProgress] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);

  const [newStock, setNewStock] = useState<number | null>(null);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loads: Promise<void>[] = [
      listCategories().then((loaded) => {
        if (!cancelled) setCategories(loaded);
      }),
      listSuppliers().then((loaded) => {
        if (!cancelled) setSuppliers(loaded);
      }),
    ];
    if (!isNew) {
      loads.push(
        getProduct(productId).then((product) => {
          if (cancelled) return;
          if (!product) {
            setLoadError('El producto no existe.');
            return;
          }
          setDraft({
            name: product.name,
            slug: product.slug,
            shortDescription: product.shortDescription,
            description: product.description,
            sku: product.sku ?? '',
            barcode: product.barcode ?? '',
            categoryIds: product.categoryIds,
            primaryCategoryId: product.primaryCategoryId ?? '',
            price: product.price,
            compareAtPrice: product.compareAtPrice ?? null,
            costPrice: product.costPrice ?? null,
            supplierId: product.supplierId ?? '',
            supplierName: product.supplierName ?? '',
            internalNotes: product.internalNotes ?? '',
            stock: product.stock,
            lowStockThreshold: product.lowStockThreshold ?? null,
            trackStock: product.trackStock,
            allowBackorder: product.allowBackorder,
            featured: product.featured,
            active: product.active,
          });
          setImages(
            [...product.images]
              .sort((first, second) => first.order - second.order)
              .map((image) => ({
                id: image.id,
                alt: image.alt,
                isPrimary: image.isPrimary,
                url: image.url,
                path: image.path,
              })),
          );
        }),
        listStockMovements(productId).then((loaded) => {
          if (!cancelled) setMovements(loaded);
        }),
      );
    }
    Promise.all(loads).catch(() => {
      if (!cancelled) setLoadError('No se pudo cargar la información del producto.');
    });
    return () => {
      cancelled = true;
    };
  }, [isNew, productId, reloadKey]);

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  if (loadError) {
    return (
      <div className="admin-page">
        <Alert title="Error" tone="danger">
          {loadError}
        </Alert>
        <Button onClick={() => navigate('/admin/productos')} variant="secondary">
          Volver a productos
        </Button>
      </div>
    );
  }

  if (!draft) {
    return <LoadingState label="Cargando producto" />;
  }

  const update = (patch: Partial<ProductDraft>) => {
    setDirty(true);
    setDraft((current) => (current ? { ...current, ...patch } : current));
  };
  const updateImages = (next: EditableProductImage[]) => {
    setDirty(true);
    setImages(next);
  };

  const handleCategoryCreated = (category: Category) => {
    setCategories((current) =>
      [...current, category].sort(
        (first, second) => first.order - second.order || first.name.localeCompare(second.name),
      ),
    );
    setCategoryModalOpen(false);
    if (draft.categoryIds.length >= MAX_PRODUCT_CATEGORIES) {
      setToast('Categoría creada. Quitá alguna para poder asignarla a este producto.');
      return;
    }
    const nextIds = [...draft.categoryIds, category.id];
    update({
      categoryIds: nextIds,
      primaryCategoryId: draft.primaryCategoryId === '' ? category.id : draft.primaryCategoryId,
    });
  };

  const handleSupplierCreated = (supplier: Supplier) => {
    setSuppliers((current) =>
      [...current, supplier].sort((first, second) =>
        first.normalizedName.localeCompare(second.normalizedName),
      ),
    );
    setSupplierModalOpen(false);
    update({ supplierId: supplier.id, supplierName: supplier.name });
  };

  const toggleCategory = (categoryId: string, selected: boolean) => {
    const nextIds = selected
      ? [...draft.categoryIds, categoryId]
      : draft.categoryIds.filter((id) => id !== categoryId);
    update({
      categoryIds: nextIds,
      primaryCategoryId:
        !selected && draft.primaryCategoryId === categoryId
          ? (nextIds[0] ?? '')
          : draft.primaryCategoryId === '' && nextIds.length === 1
            ? nextIds[0]!
            : draft.primaryCategoryId,
    });
  };

  async function handleSave() {
    if (!draft || saving) return;
    setErrors([]);
    setSaving(true);
    setImageProgress({});
    try {
      await saveProduct({
        ...(productId ? { productId } : {}),
        draft,
        images,
        onImageProgress: (imageId, percent) =>
          setImageProgress((current) => ({ ...current, [imageId]: percent })),
      });
      setDirty(false);
      navigate('/admin/productos');
    } catch (cause) {
      setErrors(
        cause instanceof CatalogError
          ? cause.errors
          : ['No se pudo guardar el producto. Intentá nuevamente.'],
      );
    } finally {
      setSaving(false);
      setImageProgress({});
    }
  }

  async function handleAdjustStock() {
    if (!productId || adjusting || newStock === null) return;
    setAdjustError(null);
    setAdjusting(true);
    try {
      await adjustStock({ productId, newStock, reason: adjustReason });
      setToast('Ajuste de stock registrado.');
      setNewStock(null);
      setAdjustReason('');
      setReloadKey((key) => key + 1);
    } catch (cause) {
      setAdjustError(
        cause instanceof CatalogError ? cause.message : 'No se pudo registrar el ajuste.',
      );
    } finally {
      setAdjusting(false);
    }
  }

  return (
    <div className="admin-page">
      <PageHeader
        breadcrumbs={[
          { label: 'Inicio', href: '/admin' },
          { label: 'Productos', href: '/admin/productos' },
          { label: isNew ? 'Nuevo' : 'Editar' },
        ]}
        primaryAction={
          <Button loading={saving} loadingLabel="Guardando" onClick={() => void handleSave()}>
            Guardar producto
          </Button>
        }
        title={isNew ? 'Nuevo producto' : `Editar: ${draft.name || 'producto'}`}
      />

      {errors.length > 0 ? (
        <Alert onDismiss={() => setErrors([])} title="Revisá estos puntos" tone="danger">
          {errors.join(' ')}
        </Alert>
      ) : null}

      <section className="admin-section" aria-labelledby="product-basics">
        <h2 id="product-basics">Datos básicos</h2>
        <div className="form-grid">
          <TextField
            label="Nombre"
            onChange={(event) => {
              const name = event.currentTarget.value;
              // El slug (URL) se genera solo desde el nombre en productos nuevos y
              // se congela al editar para no romper enlaces ya publicados.
              update(isNew ? { name, slug: slugify(name) } : { name });
            }}
            required
            value={draft.name}
          />
          <TextField
            helpText="Opcional; identificador interno único."
            label="Código interno (SKU)"
            onChange={(event) => update({ sku: event.currentTarget.value })}
            value={draft.sku}
          />
          <div className="field--full">
            <TextField
              helpText="Resumen corto para listados (máximo 200 caracteres)."
              label="Descripción breve"
              onChange={(event) => update({ shortDescription: event.currentTarget.value })}
              value={draft.shortDescription}
            />
          </div>
          <div className="field--full text-field">
            <label htmlFor={descriptionId}>Descripción completa</label>
            <textarea
              className="text-field__input"
              id={descriptionId}
              onChange={(event) => update({ description: event.currentTarget.value })}
              rows={5}
              value={draft.description}
            />
          </div>
          <TextField
            helpText="Opcional; debe ser único."
            label="Código de barras"
            onChange={(event) => update({ barcode: event.currentTarget.value })}
            value={draft.barcode}
          />
        </div>
      </section>

      <section className="admin-section" aria-labelledby="product-categories">
        <div className="admin-section__heading">
          <h2 id="product-categories">Categorías</h2>
          <Button onClick={() => setCategoryModalOpen(true)} size="small" variant="secondary">
            Nueva categoría
          </Button>
        </div>
        {categories.length === 0 ? (
          <p className="admin-page__note">
            Todavía no hay categorías. Creá una con “Nueva categoría” o desde la sección Categorías.
          </p>
        ) : (
          <>
            <div className="picker">
              <button
                aria-expanded={categoryPickerOpen}
                className="picker__trigger"
                onClick={() => setCategoryPickerOpen((open) => !open)}
                type="button"
              >
                <span>
                  {draft.categoryIds.length === 0
                    ? 'Seleccionar categorías'
                    : `${draft.categoryIds.length} de ${MAX_PRODUCT_CATEGORIES} seleccionada${
                        draft.categoryIds.length === 1 ? '' : 's'
                      }`}
                </span>
                <Icon name="chevron-down" />
              </button>
              {categoryPickerOpen ? (
                <>
                  <div
                    className="picker__backdrop"
                    onClick={() => setCategoryPickerOpen(false)}
                    role="presentation"
                  />
                  <div className="picker__panel">
                    {categories.map((category) => {
                      const selected = draft.categoryIds.includes(category.id);
                      return (
                        <label className="checkbox-field" key={category.id}>
                          <input
                            checked={selected}
                            disabled={
                              !selected && draft.categoryIds.length >= MAX_PRODUCT_CATEGORIES
                            }
                            onChange={(event) =>
                              toggleCategory(category.id, event.currentTarget.checked)
                            }
                            type="checkbox"
                          />
                          <span>
                            {category.name}
                            {category.active ? null : <small>Inactiva</small>}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </>
              ) : null}
            </div>
            {draft.categoryIds.length > 0 ? (
              <div className="chip-list">
                {draft.categoryIds.map((categoryId) => {
                  const category = categories.find((item) => item.id === categoryId);
                  return (
                    <span className="chip" key={categoryId}>
                      {category?.name ?? categoryId}
                      <button
                        aria-label={`Quitar ${category?.name ?? 'categoría'}`}
                        onClick={() => toggleCategory(categoryId, false)}
                        type="button"
                      >
                        <Icon name="close" />
                      </button>
                    </span>
                  );
                })}
              </div>
            ) : null}
            {draft.categoryIds.length > 0 ? (
              <div className="text-field">
                <label htmlFor="primary-category">Categoría principal</label>
                <select
                  className="text-field__input"
                  id="primary-category"
                  onChange={(event) => update({ primaryCategoryId: event.currentTarget.value })}
                  value={draft.primaryCategoryId}
                >
                  <option value="">Sin categoría principal</option>
                  {draft.categoryIds.map((categoryId) => (
                    <option key={categoryId} value={categoryId}>
                      {categories.find((category) => category.id === categoryId)?.name ??
                        categoryId}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </>
        )}
      </section>

      <section className="admin-section" aria-labelledby="product-pricing">
        <h2 id="product-pricing">Precios (₲ enteros)</h2>
        <div className="form-grid">
          <NumericInput
            allowEmpty={false}
            currency={appConfig.currency}
            label="Precio de venta"
            min={0}
            onValueChange={(value) => update({ price: value })}
            value={draft.price}
          />
          <NumericInput
            currency={appConfig.currency}
            helpText="Opcional; debe ser mayor al precio de venta."
            label="Precio anterior"
            min={0}
            onValueChange={(value) => update({ compareAtPrice: value })}
            value={draft.compareAtPrice}
          />
          <NumericInput
            currency={appConfig.currency}
            helpText="Uso interno; no se muestra en la tienda."
            label="Costo interno"
            min={0}
            onValueChange={(value) => update({ costPrice: value })}
            value={draft.costPrice}
          />
          <div className="text-field">
            <label htmlFor="product-supplier">Proveedor</label>
            <div className="field-with-action">
              <select
                className="text-field__input"
                id="product-supplier"
                onChange={(event) => {
                  const supplierId = event.currentTarget.value;
                  const supplier = suppliers.find((item) => item.id === supplierId);
                  update({ supplierId, supplierName: supplier?.name ?? '' });
                }}
                value={draft.supplierId}
              >
                <option value="">Sin proveedor</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                    {supplier.active ? '' : ' (inactivo)'}
                  </option>
                ))}
                {draft.supplierId && !suppliers.some((item) => item.id === draft.supplierId) ? (
                  <option value={draft.supplierId}>
                    {draft.supplierName || 'Proveedor actual'}
                  </option>
                ) : null}
              </select>
              <Button
                onClick={() => setSupplierModalOpen(true)}
                size="small"
                type="button"
                variant="secondary"
              >
                Nuevo proveedor
              </Button>
            </div>
            <small className="text-field__message">Uso interno; no se muestra en la tienda.</small>
          </div>
          <div className="field--full text-field">
            <label htmlFor="product-internal-notes">Notas internas</label>
            <textarea
              className="text-field__input"
              id="product-internal-notes"
              onChange={(event) => update({ internalNotes: event.currentTarget.value })}
              rows={3}
              value={draft.internalNotes}
            />
          </div>
        </div>
      </section>

      <section className="admin-section" aria-labelledby="product-stock">
        <h2 id="product-stock">Stock</h2>
        <div className="form-grid">
          <label className="checkbox-field">
            <input
              checked={draft.trackStock}
              onChange={(event) => update({ trackStock: event.currentTarget.checked })}
              type="checkbox"
            />
            <span>
              Controlar stock<small>Descuenta unidades y avisa cuando queda poco.</small>
            </span>
          </label>
          <label className="checkbox-field">
            <input
              checked={draft.allowBackorder}
              onChange={(event) => update({ allowBackorder: event.currentTarget.checked })}
              type="checkbox"
            />
            <span>
              Permitir venta sin stock<small>Acepta pedidos aunque el stock llegue a cero.</small>
            </span>
          </label>
          <NumericInput
            allowEmpty={false}
            helpText={isNew ? 'Stock inicial.' : 'Para corregir stock usá el ajuste de más abajo.'}
            label="Stock actual"
            onValueChange={(value) => update({ stock: value })}
            value={draft.stock}
            {...(isNew ? {} : { disabled: true })}
          />
          <NumericInput
            helpText="Vacío usa el umbral general de Configuración."
            label="Umbral de stock bajo"
            min={0}
            onValueChange={(value) => update({ lowStockThreshold: value })}
            value={draft.lowStockThreshold}
          />
        </div>
      </section>

      <section className="admin-section" aria-labelledby="product-visibility">
        <h2 id="product-visibility">Visibilidad</h2>
        <div className="admin-section__toggles">
          <label className="checkbox-field">
            <input
              checked={draft.active}
              onChange={(event) => update({ active: event.currentTarget.checked })}
              type="checkbox"
            />
            <span>
              Activo<small>Solo los productos activos serán visibles en la tienda.</small>
            </span>
          </label>
          <label className="checkbox-field">
            <input
              checked={draft.featured}
              onChange={(event) => update({ featured: event.currentTarget.checked })}
              type="checkbox"
            />
            <span>
              Destacado<small>Aparecerá en la portada de la tienda.</small>
            </span>
          </label>
        </div>
      </section>

      <section className="admin-section" aria-labelledby="product-images-title">
        <h2 id="product-images-title">Imágenes</h2>
        <ProductImagesEditor
          disabled={saving}
          images={images}
          onChange={updateImages}
          onError={(message) => setErrors((current) => [...new Set([...current, message])])}
          progressById={imageProgress}
        />
      </section>

      {!isNew ? (
        <section className="admin-section" aria-labelledby="product-stock-adjust">
          <h2 id="product-stock-adjust">Ajuste manual de stock</h2>
          <p className="admin-page__note">
            Stock actual: <strong>{draft.stock}</strong>. El ajuste queda registrado en los
            movimientos.
          </p>
          {adjustError ? (
            <Alert
              onDismiss={() => setAdjustError(null)}
              title="Ajuste no registrado"
              tone="danger"
            >
              {adjustError}
            </Alert>
          ) : null}
          <div className="form-grid">
            <NumericInput label="Stock nuevo" onValueChange={setNewStock} value={newStock} />
            <TextField
              label="Motivo"
              onChange={(event) => setAdjustReason(event.currentTarget.value)}
              placeholder="Ej.: recuento físico, rotura, carga inicial"
              required
              value={adjustReason}
            />
          </div>
          <div>
            <Button
              loading={adjusting}
              loadingLabel="Registrando"
              onClick={() => void handleAdjustStock()}
              variant="secondary"
            >
              Registrar ajuste
            </Button>
          </div>
          {movements.length > 0 ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Cambio</th>
                    <th>Antes</th>
                    <th>Después</th>
                    <th>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((movement) => (
                    <tr key={movement.id}>
                      <td data-label="Fecha">{formatMovementDate(movement.createdAtMillis)}</td>
                      <td data-label="Cambio">
                        {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}
                      </td>
                      <td data-label="Antes">{movement.previousStock}</td>
                      <td data-label="Después">{movement.resultingStock}</td>
                      <td data-label="Motivo">{movement.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="admin-page__note">Sin movimientos registrados todavía.</p>
          )}
        </section>
      ) : null}

      {categoryModalOpen ? (
        <CategoryQuickCreateModal
          onClose={() => setCategoryModalOpen(false)}
          onCreated={handleCategoryCreated}
        />
      ) : null}

      {supplierModalOpen ? (
        <SupplierQuickCreateModal
          onClose={() => setSupplierModalOpen(false)}
          onCreated={handleSupplierCreated}
        />
      ) : null}

      {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}
    </div>
  );
}
