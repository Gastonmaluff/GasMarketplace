import { useCallback, useEffect, useState } from 'react';

import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { LoadingState } from '../../../components/ui/LoadingState';
import { PageHeader } from '../../../components/ui/PageHeader';
import { TextField } from '../../../components/ui/TextField';
import { Toast } from '../../../components/ui/Toast';
import { NumericInput } from '../../../components/ui/inputs/NumericInput';
import { ParaguayPhoneInput } from '../../../components/ui/inputs/ParaguayPhoneInput';
import {
  loadStoreSettings,
  normalizePrivateSettings,
  normalizePublicSettings,
  saveStoreSettings,
  SettingsError,
} from '../settings.service';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  type DeliveryZone,
  type PaymentMethod,
  type StoreSettings,
} from '../settings.types';

function createZone(order: number): DeliveryZone {
  return { id: crypto.randomUUID(), name: '', cost: 0, active: true, order };
}

function moveZone(zones: DeliveryZone[], index: number, offset: -1 | 1): DeliveryZone[] {
  const target = index + offset;
  if (target < 0 || target >= zones.length) return zones;
  const next = [...zones];
  const [zone] = next.splice(index, 1);
  next.splice(target, 0, zone!);
  return next;
}

export function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveErrors, setSaveErrors] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    loadStoreSettings()
      .then((loaded) => {
        if (!cancelled) setSettings(loaded);
      })
      .catch(() => {
        if (!cancelled) setLoadError('No se pudo cargar la configuración. Verificá la conexión.');
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const retry = useCallback(() => {
    setLoadError(null);
    setSettings(null);
    setReloadKey((key) => key + 1);
  }, []);

  const updatePublic = (patch: Partial<StoreSettings['publicSettings']>) => {
    setSettings((current) =>
      current ? { ...current, publicSettings: { ...current.publicSettings, ...patch } } : current,
    );
  };
  const updatePrivate = (patch: Partial<StoreSettings['privateSettings']>) => {
    setSettings((current) =>
      current ? { ...current, privateSettings: { ...current.privateSettings, ...patch } } : current,
    );
  };

  async function handleSave() {
    if (!settings || saving) return;
    setSaveErrors([]);
    setSaving(true);
    try {
      const normalized: StoreSettings = {
        publicSettings: normalizePublicSettings(settings.publicSettings),
        privateSettings: normalizePrivateSettings(settings.privateSettings),
      };
      await saveStoreSettings(normalized);
      setSettings(normalized);
      setToast('Configuración guardada correctamente.');
    } catch (cause) {
      setSaveErrors(
        cause instanceof SettingsError
          ? cause.errors
          : ['No se pudo guardar la configuración. Intentá nuevamente.'],
      );
    } finally {
      setSaving(false);
    }
  }

  if (loadError) {
    return (
      <div className="admin-page">
        <PageHeader
          breadcrumbs={[{ label: 'Inicio', href: '/admin' }, { label: 'Configuración' }]}
          title="Configuración"
        />
        <Alert title="Error de carga" tone="danger">
          {loadError}
        </Alert>
        <Button onClick={retry} variant="secondary">
          Reintentar
        </Button>
      </div>
    );
  }

  if (!settings) {
    return <LoadingState label="Cargando configuración" />;
  }

  const { publicSettings, privateSettings } = settings;
  const togglePaymentMethod = (method: PaymentMethod, enabled: boolean) => {
    updatePublic({
      acceptedPaymentMethods: enabled
        ? [...publicSettings.acceptedPaymentMethods, method]
        : publicSettings.acceptedPaymentMethods.filter((current) => current !== method),
    });
  };
  const updateZone = (id: string, patch: Partial<DeliveryZone>) => {
    updatePublic({
      deliveryZones: publicSettings.deliveryZones.map((zone) =>
        zone.id === id ? { ...zone, ...patch } : zone,
      ),
    });
  };

  return (
    <div className="admin-page">
      <PageHeader
        breadcrumbs={[{ label: 'Inicio', href: '/admin' }, { label: 'Configuración' }]}
        description="Datos visibles de la tienda, entrega, medios de pago y preferencias internas."
        primaryAction={
          <Button loading={saving} loadingLabel="Guardando" onClick={() => void handleSave()}>
            Guardar cambios
          </Button>
        }
        title="Configuración"
      />

      {saveErrors.length > 0 ? (
        <Alert onDismiss={() => setSaveErrors([])} title="Revisá estos puntos" tone="danger">
          {saveErrors.join(' ')}
        </Alert>
      ) : null}

      <section aria-labelledby="settings-identity" className="admin-section">
        <h2 id="settings-identity">Identidad de la tienda</h2>
        <div className="form-grid">
          <TextField
            label="Nombre visible"
            onChange={(event) => updatePublic({ storeName: event.currentTarget.value })}
            required
            value={publicSettings.storeName}
          />
          <TextField
            label="Correo de contacto"
            onChange={(event) => updatePublic({ supportEmail: event.currentTarget.value })}
            type="email"
            value={publicSettings.supportEmail}
          />
          <div className="field--full">
            <TextField
              helpText="Se muestra en la portada de la tienda."
              label="Descripción"
              onChange={(event) => updatePublic({ storeDescription: event.currentTarget.value })}
              value={publicSettings.storeDescription}
            />
          </div>
          <ParaguayPhoneInput
            label="WhatsApp"
            mode="mobile"
            onValueChange={({ displayValue, normalizedValue }) =>
              updatePublic({
                whatsappNumberDisplay: displayValue,
                whatsappNumberNormalized: normalizedValue,
              })
            }
            value={publicSettings.whatsappNumberNormalized}
          />
          <TextField
            label="Ciudad"
            normalization="title-case"
            onChange={(event) => updatePublic({ city: event.currentTarget.value })}
            value={publicSettings.city}
          />
          <div className="field--full">
            <TextField
              label="Dirección"
              onChange={(event) => updatePublic({ address: event.currentTarget.value })}
              value={publicSettings.address}
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="settings-delivery" className="admin-section">
        <h2 id="settings-delivery">Entrega</h2>
        <div className="admin-section__toggles">
          <label className="checkbox-field">
            <input
              checked={publicSettings.pickupEnabled}
              onChange={(event) => updatePublic({ pickupEnabled: event.currentTarget.checked })}
              type="checkbox"
            />
            <span>
              Retiro en local<small>El cliente pasa a buscar su pedido.</small>
            </span>
          </label>
          <label className="checkbox-field">
            <input
              checked={publicSettings.deliveryEnabled}
              onChange={(event) => updatePublic({ deliveryEnabled: event.currentTarget.checked })}
              type="checkbox"
            />
            <span>
              Delivery por zonas<small>Entrega con costo configurable por zona.</small>
            </span>
          </label>
        </div>

        {publicSettings.deliveryEnabled ? (
          <div className="zone-editor">
            {publicSettings.deliveryZones.length === 0 ? (
              <p className="zone-editor__empty">Todavía no hay zonas de entrega definidas.</p>
            ) : (
              <ul className="zone-editor__list">
                {publicSettings.deliveryZones.map((zone, index) => (
                  <li className="zone-editor__row" key={zone.id}>
                    <TextField
                      label="Zona"
                      onChange={(event) => updateZone(zone.id, { name: event.currentTarget.value })}
                      required
                      value={zone.name}
                    />
                    <NumericInput
                      allowEmpty={false}
                      currency={publicSettings.currency}
                      label="Costo"
                      min={0}
                      onValueChange={(value) => updateZone(zone.id, { cost: value ?? 0 })}
                      value={zone.cost}
                    />
                    <label className="checkbox-field zone-editor__active">
                      <input
                        checked={zone.active}
                        onChange={(event) =>
                          updateZone(zone.id, { active: event.currentTarget.checked })
                        }
                        type="checkbox"
                      />
                      <span>Activa</span>
                    </label>
                    <div className="zone-editor__actions">
                      <Button
                        aria-label={`Subir la zona ${zone.name || index + 1}`}
                        disabled={index === 0}
                        onClick={() =>
                          updatePublic({
                            deliveryZones: moveZone(publicSettings.deliveryZones, index, -1),
                          })
                        }
                        size="small"
                        variant="ghost"
                      >
                        ↑
                      </Button>
                      <Button
                        aria-label={`Bajar la zona ${zone.name || index + 1}`}
                        disabled={index === publicSettings.deliveryZones.length - 1}
                        onClick={() =>
                          updatePublic({
                            deliveryZones: moveZone(publicSettings.deliveryZones, index, 1),
                          })
                        }
                        size="small"
                        variant="ghost"
                      >
                        ↓
                      </Button>
                      <Button
                        aria-label={`Quitar la zona ${zone.name || index + 1}`}
                        onClick={() =>
                          updatePublic({
                            deliveryZones: publicSettings.deliveryZones.filter(
                              (current) => current.id !== zone.id,
                            ),
                          })
                        }
                        size="small"
                        variant="danger"
                      >
                        Quitar
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Button
              onClick={() =>
                updatePublic({
                  deliveryZones: [
                    ...publicSettings.deliveryZones,
                    createZone(publicSettings.deliveryZones.length),
                  ],
                })
              }
              size="small"
              variant="secondary"
            >
              Agregar zona
            </Button>
          </div>
        ) : null}
      </section>

      <section aria-labelledby="settings-payments" className="admin-section">
        <h2 id="settings-payments">Medios de pago</h2>
        <div className="admin-section__toggles">
          {PAYMENT_METHODS.map((method) => (
            <label className="checkbox-field" key={method}>
              <input
                checked={publicSettings.acceptedPaymentMethods.includes(method)}
                onChange={(event) => togglePaymentMethod(method, event.currentTarget.checked)}
                type="checkbox"
              />
              <span>{PAYMENT_METHOD_LABELS[method]}</span>
            </label>
          ))}
        </div>
        <TextField
          helpText="Se muestra al comprador después de confirmar un pedido."
          label="Mensaje de confirmación"
          onChange={(event) =>
            updatePublic({ orderConfirmationMessage: event.currentTarget.value })
          }
          value={publicSettings.orderConfirmationMessage}
        />
      </section>

      <section aria-labelledby="settings-internal" className="admin-section">
        <h2 id="settings-internal">Preferencias internas</h2>
        <div className="form-grid">
          <NumericInput
            allowEmpty={false}
            helpText="Cantidad desde la cual un producto se considera con stock bajo."
            label="Umbral de stock bajo"
            min={0}
            onValueChange={(value) => updatePrivate({ defaultLowStockThreshold: value ?? 0 })}
            value={privateSettings.defaultLowStockThreshold}
          />
          <label className="checkbox-field">
            <input
              checked={privateSettings.allowNegativeStock}
              onChange={(event) =>
                updatePrivate({ allowNegativeStock: event.currentTarget.checked })
              }
              type="checkbox"
            />
            <span>
              Permitir stock negativo<small>Solo si aceptás vender sin stock confirmado.</small>
            </span>
          </label>
        </div>
      </section>

      {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}
    </div>
  );
}
