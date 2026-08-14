import fs from "fs";
import path from "path";
import { getDb } from "@/lib/db";
import { VILLAGES } from "@/lib/villages";
import { deltaPct, resolveDateRange } from "@/lib/analytics/ranges";
import type {
  AnalyticsDashboardPayload,
  AnalyticsRangeKey,
  FunnelStep,
  InsightCard,
  KpiCard,
  PriorityItem,
  SeriesPoint,
  VillageStats,
} from "@/lib/analytics/types";

function countSql(
  db: ReturnType<typeof getDb>,
  sql: string,
  params: unknown[] = []
): number {
  const row = db.prepare(sql).get(...params) as { n?: number } | undefined;
  return Number(row?.n) || 0;
}

function betweenClause(
  column: string,
  start: string | null,
  end: string | null
): { sql: string; params: string[] } {
  if (!start && !end) return { sql: "1=1", params: [] };
  if (start && end) {
    return { sql: `${column} >= ? AND ${column} <= ?`, params: [start, end] };
  }
  if (start) return { sql: `${column} >= ?`, params: [start] };
  return { sql: `${column} <= ?`, params: [end!] };
}

function seriesFromRows(
  rows: Array<{ d: string; n: number }>
): SeriesPoint[] {
  return rows.map((r) => ({ date: r.d, value: Number(r.n) || 0 }));
}

function parseCollectibles(json: string): Record<string, number> {
  try {
    const raw = JSON.parse(json || "{}") as Record<string, unknown>;
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(raw)) {
      const n = typeof v === "number" ? v : Number(v);
      if (Number.isFinite(n) && n > 0) out[k] = n;
    }
    return out;
  } catch {
    return {};
  }
}

function buildInsights(input: {
  villages: VillageStats[];
  lettersSentDelta: number | null;
  taskTop: string | null;
  busyTv: string | null;
  newUsers: number;
  withVillage: number;
}): InsightCard[] {
  const cards: InsightCard[] = [];
  const topEngaged = [...input.villages].sort(
    (a, b) => b.engagementRate - a.engagementRate
  )[0];
  if (topEngaged && topEngaged.members > 0) {
    cards.push({
      id: "village-engage",
      emoji: "🏘️",
      title: `${topEngaged.name} leads engagement`,
      what: `${topEngaged.name} currently shows the highest engagement rate (${topEngaged.engagementRate}%) among villages with members.`,
      why: "Engagement rate highlights how active a village feels relative to its size — useful when deciding where to host events.",
      next: "Compare task completions and letter volume for that village in Villages → detail.",
      kind: "positive",
    });
  }
  if (input.taskTop) {
    cards.push({
      id: "task-top",
      emoji: "🌱",
      title: "Most completed activity",
      what: `“${input.taskTop}” led completed activities in this range (measured from journal rows).`,
      why: "Popular activities are natural places to deepen the loop with rewards or follow-up letters.",
      next: "Check Tasks for least-completed activities before changing anything.",
      kind: "positive",
    });
  }
  if (input.lettersSentDelta != null) {
    cards.push({
      id: "letters-delta",
      emoji: "💌",
      title:
        input.lettersSentDelta >= 0
          ? "Letter sending rose"
          : "Letter sending dipped",
      what: `Letters sent changed by ${input.lettersSentDelta}% versus the previous period (same length).`,
      why: "Letters are a core WhimPost loop — swings often show whether the social rhythm is warming or cooling.",
      next: "Open Letter Analytics funnel to see where writers drop off.",
      kind: input.lettersSentDelta >= 0 ? "positive" : "caution",
    });
  }
  if (input.busyTv) {
    cards.push({
      id: "tv-busy",
      emoji: "📺",
      title: "TV Corner busy window",
      what: input.busyTv,
      why: "Peak hours help schedule shared watches without guessing.",
      next: "Cross-check TV Corner hour heat with village membership.",
      kind: "neutral",
    });
  }
  if (input.newUsers > 0) {
    const missingVillage = Math.max(0, input.newUsers - input.withVillage);
    if (missingVillage > 0) {
      const pct = Math.round((missingVillage / input.newUsers) * 100);
      cards.push({
        id: "intro-gap",
        emoji: "⚠️",
        title: "Some newcomers lack a village",
        what: `About ${pct}% of new accounts in this range still have no village_id set (${missingVillage} of ${input.newUsers}).`,
        why: "Village joining is a major onboarding step — missing it often means a softer first day.",
        next: "Review Behavior entry pages and the village join flow.",
        kind: "caution",
      });
    }
  }
  return cards.slice(0, 8);
}

