"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/shell/page-header";
import { PermissionGate } from "@/components/shell/permission-gate";
import { SettingFieldControl } from "@/components/settings/setting-field-control";
import {
  SettingsFact,
} from "@/components/settings/settings-form";
import { SettingsStages } from "@/components/settings/settings-stages";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { identityApi } from "@/lib/api/identity";
import { storedFileSrc } from "@/lib/media";
import { qk } from "@/lib/query/keys";
import { useApiClient, usePlatform } from "@/providers/platform-provider";
import { useToast } from "@/components/feedback/toast";

type Draft = Record<string, string>;

function str(v: unknown) {
  return typeof v === "string" ? v : "";
}

function AvatarPreview({
  url,
  first,
  last,
}: {
  url: string;
  first: string;
  last: string;
}) {
  const src = storedFileSrc(url);
  const initials =
    `${first.slice(0, 1)}${last.slice(0, 1)}`.toUpperCase() || "?";
  return (
    <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-full)] border border-[var(--border)] bg-[var(--bg-app)] type-md text-[var(--text-secondary)]">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}

function AvatarUpload({
  url,
  first,
  last,
  busy,
  onFile,
  onRemove,
}: {
  url: string;
  first: string;
  last: string;
  busy: boolean;
  onFile: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-start gap-[var(--space-4)] sm:col-span-2">
      <AvatarPreview url={url} first={first} last={last} />
      <div className="min-w-0 flex-1">
        <p className="mb-[var(--space-1)] type-sm font-medium text-[var(--text-secondary)]">
          Photo de profil
        </p>
        <p className="mb-[var(--space-2)] type-xs text-[var(--text-muted)]">
          JPEG, PNG, WebP or GIF · 2 MB max. Stored on object storage (Cloudflare R2).
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) onFile(file);
          }}
        />
        <div className="flex flex-wrap gap-[var(--space-2)]">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? "Uploading…" : "Upload photo"}
          </Button>
          {url ? (
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={onRemove}
            >
              Remove
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ProfileForm() {
  const client = useApiClient();
  const { context } = usePlatform();
  const idk = qk.identity(context?.organizationId);
  const api = identityApi(client);
  const qc = useQueryClient();
  const toast = useToast();
  const [draft, setDraft] = useState<Draft>({});

  const query = useQuery({
    queryKey: idk.me(),
    queryFn: async () => api.users.me(),
  });

  const profile = (query.data?.data?.profile ?? {}) as Record<string, unknown>;
  const employment = query.data?.data?.employment;
  const address = (profile.address ?? {}) as Record<string, unknown>;

  useEffect(() => {
    setDraft({});
  }, [query.dataUpdatedAt]);

  const val = (key: string, fallback = "") =>
    draft[key] !== undefined ? draft[key] : str(profile[key] || fallback);

  const addr = (key: string) =>
    draft[`address.${key}`] !== undefined
      ? draft[`address.${key}`]
      : str(address[key]);

  const set = (key: string, value: string) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const patch = useMutation({
    mutationFn: () => {
      const next: Record<string, unknown> = {
        firstName: val("firstName"),
        lastName: val("lastName"),
        displayName: val("displayName"),
        preferredName: val("preferredName"),
        gender: val("gender") || null,
        dateOfBirth: val("dateOfBirth") || null,
        biography: val("biography"),
        email: val("email"),
        phone: val("phone"),
        mobile: val("mobile"),
        alternatePhone: val("alternatePhone"),
        employeeNumber: val("employeeNumber"),
        jobTitle: val("jobTitle"),
        address: {
          line1: addr("line1"),
          line2: addr("line2"),
          city: addr("city"),
          region: addr("region"),
          postalCode: addr("postalCode"),
          country: addr("country"),
        },
      };
      return api.users.patchMe(next);
    },
    onSuccess: async () => {
      toast.push({ title: "Profile saved", tone: "success" });
      await qc.invalidateQueries({ queryKey: idk.me() });
    },
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  const uploadAvatar = useMutation({
    mutationFn: (file: File) => api.users.uploadAvatar(file),
    onSuccess: async (res) => {
      const next = str((res.data.profile as Record<string, unknown> | undefined)?.avatarUrl);
      set("avatarUrl", next);
      toast.push({ title: "Photo updated", tone: "success" });
      await qc.invalidateQueries({ queryKey: idk.me() });
    },
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  const removeAvatar = useMutation({
    mutationFn: () => api.users.patchMe({ avatarUrl: null }),
    onSuccess: async () => {
      set("avatarUrl", "");
      toast.push({ title: "Photo removed", tone: "success" });
      await qc.invalidateQueries({ queryKey: idk.me() });
    },
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  if (query.isLoading) return <Skeleton className="h-48 w-full" />;
  if (query.isError) {
    return (
      <ErrorState
        title="Couldn't load profile"
        description={
          query.error instanceof Error ? query.error.message : "Try again."
        }
        onRetry={() => void query.refetch()}
      />
    );
  }

  const avatarUrl = val("avatarUrl");
  const saveFooter = (
    <PermissionGate permission="users:update">
      <Button disabled={patch.isPending} onClick={() => patch.mutate()}>
        {patch.isPending ? "Saving…" : "Save profile"}
      </Button>
    </PermissionGate>
  );

  return (
    <SettingsStages
      footer={saveFooter}
      stages={[
        {
          id: "personal",
          label: "Personal",
          description: "Identity and how you appear across Atlas.",
          content: (
            <>
              <PermissionGate
                permission="users:update"
                fallback={
                  <div className="flex items-start gap-[var(--space-4)] sm:col-span-2">
                    <AvatarPreview
                      url={avatarUrl}
                      first={val("firstName")}
                      last={val("lastName")}
                    />
                  </div>
                }
              >
                <AvatarUpload
                  url={avatarUrl}
                  first={val("firstName")}
                  last={val("lastName")}
                  busy={uploadAvatar.isPending || removeAvatar.isPending}
                  onFile={(file) => uploadAvatar.mutate(file)}
                  onRemove={() => removeAvatar.mutate()}
                />
              </PermissionGate>
              <SettingFieldControl
                meta={{ key: "firstName", label: "First name", control: "text" }}
                value={val("firstName")}
                onChange={(v) => set("firstName", String(v))}
              />
              <SettingFieldControl
                meta={{ key: "lastName", label: "Last name", control: "text" }}
                value={val("lastName")}
                onChange={(v) => set("lastName", String(v))}
              />
              <SettingFieldControl
                meta={{ key: "displayName", label: "Display name", control: "text" }}
                value={val("displayName")}
                onChange={(v) => set("displayName", String(v))}
              />
              <SettingFieldControl
                meta={{
                  key: "preferredName",
                  label: "Preferred name",
                  control: "text",
                }}
                value={val("preferredName")}
                onChange={(v) => set("preferredName", String(v))}
              />
              <SettingFieldControl
                meta={{
                  key: "gender",
                  label: "Gender",
                  control: "select",
                  options: [
                    { value: "female", label: "Female" },
                    { value: "male", label: "Male" },
                    { value: "non_binary", label: "Non-binary" },
                    { value: "other", label: "Other" },
                  ],
                }}
                value={val("gender")}
                onChange={(v) => set("gender", String(v))}
              />
              <SettingFieldControl
                meta={{
                  key: "dateOfBirth",
                  label: "Date of birth",
                  control: "date",
                }}
                value={val("dateOfBirth")}
                onChange={(v) => set("dateOfBirth", String(v))}
              />
              <div className="sm:col-span-2">
                <SettingFieldControl
                  meta={{ key: "biography", label: "Biography", control: "textarea" }}
                  value={val("biography")}
                  onChange={(v) => set("biography", String(v))}
                />
              </div>
            </>
          ),
        },
        {
          id: "contact",
          label: "Contact",
          description: "How colleagues and the system can reach you.",
          content: (
            <>
              <SettingFieldControl
                meta={{ key: "email", label: "Email", control: "email" }}
                value={val("email")}
                onChange={(v) => set("email", String(v))}
              />
              <SettingFieldControl
                meta={{ key: "phone", label: "Phone", control: "tel" }}
                value={val("phone")}
                onChange={(v) => set("phone", String(v))}
              />
              <SettingFieldControl
                meta={{ key: "mobile", label: "Mobile", control: "tel" }}
                value={val("mobile")}
                onChange={(v) => set("mobile", String(v))}
              />
              <SettingFieldControl
                meta={{
                  key: "alternatePhone",
                  label: "Alternate phone",
                  control: "tel",
                }}
                value={val("alternatePhone")}
                onChange={(v) => set("alternatePhone", String(v))}
              />
              <SettingFieldControl
                meta={{ key: "line1", label: "Address line 1", control: "text" }}
                value={addr("line1")}
                onChange={(v) => set("address.line1", String(v))}
              />
              <SettingFieldControl
                meta={{ key: "line2", label: "Address line 2", control: "text" }}
                value={addr("line2")}
                onChange={(v) => set("address.line2", String(v))}
              />
              <SettingFieldControl
                meta={{ key: "city", label: "City", control: "text" }}
                value={addr("city")}
                onChange={(v) => set("address.city", String(v))}
              />
              <SettingFieldControl
                meta={{ key: "region", label: "Region / province", control: "text" }}
                value={addr("region")}
                onChange={(v) => set("address.region", String(v))}
              />
              <SettingFieldControl
                meta={{ key: "postalCode", label: "Postal code", control: "text" }}
                value={addr("postalCode")}
                onChange={(v) => set("address.postalCode", String(v))}
              />
              <SettingFieldControl
                meta={{ key: "country", label: "Country", control: "text" }}
                value={addr("country")}
                onChange={(v) => set("address.country", String(v))}
              />
            </>
          ),
        },
        {
          id: "professional",
          label: "Professional",
          description:
            "Person-level employment defaults. Organization roles live on memberships.",
          content: (
            <>
              <SettingFieldControl
                meta={{
                  key: "employeeNumber",
                  label: "Employee number",
                  control: "text",
                }}
                value={val("employeeNumber")}
                onChange={(v) => set("employeeNumber", String(v))}
              />
              <SettingFieldControl
                meta={{ key: "jobTitle", label: "Job title", control: "text" }}
                value={val("jobTitle")}
                onChange={(v) => set("jobTitle", String(v))}
              />
            </>
          ),
        },
        ...(employment
          ? [
              {
                id: "organization",
                label: "Organization",
                description:
                  "Read-only projection from your membership in the active organization.",
                content: (
                  <>
                    <SettingsFact label="Organization">
                      {employment.organizationName || employment.organizationId}
                    </SettingsFact>
                    <SettingsFact label="Status">
                      <Badge>{employment.status || "—"}</Badge>
                    </SettingsFact>
                    <SettingsFact label="Department">
                      {employment.department || "—"}
                    </SettingsFact>
                    <SettingsFact label="Position">
                      {employment.position || "—"}
                    </SettingsFact>
                    <SettingsFact label="Manager">
                      <span className="font-mono type-xs">
                        {employment.managerUserId || "—"}
                      </span>
                    </SettingsFact>
                    <SettingsFact label="Joined">
                      {employment.joinedAt
                        ? new Date(employment.joinedAt).toLocaleDateString()
                        : "—"}
                    </SettingsFact>
                    <div className="sm:col-span-2">
                      <SettingsFact label="Roles">
                        {(employment.roles ?? []).join(", ") || "—"}
                      </SettingsFact>
                    </div>
                  </>
                ),
                footer: saveFooter,
              },
            ]
          : []),
      ]}
    />
  );
}

export default function ProfilePage() {
  return (
    <div>
      <PageHeader
        title="My profile"
        description="Personal, contact, and professional information."
      />
      <PermissionGate
        permission="users:read"
        fallback={
          <EmptyState
            title="Access restricted"
            description="You need users:read."
          />
        }
      >
        <ProfileForm />
      </PermissionGate>
    </div>
  );
}
