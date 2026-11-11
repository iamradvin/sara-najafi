export type HomeIconName =
  | "article"
  | "bell"
  | "bookmark"
  | "chevron"
  | "close"
  | "courses"
  | "file"
  | "home"
  | "menu"
  | "microphone"
  | "phone"
  | "profile"
  | "search"
  | "stories"
  | "support"
  | "testimonials"
  | "video"
  | "wallet";

export function HomeIcon({ name }: Readonly<{ name: HomeIconName }>) {
  switch (name) {
    case "article":
      return <svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><path d="M5 4.5h14v15H5zM8 8h8M8 12h8m-8 4h5" /></svg>;
    case "bell":
      return <svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Zm-8 12h4" /></svg>;
    case "bookmark":
      return <svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-4-6 4V4.5Z" /></svg>;
    case "chevron":
      return <svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><path d="m9 5 7 7-7 7" /></svg>;
    case "close":
      return <svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18" /></svg>;
    case "courses":
      return <svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H12v17H5.5A2.5 2.5 0 0 0 3 22V5.5Zm18 0A2.5 2.5 0 0 0 18.5 3H12v17h6.5A2.5 2.5 0 0 1 21 22V5.5Z" /><path d="M6.5 7H9m-2.5 4H9m6-4h2.5M15 11h2.5" /></svg>;
    case "file":
      return <svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><path d="M6 3.5h8l4 4V20H6zM14 3.5v5h5M9 13h6m-6 3h6" /></svg>;
    case "home":
      return <svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><path d="m3.5 10 8.5-7 8.5 7v10.5h-6v-6h-5v6h-6V10Z" /></svg>;
    case "menu":
      return <svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
    case "microphone":
      return <svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21m-4 0h8" /></svg>;
    case "phone":
      return <svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><path d="m7 3 3 4-2 2c1.2 2.8 3.2 4.8 6 6l2-2 4 3v3a2 2 0 0 1-2 2C10 20 4 14 3 6a2 2 0 0 1 2-3h2Z" /></svg>;
    case "profile":
      return <svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>;
    case "search":
      return <svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="7" /><path d="m16 16 5 5" /></svg>;
    case "stories":
      return <svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3M7 10h5m-5 4h3" /></svg>;
    case "support":
      return <svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><path d="M4 13v-2a8 8 0 0 1 16 0v2" /><rect x="3" y="12" width="4" height="7" rx="2" /><rect x="17" y="12" width="4" height="7" rx="2" /><path d="M20 18a4 4 0 0 1-4 4h-3" /></svg>;
    case "testimonials":
      return <svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-5 4v-4.3a2.5 2.5 0 0 1-2-2.2V5.5Z" /><path d="M8 8h8m-8 4h5" /></svg>;
    case "video":
      return <svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m10 9 5 3-5 3V9Z" /></svg>;
    case "wallet":
      return <svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H20v16H6.5A2.5 2.5 0 0 1 4 17.5v-11ZM4 8h16m-5 5h5" /><circle cx="16" cy="13" r=".7" /></svg>;
  }
}
