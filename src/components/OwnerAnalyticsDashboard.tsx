"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AnalyticsDashboardPayload,
  AnalyticsRangeKey,
  KpiCard,
  SeriesPoint,
  VillageStats,
} from "@/lib/analytics/types";

type SectionId =
  | "overview"
  | "users"
  | "villages"
  | "letters"
  | "tv"
  | "tasks"
  | "collections"
  | "traffic"
  | "behavior"
  | "performance"
  | "errors"
  | "system"
  | "insights";

const NAV: Array<{ id: SectionId; label: string; icon: string }> = [
  { id: "overview", label: "Overview", icon: "🏡" },
  { id: "users", label: "Users", icon: "👥" },
  { id: "villages", label: "Villages", icon: "🏘️" },
  { id: "letters", label: "Letters", icon: "✉️" },
  { id: "tv", label: "TV Corner", icon: "📺" },
  { id: "tasks", label: "Tasks", icon: "🌱" },
  { id: "collections", label: "Collections", icon: "🎒" },
  { id: "traffic", label: "Traffic", icon: "🌎" },
  { id: "behavior", label: "Behavior", icon: "👣" },
  { id: "performance", label: "Performance", icon: "⚡" },
  { id: "errors", label: "Errors", icon: "🚨" },
  { id: "system", label: "System", icon: "💾" },
  { id: "insights", label: "Insights", icon: "✨" },
];

const RANGES: Array<{ key: AnalyticsRangeKey; label: string }> = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 3 months" },
  { key: "180d", label: "Last 6 months" },
  { key: "all", label: "All time" },
  { key: "custom", label: "Custom range" },
];

