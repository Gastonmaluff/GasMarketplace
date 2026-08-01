import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';

import { appConfig } from '../../../config/app.config';
import { Alert } from '../../../components/ui/Alert';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LoadingState } from '../../../components/ui/LoadingState';
import { searchActiveProducts, type Product } from '../../catalog';
import { ProductGrid } from '../components/ProductGrid';
import { StoreBreadcrumbs } from '../components/StoreBreadcrumbs';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

const MAX_TERM_LENGTH = 80;

type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; results: Product[] };

interface SearchResult {
  term: string;
  results: Product[];
  error: boolean;
}

export function SearchPage() {
  const [params] = useSearchParams();
  const rawTerm = params.get('q') ?? '';
  const term = rawTerm.trim().slice(0, MAX_TERM_LENGTH);
  const [result, setResult] = useState<SearchResult>({ term: '', results: [], error: false });

  useDocumentMeta({
    title: term ? `Buscar: ${term} | ${appConfig.name}` : `Buscar | ${appConfig.name}`,
    noindex: true,
  });

  useEffect(() => {
    if (term === '') return undefined;
    let cancelled = false;
    searchActiveProducts(term)
      .then((results) => {
        if (!cancelled) setResult({ term, results, error: false });
      })
      .catch(() => {
        if (!cancelled) setResult({ term, results: [], error: true });
      });
    return () => {
      cancelled = true;
    };
  }, [term]);

  const state: SearchState =
    term === ''
      ? { status: 'idle' }
      : result.term !== term
        ? { status: 'loading' }
        : result.error
          ? { status: 'error' }
          : { status: 'ready', results: result.results };

  return (
    <div className="store-listing">
      <div className="store-listing__head">
        <StoreBreadcrumbs
          items={[
            { label: 'Inicio', href: '/' },
            { label: 'Catálogo', href: '/catalogo' },
            { label: 'Buscar' },
          ]}
        />
        <h1 className="store-listing__title">
          {term ? `Resultados para "${term}"` : 'Buscar productos'}
        </h1>
      </div>

      {state.status === 'idle' ? (
        <EmptyState
          action={
            <Link className="button button--primary" to="/catalogo">
              Ver catálogo
            </Link>
          }
          description="Escribí un término en el buscador del encabezado para encontrar productos."
          title="¿Qué estás buscando?"
        />
      ) : state.status === 'loading' ? (
        <LoadingState label="Buscando productos" />
      ) : state.status === 'error' ? (
        <div className="store-state">
          <Alert title="No pudimos completar la búsqueda" tone="danger">
            Intentá nuevamente en un momento.
          </Alert>
        </div>
      ) : state.results.length === 0 ? (
        <EmptyState
          action={
            <Link className="button button--primary" to="/catalogo">
              Ver catálogo
            </Link>
          }
          description={`No encontramos productos para "${term}". Probá con otras palabras.`}
          title="Sin resultados"
        />
      ) : (
        <>
          <p className="store-results-count">
            {state.results.length} {state.results.length === 1 ? 'resultado' : 'resultados'}
          </p>
          <ProductGrid products={state.results} />
        </>
      )}
    </div>
  );
}
