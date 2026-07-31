import { describe, expect, it } from 'vitest';

import {
  ORDER_STATUSES,
  canTransition,
  computeItemSubtotal,
  computeOrderTotals,
  formatOrderNumber,
  isTerminalStatus,
  nextStatuses,
} from './order.core';
import type { OrderStatus } from './order.types';

describe('computeItemSubtotal', () => {
  it('multiplica precio por cantidad', () => {
    expect(computeItemSubtotal(25000, 3)).toBe(75000);
  });
});

describe('computeOrderTotals', () => {
  it('suma subtotales y agrega el envío', () => {
    const totals = computeOrderTotals(
      [
        { unitPrice: 25000, quantity: 2 },
        { unitPrice: 5000, quantity: 1 },
      ],
      8000,
    );
    expect(totals).toEqual({
      itemCount: 3,
      itemsSubtotal: 55000,
      deliveryCost: 8000,
      total: 63000,
    });
  });

  it('sin envío el total es solo el de los ítems', () => {
    expect(computeOrderTotals([{ unitPrice: 10000, quantity: 2 }])).toMatchObject({
      itemsSubtotal: 20000,
      deliveryCost: 0,
      total: 20000,
    });
  });

  it('nunca aplica un costo de envío negativo', () => {
    expect(computeOrderTotals([{ unitPrice: 10000, quantity: 1 }], -5000).deliveryCost).toBe(0);
  });

  it('carrito vacío da todo en cero', () => {
    expect(computeOrderTotals([])).toEqual({
      itemCount: 0,
      itemsSubtotal: 0,
      deliveryCost: 0,
      total: 0,
    });
  });
});

describe('máquina de estados', () => {
  it('permite las transiciones del flujo feliz', () => {
    expect(canTransition('pendiente', 'confirmado')).toBe(true);
    expect(canTransition('confirmado', 'en_preparacion')).toBe(true);
    expect(canTransition('en_preparacion', 'enviado')).toBe(true);
    expect(canTransition('enviado', 'entregado')).toBe(true);
  });

  it('permite cancelar desde pendiente/confirmado/en_preparacion', () => {
    expect(canTransition('pendiente', 'cancelado')).toBe(true);
    expect(canTransition('confirmado', 'cancelado')).toBe(true);
    expect(canTransition('en_preparacion', 'cancelado')).toBe(true);
  });

  it('rechaza saltos inválidos y cancelar un pedido entregado', () => {
    expect(canTransition('pendiente', 'enviado')).toBe(false);
    expect(canTransition('entregado', 'cancelado')).toBe(false);
    expect(canTransition('cancelado', 'pendiente')).toBe(false);
    expect(canTransition('pendiente', 'pendiente')).toBe(false);
  });

  it('entregado y cancelado son terminales', () => {
    expect(isTerminalStatus('entregado')).toBe(true);
    expect(isTerminalStatus('cancelado')).toBe(true);
    expect(isTerminalStatus('pendiente')).toBe(false);
  });

  it('nextStatuses coincide con las transiciones declaradas', () => {
    expect(nextStatuses('enviado')).toEqual(['entregado']);
    expect(ORDER_STATUSES).toContain('pendiente' satisfies OrderStatus);
  });
});

describe('formatOrderNumber', () => {
  it('arma el correlativo con ceros a la izquierda', () => {
    expect(formatOrderNumber(2026, 1)).toBe('2026-000001');
    expect(formatOrderNumber(2026, 123456)).toBe('2026-123456');
  });
});
