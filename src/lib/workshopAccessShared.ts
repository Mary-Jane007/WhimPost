import type { VillageId } from "@/lib/villages";

/** Shared workshop access types/labels — safe for client components (no DB). */

export type WorkshopAccessMode =
  | "HOME_VILLAGERS_ONLY"
  | "VISITORS_ALLOWED"
  | "EVERYONE"
  | "INVITATION_ONLY"
  | "CLOSED";

export const WORKSHOP_ACCESS_MODES: WorkshopAccessMode[] = [
  "HOME_VILLAGERS_ONLY",
  "VISITORS_ALLOWED",
  "EVERYONE",
  "INVITATION_ONLY",
  "CLOSED",
];

export const WORKSHOP_ACCESS_LABELS: Record<WorkshopAccessMode, string> = {
  HOME_VILLAGERS_ONLY: "Home Villagers Only",
  VISITORS_ALLOWED: "Visitors Allowed",
  EVERYONE: "Everyone",
  INVITATION_ONLY: "Invitation Only",
  CLOSED: "Closed",
};

export type WorkshopAccessGateKind =
  | "allowed"
  | "closed"
  | "home_only"
  | "visitors_welcome"
  | "everyone"
  | "invite_only";

export type WorkshopAccessDecision = {
  allowed: boolean;
  mode: WorkshopAccessMode;
  /** True when a scheduled event override is currently active. */
  eventActive: boolean;
  kind: WorkshopAccessGateKind;
  headline: string;
  body: string;
};

export type WorkshopAccessSettings = {
  villageId: VillageId;
  name: string;
  buildingName: string;
  accessMode: WorkshopAccessMode;
  eventAccessMode: WorkshopAccessMode | null;
  eventStartsAt: string | null;
  eventEndsAt: string | null;
  updatedAt: string | null;
  effectiveMode: WorkshopAccessMode;
  eventActive: boolean;
  statusLabel: "Open" | "Closed" | "Event";
  statusTone: "open" | "closed" | "event";
};

export type WorkshopActivityAccess = {
  id: string;
  villageId: VillageId;
  activityKey: string;
  label: string;
  accessMode: WorkshopAccessMode;
  isCrossVillage: boolean;
};

export function isWorkshopAccessMode(raw: unknown): raw is WorkshopAccessMode {
  return (
    typeof raw === "string" &&
    (WORKSHOP_ACCESS_MODES as string[]).includes(raw)
  );
}
