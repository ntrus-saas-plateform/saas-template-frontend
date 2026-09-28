export type AppLifecycleStatus =
  | "ACTIVE"
  | "NOT_SUBSCRIBED"
  | "UNAVAILABLE"
  | "COMING_SOON";

export type AppNavItem = {
  id: string;
  label: string;
  href: string;
  permission?: string;
  section?: "overview" | "management" | "administration" | "settings";
};

export type ApplicationManifest = {
  id: string;
  name: string;
  description: string;
  icon: string;
  href: string;
  requiredModule?: string;
  requiredPermission?: string;
  /** Static status when no API module exists yet */
  defaultStatus: AppLifecycleStatus;
  navigation: AppNavItem[];
};
