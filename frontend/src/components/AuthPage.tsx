import { useState, type FormEvent } from "react";
import type { FinancialProfileForm } from "../types/financial";
import type { ProfileChange } from "../types/auth";
import { FinancialProfileForm as ProfileForm } from "./FinancialProfileForm";
import { validateProfile } from "../utils/profileValidation";

type Props = {
  initialProfile: FinancialProfileForm;
  onLogin: (username: string, password: string) => Promise<void>;
  onSignup: (username: string, password: string, profile: FinancialProfileForm) => Promise<void>;
};

export function AuthPage({ initialProfile, onLogin, onSignup }: Props) {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [profile, setProfile] = useState(initialProfile);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const updateProfile: ProfileChange = (key, value) => setProfile(current => key === "existingDebt" && Number(value) === 0
    ? { ...current, existingDebt: value, existingDebtAnnualInterestRate: "0" }
    : { ...current, [key]: value });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!username.trim() || password.length < 8) {
      setError("Enter a username and a password with at least 8 characters.");
      return;
    }
    if (mode === "signup") {
      const profileErrors = validateProfile(profile);
      if (Object.keys(profileErrors).length) {
        setError("Check your financial profile values before creating the account.");
        return;
      }
    }
    setLoading(true);
    try {
      if (mode === "signup") await onSignup(username.trim(), password, profile);
      else await onLogin(username.trim(), password);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return <main className="content auth-page">
    <div className="auth-shell">
      <div className="auth-intro"><p className="kicker">YOUR PRIVATE FINANCIAL WORKSPACE</p><h1>Build a plan that remembers <em>you.</em></h1><p>Save your financial profile once, then use it across every goal and scenario.</p></div>
      <form className="panel auth-panel" onSubmit={submit} noValidate>
        <div className="auth-tabs"><button type="button" className={mode === "signup" ? "chip active" : "chip"} onClick={() => { setMode("signup"); setError(""); }}>Create account</button><button type="button" className={mode === "login" ? "chip active" : "chip"} onClick={() => { setMode("login"); setError(""); }}>Log in</button></div>
        <div className="auth-credentials"><label className="auth-field"><span>USERNAME</span><input value={username} onChange={event => setUsername(event.target.value)} autoComplete="username" placeholder="e.g. arjun_rao" /></label><label className="auth-field"><span>PASSWORD</span><input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder="At least 8 characters" /></label></div>
        {mode === "signup" && <><div className="auth-section-heading"><span className="section-label">YOUR BASELINE</span><p>These values become your default profile for every financial goal. You can edit them later.</p></div><ProfileForm profile={profile} errors={{}} onChange={updateProfile} /></>}
        {error && <div className="notice" role="alert"><span>{error}</span></div>}
        <button className="primary auth-submit" type="submit" disabled={loading}>{loading ? "Saving securely…" : mode === "signup" ? "Create account" : "Log in"}</button>
        <p className="auth-note">Prototype login only — no email verification or external account connection is used.</p>
      </form>
    </div>
  </main>;
}
