import type { AuthUser, SavedGoal } from "../types/auth";

type Props = {
  user: AuthUser;
  goals: SavedGoal[];
  monthlyIncome: number;
  monthlyExpenses: number;
  onNewGoal: () => void;
  onOpenGoal: (goal: SavedGoal) => void;
};

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function label(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, character => character.toUpperCase());
}

function targetLabel(targetDate: string | null) {
  if (!targetDate) return "Flexible timeline";
  const date = new Date(`${targetDate}-01T00:00:00`);
  return Number.isNaN(date.getTime()) ? targetDate : new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" }).format(date);
}

export function HomePage({ user, goals, monthlyIncome, monthlyExpenses, onNewGoal, onOpenGoal }: Props) {
  const firstName = user.username.split(/[._-]/)[0] || user.username;
  const monthlySurplus = Math.max(0, monthlyIncome - monthlyExpenses);

  return <main className="content home-page">
    <section className="home-hero">
      <div className="home-hero-copy">
        <p className="kicker">YOUR FINANCIAL WORKSPACE</p>
        <h1>Welcome back, <em>{firstName}.</em></h1>
        <p>Turn your next big decision into a plan you can understand, compare, and sustain when life changes.</p>
        <button className="primary home-cta" type="button" aria-label="Plan a new goal" onClick={onNewGoal}>+ Plan a new goal</button>
      </div>
      <div className="home-snapshot" aria-label="Financial snapshot">
        <div><span>MONTHLY INCOME</span><strong>{currency.format(monthlyIncome)}</strong></div>
        <div><span>MONTHLY SURPLUS</span><strong>{currency.format(monthlySurplus)}</strong></div>
        <p>Based on your saved profile. Update it anytime from the profile icon.</p>
      </div>
    </section>

    <section className="home-goals" aria-labelledby="goals-heading">
      <div className="home-section-heading">
        <div><p className="section-label">YOUR PLAN LIBRARY</p><h2 id="goals-heading">Previous goals</h2></div>
        <span className="goal-count">{goals.length} {goals.length === 1 ? "goal" : "goals"}</span>
      </div>
      {goals.length ? <div className="goal-library">{goals.map(goal => <article className="goal-library-card" key={goal.id}>
        <div className="goal-card-top"><span className="goal-category">{label(goal.category)}</span><span className="goal-priority">{label(goal.priority)} priority</span></div>
        <h3>{goal.name}</h3>
        <div className="goal-card-details"><div><span>TARGET</span><strong>{currency.format(goal.target_amount)}</strong></div><div><span>TIMEFRAME</span><strong>{targetLabel(goal.target_date)}</strong></div></div>
        <button className="secondary goal-open" type="button" onClick={() => onOpenGoal(goal)}>Open goal</button>
      </article>)}</div> : <div className="empty-home panel"><div className="empty-home-mark">◎</div><div><h2>Your planning library is ready.</h2><p>Start with a car, home, education, land purchase, business, or any goal that matters to you.</p></div><button className="primary" type="button" onClick={onNewGoal}>Create your first goal</button></div>}
    </section>
  </main>;
}
