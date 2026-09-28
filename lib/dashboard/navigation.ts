export type DashboardNavItem = { href: string; key: string };
export type DashboardNavGroup = { key: string; items: DashboardNavItem[] };

// Purely data — consumed by both the sidebar and (later) breadcrumbs/search.
// Translation labels live under the `dashboard.nav` namespace, keyed by
// each item's `key`.
export const dashboardNavGroups: DashboardNavGroup[] = [
  {
    key: "workspace",
    items: [
      { href: "/dashboard", key: "commandCenter" },
      { href: "/dashboard/startup", key: "myStartup" },
      { href: "/dashboard/readiness", key: "readiness" },
      { href: "/dashboard/roadmap", key: "roadmap" },
      { href: "/dashboard/tasks", key: "tasks" },
    ],
  },
  {
    key: "build",
    items: [
      { href: "/dashboard/pitch", key: "pitchLab" },
      { href: "/dashboard/financials", key: "financials" },
      { href: "/dashboard/data-room", key: "dataRoom" },
    ],
  },
  {
    key: "connect",
    items: [
      { href: "/dashboard/experts", key: "experts" },
      { href: "/dashboard/investors", key: "investors" },
      { href: "/dashboard/pitch-live", key: "pitchLive" },
      { href: "/dashboard/community", key: "community" },
    ],
  },
  {
    key: "grow",
    items: [
      { href: "/dashboard/resources", key: "resources" },
      { href: "/dashboard/opportunities", key: "opportunities" },
    ],
  },
  {
    key: "insights",
    items: [{ href: "/dashboard/analytics", key: "analytics" }],
  },
];

export const dashboardBottomNavItems: DashboardNavItem[] = [
  { href: "/dashboard/messages", key: "messages" },
  { href: "/dashboard/settings", key: "settings" },
  { href: "/dashboard/help", key: "help" },
];

// Every route above except the Command Center itself renders the shared
// placeholder screen for this batch — see components/dashboard/ModulePlaceholder.tsx.
export const implementedDashboardRoutes = new Set([
  "/dashboard",
  "/dashboard/roadmap",
  "/dashboard/tasks",
  "/dashboard/pitch",
  "/dashboard/pitch/editor",
  "/dashboard/pitch/practice",
  "/dashboard/pitch/qna",
  "/dashboard/pitch/review",
  "/dashboard/pitch-live",
  "/dashboard/financials",
  "/dashboard/data-room",
  "/dashboard/experts",
  "/dashboard/experts/requests",
]);
