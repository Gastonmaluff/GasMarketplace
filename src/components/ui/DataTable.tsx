import { useMemo, useState, type ReactNode } from 'react';

import { Alert } from './Alert';
import { Button } from './Button';
import { EmptyState } from './EmptyState';
import { LoadingState } from './LoadingState';

type SortDirection = 'ascending' | 'descending';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => number | string;
  align?: 'left' | 'right';
}

interface DataTableProps<T> {
  columns: readonly DataTableColumn<T>[];
  rows: readonly T[];
  getRowKey: (row: T) => string;
  emptyDescription?: string;
  emptyTitle?: string;
  error?: string;
  initialSortKey?: string;
  loading?: boolean;
  pageSize?: number;
}

export function DataTable<T>({
  columns,
  emptyDescription = 'Probá ajustar la búsqueda o los filtros.',
  emptyTitle = 'No hay resultados',
  error,
  getRowKey,
  initialSortKey,
  loading = false,
  pageSize = 3,
  rows,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState(initialSortKey);
  const [sortDirection, setSortDirection] = useState<SortDirection>('ascending');
  const [requestedPage, setRequestedPage] = useState(1);

  const sortedRows = useMemo(() => {
    const sortColumn = columns.find((column) => column.key === sortKey && column.sortValue);
    if (!sortColumn?.sortValue) return [...rows];
    return [...rows].sort((firstRow, secondRow) => {
      const firstValue = sortColumn.sortValue!(firstRow);
      const secondValue = sortColumn.sortValue!(secondRow);
      const comparison =
        typeof firstValue === 'number' && typeof secondValue === 'number'
          ? firstValue - secondValue
          : String(firstValue).localeCompare(String(secondValue));
      return sortDirection === 'ascending' ? comparison : -comparison;
    });
  }, [columns, rows, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const startIndex = (page - 1) * pageSize;
  const visibleRows = sortedRows.slice(startIndex, startIndex + pageSize);

  const changeSort = (column: DataTableColumn<T>) => {
    if (!column.sortValue) return;
    if (sortKey === column.key) {
      setSortDirection((current) => (current === 'ascending' ? 'descending' : 'ascending'));
    } else {
      setSortKey(column.key);
      setSortDirection('ascending');
    }
    setRequestedPage(1);
  };

  if (error) {
    return (
      <Alert title="No pudimos cargar la tabla" tone="danger">
        {error}
      </Alert>
    );
  }
  if (loading) {
    return <LoadingState label="Cargando resultados" />;
  }
  if (rows.length === 0) {
    return <EmptyState description={emptyDescription} title={emptyTitle} />;
  }

  return (
    <div className="data-table">
      <div className="data-table__summary" aria-live="polite">
        {rows.length} {rows.length === 1 ? 'resultado' : 'resultados'}
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  aria-sort={sortKey === column.key ? sortDirection : undefined}
                  className={column.align === 'right' ? 'table-actions' : undefined}
                  key={column.key}
                >
                  {column.sortValue ? (
                    <button className="table-sort" onClick={() => changeSort(column)} type="button">
                      {column.header}
                      <span aria-hidden="true">
                        {sortKey === column.key
                          ? sortDirection === 'ascending'
                            ? ' ↑'
                            : ' ↓'
                          : ' ↕'}
                      </span>
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={getRowKey(row)}>
                {columns.map((column) => (
                  <td
                    className={column.align === 'right' ? 'table-actions' : undefined}
                    data-label={column.header}
                    key={column.key}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <nav aria-label="Paginación de resultados" className="data-table__pagination">
        <span>
          Página {page} de {totalPages}
        </span>
        <div>
          <Button
            disabled={page === 1}
            onClick={() => setRequestedPage(page - 1)}
            size="small"
            variant="ghost"
          >
            Anterior
          </Button>
          <Button
            disabled={page === totalPages}
            onClick={() => setRequestedPage(page + 1)}
            size="small"
            variant="ghost"
          >
            Siguiente
          </Button>
        </div>
      </nav>
    </div>
  );
}
