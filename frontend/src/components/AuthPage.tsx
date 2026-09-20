import { useState, type FormEvent } from "react";
import type { FinancialProfileForm } from "../types/financial";
import type { ProfileChange } from "../types/auth";
import { FinancialProfileForm as ProfileForm } from "./FinancialProfileForm";
import { validateProfile } from "../utils/profileValidation";
import { FinanceSketch } from "./FinanceSketch";

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
      <section className="auth-intro">
        <div className="auth-intro-meta"><p className="kicker">PERSONAL FINANCIAL RESILIENCE</p><span>PRIVATE BY DESIGN</span></div>
        <h1>Make money decisions<br /><em>built for real life.</em></h1>
        <p>FinnStrat connects your everyday money with the goals that matter, then tests every plan against the unexpected.</p>
        <div className="auth-steps" aria-label="How FinnStrat works">
          <div><strong>01</strong><span>Track</span><small>Know your starting point</small></div>
          <div><strong>02</strong><span>Plan</span><small>Compare paths to your goal</small></div>
          <div><strong>03</strong><span>Stress-test</span><small>Prepare for what changes</small></div>
        </div>
        <div className="auth-visual"><FinanceSketch /><span>PLAN&nbsp;&nbsp;·&nbsp;&nbsp;STRESS-TEST&nbsp;&nbsp;·&nbsp;&nbsp;ADJUST</span></div>
      </section>
      <form className="panel auth-panel" onSubmit={submit} noValidate>
        <div className="auth-panel-top"><div><p className="section-label">YOUR FINANCIAL WORKSPACE</p><h2>{mode === "signup" ? "Start with your baseline." : "Welcome back."}</h2></div><span className="auth-badge">PROTOTYPE</span></div>
        <p className="auth-panel-lede">{mode === "signup" ? "Create your account once. Your profile will power every goal you plan." : "Sign in to continue planning goals that can withstand real life."}</p>
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
