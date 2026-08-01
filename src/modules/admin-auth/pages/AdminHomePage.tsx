import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Icon } from '../../../components/ui/Icon';
import { PageHeader } from '../../../components/ui/PageHeader';
import { listProducts } from '../../catalog/products/product.service';
import type { Product } from '../../catalog/products/product.types';
import { isLowStock } from '../../catalog/products/product.validation';

const DEFAULT_LOW_STOCK_THRESHOLD = 3;

function formatPercent(value: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

/**
 * Página inicial del panel. Accesos frecuentes y salud de catálogo; el
 * resumen operativo de pedidos se ve en /admin/pedidos.
 */
export function AdminHomePage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;
    listProducts()
      .then((loaded) => {
        if (!cancelled) setProducts(loaded);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter((product) => product.active).length;
    const featured = products.filter((product) => product.featured).length;
    const lowStock = products.filter((product) =>
      isLowStock(product, DEFAULT_LOW_STOCK_THRESHOLD),
    ).length;
    return { active, featured, lowStock, total };
  }, [products]);

  const lowStockAlerts = useMemo(
    () =>
      products
        .filter((product) => product.trackStock && product.stock <= DEFAULT_LOW_STOCK_THRESHOLD)
        .sort((first, second) => first.stock - second.stock)
        .slice(0, 4),
    [products],
  );

  return (
    <div className="admin-page">
      <PageHeader
        description="Administrá la configuración, las categorías y los productos de la tienda."
        eyebrow="Panel administrativo"
        title="Inicio"
      />
      <div className="admin-shortcuts" aria-label="Accesos principales">
        <Link className="admin-shortcut" to="/admin/pedidos">
          <span className="admin-shortcut__icon">
            <Icon name="cart" />
          </span>
          <span className="admin-shortcut__copy">
            <strong>Pedidos</strong>
            <span>Ver, filtrar y actualizar el estado de los pedidos.</span>
          </span>
        </Link>
        <Link className="admin-shortcut" to="/admin/productos">
          <span className="admin-shortcut__icon">
            <Icon name="box" />
          </span>
          <span className="admin-shortcut__copy">
            <strong>Productos</strong>
            <span>Cargar mercadería, precios, imágenes y stock.</span>
          </span>
        </Link>
        <Link className="admin-shortcut" to="/admin/categorias">
          <span className="admin-shortcut__icon">
            <Icon name="tag" />
          </span>
          <span className="admin-shortcut__copy">
            <strong>Categorías</strong>
            <span>Organizar el catálogo en secciones.</span>
          </span>
        </Link>
        <Link className="admin-shortcut" to="/admin/configuracion">
          <span className="admin-shortcut__icon">
            <Icon name="settings" />
          </span>
          <span className="admin-shortcut__copy">
            <strong>Configuración</strong>
            <span>Datos de la tienda, entrega y medios de pago.</span>
          </span>
        </Link>
      </div>

      <div className="admin-home-panels">
        <section className="admin-side-card">
          <div className="admin-side-card__head">
            <div>
              <h2>Resumen del catálogo</h2>
              <p>Estado actual</p>
            </div>
            <Icon name="bell" size={18} />
          </div>
          <div className="catalog-donut" aria-hidden="true">
            <span>{stats.total}</span>
          </div>
          <div className="catalog-breakdown">
            <span>
              <i className="catalog-breakdown__dot catalog-breakdown__dot--active" />
              Activos {stats.active} ({formatPercent(stats.active, stats.total)})
            </span>
            <span>
              <i className="catalog-breakdown__dot catalog-breakdown__dot--featured" />
              Destacados {stats.featured} ({formatPercent(stats.featured, stats.total)})
            </span>
            <span>
              <i className="catalog-breakdown__dot catalog-breakdown__dot--muted" />
              Inactivos {stats.total - stats.active} (
              {formatPercent(stats.total - stats.active, stats.total)})
            </span>
          </div>
        </section>

        <section className="admin-side-card">
          <div className="admin-side-card__head">
            <div>
              <h2>Alertas de stock bajo</h2>
              <p>Primeros productos a revisar</p>
            </div>
          </div>
          <div className="stock-alert-list">
            {lowStockAlerts.length > 0 ? (
              lowStockAlerts.map((product) => {
                const primaryImage =
                  product.images.find((image) => image.isPrimary) ?? product.images[0];
                return (
                  <Link
                    className="stock-alert-item"
                    key={product.id}
                    to={`/admin/productos/${product.id}`}
                  >
                    {primaryImage ? (
                      <img alt="" src={primaryImage.url} />
                    ) : (
                      <span>
                        <Icon name="box" size={16} />
                      </span>
                    )}
                    <span>
                      <strong>{product.name}</strong>
                      <small>Stock: {product.stock} unidades</small>
                    </span>
                  </Link>
                );
              })
            ) : (
              <p className="admin-page__note">Sin alertas por ahora.</p>
            )}
          </div>
        </section>

        <section className="admin-side-card">
          <div className="admin-side-card__head">
            <div>
              <h2>Acciones rápidas</h2>
              <p>Atajos del catálogo</p>
            </div>
          </div>
          <div className="quick-action-list">
            <Link to="/admin/productos/nuevo">
              <Icon name="plus" size={16} />
              Nuevo producto
            </Link>
            <Link to="/admin/categorias">
              <Icon name="tag" size={16} />
              Gestionar categorías
            </Link>
            <Link to="/admin/productos">
              <Icon name="star" size={16} />
              Ver productos destacados
            </Link>
          </div>
        </section>
      </div>

      <p className="admin-page__note">
        El resumen operativo de clientes se habilitará en una próxima fase del roadmap.
      </p>
    </div>
  );
}
