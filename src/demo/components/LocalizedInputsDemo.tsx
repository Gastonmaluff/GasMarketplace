import { useState } from 'react';

import { NumericInput } from '../../components/ui/inputs/NumericInput';
import {
  ParaguayPhoneInput,
  type ParaguayPhoneValue,
} from '../../components/ui/inputs/ParaguayPhoneInput';
import { TextField } from '../../components/ui/TextField';
import { appConfig } from '../../config/app.config';
import { formatNumericValue } from '../../utils/formatters/number';

interface ValueReadoutProps {
  visual: string;
  normalized: string;
}

function ValueReadout({ normalized, visual }: ValueReadoutProps) {
  return (
    <dl className="value-readout">
      <div>
        <dt>Valor visual</dt>
        <dd>{visual || 'Vacío'}</dd>
      </div>
      <div>
        <dt>Valor interno</dt>
        <dd>{normalized || 'Vacío'}</dd>
      </div>
    </dl>
  );
}

export function LocalizedInputsDemo() {
  const [pygAmount, setPygAmount] = useState<number | null>(1_500_000);
  const [decimalAmount, setDecimalAmount] = useState<number | null>(1250.5);
  const [quantity, setQuantity] = useState<number | null>(24);
  const [nationalPhone, setNationalPhone] = useState<ParaguayPhoneValue>({
    displayValue: '0981 123 456',
    isValid: true,
    normalizedValue: '+595981123456',
  });
  const [internationalPhone, setInternationalPhone] = useState<ParaguayPhoneValue>({
    displayValue: '+595 981 123 456',
    isValid: true,
    normalizedValue: '+595981123456',
  });
  const [invalidLandline, setInvalidLandline] = useState<ParaguayPhoneValue>({
    displayValue: '021 12',
    isValid: false,
    normalizedValue: '+5952112',
  });
  const [personName, setPersonName] = useState('  maría   gonzález ');
  const [plainText, setPlainText] = useState('  texto SIN cambios  ');

  return (
    <div className="localized-inputs-grid">
      <div className="localized-example">
        <NumericInput
          currency={appConfig.currency}
          label="Monto en guaraníes"
          onValueChange={setPygAmount}
          value={pygAmount}
        />
        <ValueReadout
          normalized={pygAmount === null ? '' : String(pygAmount)}
          visual={formatNumericValue(pygAmount, {
            currency: appConfig.currency,
            locale: appConfig.locale,
          })}
        />
      </div>

      <div className="localized-example">
        <NumericInput
          decimals={2}
          label="Monto con decimales"
          onValueChange={setDecimalAmount}
          prefix="₲ "
          value={decimalAmount}
        />
        <ValueReadout
          normalized={decimalAmount === null ? '' : String(decimalAmount)}
          visual={formatNumericValue(decimalAmount, {
            decimals: 2,
            locale: appConfig.locale,
            prefix: '₲ ',
          })}
        />
      </div>

      <div className="localized-example">
        <NumericInput
          allowEmpty={false}
          error={
            quantity !== null && quantity > 100
              ? 'La cantidad máxima del ejemplo es 100.'
              : undefined
          }
          helpText="Acepta valores entre 0 y 100."
          label="Cantidad numérica"
          max={100}
          min={0}
          onValueChange={setQuantity}
          suffix=" unidades"
          value={quantity}
        />
        <ValueReadout
          normalized={quantity === null ? '' : String(quantity)}
          visual={formatNumericValue(quantity, { locale: appConfig.locale, suffix: ' unidades' })}
        />
      </div>

      <div className="localized-example">
        <ParaguayPhoneInput
          defaultValue="0981123456"
          helpText="Admite espacios, guiones y paréntesis."
          label="Teléfono móvil nacional"
          mode="mobile"
          onValueChange={setNationalPhone}
        />
        <ValueReadout
          normalized={nationalPhone.normalizedValue}
          visual={nationalPhone.displayValue}
        />
      </div>

      <div className="localized-example">
        <ParaguayPhoneInput
          defaultValue="+595 981-123-456"
          label="Teléfono internacional"
          mode="mobile"
          onValueChange={setInternationalPhone}
        />
        <ValueReadout
          normalized={internationalPhone.normalizedValue}
          visual={internationalPhone.displayValue}
        />
      </div>

      <div className="localized-example">
        <ParaguayPhoneInput
          defaultValue="021-12"
          helpText="El mensaje aparece al salir si el número está incompleto."
          label="Validación de teléfono fijo"
          mode="landline"
          onValueChange={setInvalidLandline}
        />
        <ValueReadout
          normalized={invalidLandline.normalizedValue}
          visual={invalidLandline.displayValue}
        />
      </div>

      <div className="localized-example">
        <TextField
          label="Nombre de persona"
          normalization="person-name"
          onChange={(event) => setPersonName(event.target.value)}
          onNormalizedValueChange={setPersonName}
          value={personName}
        />
        <ValueReadout normalized={personName} visual={personName} />
      </div>

      <div className="localized-example">
        <TextField
          helpText="No se modifica al perder el foco."
          label="Texto sin normalización"
          normalization="none"
          onChange={(event) => setPlainText(event.target.value)}
          value={plainText}
        />
        <ValueReadout normalized={plainText} visual={plainText} />
      </div>
    </div>
  );
}
