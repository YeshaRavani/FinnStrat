type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  help?: string;
  error?: string;
  type?: "currency" | "number" | "date" | "text";
  min?: string;
  max?: string;
  step?: string;
};

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

export function Field({ label, value, onChange, required = false, help, error, type = "currency", min, max, step }: Props) {
  const inputId = `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const displayValue = type === "currency" && value !== "" && Number.isFinite(Number(value))
    ? inr.format(Number(value))
    : value;

  return (
    <label className="field" htmlFor={inputId}>
      <span>{label}{required && <b className="required-mark" aria-hidden="true"> *</b>}</span>
      <div className={type === "currency" ? "input-wrap" : "input-wrap plain-input"}>
        {type === "currency" && <b aria-hidden="true">₹</b>}
        <input
          id={inputId}
          type={type === "date" ? "date" : "text"}
          inputMode={type === "currency" || type === "number" ? "decimal" : undefined}
          value={displayValue}
          min={min}
          max={max}
          step={step}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={[help && `${inputId}-help`, error && `${inputId}-error`].filter(Boolean).join(" ") || undefined}
          onChange={event => onChange(type === "currency" || type === "number" ? event.target.value.replace(/,/g, "").replace(/[^0-9.-]/g, "") : event.target.value)}
        />
      </div>
      {help && <small id={`${inputId}-help`} className="field-help">{help}</small>}
      {error && <small id={`${inputId}-error`} className="field-error">{error}</small>}
    </label>
  );
}
