import { useState, type FormEvent } from "react";
import type { FinancialProfileForm } from "../types/financial";
import type { AuthUser } from "../types/auth";
import { FinancialProfileForm as ProfileForm } from "../components/FinancialProfileForm";
import { validateProfile } from "../utils/profileValidation";
import { BackButton } from "../components/BackButton";

type Props = { user: AuthUser; profile: FinancialProfileForm; goals: { id: number; name: string; category: string }[]; onSave: (profile: FinancialProfileForm) => Promise<void>; onBack: () => void };

export function ProfilePage({ user, profile: initialProfile, goals, onSave, onBack }: Props) {
  const [profile, setProfile] = useState(initialProfile);
  const [errors, setErrors] = useState<Partial<Record<keyof FinancialProfileForm, string>>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const update = (key: keyof FinancialProfileForm, value: string) => setProfile(current => key === "existingDebt" && Number(value) === 0
    ? { ...current, existingDebt: value, existingDebtAnnualInterestRate: "0" }
    : { ...current, [key]: value });
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validateProfile(profile);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSaving(true);
    setError("");
    try { await onSave(profile); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save profile."); } finally { setSaving(false); }
  };
  return <main className="content profile-page"><div className="results-heading"><div><p className="section-label">PROFILE</p><h1>@{user.username}</h1><p className="page-subtitle">Keep your baseline financial context current. Saved goals use this profile when you run new analysis.</p></div><BackButton label="Back to home" onClick={onBack} /></div><div className="profile-layout"><form className="panel form-panel" onSubmit={submit} noValidate><ProfileForm profile={profile} errors={errors} onChange={update} /><div className="form-actions"><button className="primary" type="submit" disabled={saving}>{saving ? "Saving…" : "Save profile"}</button></div>{error && <div className="notice" role="alert"><span>{error}</span></div>}</form><section className="panel saved-goals"><p className="section-label">SAVED GOALS</p><h2>Your planning history</h2>{goals.length ? <ul>{goals.map(goal => <li key={goal.id}><strong>{goal.name}</strong><span>{goal.category}</span></li>)}</ul> : <p>No saved goals yet. Generate your first strategy to save one here.</p>}</section></div></main>;
}