function buildPriorities(input: {
  errors: number;
  inactive: number;
  totalUsers: number;
  lowVillage: VillageStats | null;
  letterFunnelDrop: FunnelStep | null;
}): PriorityItem[] {
  const items: PriorityItem[] = [];
  if (input.errors > 10) {
    items.push({
      id: "errors",
      severity: "high",
      title: "Elevated error volume",
      detail: `${input.errors} tracked errors in this range. Expand Website Health for kinds and paths.`,
      affectedUsers: null,
    });
  }
  if (input.totalUsers > 0 && input.inactive / input.totalUsers > 0.45) {
    items.push({
      id: "inactive",
      severity: "medium",
      title: "Large inactive share",
      detail: `${input.inactive} users look inactive (no recent progress/letter/TV signal). Worth a gentle re-engagement experiment.`,
      affectedUsers: input.inactive,
    });
  }
  if (input.letterFunnelDrop && input.letterFunnelDrop.dropPct != null && input.letterFunnelDrop.dropPct > 40) {
    items.push({
      id: "letter-drop",
      severity: "medium",
      title: `Letter funnel soft at “${input.letterFunnelDrop.label}”`,
      detail: `About ${input.letterFunnelDrop.dropPct}% drop into this step. Investigate UX, not just the number.`,
      affectedUsers: null,
    });
  }
  if (input.lowVillage && input.lowVillage.members > 0 && input.lowVillage.engagementRate < 15) {
    items.push({
      id: "village-soft",
      severity: "low",
      title: `${input.lowVillage.name} engagement is soft`,
      detail: "Fewer active signals relative to membership — investigate before redesigning.",
      affectedUsers: input.lowVillage.members,
    });
  }
  if (items.length === 0) {
    items.push({
      id: "steady",
      severity: "low",
      title: "No urgent red flags from current signals",
      detail: "Keep watching growth, letter funnel, and error volume as traffic rises.",
      affectedUsers: null,
    });
  }
  return items;
}

