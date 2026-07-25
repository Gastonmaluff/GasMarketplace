import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { NumericInput } from './NumericInput';

describe('NumericInput', () => {
  it('muestra miles pero emite un número limpio', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<NumericInput defaultValue={1500} label="Monto" onValueChange={onValueChange} />);
    const input = screen.getByRole('spinbutton', { name: 'Monto' });

    expect(input).toHaveValue('1.500');
    await user.click(input);
    await user.clear(input);
    await user.type(input, '1500000');
    await user.tab();

    expect(input).toHaveValue('1.500.000');
    expect(onValueChange).toHaveBeenLastCalledWith(1_500_000);
    expect(typeof onValueChange.mock.lastCall?.[0]).toBe('number');
  });

  it('distingue vacío, cero, decimales y negativos configurables', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <NumericInput
        allowNegative
        decimals={2}
        defaultValue={0}
        label="Saldo"
        onValueChange={onValueChange}
      />,
    );
    const input = screen.getByRole('spinbutton', { name: 'Saldo' });

    expect(input).toHaveValue('0,00');
    await user.click(input);
    await user.clear(input);
    expect(onValueChange).toHaveBeenLastCalledWith(null);
    await user.type(input, '-12,5');
    await user.tab();
    expect(input).toHaveValue('-12,50');
    expect(onValueChange).toHaveBeenLastCalledWith(-12.5);
  });
});
