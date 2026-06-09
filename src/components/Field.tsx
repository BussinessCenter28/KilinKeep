// Form field wrappers — presentational, controlled. Validation lives in hooks/services.
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';

function Wrap({ label, hint, hintWarn, children }: { label: string; hint?: ReactNode; hintWarn?: boolean; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint ? <span className={`hint ${hintWarn ? 'warn' : ''}`.trim()}>{hint}</span> : null}
    </label>
  );
}

interface TextProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: ReactNode;
  hintWarn?: boolean;
}
export function TextField({ label, hint, hintWarn, ...rest }: TextProps) {
  return (
    <Wrap label={label} hint={hint} hintWarn={hintWarn}>
      <input {...rest} />
    </Wrap>
  );
}

interface AreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: ReactNode;
}
export function TextArea({ label, hint, ...rest }: AreaProps) {
  return (
    <Wrap label={label} hint={hint}>
      <textarea {...rest} />
    </Wrap>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: ReactNode;
  options: readonly { value: string; label: string }[];
  placeholder?: string;
}
export function SelectField({ label, hint, options, placeholder, ...rest }: SelectProps) {
  return (
    <Wrap label={label} hint={hint}>
      <select {...rest}>
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </Wrap>
  );
}
