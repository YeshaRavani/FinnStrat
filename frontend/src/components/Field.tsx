type Props = { label: string; value: string; onChange: (value: string) => void };

export function Field({ label, value, onChange }: Props) {
  return <label className="field"><span>{label}</span><div className="input-wrap"><b>₹</b><input value={value} onChange={(event) => onChange(event.target.value)} /></div></label>;
}
