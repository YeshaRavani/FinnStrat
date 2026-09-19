type Props<T extends string> = {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  help?: string;
};

export function SelectField<T extends string>({ label, value, options, onChange, help }: Props<T>) {
  const id = `select-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <label className="field select-field" htmlFor={id}>
      <span>{label}</span>
      <select id={id} value={value} onChange={event => onChange(event.target.value as T)} aria-describedby={help ? `${id}-help` : undefined}>
        {options.map(option => <option value={option.value} key={option.value}>{option.label}</option>)}
      </select>
      {help && <small id={`${id}-help`} className="field-help">{help}</small>}
    </label>
  );
}