export function buildAnalyticsDashboard(opts: {
  rangeKey?: AnalyticsRangeKey;
  customStart?: string | null;
  customEnd?: string | null;
}): AnalyticsDashboardPayload {
  const db = getDb();
  const range = resolveDateRange(
    opts.rangeKey || "30d",
    opts.customStart,
    opts.customEnd
  );
  const cur = betweenClause("created_at", range.start, range.end);
  const prev = betweenClause("created_at", range.prevStart, range.prevEnd);
  const sentCur = betweenClause("sent_at", range.start, range.end);
  const sentPrev = betweenClause("sent_at", range.prevStart, range.prevEnd);

  const totalUsers = countSql(db, `SELECT COUNT(*) AS n FROM users`);
  const newUsers = countSql(
    db,
    `SELECT COUNT(*) AS n FROM users WHERE ${cur.sql}`,
    cur.params
  );
  const newUsersPrev = countSql(
    db,
    `SELECT COUNT(*) AS n FROM users WHERE ${prev.sql}`,
    prev.params
  );

  // Active ≈ touched a progress row, journal, letter, or analytics event recently.
  const activeUsers = countSql(
    db,
    `SELECT COUNT(DISTINCT uid) AS n FROM (
      SELECT user_id AS uid FROM workshop_progress WHERE ${betweenClause("updated_at", range.start, range.end).sql}
      UNION
      SELECT user_id FROM garden_progress WHERE ${betweenClause("updated_at", range.start, range.end).sql}
      UNION
      SELECT user_id FROM library_progress WHERE ${betweenClause("updated_at", range.start, range.end).sql}
      UNION
      SELECT user_id FROM hearth_progress WHERE ${betweenClause("updated_at", range.start, range.end).sql}
      UNION
      SELECT user_id FROM moon_progress WHERE ${betweenClause("updated_at", range.start, range.end).sql}
      UNION
      SELECT sender_id FROM letters WHERE status='sent' AND ${sentCur.sql}
      UNION
      SELECT user_id FROM analytics_events WHERE user_id IS NOT NULL AND ${cur.sql}
    )`,
    [
      ...betweenClause("updated_at", range.start, range.end).params,
      ...betweenClause("updated_at", range.start, range.end).params,
      ...betweenClause("updated_at", range.start, range.end).params,
      ...betweenClause("updated_at", range.start, range.end).params,
      ...betweenClause("updated_at", range.start, range.end).params,
      ...sentCur.params,
      ...cur.params,
    ]
  );

  const today = resolveDateRange("today");
  const todayClause = betweenClause("created_at", today.start, today.end);
  const activeToday = countSql(
    db,
    `SELECT COUNT(DISTINCT user_id) AS n FROM analytics_events
     WHERE user_id IS NOT NULL AND ${todayClause.sql}`,
    todayClause.params
  );
  const newToday = countSql(
    db,
    `SELECT COUNT(*) AS n FROM users WHERE ${todayClause.sql}`,
    todayClause.params
  );
  const week = resolveDateRange("7d");
  const weekClause = betweenClause("created_at", week.start, week.end);
  const newWeek = countSql(
    db,
    `SELECT COUNT(*) AS n FROM users WHERE ${weekClause.sql}`,
    weekClause.params
  );

  const returningUsers = range.start
    ? countSql(
        db,
        `SELECT COUNT(*) AS n FROM users u
         WHERE u.created_at < ?
           AND EXISTS (
             SELECT 1 FROM analytics_events e
             WHERE e.user_id = u.id AND ${cur.sql.replace(/created_at/g, "e.created_at")}
           )`,
        [range.start, ...cur.params]
      )
    : countSql(
        db,
        `SELECT COUNT(*) AS n FROM users u
         WHERE EXISTS (
           SELECT 1 FROM analytics_events e
           WHERE e.user_id = u.id
             AND e.created_at > datetime(u.created_at, '+1 day')
         )`
      );

  const lettersSent = countSql(
    db,
    `SELECT COUNT(*) AS n FROM letters
     WHERE status='sent' AND sender_id NOT LIKE 'system-%' AND ${sentCur.sql}`,
    sentCur.params
  );
  const lettersSentPrev = countSql(
    db,
    `SELECT COUNT(*) AS n FROM letters
     WHERE status='sent' AND sender_id NOT LIKE 'system-%' AND ${sentPrev.sql}`,
    sentPrev.params
  );
  const lettersReceived = countSql(
    db,
    `SELECT COUNT(*) AS n FROM letters
     WHERE status='sent' AND sender_id NOT LIKE 'system-%' AND ${sentCur.sql}`,
    sentCur.params
  );
  const lettersOpened = countSql(
    db,
    `SELECT COUNT(*) AS n FROM letters
     WHERE status='sent' AND is_read=1 AND sender_id NOT LIKE 'system-%' AND ${sentCur.sql}`,
    sentCur.params
  );
  const lettersWritten = countSql(
    db,
    `SELECT COUNT(*) AS n FROM letters
     WHERE sender_id NOT LIKE 'system-%' AND ${cur.sql}`,
    cur.params
  );

  const tasksCompleted = countSql(
    db,
    `SELECT COUNT(*) AS n FROM (
      SELECT id FROM workshop_journal WHERE ${cur.sql}
      UNION ALL
      SELECT id FROM garden_journal WHERE ${cur.sql}
      UNION ALL
      SELECT id FROM library_journal WHERE ${cur.sql}
    )`,
    [...cur.params, ...cur.params, ...cur.params]
  );

  const tvViewers = countSql(
    db,
    `SELECT COUNT(DISTINCT user_id) AS n FROM tv_presence
     WHERE ${betweenClause("last_seen_at", range.start, range.end).sql}`,
    betweenClause("last_seen_at", range.start, range.end).params
  );

  const villageCounts = VILLAGES.map((v) => {
    const members = countSql(
      db,
      `SELECT COUNT(*) AS n FROM users WHERE village_id = ?`,
      [v.id]
    );
    return { id: v.id, name: v.name, members };
  });
  const popularVillage =
    [...villageCounts].sort((a, b) => b.members - a.members)[0]?.name || "—";

  const kpi = (
    id: string,
    label: string,
    value: number | string,
    hint: string,
    current?: number,
    previous?: number,
    format: KpiCard["format"] = "number"
  ): KpiCard => ({
    id,
    label,
    value,
    hint,
    deltaPct:
      typeof current === "number" && typeof previous === "number"
        ? deltaPct(current, previous)
        : null,
    format,
  });

  const kpis: KpiCard[] = [
    kpi("total-users", "Total users", totalUsers, "Every registered account in the database."),
    kpi(
      "active-today",
      "Active users today",
      activeToday,
      "Distinct users with a tracked analytics event since UTC midnight."
    ),
    kpi(
      "new-today",
      "New users today",
      newToday,
      "Accounts created since UTC midnight.",
      newToday,
      countSql(
        db,
        `SELECT COUNT(*) AS n FROM users WHERE created_at >= datetime('now','-1 day') AND created_at < datetime('now','start of day')`
      )
    ),
    kpi("new-week", "New users this week", newWeek, "Registrations in the last 7 days."),
    kpi(
      "returning",
      "Returning users",
      returningUsers,
      "Users who registered before this range and produced an analytics event inside it."
    ),
    kpi(
      "letters-sent",
      "Letters sent",
      lettersSent,
      "Sent letters excluding system welcome mail.",
      lettersSent,
      lettersSentPrev
    ),
    kpi(
      "letters-received",
      "Letters received",
      lettersReceived,
      "Same pool as sent letters (recipient deliveries in range)."
    ),
    kpi(
      "tasks",
      "Tasks completed",
      tasksCompleted,
      "Journal/activity rows across workshop, garden, and library in this range."
    ),
    kpi(
      "tv-viewers",
      "TV Corner viewers",
      tvViewers,
      "Distinct users seen in tv_presence during the range."
    ),
    kpi(
      "popular-village",
      "Most popular village",
      popularVillage,
      "Village with the most current members (not range-limited).",
      undefined,
      undefined,
      "text"
    ),
    kpi(
      "session",
      "Avg session duration",
      "—",
      "Needs richer client session beacons over time. Showing placeholder until enough heartbeat data exists.",
      undefined,
      undefined,
      "text"
    ),
  ];

  // Growth series
  const growthRows = db
    .prepare(
      `SELECT date(created_at) AS d, COUNT(*) AS n
       FROM users
       WHERE ${cur.sql}
       GROUP BY date(created_at)
       ORDER BY d ASC`
    )
    .all(...cur.params) as Array<{ d: string; n: number }>;

  const activeGrowthRows = db
    .prepare(
      `SELECT date(created_at) AS d, COUNT(DISTINCT user_id) AS n
       FROM analytics_events
       WHERE user_id IS NOT NULL AND ${cur.sql}
       GROUP BY date(created_at)
       ORDER BY d ASC`
    )
    .all(...cur.params) as Array<{ d: string; n: number }>;

  const returningGrowthRows = db
    .prepare(
      `SELECT date(e.created_at) AS d, COUNT(DISTINCT e.user_id) AS n
       FROM analytics_events e
       JOIN users u ON u.id = e.user_id
       WHERE e.user_id IS NOT NULL
         AND u.created_at < date(e.created_at)
         AND ${cur.sql.replace(/created_at/g, "e.created_at")}
       GROUP BY date(e.created_at)
       ORDER BY d ASC`
    )
    .all(...cur.params) as Array<{ d: string; n: number }>;

  const month = resolveDateRange("30d");
  const monthClause = betweenClause("created_at", month.start, month.end);
  const dau = activeToday;
  const wau = countSql(
    db,
    `SELECT COUNT(DISTINCT user_id) AS n FROM analytics_events
     WHERE user_id IS NOT NULL AND ${weekClause.sql}`,
    weekClause.params
  );
  const mau = countSql(
    db,
    `SELECT COUNT(DISTINCT user_id) AS n FROM analytics_events
     WHERE user_id IS NOT NULL AND ${monthClause.sql}`,
    monthClause.params
  );

  // Retention approx: users created in range who returned later
  const cohortSize = newUsers;
  const day1 = countSql(
    db,
    `SELECT COUNT(*) AS n FROM users u
     WHERE ${cur.sql.replace(/created_at/g, "u.created_at")}
       AND EXISTS (
         SELECT 1 FROM analytics_events e
         WHERE e.user_id = u.id
           AND e.created_at > u.created_at
           AND e.created_at <= datetime(u.created_at, '+1 day')
       )`,
    cur.params
  );
  const day7 = countSql(
    db,
    `SELECT COUNT(*) AS n FROM users u
     WHERE ${cur.sql.replace(/created_at/g, "u.created_at")}
       AND EXISTS (
         SELECT 1 FROM analytics_events e
         WHERE e.user_id = u.id
           AND e.created_at > datetime(u.created_at, '+1 day')
           AND e.created_at <= datetime(u.created_at, '+7 day')
       )`,
    cur.params
  );
  const day30 = countSql(
    db,
    `SELECT COUNT(*) AS n FROM users u
     WHERE ${cur.sql.replace(/created_at/g, "u.created_at")}
       AND EXISTS (
         SELECT 1 FROM analytics_events e
         WHERE e.user_id = u.id
           AND e.created_at > datetime(u.created_at, '+7 day')
           AND e.created_at <= datetime(u.created_at, '+30 day')
       )`,
    cur.params
  );

  const inactive = Math.max(0, totalUsers - activeUsers);

  // Villages
  const villages: VillageStats[] = VILLAGES.map((v) => {
    const members = villageCounts.find((x) => x.id === v.id)?.members || 0;
    const activeMembers = countSql(
      db,
      `SELECT COUNT(DISTINCT u.id) AS n FROM users u
       JOIN analytics_events e ON e.user_id = u.id
       WHERE u.village_id = ? AND ${cur.sql.replace(/created_at/g, "e.created_at")}`,
      [v.id, ...cur.params]
    );
    const lettersSentV = countSql(
      db,
      `SELECT COUNT(*) AS n FROM letters l
       JOIN users u ON u.id = l.sender_id
       WHERE u.village_id = ? AND l.status='sent' AND l.sender_id NOT LIKE 'system-%'
         AND ${sentCur.sql.replace(/sent_at/g, "l.sent_at")}`,
      [v.id, ...sentCur.params]
    );
    const lettersRecvV = countSql(
      db,
      `SELECT COUNT(*) AS n FROM letters l
       JOIN users u ON u.id = l.recipient_id
       WHERE u.village_id = ? AND l.status='sent' AND l.sender_id NOT LIKE 'system-%'
         AND ${sentCur.sql.replace(/sent_at/g, "l.sent_at")}`,
      [v.id, ...sentCur.params]
    );
    const tasksV = countSql(
      db,
      `SELECT COUNT(*) AS n FROM (
         SELECT j.id FROM workshop_journal j JOIN users u ON u.id=j.user_id
           WHERE u.village_id=? AND ${cur.sql.replace(/created_at/g, "j.created_at")}
         UNION ALL
         SELECT j.id FROM garden_journal j JOIN users u ON u.id=j.user_id
           WHERE u.village_id=? AND ${cur.sql.replace(/created_at/g, "j.created_at")}
         UNION ALL
         SELECT j.id FROM library_journal j JOIN users u ON u.id=j.user_id
           WHERE u.village_id=? AND ${cur.sql.replace(/created_at/g, "j.created_at")}
       )`,
      [v.id, ...cur.params, v.id, ...cur.params, v.id, ...cur.params]
    );
    const tvSessions = countSql(
      db,
      `SELECT COUNT(DISTINCT p.user_id) AS n FROM tv_presence p
       JOIN users u ON u.id = p.user_id
       WHERE u.village_id = ? AND ${betweenClause("p.last_seen_at", range.start, range.end).sql}`,
      [v.id, ...betweenClause("p.last_seen_at", range.start, range.end).params]
    );
    const collectors = db
      .prepare(`SELECT collectibles_json FROM users WHERE village_id = ?`)
      .all(v.id) as Array<{ collectibles_json: string }>;
    let collectionItems = 0;
    for (const row of collectors) {
      const bag = parseCollectibles(row.collectibles_json);
      collectionItems += Object.values(bag).reduce((a, b) => a + b, 0);
    }
    const engagementRate =
      members > 0 ? Math.round((activeMembers / members) * 1000) / 10 : 0;
    return {
      id: v.id,
      name: v.name,
      members,
      memberPct: totalUsers ? Math.round((members / totalUsers) * 1000) / 10 : 0,
      activeMembers,
      lettersSent: lettersSentV,
      lettersReceived: lettersRecvV,
      tasksCompleted: tasksV,
      tvSessions,
      collectionItems,
      engagementRate,
    };
  });

  for (const v of villages) {
    const peers = villages.filter((x) => x.id !== v.id);
    const avgEng =
      peers.reduce((a, b) => a + b.engagementRate, 0) / Math.max(1, peers.length);
    if (v.members > 0 && v.engagementRate > avgEng + 5) {
      v.insight = `${v.name} has fewer or similar members but a stronger engagement rate than the village average.`;
    }
  }

  // Letter funnel (approx, privacy safe)
  const joined = newUsers || totalUsers;
  const visitedCompose = countSql(
    db,
    `SELECT COUNT(DISTINCT user_id) AS n FROM analytics_events
     WHERE event_name='page_viewed' AND path LIKE '/compose%' AND ${cur.sql}`,
    cur.params
  );
  const startedLetter = countSql(
    db,
    `SELECT COUNT(DISTINCT user_id) AS n FROM analytics_events
     WHERE event_name='letter_started' AND ${cur.sql}`,
    cur.params
  );
  const senders = countSql(
    db,
    `SELECT COUNT(DISTINCT sender_id) AS n FROM letters
     WHERE status='sent' AND sender_id NOT LIKE 'system-%' AND ${sentCur.sql}`,
    sentCur.params
  );
  const receivers = countSql(
    db,
    `SELECT COUNT(DISTINCT recipient_id) AS n FROM letters
     WHERE status='sent' AND sender_id NOT LIKE 'system-%' AND is_read=1 AND ${sentCur.sql}`,
    sentCur.params
  );
  // Reply approx: users who both received and later sent
  const repliers = countSql(
    db,
    `SELECT COUNT(DISTINCT l2.sender_id) AS n
     FROM letters l1
     JOIN letters l2 ON l2.sender_id = l1.recipient_id
       AND l2.recipient_id = l1.sender_id
       AND l2.status='sent'
       AND l2.sent_at > l1.sent_at
     WHERE l1.status='sent' AND l1.sender_id NOT LIKE 'system-%'
       AND ${sentCur.sql.replace(/sent_at/g, "l1.sent_at")}`,
    sentCur.params
  );
  const funnelCounts = [
    { id: "join", label: "User joins", count: joined },
    { id: "compose", label: "Visits letter section", count: Math.max(visitedCompose, startedLetter, senders) },
    { id: "start", label: "Starts writing", count: Math.max(startedLetter, senders) },
    { id: "send", label: "Sends letter", count: senders },
    { id: "receive", label: "Receives / opens", count: receivers },
    { id: "reply", label: "Replies", count: repliers },
  ];
  const funnel: FunnelStep[] = funnelCounts.map((step, i) => {
    const prevCount = i === 0 ? step.count : funnelCounts[i - 1]!.count;
    const pctOfFirst = joined ? Math.round((step.count / joined) * 1000) / 10 : 0;
    const dropPct =
      i === 0 || prevCount <= 0
        ? null
        : Math.round(((prevCount - step.count) / prevCount) * 1000) / 10;
    return { ...step, pctOfFirst, dropPct };
  });

  const letterSeries = seriesFromRows(
    db
      .prepare(
        `SELECT date(sent_at) AS d, COUNT(*) AS n FROM letters
         WHERE status='sent' AND sender_id NOT LIKE 'system-%' AND ${sentCur.sql}
         GROUP BY date(sent_at) ORDER BY d`
      )
      .all(...sentCur.params) as Array<{ d: string; n: number }>
  );

  // TV hour heat from presence / chat
  const hourRows = db
    .prepare(
      `SELECT CAST(strftime('%H', last_seen_at) AS INTEGER) AS hour, COUNT(*) AS n
       FROM tv_presence
       WHERE ${betweenClause("last_seen_at", range.start, range.end).sql}
       GROUP BY hour ORDER BY hour`
    )
    .all(...betweenClause("last_seen_at", range.start, range.end).params) as Array<{
    hour: number;
    n: number;
  }>;
  const hourHeat = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: Number(hourRows.find((r) => r.hour === hour)?.n) || 0,
  }));
  const peak = [...hourHeat].sort((a, b) => b.count - a.count)[0];
  const busiestInsight =
    peak && peak.count > 0
      ? `TV Corner presence currently clusters near ${String(peak.hour).padStart(2, "0")}:00–${String((peak.hour + 2) % 24).padStart(2, "0")}:00 UTC (measured from presence heartbeats).`
      : null;

  // Tasks
  const taskTypeRows = db
    .prepare(
      `SELECT activity_type AS activityType, COUNT(*) AS completions FROM (
         SELECT activity_type, created_at FROM workshop_journal
         UNION ALL SELECT activity_type, created_at FROM garden_journal
         UNION ALL SELECT activity_type, created_at FROM library_journal
       ) WHERE ${cur.sql}
       GROUP BY activity_type
       ORDER BY completions DESC`
    )
    .all(...cur.params) as Array<{ activityType: string; completions: number }>;

  const popularTaskRows = db
    .prepare(
      `SELECT activity_id AS id, COALESCE(activity_name, activity_id) AS name, COUNT(*) AS completions
       FROM (
         SELECT activity_id, activity_name, created_at FROM workshop_journal
         UNION ALL SELECT activity_id, activity_name, created_at FROM garden_journal
         UNION ALL SELECT activity_id, activity_name, created_at FROM library_journal
       ) WHERE ${cur.sql}
       GROUP BY activity_id
       ORDER BY completions DESC
       LIMIT 8`
    )
    .all(...cur.params) as Array<{ id: string; name: string; completions: number }>;

  const leastTaskRows = [...popularTaskRows].reverse().slice(0, 5);

  // Collections from users.collectibles_json
  const collectRows = db
    .prepare(`SELECT collectibles_json FROM users`)
    .all() as Array<{ collectibles_json: string }>;
  const kindTotals: Record<string, number> = {};
  let totalItems = 0;
  let activeCollectors = 0;
  for (const row of collectRows) {
    const bag = parseCollectibles(row.collectibles_json);
    const sum = Object.values(bag).reduce((a, b) => a + b, 0);
    if (sum > 0) {
      activeCollectors += 1;
      totalItems += sum;
      for (const [k, v] of Object.entries(bag)) {
        kindTotals[k] = (kindTotals[k] || 0) + v;
      }
    }
  }
  const topKinds = Object.entries(kindTotals)
    .map(([kind, count]) => ({ kind, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Traffic from analytics_events
  const sourceRows = db
    .prepare(
      `SELECT COALESCE(source,'Direct') AS source, COUNT(*) AS count
       FROM analytics_events WHERE event_name='page_viewed' AND ${cur.sql}
       GROUP BY source ORDER BY count DESC LIMIT 12`
    )
    .all(...cur.params) as Array<{ source: string; count: number }>;
  const deviceRows = db
    .prepare(
      `SELECT COALESCE(device,'unknown') AS device, COUNT(*) AS count
       FROM analytics_events WHERE event_name='page_viewed' AND ${cur.sql}
       GROUP BY device ORDER BY count DESC`
    )
    .all(...cur.params) as Array<{ device: string; count: number }>;
  const browserRows = db
    .prepare(
      `SELECT COALESCE(browser,'Other') AS browser, COUNT(*) AS count
       FROM analytics_events WHERE event_name='page_viewed' AND ${cur.sql}
       GROUP BY browser ORDER BY count DESC`
    )
    .all(...cur.params) as Array<{ browser: string; count: number }>;
  const pageRows = db
    .prepare(
      `SELECT COALESCE(path,'/') AS path, COUNT(*) AS count
       FROM analytics_events WHERE event_name='page_viewed' AND ${cur.sql}
       GROUP BY path ORDER BY count DESC LIMIT 12`
    )
    .all(...cur.params) as Array<{ path: string; count: number }>;

  const sessionsApprox = countSql(
    db,
    `SELECT COUNT(DISTINCT session_id) AS n FROM analytics_events
     WHERE session_id IS NOT NULL AND ${cur.sql}`,
    cur.params
  );
  const pageViews = countSql(
    db,
    `SELECT COUNT(*) AS n FROM analytics_events WHERE event_name='page_viewed' AND ${cur.sql}`,
    cur.params
  );

  const featureRows = db
    .prepare(
      `SELECT event_name AS feature, COUNT(*) AS count
       FROM analytics_events
       WHERE event_name != 'page_viewed' AND ${cur.sql}
       GROUP BY event_name ORDER BY count DESC LIMIT 12`
    )
    .all(...cur.params) as Array<{ feature: string; count: number }>;

  const errorsInRange = countSql(
    db,
    `SELECT COUNT(*) AS n FROM analytics_errors WHERE ${cur.sql}`,
    cur.params
  );
  const recentErrors = db
    .prepare(
      `SELECT id, kind, message, path, created_at AS createdAt
       FROM analytics_errors WHERE ${cur.sql}
       ORDER BY created_at DESC LIMIT 12`
    )
    .all(...cur.params) as Array<{
    id: string;
    kind: string;
    message: string;
    path: string | null;
    createdAt: string;
  }>;

  const healthStatus =
    errorsInRange > 40 ? "critical" : errorsInRange > 10 ? "attention" : "healthy";

  let dbBytes: number | null = null;
  let uploadsBytes: number | null = null;
  try {
    dbBytes = fs.statSync(path.join(process.cwd(), "data", "whimpost.db")).size;
  } catch {
    dbBytes = null;
  }
  try {
    const uploadDir = path.join(process.cwd(), "data", "uploads");
    if (fs.existsSync(uploadDir)) {
      uploadsBytes = 0;
      for (const name of fs.readdirSync(uploadDir)) {
        try {
          uploadsBytes += fs.statSync(path.join(uploadDir, name)).size;
        } catch {
          // skip
        }
      }
    }
  } catch {
    uploadsBytes = null;
  }

  const journalRows =
    countSql(db, `SELECT COUNT(*) AS n FROM workshop_journal`) +
    countSql(db, `SELECT COUNT(*) AS n FROM garden_journal`) +
    countSql(db, `SELECT COUNT(*) AS n FROM library_journal`);

  const insights = buildInsights({
    villages,
    lettersSentDelta: deltaPct(lettersSent, lettersSentPrev),
    taskTop: popularTaskRows[0]?.name || null,
    busyTv: busiestInsight,
    newUsers,
    withVillage: countSql(
      db,
      `SELECT COUNT(*) AS n FROM users WHERE village_id IS NOT NULL AND ${cur.sql}`,
      cur.params
    ),
  });

  const worstFunnel = [...funnel]
    .filter((f) => f.dropPct != null)
    .sort((a, b) => (b.dropPct || 0) - (a.dropPct || 0))[0] || null;

  const priorities = buildPriorities({
    errors: errorsInRange,
    inactive,
    totalUsers,
    lowVillage: [...villages].sort((a, b) => a.engagementRate - b.engagementRate)[0] || null,
    letterFunnelDrop: worstFunnel,
  });

  return {
    generatedAt: new Date().toISOString(),
    range,
    overview: { kpis },
    users: {
      total: totalUsers,
      newInRange: newUsers,
      activeInRange: activeUsers,
      returningInRange: returningUsers,
      inactive,
      dau,
      wau,
      mau,
      growth: seriesFromRows(growthRows),
      growthModes: {
        registrations: seriesFromRows(growthRows),
        active: seriesFromRows(activeGrowthRows),
        returning: seriesFromRows(returningGrowthRows),
      },
      retention: { cohortSize, day1, day7, day30 },
    },
    villages,
    letters: {
      written: lettersWritten,
      sent: lettersSent,
      received: lettersReceived,
      opened: lettersOpened,
      replied: repliers,
      avgPerActiveUser:
        activeUsers > 0
          ? Math.round((lettersSent / activeUsers) * 10) / 10
          : 0,
      funnel,
      series: letterSeries,
    },
    tv: {
      uniqueViewers: tvViewers,
      sessions: countSql(
        db,
        `SELECT COUNT(*) AS n FROM tv_presence WHERE ${betweenClause("last_seen_at", range.start, range.end).sql}`,
        betweenClause("last_seen_at", range.start, range.end).params
      ),
      chatMessages: countSql(
        db,
        `SELECT COUNT(*) AS n FROM tv_chat_messages WHERE ${cur.sql}`,
        cur.params
      ),
      videos: countSql(db, `SELECT COUNT(*) AS n FROM tv_videos`),
      byVillage: villages.map((v) => ({
        id: v.id,
        name: v.name,
        viewers: v.tvSessions,
      })),
      hourHeat,
      busiestInsight,
    },
    tasks: {
      completed: tasksCompleted,
      byType: taskTypeRows.map((r) => ({
        activityType: r.activityType,
        completions: Number(r.completions) || 0,
      })),
      popular: popularTaskRows,
      least: leastTaskRows,
      avgPerActiveUser:
        activeUsers > 0
          ? Math.round((tasksCompleted / activeUsers) * 10) / 10
          : 0,
    },
    collections: {
      totalItems,
      activeCollectors,
      topKinds,
    },
    traffic: {
      sources: sourceRows,
      devices: deviceRows,
      browsers: browserRows,
      topPages: pageRows,
      note:
        sourceRows.length === 0
          ? "Traffic charts fill in as page_viewed events arrive from the analytics beacon."
          : "Sources inferred from referrer / utm on page views (aggregated only).",
    },
    behavior: {
      sessionsApprox,
      avgPagesPerSession:
        sessionsApprox > 0
          ? Math.round((pageViews / sessionsApprox) * 10) / 10
          : null,
      topEntry: pageRows[0]?.path || null,
      topExit: pageRows[pageRows.length - 1]?.path || null,
      featuresUsed: featureRows,
      commonPath:
        pageRows.length >= 3
          ? pageRows
              .slice(0, 4)
              .map((p) => p.path)
              .join(" → ")
          : null,
    },
    health: {
      status: healthStatus,
      errorsInRange,
      recentErrors,
      note: "Client and API errors appear here once reported through trackAnalyticsError / the beacon.",
    },
    system: {
      users: totalUsers,
      letters: countSql(db, `SELECT COUNT(*) AS n FROM letters`),
      journalRows,
      tvVideos: countSql(db, `SELECT COUNT(*) AS n FROM tv_videos`),
      tvPresence: countSql(db, `SELECT COUNT(*) AS n FROM tv_presence`),
      analyticsEvents: countSql(db, `SELECT COUNT(*) AS n FROM analytics_events`),
      dbBytes,
      uploadsBytes,
    },
    insights,
    priorities,
  };
}
