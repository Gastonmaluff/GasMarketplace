import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { appConfig } from '../../../config/app.config';
import { Button } from '../../../components/ui/Button';
import { TextField } from '../../../components/ui/TextField';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

interface StoreNotFoundPageProps {
  title?: string;
  message?: string;
}

/** 404 pública del storefront, distinta del error del panel administrativo. */
export function StoreNotFoundPage({
  message = 'No encontramos lo que buscabas. Puede que ya no esté disponible.',
  title = 'Página no encontrada',
}: StoreNotFoundPageProps) {
  const navigate = useNavigate();
  const [term, setTerm] = useState('');

  useDocumentMeta({ title: `${title} | ${appConfig.name}`, noindex: true });

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = term.trim();
    if (trimmed !== '') navigate(`/buscar?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="store-notfound">
      <p className="eyebrow">Error 404</p>
      <h1>{title}</h1>
      <p>{message}</p>
      <form className="store-notfound__search" onSubmit={submitSearch} role="search">
        <TextField
          label="Buscar productos"
          onChange={(event) => setTerm(event.currentTarget.value)}
          placeholder="¿Qué estás buscando?"
          type="search"
          value={term}
        />
        <Button type="submit">Buscar</Button>
      </form>
      <div className="button-group">
        <Link className="button button--primary" to="/">
          Volver al inicio
        </Link>
        <Link className="button button--ghost" to="/catalogo">
          Ver catálogo
        </Link>
      </div>
    </div>
  );
}
