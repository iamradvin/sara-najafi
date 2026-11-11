export type DashboardIconName =
  | "overview"
  | "courses"
  | "orders"
  | "profile"
  | "students"
  | "categories"
  | "enrollments"
  | "sales"
  | "learning-time"
  | "completed"
  | "path"
  | "video"
  | "start"
  | "knowledge"
  | "lifestyle";

export function DashboardIcon({ name }: Readonly<{ name: DashboardIconName }>) {
  switch (name) {
    case "overview":
      return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="m3.5 10 8.5-7 8.5 7v10.5h-6v-6h-5v6h-6V10Z" /></svg>;
    case "courses":
      return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5v-12ZM4 17.5A2.5 2.5 0 0 1 6.5 15H20M8 7h8m-8 4h6" /></svg>;
    case "orders":
      return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M6 3.5h12v17l-2.5-1.6-3.5 1.6-3.5-1.6L6 20.5v-17ZM9 8h6m-6 4h6m-6 4h3" /></svg>;
    case "profile":
      return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>;
    case "students":
      return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0m1-8a3 3 0 1 0 0-6m1 8a5.5 5.5 0 0 1 4 5" /></svg>;
    case "categories":
      return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5v-12ZM4 17.5A2.5 2.5 0 0 1 6.5 15H20M8 7h8m-8 4h5" /><circle cx="16.5" cy="11" r="1" /></svg>;
    case "enrollments":
      return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" /><path d="m8 12 2.5 2.5 5.5-5.5" /></svg>;
    case "sales":
      return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M4 19.5h16M6.5 16V11m5.5 5V5m5.5 11V8" /></svg>;
    case "learning-time":
      return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 2" /></svg>;
    case "completed":
      return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" /><path d="m8 12 2.5 2.5 5.5-5.5" /></svg>;
    case "path":
      return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><circle cx="6" cy="18" r="2" /><circle cx="18" cy="6" r="2" /><path d="M8 18h3a3 3 0 0 0 3-3v-3a3 3 0 0 1 3-3h1" /></svg>;
    case "video":
      return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><rect x="3.5" y="5.5" width="17" height="13" rx="2.5" /><path d="m10 9 5 3-5 3V9Z" /></svg>;
    case "start":
      return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M12 3.5 14.4 9l5.9.5-4.5 3.8 1.4 5.7-5.2-3-5.2 3 1.4-5.7-4.5-3.8 5.9-.5L12 3.5Z" /></svg>;
    case "knowledge":
      return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5v-12ZM4 17.5A2.5 2.5 0 0 1 6.5 15H20M8 7h8m-8 4h6" /></svg>;
    case "lifestyle":
      return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M20.5 8.5c0 5-8.5 11-8.5 11s-8.5-6-8.5-11a4.5 4.5 0 0 1 8.5-2.1 4.5 4.5 0 0 1 8.5 2.1Z" /><path d="M3.5 12h5l2-3 3 6 2-3h5" /></svg>;
  }
}
