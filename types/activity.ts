export type Activity = {
  id: string;
  delta: number;
  dimension: string;
  description: string;
  occurredAt: string;
};

export type UpcomingEventKind =
  | "task"
  | "expert_session"
  | "pitch_live"
  | "application_deadline"
  | "investor_meeting";

export type UpcomingEvent = {
  id: string;
  kind: UpcomingEventKind;
  title: string;
  date: string;
};

export type ExpertSession = {
  id: string;
  expertName: string;
  expertise: string;
  scheduledAt: string;
};

export type NotificationKind = "info" | "success" | "warning";

export type Notification = {
  id: string;
  title: string;
  kind: NotificationKind;
  read: boolean;
  createdAt: string;
};
