import type { RankingPreference } from "../types/strategy";

type Props = { value: RankingPreference; onChange: (value: RankingPreference) => void };

export function PreferenceSelector({ value, onChange }: Props) {
  const preferences: RankingPreference[] = ["balanced", "resilience", "speed", "wealth", "liquidity", "low_debt"];
  return <div className="preference"><label>Optimize for</label><div className="chips">{preferences.map((item) => <button type="button" className={value === item ? "chip active" : "chip"} onClick={() => onChange(item)} key={item}>{item}</button>)}</div></div>;
}