function formatBytes(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatKpiValue(kpi: KpiCard): string {
  if (kpi.format === "text") return String(kpi.value);
  if (typeof kpi.value === "number") return kpi.value.toLocaleString();
  return String(kpi.value);
}

function Delta({ pct }: { pct: number | null }) {
  if (pct == null) return null;
  const up = pct >= 0;
  return (
    <span className={`oa-delta ${up ? "up" : "down"}`} title="Compared with the previous period of the same length">
      {up ? "↑" : "↓"} {Math.abs(pct)}% vs previous period
    </span>
  );
}

function Sparkline({
  series,
  height = 72,
}: {
  series: SeriesPoint[];
  height?: number;
}) {
  const w = 320;
  const h = height;
  const pad = 6;
  if (!series.length) {
    return (
      <div className="oa-empty-chart" style={{ height }}>
        No points in this range yet
      </div>
    );
  }
  const vals = series.map((p) => p.value);
  const max = Math.max(...vals, 1);
  const min = Math.min(...vals, 0);
  const span = Math.max(max - min, 1);
  const pts = series
    .map((p, i) => {
      const x = pad + (i / Math.max(series.length - 1, 1)) * (w - pad * 2);
      const y = h - pad - ((p.value - min) / span) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");
  const area = `${pad},${h - pad} ${pts} ${w - pad},${h - pad}`;
  return (
    <svg className="oa-spark" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Trend chart">
      <polygon points={area} className="oa-spark-area" />
      <polyline points={pts} className="oa-spark-line" fill="none" />
    </svg>
  );
}

function BarCompare({
  rows,
  valueKey = "count",
  labelKey = "label",
}: {
  rows: Array<Record<string, string | number>>;
  valueKey?: string;
  labelKey?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => Number(r[valueKey]) || 0));
  if (!rows.length) return <p className="oa-muted">No data yet.</p>;
  return (
    <ul className="oa-bars">
      {rows.map((r, i) => {
        const v = Number(r[valueKey]) || 0;
        const label = String(r[labelKey] ?? "");
        return (
          <li key={`${label}-${i}`}>
            <div className="oa-bars-meta">
              <span>{label}</span>
              <strong>{v.toLocaleString()}</strong>
            </div>
            <div className="oa-bars-track" aria-hidden>
              <span style={{ width: `${(v / max) * 100}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function HourHeat({ hours }: { hours: Array<{ hour: number; count: number }> }) {
  const max = Math.max(1, ...hours.map((h) => h.count));
  return (
    <div className="oa-heat" role="img" aria-label="TV Corner activity by hour UTC">
      {hours.map((h) => (
        <div key={h.hour} className="oa-heat-cell" title={`${String(h.hour).padStart(2, "0")}:00 — ${h.count}`}>
          <span
            style={{
              opacity: 0.18 + (h.count / max) * 0.82,
            }}
          />
          <em>{String(h.hour).padStart(2, "0")}</em>
        </div>
      ))}
    </div>
  );
}

function RetentionBars({
  cohortSize,
  day1,
  day7,
  day30,
}: {
  cohortSize: number;
  day1: number;
  day7: number;
  day30: number;
}) {
  const steps = [
    { label: "Joined", n: cohortSize },
    { label: "Day 1 return", n: day1 },
    { label: "Day 7 return", n: day7 },
    { label: "Day 30 return", n: day30 },
  ];
  const max = Math.max(1, cohortSize);
  return (
    <div className="oa-retention">
      <p className="oa-muted">
        Measured from analytics events after signup (cohort size in this range). Example reading:{" "}
        <em>
          {cohortSize} users joined → {day1} returned the next day → {day7} within 7 days.
        </em>
      </p>
      <ul className="oa-bars">
        {steps.map((s) => (
          <li key={s.label}>
            <div className="oa-bars-meta">
              <span>{s.label}</span>
              <strong>
                {s.n.toLocaleString()}
                {cohortSize > 0 ? (
                  <span className="oa-muted"> ({Math.round((s.n / max) * 100)}%)</span>
                ) : null}
              </strong>
            </div>
            <div className="oa-bars-track" aria-hidden>
              <span style={{ width: `${(s.n / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FunnelView({
  steps,
}: {
  steps: AnalyticsDashboardPayload["letters"]["funnel"];
}) {
  if (!steps.length) return <p className="oa-muted">No funnel data yet.</p>;
  const max = Math.max(1, ...steps.map((s) => s.count));
  return (
    <ol className="oa-funnel">
      {steps.map((s, i) => (
        <li key={s.id}>
          <div className="oa-funnel-row">
            <span className="oa-funnel-label">{s.label}</span>
            <strong>
              {s.count.toLocaleString()}{" "}
              <span className="oa-muted">({s.pctOfFirst}% of first step)</span>
            </strong>
          </div>
          <div className="oa-funnel-bar" aria-hidden>
            <span style={{ width: `${(s.count / max) * 100}%` }} />
          </div>
          {i > 0 && s.dropPct != null ? (
            <p className="oa-funnel-drop">↓ {s.dropPct}% from previous step</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

export function OwnerAnalyticsDashboard() {
  const [section, setSection] = useState<SectionId>("overview");
  const [range, setRange] = useState<AnalyticsRangeKey>("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [data, setData] = useState<AnalyticsDashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [growthMode, setGrowthMode] = useState<
    "registrations" | "active" | "returning"
  >("registrations");
  const [villageId, setVillageId] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(true);
  const [errorsOpen, setErrorsOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ range });
      if (range === "custom") {
        if (customStart) qs.set("start", customStart);
        if (customEnd) qs.set("end", customEnd);
      }
      const res = await fetch(`/api/admin/analytics?${qs.toString()}`, {
        credentials: "same-origin",
      });
      const json = (await res.json()) as {
        ok?: boolean;
        data?: AnalyticsDashboardPayload;
        error?: string;
      };
      if (!res.ok || !json.ok || !json.data) {
        throw new Error(json.error || "Could not load analytics");
      }
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [range, customStart, customEnd]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedVillage: VillageStats | null = useMemo(() => {
    if (!data || !villageId) return null;
    return data.villages.find((v) => v.id === villageId) || null;
  }, [data, villageId]);

  const growthSeries = useMemo(() => {
    if (!data) return [];
    return data.users.growthModes?.[growthMode] || data.users.growth;
  }, [data, growthMode]);

  return (
    <div className="oa-shell">
      <header className="oa-hero">
        <p className="oa-kicker">Owner control room</p>
        <h1>WhimPost Analytics</h1>
        <p className="oa-lede">
          A private look at who is visiting the villages, what they do, and what needs care —
          aggregated and privacy-safe.
        </p>
      </header>

      <div className="oa-toolbar">
        <label className="oa-range">
          <span>Date range</span>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as AnalyticsRangeKey)}
          >
            {RANGES.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        {range === "custom" ? (
          <div className="oa-custom-range">
            <label>
              From
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
            </label>
            <label>
              To
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </label>
          </div>
        ) : null}
        <button type="button" className="oa-refresh" onClick={() => void load()} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
        {data ? (
          <span className="oa-muted oa-gen">
            {data.range.label} · updated {new Date(data.generatedAt).toLocaleString()}
          </span>
        ) : null}
      </div>

      <div className={`oa-layout ${navOpen ? "nav-open" : "nav-closed"}`}>
        <aside className="oa-nav" aria-label="Owner analytics">
          <button
            type="button"
            className="oa-nav-toggle"
            onClick={() => setNavOpen((v) => !v)}
            aria-expanded={navOpen}
          >
            {navOpen ? "Collapse menu" : "Owner menu"}
          </button>
          {navOpen ? (
            <nav>
              <p className="oa-nav-title">OWNER</p>
              <ul>
                {NAV.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={section === item.id ? "active" : ""}
                      onClick={() => {
                        setSection(item.id);
                        if (item.id !== "villages") setVillageId(null);
                      }}
                    >
                      <span aria-hidden>{item.icon}</span> {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </aside>

        <div className="oa-main">
          {error ? <p className="oa-error">{error}</p> : null}
          {loading && !data ? <p className="oa-muted">Gathering village signals…</p> : null}

          {data && section === "overview" ? (
            <section className="oa-section" id="overview">
              <h2>Overview</h2>
              <p className="oa-section-lede">
                Who is using WhimPost, what they are doing, and whether the forest is healthy.
              </p>
              <div className="oa-kpi-grid">
                {data.overview.kpis.map((kpi) => (
                  <article key={kpi.id} className="oa-kpi" title={kpi.hint}>
                    <h3>{kpi.label}</h3>
                    <p className="oa-kpi-value">{formatKpiValue(kpi)}</p>
                    <Delta pct={kpi.deltaPct} />
                    <p className="oa-hint">{kpi.hint}</p>
                  </article>
                ))}
              </div>
              <div className="oa-two">
                <article className="oa-panel">
                  <h3>✨ Top insights</h3>
                  <ul className="oa-insight-list">
                    {data.insights.slice(0, 3).map((ins) => (
                      <li key={ins.id}>
                        <strong>
                          {ins.emoji} {ins.title}
                        </strong>
                        <span>{ins.what}</span>
                      </li>
                    ))}
                  </ul>
                  <button type="button" className="oa-linkish" onClick={() => setSection("insights")}>
                    Open full insights →
                  </button>
                </article>
                <article className="oa-panel">
                  <h3>🛠 What should I improve?</h3>
                  <ul className="oa-priority-list">
                    {data.priorities.slice(0, 3).map((p) => (
                      <li key={p.id} className={`sev-${p.severity}`}>
                        <span className="oa-sev">
                          {p.severity === "high" ? "🔴" : p.severity === "medium" ? "🟡" : "🟢"}{" "}
                          {p.severity} priority
                        </span>
                        <strong>{p.title}</strong>
                        <span>{p.detail}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              </div>
            </section>
          ) : null}

          {data && section === "users" ? (
            <section className="oa-section">
              <h2>👥 Users</h2>
              <div className="oa-stat-row">
                <div>
                  <em>Total</em>
                  <strong>{data.users.total}</strong>
                </div>
                <div>
                  <em>New</em>
                  <strong>{data.users.newInRange}</strong>
                </div>
                <div>
                  <em>Active</em>
                  <strong>{data.users.activeInRange}</strong>
                </div>
                <div>
                  <em>Returning</em>
                  <strong>{data.users.returningInRange}</strong>
                </div>
                <div>
                  <em>Inactive</em>
                  <strong>{data.users.inactive}</strong>
                </div>
                <div>
                  <em>DAU / WAU / MAU</em>
                  <strong>
                    {data.users.dau} / {data.users.wau} / {data.users.mau}
                  </strong>
                </div>
              </div>
              <article className="oa-panel">
                <div className="oa-panel-head">
                  <h3>User growth</h3>
                  <div className="oa-seg">
                    {(
                      [
                        ["registrations", "Registrations"],
                        ["active", "Active users"],
                        ["returning", "Returning"],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        className={growthMode === id ? "active" : ""}
                        onClick={() => setGrowthMode(id)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <Sparkline series={growthSeries} height={110} />
              </article>
              <article className="oa-panel">
                <h3>Retention</h3>
                <RetentionBars {...data.users.retention} />
              </article>
            </section>
          ) : null}

          {data && section === "villages" ? (
            <section className="oa-section">
              <h2>🏘️ Villages</h2>
              {!selectedVillage ? (
                <>
                  <p className="oa-section-lede">
                    Compare membership and engagement. Click a village for detail.
                  </p>
                  <div className="oa-village-grid">
                    {data.villages.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        className="oa-village-card"
                        onClick={() => setVillageId(v.id)}
                      >
                        <h3>{v.name}</h3>
                        <p>
                          {v.members} members · {v.memberPct}% of users
                        </p>
                        <p>
                          Active {v.activeMembers} · Engagement {v.engagementRate}%
                        </p>
                        {v.insight ? <p className="oa-hint">{v.insight}</p> : null}
                      </button>
                    ))}
                  </div>
                  <article className="oa-panel">
                    <h3>Engagement comparison</h3>
                    <BarCompare
                      rows={data.villages.map((v) => ({
                        label: v.name,
                        count: v.engagementRate,
                      }))}
                    />
                  </article>
                </>
              ) : (
                <article className="oa-panel">
                  <button type="button" className="oa-linkish" onClick={() => setVillageId(null)}>
                    ← All villages
                  </button>
                  <h3>{selectedVillage.name}</h3>
                  <div className="oa-stat-row">
                    <div>
                      <em>Members</em>
                      <strong>{selectedVillage.members}</strong>
                    </div>
                    <div>
                      <em>% of users</em>
                      <strong>{selectedVillage.memberPct}%</strong>
                    </div>
                    <div>
                      <em>Active</em>
                      <strong>{selectedVillage.activeMembers}</strong>
                    </div>
                    <div>
                      <em>Engagement</em>
                      <strong>{selectedVillage.engagementRate}%</strong>
                    </div>
                    <div>
                      <em>Letters sent</em>
                      <strong>{selectedVillage.lettersSent}</strong>
                    </div>
                    <div>
                      <em>Letters received</em>
                      <strong>{selectedVillage.lettersReceived}</strong>
                    </div>
                    <div>
                      <em>Tasks done</em>
                      <strong>{selectedVillage.tasksCompleted}</strong>
                    </div>
                    <div>
                      <em>TV participation</em>
                      <strong>{selectedVillage.tvSessions}</strong>
                    </div>
                    <div>
                      <em>Collection items</em>
                      <strong>{selectedVillage.collectionItems}</strong>
                    </div>
                  </div>
                  {selectedVillage.insight ? (
                    <p className="oa-hint">{selectedVillage.insight}</p>
                  ) : null}
                </article>
              )}
            </section>
          ) : null}

          {data && section === "letters" ? (
            <section className="oa-section">
              <h2>✉️ Letters</h2>
              <p className="oa-section-lede">
                Aggregated letter activity only — private letter contents are never shown here.
              </p>
              <div className="oa-stat-row">
                <div>
                  <em>Written</em>
                  <strong>{data.letters.written}</strong>
                </div>
                <div>
                  <em>Sent</em>
                  <strong>{data.letters.sent}</strong>
                </div>
                <div>
                  <em>Received</em>
                  <strong>{data.letters.received}</strong>
                </div>
                <div>
                  <em>Opened</em>
                  <strong>{data.letters.opened}</strong>
                </div>
                <div>
                  <em>Replied (approx)</em>
                  <strong>{data.letters.replied}</strong>
                </div>
                <div>
                  <em>Avg / active user</em>
                  <strong>{data.letters.avgPerActiveUser}</strong>
                </div>
              </div>
              <div className="oa-two">
                <article className="oa-panel">
                  <h3>Letter funnel</h3>
                  <FunnelView steps={data.letters.funnel} />
                </article>
                <article className="oa-panel">
                  <h3>Letters sent over time</h3>
                  <Sparkline series={data.letters.series} height={120} />
                </article>
              </div>
            </section>
          ) : null}

          {data && section === "tv" ? (
            <section className="oa-section">
              <h2>📺 TV Corner</h2>
              <div className="oa-stat-row">
                <div>
                  <em>Unique viewers</em>
                  <strong>{data.tv.uniqueViewers}</strong>
                </div>
                <div>
                  <em>Sessions</em>
                  <strong>{data.tv.sessions}</strong>
                </div>
                <div>
                  <em>Chat messages</em>
                  <strong>{data.tv.chatMessages}</strong>
                </div>
                <div>
                  <em>Videos on shelf</em>
                  <strong>{data.tv.videos}</strong>
                </div>
              </div>
              {data.tv.busiestInsight ? (
                <p className="oa-callout">{data.tv.busiestInsight}</p>
              ) : null}
              <article className="oa-panel">
                <h3>Time-of-day activity (UTC)</h3>
                <HourHeat hours={data.tv.hourHeat} />
              </article>
              <article className="oa-panel">
                <h3>Viewers by village</h3>
                <BarCompare
                  rows={data.tv.byVillage.map((v) => ({
                    label: v.name,
                    count: v.viewers,
                  }))}
                />
              </article>
            </section>
          ) : null}

          {data && section === "tasks" ? (
            <section className="oa-section">
              <h2>🌱 Tasks</h2>
              <p className="oa-section-lede">
                Low completion is something to investigate — not automatically a bad task.
              </p>
              <div className="oa-stat-row">
                <div>
                  <em>Completed</em>
                  <strong>{data.tasks.completed}</strong>
                </div>
                <div>
                  <em>Avg / active user</em>
                  <strong>{data.tasks.avgPerActiveUser}</strong>
                </div>
              </div>
              <div className="oa-two">
                <article className="oa-panel">
                  <h3>Most popular</h3>
                  <BarCompare
                    rows={data.tasks.popular.map((t) => ({
                      label: t.name,
                      count: t.completions,
                    }))}
                  />
                </article>
                <article className="oa-panel">
                  <h3>Worth investigating (fewer completions)</h3>
                  <BarCompare
                    rows={data.tasks.least.map((t) => ({
                      label: t.name,
                      count: t.completions,
                    }))}
                  />
                </article>
              </div>
              <article className="oa-panel">
                <h3>By activity type</h3>
                <BarCompare
                  rows={data.tasks.byType.map((t) => ({
                    label: t.activityType,
                    count: t.completions,
                  }))}
                />
              </article>
            </section>
          ) : null}

          {data && section === "collections" ? (
            <section className="oa-section">
              <h2>🎒 Collections</h2>
              <div className="oa-stat-row">
                <div>
                  <em>Total items collected</em>
                  <strong>{data.collections.totalItems}</strong>
                </div>
                <div>
                  <em>Active collectors</em>
                  <strong>{data.collections.activeCollectors}</strong>
                </div>
              </div>
              <article className="oa-panel">
                <h3>Most collected kinds</h3>
                <BarCompare
                  rows={data.collections.topKinds.map((k) => ({
                    label: k.kind,
                    count: k.count,
                  }))}
                />
              </article>
            </section>
          ) : null}

          {data && section === "traffic" ? (
            <section className="oa-section">
              <h2>🌎 Traffic</h2>
              <p className="oa-section-lede">{data.traffic.note}</p>
              <div className="oa-two">
                <article className="oa-panel">
                  <h3>Sources</h3>
                  <BarCompare
                    rows={data.traffic.sources.map((s) => ({
                      label: s.source,
                      count: s.count,
                    }))}
                  />
                </article>
                <article className="oa-panel">
                  <h3>Devices</h3>
                  <BarCompare
                    rows={data.traffic.devices.map((s) => ({
                      label: s.device,
                      count: s.count,
                    }))}
                  />
                </article>
              </div>
              <div className="oa-two">
                <article className="oa-panel">
                  <h3>Browsers</h3>
                  <BarCompare
                    rows={data.traffic.browsers.map((s) => ({
                      label: s.browser,
                      count: s.count,
                    }))}
                  />
                </article>
                <article className="oa-panel">
                  <h3>Most visited pages</h3>
                  <ol className="oa-rank">
                    {data.traffic.topPages.map((p, i) => (
                      <li key={p.path}>
                        <span>
                          {i + 1}. {p.path}
                        </span>
                        <strong>{p.count}</strong>
                      </li>
                    ))}
                  </ol>
                  {!data.traffic.topPages.length ? (
                    <p className="oa-muted">Waiting for page_viewed beacons.</p>
                  ) : null}
                </article>
              </div>
            </section>
          ) : null}

          {data && section === "behavior" ? (
            <section className="oa-section">
              <h2>👣 Behavior</h2>
              <div className="oa-stat-row">
                <div>
                  <em>Sessions (approx)</em>
                  <strong>{data.behavior.sessionsApprox}</strong>
                </div>
                <div>
                  <em>Avg pages / session</em>
                  <strong>{data.behavior.avgPagesPerSession ?? "—"}</strong>
                </div>
                <div>
                  <em>Top entry</em>
                  <strong>{data.behavior.topEntry || "—"}</strong>
                </div>
                <div>
                  <em>Soft exit signal</em>
                  <strong>{data.behavior.topExit || "—"}</strong>
                </div>
              </div>
              {data.behavior.commonPath ? (
                <p className="oa-callout">Common path signal: {data.behavior.commonPath}</p>
              ) : null}
              <article className="oa-panel">
                <h3>Features used</h3>
                <BarCompare
                  rows={data.behavior.featuresUsed.map((f) => ({
                    label: f.feature,
                    count: f.count,
                  }))}
                />
              </article>
            </section>
          ) : null}

          {data && section === "performance" ? (
            <section className="oa-section">
              <h2>⚡ Performance</h2>
              <article className="oa-panel">
                <h3>
                  Status:{" "}
                  {data.health.status === "healthy"
                    ? "🟢 Healthy"
                    : data.health.status === "attention"
                      ? "🟡 Needs attention"
                      : "🔴 Critical"}
                </h3>
                <p className="oa-muted">
                  Detailed page-load and API timing beacons will appear here as instrumentation
                  expands. Error volume is the current leading health signal.
                </p>
                <p>
                  Tracked errors in range: <strong>{data.health.errorsInRange}</strong>
                </p>
              </article>
            </section>
          ) : null}

          {data && section === "errors" ? (
            <section className="oa-section">
              <h2>🚨 Errors</h2>
              <p className="oa-section-lede">{data.health.note}</p>
              <p>
                {data.health.status === "healthy"
                  ? "🟢"
                  : data.health.status === "attention"
                    ? "🟡"
                    : "🔴"}{" "}
                {data.health.errorsInRange} errors in this range
              </p>
              <button
                type="button"
                className="oa-linkish"
                onClick={() => setErrorsOpen((v) => !v)}
              >
                {errorsOpen ? "Hide detailed logs" : "Expand detailed logs"}
              </button>
              {errorsOpen ? (
                <div className="oa-table-wrap">
                  <table className="oa-table">
                    <thead>
                      <tr>
                        <th>When</th>
                        <th>Kind</th>
                        <th>Message</th>
                        <th>Path</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.health.recentErrors.map((e) => (
                        <tr key={e.id}>
                          <td>{e.createdAt}</td>
                          <td>{e.kind}</td>
                          <td>{e.message}</td>
                          <td>{e.path || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!data.health.recentErrors.length ? (
                    <p className="oa-muted">No recent error rows.</p>
                  ) : null}
                </div>
              ) : null}
            </section>
          ) : null}

          {data && section === "system" ? (
            <section className="oa-section">
              <h2>💾 System</h2>
              <p className="oa-section-lede">
                Technical overview only — credentials, env vars, and tokens are never shown.
              </p>
              <div className="oa-stat-row">
                <div>
                  <em>Users</em>
                  <strong>{data.system.users}</strong>
                </div>
                <div>
                  <em>Letters</em>
                  <strong>{data.system.letters}</strong>
                </div>
                <div>
                  <em>Journal rows</em>
                  <strong>{data.system.journalRows}</strong>
                </div>
                <div>
                  <em>TV videos</em>
                  <strong>{data.system.tvVideos}</strong>
                </div>
                <div>
                  <em>TV presence rows</em>
                  <strong>{data.system.tvPresence}</strong>
                </div>
                <div>
                  <em>Analytics events</em>
                  <strong>{data.system.analyticsEvents}</strong>
                </div>
                <div>
                  <em>Database size</em>
                  <strong>{formatBytes(data.system.dbBytes)}</strong>
                </div>
                <div>
                  <em>Uploads storage</em>
                  <strong>{formatBytes(data.system.uploadsBytes)}</strong>
                </div>
              </div>
            </section>
          ) : null}

          {data && section === "insights" ? (
            <section className="oa-section">
              <h2>✨ WhimPost Insights</h2>
              <p className="oa-section-lede">
                Measured patterns first — suggestions are investigation prompts, not automatic
                changes.
              </p>
              <div className="oa-insight-grid">
                {data.insights.map((ins) => (
                  <article key={ins.id} className={`oa-insight kind-${ins.kind}`}>
                    <h3>
                      {ins.emoji} {ins.title}
                    </h3>
                    <p>
                      <strong>What happened</strong>
                      <br />
                      {ins.what}
                    </p>
                    <p>
                      <strong>Why it matters</strong>
                      <br />
                      {ins.why}
                    </p>
                    <p>
                      <strong>Suggested investigation</strong>
                      <br />
                      {ins.next}
                    </p>
                  </article>
                ))}
              </div>
              <h3 className="oa-subhead">🛠 What should I improve?</h3>
              <ul className="oa-priority-list oa-priority-full">
                {data.priorities.map((p) => (
                  <li key={p.id} className={`sev-${p.severity}`}>
                    <span className="oa-sev">
                      {p.severity === "high" ? "🔴 High" : p.severity === "medium" ? "🟡 Medium" : "🟢 Low"}{" "}
                      priority
                    </span>
                    <strong>{p.title}</strong>
                    <span>{p.detail}</span>
                    {p.affectedUsers != null ? (
                      <span className="oa-muted">~{p.affectedUsers} users affected</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
