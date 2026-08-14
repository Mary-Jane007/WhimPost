/**
 * WhimPost analytics — expandable event names.
 * Prefer these constants so new features stay consistent.
 */
export const ANALYTICS_EVENTS = [
  "page_viewed",
  "user_registered",
  "user_login",
  "village_joined",
  "letter_started",
  "letter_sent",
  "letter_opened",
  "letter_replied",
  "task_started",
  "task_completed",
  "collection_item_found",
  "tv_corner_joined",
  "tv_corner_left",
  "tv_session_heartbeat",
  "library_book_opened",
  "library_book_finished",
  "error_occurred",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number] | string;

export type AnalyticsRangeKey =
  | "today"
  | "7d"
  | "30d"
  | "90d"
  | "180d"
  | "all"
  | "custom";

export type DateRange = {
  key: AnalyticsRangeKey;
  start: string | null; // SQLite datetime UTC
  end: string | null;
  prevStart: string | null;
  prevEnd: string | null;
  label: string;
};

export type KpiCard = {
  id: string;
  label: string;
  value: number | string;
  hint: string;
  deltaPct: number | null;
  format?: "number" | "percent" | "duration" | "text";
};

export type SeriesPoint = { date: string; value: number };

export type VillageStats = {
  id: string;
  name: string;
  members: number;
  memberPct: number;
  activeMembers: number;
  lettersSent: number;
  lettersReceived: number;
  tasksCompleted: number;
  tvSessions: number;
  collectionItems: number;
  engagementRate: number;
  insight?: string;
};

export type FunnelStep = {
  id: string;
  label: string;
  count: number;
  pctOfFirst: number;
  dropPct: number | null;
};

export type InsightCard = {
  id: string;
  emoji: string;
  title: string;
  what: string;
  why: string;
  next: string;
  kind: "positive" | "neutral" | "caution";
};

export type PriorityItem = {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
  affectedUsers: number | null;
};

export type AnalyticsDashboardPayload = {
  generatedAt: string;
  range: DateRange;
  overview: {
    kpis: KpiCard[];
  };
  users: {
    total: number;
    newInRange: number;
    activeInRange: number;
    returningInRange: number;
    inactive: number;
    dau: number;
    wau: number;
    mau: number;
    growth: SeriesPoint[];
    growthModes: {
      registrations: SeriesPoint[];
      active: SeriesPoint[];
      returning: SeriesPoint[];
    };
    retention: {
      cohortSize: number;
      day1: number;
      day7: number;
      day30: number;
    };
  };
  villages: VillageStats[];
  letters: {
    written: number;
    sent: number;
    received: number;
    opened: number;
    replied: number;
    avgPerActiveUser: number;
    funnel: FunnelStep[];
    series: SeriesPoint[];
  };
  tv: {
    uniqueViewers: number;
    sessions: number;
    chatMessages: number;
    videos: number;
    byVillage: Array<{ id: string; name: string; viewers: number }>;
    hourHeat: Array<{ hour: number; count: number }>;
    busiestInsight: string | null;
  };
  tasks: {
    completed: number;
    byType: Array<{
      activityType: string;
      completions: number;
    }>;
    popular: Array<{ id: string; name: string; completions: number }>;
    least: Array<{ id: string; name: string; completions: number }>;
    avgPerActiveUser: number;
  };
  collections: {
    totalItems: number;
    activeCollectors: number;
    topKinds: Array<{ kind: string; count: number }>;
  };
  traffic: {
    sources: Array<{ source: string; count: number }>;
    devices: Array<{ device: string; count: number }>;
    browsers: Array<{ browser: string; count: number }>;
    topPages: Array<{ path: string; count: number }>;
    note: string;
  };
  behavior: {
    sessionsApprox: number;
    avgPagesPerSession: number | null;
    topEntry: string | null;
    topExit: string | null;
    featuresUsed: Array<{ feature: string; count: number }>;
    commonPath: string | null;
  };
  health: {
    status: "healthy" | "attention" | "critical";
    errorsInRange: number;
    recentErrors: Array<{
      id: string;
      kind: string;
      message: string;
      path: string | null;
      createdAt: string;
    }>;
    note: string;
  };
  system: {
    users: number;
    letters: number;
    journalRows: number;
    tvVideos: number;
    tvPresence: number;
    analyticsEvents: number;
    dbBytes: number | null;
    uploadsBytes: number | null;
  };
  insights: InsightCard[];
  priorities: PriorityItem[];
};
