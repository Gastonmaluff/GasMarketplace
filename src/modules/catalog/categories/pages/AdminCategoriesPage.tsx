import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { Alert } from '../../../../components/ui/Alert';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { DataTable, type DataTableColumn } from '../../../../components/ui/DataTable';
import { Modal } from '../../../../components/ui/Modal';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { TextField } from '../../../../components/ui/TextField';
import { Toast } from '../../../../components/ui/Toast';
import { CatalogError } from '../../shared/catalog-context';
import { deleteCategory, listCategories, setCategoryActive } from '../category.service';
import type { Category } from '../category.types';

type ActivityFilter = 'all' | 'active' | 'inactive';

export function AdminCategoriesPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState('');
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listCategories()
      .then((loaded) => {
        if (!cancelled) setCategories(loaded);
      })
      .catch(() => {
        if (!cancelled) setLoadError('No se pudieron cargar las categorías.');
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const reload = useCallback(() => {
    setCategories(null);
    setLoadError(null);
    setReloadKey((key) => key + 1);
  }, []);

  const visibleCategories = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return (categories ?? []).filter((category) => {
      if (activityFilter === 'active' && !category.active) return false;
      if (activityFilter === 'inactive' && category.active) return false;
      if (normalizedSearch === '') return true;
      return (
        category.normalizedName.includes(normalizedSearch) ||
        category.slug.includes(normalizedSearch)
      );
    });
  }, [activityFilter, categories, search]);

  async function toggleActive(category: Category) {
    setBusyId(category.id);
    setActionError(null);
    try {
      await setCategoryActive(category.id, !category.active);
      setToast(category.active ? 'Categoría desactivada.' : 'Categoría activada.');
      reload();
    } catch (cause) {
      setActionError(
        cause instanceof CatalogError ? cause.message : 'No se pudo actualizar la categoría.',
      );
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setBusyId(pendingDelete.id);
    setActionError(null);
    try {
      await deleteCategory(pendingDelete.id);
      setToast('Categoría eliminada.');
      setPendingDelete(null);
      reload();
    } catch (cause) {
      setActionError(
        cause instanceof CatalogError ? cause.message : 'No se pudo eliminar la categoría.',
      );
      setPendingDelete(null);
    } finally {
      setBusyId(null);
    }
  }

  const columns: readonly DataTableColumn<Category>[] = [
    {
      key: 'order',
      header: 'Orden',
      render: (category) => category.order,
      sortValue: (category) => category.order,
    },
    {
      key: 'name',
      header: 'Categoría',
      render: (category) => (
        <div className="cell-title">
          {category.iconUrl ? (
            <img alt="" className="cell-thumb" height="36" src={category.iconUrl} width="36" />
          ) : category.imageUrl ? (
            <img alt="" className="cell-thumb" height="36" src={category.imageUrl} width="36" />
          ) : null}
          <div>
            <strong>{category.name}</strong>
            <small>/{category.slug}</small>
          </div>
        </div>
      ),
      sortValue: (category) => category.normalizedName,
    },
    {
      key: 'status',
      header: 'Estado',
      render: (category) => (
        <Badge tone={category.active ? 'success' : 'neutral'}>
          {category.active ? 'Activa' : 'Inactiva'}
        </Badge>
      ),
      sortValue: (category) => (category.active ? 0 : 1),
    },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'right',
      render: (category) => (
        <div className="row-actions">
          <Button
            onClick={() => navigate(`/admin/categorias/${category.id}`)}
            size="small"
            variant="ghost"
          >
            Editar
          </Button>
          <Button
            loading={busyId === category.id}
            onClick={() => void toggleActive(category)}
            size="small"
            variant="secondary"
          >
            {category.active ? 'Desactivar' : 'Activar'}
          </Button>
          <Button onClick={() => setPendingDelete(category)} size="small" variant="danger">
            Eliminar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-page admin-page--wide">
      <PageHeader
        breadcrumbs={[{ label: 'Inicio', href: '/admin' }, { label: 'Categorías' }]}
        description="Secciones que organizan el catálogo de la tienda."
        primaryAction={
          <Link className="button button--primary" to="/admin/categorias/nueva">
            Nueva categoría
          </Link>
        }
        title="Categorías"
      />

      {actionError ? (
        <Alert onDismiss={() => setActionError(null)} title="Acción no completada" tone="danger">
          {actionError}
        </Alert>
      ) : null}

      <div className="list-toolbar">
        <TextField
          label="Buscar"
          onChange={(event) => setSearch(event.currentTarget.value)}
          placeholder="Nombre o slug"
          type="search"
          value={search}
        />
        <div className="text-field">
          <label htmlFor="category-activity-filter">Estado</label>
          <select
            className="text-field__input"
            id="category-activity-filter"
            onChange={(event) => setActivityFilter(event.currentTarget.value as ActivityFilter)}
            value={activityFilter}
          >
            <option value="all">Todas</option>
            <option value="active">Activas</option>
            <option value="inactive">Inactivas</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        emptyDescription="Creá la primera categoría para organizar los productos."
        emptyTitle="Sin categorías"
        error={loadError ?? undefined}
        getRowKey={(category) => category.id}
        initialSortKey="order"
        loading={categories === null && !loadError}
        pageSize={10}
        rows={visibleCategories}
      />
      {loadError ? (
        <Button onClick={reload} variant="secondary">
          Reintentar
        </Button>
      ) : null}

      <Modal
        description="Esta acción no se puede deshacer."
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title={`Eliminar "${pendingDelete?.name ?? ''}"`}
      >
        <p>
          Solo se puede eliminar una categoría sin productos asociados. Si tiene productos, vas a
          ver un aviso y podés desactivarla en su lugar.
        </p>
        <div className="modal-actions">
          <Button onClick={() => setPendingDelete(null)} variant="ghost">
            Cancelar
          </Button>
          <Button
            loading={busyId === pendingDelete?.id}
            onClick={() => void confirmDelete()}
            variant="danger"
          >
            Eliminar definitivamente
          </Button>
        </div>
      </Modal>

      {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}
    </div>
  );
}
