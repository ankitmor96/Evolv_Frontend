import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid,
} from "recharts";
import "./Report.css";

/* ---------- Replace this with data from your API ---------- */
const report = {
  title: "Growth Report",
  period: "October 2026",
  kpis: [
    { label: "Posts shared", value: 128, delta: "+18%" },
    { label: "Skills learned", value: 14, delta: "+3" },
    { label: "Connections", value: 56, delta: "+12" },
    { label: "Streak (days)", value: 21, delta: "Best yet" },
  ],
  goals: [
    { name: "Learning", pct: 75 },
    { name: "Sharing", pct: 55 },
    { name: "Community", pct: 30 },
  ],
  monthly: [
    { m: "May", v: 20 }, { m: "Jun", v: 34 }, { m: "Jul", v: 28 },
    { m: "Aug", v: 52 }, { m: "Sep", v: 61 }, { m: "Oct", v: 88 },
  ],
  categories: [
    { name: "Art & Design", value: 32 },
    { name: "Fitness & Health", value: 24 },
    { name: "Psychology", value: 20 },
    { name: "Philosophy", value: 14 },
    { name: "Photography", value: 10 },
  ],
  tasks: [
    { t: "Finish 3 design lessons", done: true },
    { t: "Share a progress post", done: true },
    { t: "Join a Psychology circle", done: false },
    { t: "Give feedback to 5 members", done: false },
  ],
};

const COLORS = ["#9d4ee8", "#0b0b0b", "#c79bf5", "#6b2fb8", "#e7d3fb"];

function Ring({ pct, light }) {
  const r = 52, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 120 120" className="ring">
      <circle cx="60" cy="60" r={r} className={light ? "ring-bg ring-bg--light" : "ring-bg"} />
      <circle
        cx="60" cy="60" r={r}
        className={light ? "ring-fg ring-fg--light" : "ring-fg"}
        strokeDasharray={c}
        strokeDashoffset={c - (c * pct) / 100}
        transform="rotate(-90 60 60)"
      />
      <text x="60" y="68" textAnchor="middle" className="ring-text">{pct}%</text>
    </svg>
  );
}

export default function Report() {
  return (
    <div className="rp-page">
      <div className="rp-frame">
        {/* Top bar, same pill style as your landing page */}
        <header className="rp-nav">
          <strong className="rp-logo">evolvs</strong>
          <span className="rp-period">{report.period}</span>
          <div className="rp-nav-actions">
            <button className="btn btn--ghost" onClick={() => window.print()}>Download PDF</button>
            <button className="btn btn--dark">Share report</button>
          </div>
        </header>

        {/* Hero */}
        <section className="rp-hero">
          <p className="rp-kicker">Your human growth network</p>
          <h1 className="rp-title">Less scrolling. More evolving.</h1>
          <p className="rp-sub">Here is what you built in {report.period}.</p>
        </section>

        {/* KPI chips */}
        <section className="rp-kpis">
          {report.kpis.map((k) => (
            <div className="chip" key={k.label}>
              <span className="chip-value">{k.value}</span>
              <span className="chip-label">{k.label}</span>
              <span className="chip-delta">{k.delta}</span>
            </div>
          ))}
        </section>

        {/* Bento grid */}
        <section className="rp-grid">
          <article className="card card--purple">
            <h3>Goal progress</h3>
            <div className="rings">
              {report.goals.map((g) => (
                <div key={g.name} className="ring-item">
                  <Ring pct={g.pct} light />
                  <span>{g.name}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="card card--wide">
            <h3>Activity over time</h3>
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={report.monthly}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9d4ee8" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#9d4ee8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#eee" />
                <XAxis dataKey="m" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} width={30} />
                <Tooltip />
                <Area type="monotone" dataKey="v" stroke="#9d4ee8" strokeWidth={3} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </article>

          <article className="card">
            <h3>Where you spend time</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={report.categories} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {report.categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <ul className="legend">
              {report.categories.map((c, i) => (
                <li key={c.name}><i style={{ background: COLORS[i % COLORS.length] }} />{c.name}<b>{c.value}%</b></li>
              ))}
            </ul>
          </article>

          <article className="card">
            <h3>Monthly posts</h3>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={report.monthly}>
                <XAxis dataKey="m" axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="v" fill="#0b0b0b" radius={[12, 12, 12, 12]} />
              </BarChart>
            </ResponsiveContainer>
          </article>

          <article className="card">
            <h3>To do list</h3>
            <ul className="todo">
              {report.tasks.map((x) => (
                <li key={x.t} className={x.done ? "done" : ""}>
                  <span className="box">{x.done ? "✓" : ""}</span>{x.t}
                </li>
              ))}
            </ul>
          </article>
        </section>
      </div>
    </div>
  );
}
