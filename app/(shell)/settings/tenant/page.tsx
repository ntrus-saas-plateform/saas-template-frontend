import { redirect } from "next/navigation";

export default function SettingsTenantRedirectPage() {
  redirect("/settings/general");
}
