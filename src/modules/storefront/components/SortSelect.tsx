import type { ProductSort } from '../../catalog';

interface SortSelectProps {
  value: ProductSort;
  onChange: (sort: ProductSort) => void;
}

const SORT_OPTIONS: ReadonlyArray<{ value: ProductSort; label: string }> = [
  { value: 'featured', label: 'Destacados primero' },
  { value: 'recent', label: 'Más recientes' },
  { value: 'price-asc', label: 'Precio: menor a mayor' },
  { value: 'price-desc', label: 'Precio: mayor a menor' },
  { value: 'name-asc', label: 'Nombre: A-Z' },
];

export function SortSelect({ onChange, value }: SortSelectProps) {
  return (
    <div className="text-field">
      <label htmlFor="store-sort">Ordenar</label>
      <select
        className="text-field__input"
        id="store-sort"
        onChange={(event) => onChange(event.currentTarget.value as ProductSort)}
        value={value}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
