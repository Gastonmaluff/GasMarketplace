import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { DataTable, type DataTableColumn } from './DataTable';

interface Row {
  id: string;
  name: string;
}
const rows: readonly Row[] = [
  { id: '1', name: 'Beta' },
  { id: '2', name: 'Alfa' },
  { id: '3', name: 'Gamma' },
];
const columns = [
  {
    key: 'name',
    header: 'Nombre',
    render: (row: Row) => row.name,
    sortValue: (row: Row) => row.name,
  },
] satisfies readonly DataTableColumn<Row>[];

describe('DataTable', () => {
  it('ordena, pagina e informa la cantidad de resultados', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} getRowKey={(row) => row.id} pageSize={2} rows={rows} />);
    expect(screen.getByText('3 resultados')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Nombre/ }));
    const bodyRows = screen.getAllByRole('row').slice(1);
    expect(within(bodyRows[0]!).getByText('Alfa')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(screen.getByText('Gamma')).toBeInTheDocument();
    expect(screen.getByText('Página 2 de 2')).toBeInTheDocument();
  });

  it('presenta estados cargando, vacío y error', () => {
    const { rerender } = render(
      <DataTable columns={columns} getRowKey={(row) => row.id} loading rows={rows} />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Cargando resultados');
    rerender(<DataTable columns={columns} getRowKey={(row) => row.id} rows={[]} />);
    expect(screen.getByRole('heading', { name: 'No hay resultados' })).toBeInTheDocument();
    rerender(
      <DataTable
        columns={columns}
        error="Error de prueba"
        getRowKey={(row) => row.id}
        rows={rows}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Error de prueba');
  });
});
