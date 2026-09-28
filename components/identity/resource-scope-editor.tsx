"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { SearchableSelect } from "@/components/settings/searchable-select";
import {
  formatPermissionKey,
  type MembershipResourceScope,
  type Permission,
} from "@/lib/api/identity";
import type { SelectOption } from "@/lib/settings/reference-data";

const RESOURCE_TYPES = [
  { value: "", label: "Toute l’organisation" },
  { value: "warehouse", label: "Entrepôt (warehouse)" },
  { value: "pos_terminal", label: "Terminal POS" },
  { value: "store", label: "Magasin / store" },
] as const;

export function ResourceScopeEditor({
  value,
  onChange,
  permissions,
  organizationOptions,
  resourceOptionsByType,
  disabled,
}: {
  value: MembershipResourceScope[];
  onChange: (next: MembershipResourceScope[]) => void;
  permissions: Permission[];
  organizationOptions: SelectOption[];
  /** Options keyed by resourceType (warehouse, pos_terminal, …). */
  resourceOptionsByType?: Record<string, SelectOption[]>;
  disabled?: boolean;
}) {
  const permissionOptions = permissions.map((p) => {
    const key = formatPermissionKey(p);
    return {
      value: key,
      label: p.description ? `${key} — ${p.description}` : key,
      group: p.resource,
    };
  });

  const update = (index: number, patch: Partial<MembershipResourceScope>) => {
    onChange(
      value.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const add = () => {
    onChange([
      ...value,
      {
        permission: permissionOptions[0]?.value ?? "",
        organizationId: organizationOptions[0]?.value,
        resourceType: undefined,
        resourceId: undefined,
      },
    ]);
  };

  return (
    <div className="space-y-[var(--space-3)]">
      <div className="flex items-start justify-between gap-[var(--space-3)]">
        <div>
          <p className="type-sm font-semibold text-[var(--text-primary)]">
            Portées de permission
          </p>
          <p className="mt-0.5 type-xs text-[var(--text-secondary)]">
            Limitez une permission catalogue à une organisation, ou à une
            ressource (ex. entrepôt) dans cette organisation.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={add}
        >
          <Plus className="size-[var(--icon-sm)]" aria-hidden />
          Ajouter
        </Button>
      </div>

      {value.length === 0 ? (
        <p className="rounded-[var(--radius-sm)] border border-dashed border-[var(--border)] px-[var(--space-3)] py-[var(--space-4)] type-sm text-[var(--text-muted)]">
          Aucune portée fine. Les rôles et permissions directes s’appliquent à
          toute l’organisation du membership.
        </p>
      ) : (
        <ul className="space-y-[var(--space-3)]">
          {value.map((row, index) => {
            const resourceOptions =
              row.resourceType && resourceOptionsByType
                ? resourceOptionsByType[row.resourceType] ?? []
                : [];
            return (
              <li
                key={`${row.permission}-${index}`}
                className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-muted)]/30 p-[var(--space-3)]"
              >
                <div className="mb-[var(--space-2)] flex items-center justify-between gap-2">
                  <span className="type-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Portée {index + 1}
                  </span>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    disabled={disabled}
                    aria-label={`Supprimer la portée ${index + 1}`}
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="text-[var(--danger)]" aria-hidden />
                  </Button>
                </div>
                <div className="grid gap-[var(--space-3)] sm:grid-cols-2">
                  <Field label="Permission" required>
                    <SearchableSelect
                      value={row.permission}
                      options={permissionOptions}
                      placeholder="Choisir une permission…"
                      disabled={disabled}
                      onChange={(permission) => update(index, { permission })}
                    />
                  </Field>
                  <Field label="Organisation" hint="Optionnel si déjà dans le membership">
                    <SearchableSelect
                      value={row.organizationId ?? ""}
                      options={[
                        { value: "", label: "Organisation du membership" },
                        ...organizationOptions,
                      ]}
                      placeholder="Organisation…"
                      disabled={disabled}
                      onChange={(organizationId) =>
                        update(index, {
                          organizationId: organizationId || undefined,
                        })
                      }
                    />
                  </Field>
                  <Field label="Type de ressource">
                    <Select
                      value={row.resourceType ?? ""}
                      disabled={disabled}
                      onChange={(e) =>
                        update(index, {
                          resourceType: e.target.value || undefined,
                          resourceId: undefined,
                        })
                      }
                    >
                      {RESOURCE_TYPES.map((t) => (
                        <option key={t.value || "all"} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Ressource">
                    {row.resourceType ? (
                      resourceOptions.length > 0 ? (
                        <SearchableSelect
                          value={row.resourceId ?? ""}
                          options={resourceOptions}
                          placeholder="Sélectionner…"
                          disabled={disabled}
                          onChange={(resourceId) =>
                            update(index, {
                              resourceId: resourceId || undefined,
                            })
                          }
                        />
                      ) : (
                        <Input
                          value={row.resourceId ?? ""}
                          disabled={disabled}
                          placeholder="UUID de la ressource"
                          onChange={(e) =>
                            update(index, {
                              resourceId: e.target.value || undefined,
                            })
                          }
                        />
                      )
                    ) : (
                      <Input
                        value=""
                        disabled
                        placeholder="Toute l’organisation"
                      />
                    )}
                  </Field>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
