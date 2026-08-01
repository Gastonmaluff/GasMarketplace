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
import { deleteSupplier, listSuppliers, setSupplierActive } from '../supplier.service';
import type { Supplier } from '../supplier.types';

type ActivityFilter = 'all' | 'active' | 'inactive';

export function AdminSuppliersPage() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState('');
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');
  const [pendingDelete, setPendingDelete] = useState<Supplier | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listSuppliers()
      .then((loaded) => {
        if (!cancelled) setSuppliers(loaded);
      })
      .catch(() => {
        if (!cancelled) setLoadError('No se pudieron cargar los proveedores.');
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const reload = useCallback(() => {
    setSuppliers(null);
    setLoadError(null);
    setReloadKey((key) => key + 1);
  }, []);

  const visibleSuppliers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return (suppliers ?? []).filter((supplier) => {
      if (activityFilter === 'active' && !supplier.active) return false;
      if (activityFilter === 'inactive' && supplier.active) return false;
      if (normalizedSearch === '') return true;
      return supplier.normalizedName.includes(normalizedSearch);
    });
  }, [activityFilter, suppliers, search]);

  async function toggleActive(supplier: Supplier) {
    setBusyId(supplier.id);
    setActionError(null);
    try {
      await setSupplierActive(supplier.id, !supplier.active);
      setToast(supplier.active ? 'Proveedor desactivado.' : 'Proveedor activado.');
      reload();
    } catch (cause) {
      setActionError(
        cause instanceof CatalogError ? cause.message : 'No se pudo actualizar el proveedor.',
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
      await deleteSupplier(pendingDelete.id);
      setToast('Proveedor eliminado.');
      setPendingDelete(null);
      reload();
    } catch (cause) {
      setActionError(
        cause instanceof CatalogError ? cause.message : 'No se pudo eliminar el proveedor.',
      );
      setPendingDelete(null);
    } finally {
      setBusyId(null);
    }
  }

  const columns: readonly DataTableColumn<Supplier>[] = [
    {
      key: 'name',
      header: 'Proveedor',
      render: (supplier) => (
        <div className="cell-title">
          <div>
            <strong>{supplier.name}</strong>
            {supplier.contactName ? <small>{supplier.contactName}</small> : null}
          </div>
        </div>
      ),
      sortValue: (supplier) => supplier.normalizedName,
    },
    {
      key: 'phone',
      header: 'Teléfono',
      render: (supplier) => supplier.phone ?? '—',
    },
    {
      key: 'status',
      header: 'Estado',
      render: (supplier) => (
        <Badge tone={supplier.active ? 'success' : 'neutral'}>
          {supplier.active ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
      sortValue: (supplier) => (supplier.active ? 0 : 1),
    },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'right',
      render: (supplier) => (
        <div className="row-actions">
          <Button
            onClick={() => navigate(`/admin/proveedores/${supplier.id}`)}
            size="small"
            variant="ghost"
          >
            Editar
          </Button>
          <Button
            loading={busyId === supplier.id}
            onClick={() => void toggleActive(supplier)}
            size="small"
            variant="secondary"
          >
            {supplier.active ? 'Desactivar' : 'Activar'}
          </Button>
          <Button onClick={() => setPendingDelete(supplier)} size="small" variant="danger">
            Eliminar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-page admin-page--wide">
      <PageHeader
        breadcrumbs={[{ label: 'Inicio', href: '/admin' }, { label: 'Proveedores' }]}
        description="Proveedores para asignar a los productos (uso interno)."
        primaryAction={
          <Link className="button button--primary" to="/admin/proveedores/nuevo">
            Nuevo proveedor
          </Link>
        }
        title="Proveedores"
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
          placeholder="Nombre del proveedor"
          type="search"
          value={search}
        />
        <div className="text-field">
          <label htmlFor="supplier-activity-filter">Estado</label>
          <select
            className="text-field__input"
            id="supplier-activity-filter"
            onChange={(event) => setActivityFilter(event.currentTarget.value as ActivityFilter)}
            value={activityFilter}
          >
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        emptyDescription="Creá el primer proveedor para asignarlo a los productos."
        emptyTitle="Sin proveedores"
        error={loadError ?? undefined}
        getRowKey={(supplier) => supplier.id}
        initialSortKey="name"
        loading={suppliers === null && !loadError}
        pageSize={10}
        rows={visibleSuppliers}
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
          Los productos que ya lo tengan asignado conservan el nombre del proveedor; solo dejará de
          estar disponible para nuevas asignaciones.
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
