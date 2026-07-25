import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ParaguayPhoneInput } from './ParaguayPhoneInput';

describe('ParaguayPhoneInput', () => {
  it('limpia, formatea y expone el valor normalizado', () => {
    const onValueChange = vi.fn();
    render(<ParaguayPhoneInput label="Celular" mode="mobile" onValueChange={onValueChange} />);
    const input = screen.getByRole('textbox', { name: 'Celular' });

    fireEvent.change(input, { target: { value: '+595 (981)-123-456' } });

    expect(input).toHaveValue('+595 981 123 456');
    expect(onValueChange).toHaveBeenLastCalledWith({
      displayValue: '+595 981 123 456',
      isValid: true,
      normalizedValue: '+595981123456',
    });
  });

  it('informa un número incompleto al perder el foco', async () => {
    const user = userEvent.setup();
    render(<ParaguayPhoneInput defaultValue="0981" label="Celular" mode="mobile" />);
    const input = screen.getByRole('textbox', { name: 'Celular' });

    await user.click(input);
    await user.tab();

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Ingresá un número móvil paraguayo válido.');
  });
});
