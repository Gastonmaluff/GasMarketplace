export interface DemoTableRow {
  category: 'Base' | 'Interfaz';
  id: string;
  name: string;
  reference: string;
  status: 'active' | 'pending';
  updatedAt: number;
  updatedLabel: string;
}

export const demoTableRows: readonly DemoTableRow[] = [
  {
    category: 'Base',
    id: '1',
    name: 'Elemento demostrativo A',
    reference: '#001',
    status: 'active',
    updatedAt: 5,
    updatedLabel: 'Hoy, 09:30',
  },
  {
    category: 'Interfaz',
    id: '2',
    name: 'Elemento demostrativo B',
    reference: '#002',
    status: 'pending',
    updatedAt: 4,
    updatedLabel: 'Ayer, 16:45',
  },
  {
    category: 'Base',
    id: '3',
    name: 'Elemento demostrativo C',
    reference: '#003',
    status: 'active',
    updatedAt: 3,
    updatedLabel: '12 jul, 11:20',
  },
  {
    category: 'Interfaz',
    id: '4',
    name: 'Elemento demostrativo D',
    reference: '#004',
    status: 'pending',
    updatedAt: 2,
    updatedLabel: '10 jul, 08:15',
  },
  {
    category: 'Base',
    id: '5',
    name: 'Elemento demostrativo E',
    reference: '#005',
    status: 'active',
    updatedAt: 1,
    updatedLabel: '8 jul, 14:05',
  },
];
