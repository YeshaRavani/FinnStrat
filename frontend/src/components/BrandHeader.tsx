import type { AuthUser } from "../types/auth";

type Props = { user?: AuthUser | null; onHome?: () => void; onProfile?: () => void; onLogout?: () => void };

export function BrandHeader({ user, onHome, onProfile, onLogout }: Props) {
  const initials = user?.username.slice(0, 2).toUpperCase() ?? "";
  return <header className="topbar">
    <button type="button" className="brand brand-button" onClick={onHome} aria-label="FinnStrat home"><span className="brand-mark">F</span><span>Finn<span className="gold">Strat</span></span></button>
    <div className="header-actions"><div className="nav-status"><span className="live-dot" /> Simulation engine <span className="divider" /> v0.1</div>{user && <div className="account-actions"><button type="button" className="profile-icon" onClick={onProfile} aria-label={`Open profile for @${user.username}`} title={`@${user.username}`}><span>{initials}</span></button><button type="button" className="nav-button logout-button" onClick={onLogout}>Log out</button></div>}</div>
  </header>;
}
