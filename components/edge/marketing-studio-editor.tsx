"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/field-control";

export type StudioBlock = {
  id: string;
  type: "HERO" | "RICH_TEXT" | "CTA" | "FORM_EMBED" | "IMAGE" | "DIVIDER";
  props: Record<string, unknown>;
};

export type StudioDocument = {
  version: 1;
  blocks: StudioBlock[];
};

const BLOCK_TYPES: StudioBlock["type"][] = [
  "HERO",
  "RICH_TEXT",
  "CTA",
  "FORM_EMBED",
  "IMAGE",
  "DIVIDER",
];

const BLOCK_ID_RE = /^[a-zA-Z0-9_-]{2,64}$/;

function newId() {
  return `b_${Math.random().toString(36).slice(2, 10)}`;
}

export function emptyStudio(): StudioDocument {
  return { version: 1, blocks: [] };
}

export function validateStudioClient(doc: StudioDocument): string | null {
  if (doc.version !== 1) return "Studio version must be 1";
  if (doc.blocks.length > 50) return "Studio exceeds 50 blocks";
  const seen = new Set<string>();
  for (const b of doc.blocks) {
    if (!BLOCK_ID_RE.test(b.id)) return `Invalid block id: ${b.id}`;
    if (seen.has(b.id)) return `Duplicate block id: ${b.id}`;
    seen.add(b.id);
    if (!BLOCK_TYPES.includes(b.type)) return `Unknown block type: ${b.type}`;
  }
  return null;
}

/** Safe subset markdown → React nodes (no HTML injection). */
function renderSimpleMarkdown(src: string) {
  const lines = src.split("\n");
  return lines.map((line, i) => {
    const parts: ReactNode[] = [];
    const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
    let last = 0;
    let match: RegExpExecArray | null;
    while ((match = re.exec(line))) {
      if (match.index > last) parts.push(line.slice(last, match.index));
      const token = match[0];
      if (token.startsWith("**")) {
        parts.push(<strong key={`${i}-${match.index}`}>{token.slice(2, -2)}</strong>);
      } else if (token.startsWith("*")) {
        parts.push(<em key={`${i}-${match.index}`}>{token.slice(1, -1)}</em>);
      } else if (token.startsWith("`")) {
        parts.push(
          <code key={`${i}-${match.index}`} className="type-xs">
            {token.slice(1, -1)}
          </code>,
        );
      } else if (token.startsWith("[")) {
        const m = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (m) {
          parts.push(
            <span key={`${i}-${match.index}`} className="underline">
              {m[1]}
            </span>,
          );
        }
      }
      last = match.index + token.length;
    }
    if (last < line.length) parts.push(line.slice(last));
    return (
      <p key={i} className="type-sm whitespace-pre-wrap">
        {parts.length ? parts : "\u00a0"}
      </p>
    );
  });
}

function StudioPreview({ doc }: { doc: StudioDocument }) {
  if (doc.blocks.length === 0) {
    return (
      <p className="type-xs text-[var(--text-muted)]">
        Preview empty — add blocks to compose the surface.
      </p>
    );
  }
  return (
    <div className="space-y-[var(--space-4)] rounded-[var(--radius-md)] bg-[var(--surface-muted)] p-[var(--space-4)]">
      {doc.blocks.map((block) => {
        if (block.type === "HERO") {
          return (
            <div key={block.id} className="space-y-1">
              <p className="type-lg font-semibold">
                {String(block.props.headline || "Headline")}
              </p>
              <p className="type-sm text-[var(--text-secondary)]">
                {String(block.props.subcopy || "Supporting line")}
              </p>
            </div>
          );
        }
        if (block.type === "RICH_TEXT") {
          return (
            <div key={block.id}>
              {renderSimpleMarkdown(String(block.props.markdown || "Body copy"))}
            </div>
          );
        }
        if (block.type === "CTA") {
          return (
            <span
              key={block.id}
              className="inline-flex rounded-[var(--radius-md)] bg-[var(--text-primary)] px-[var(--space-3)] py-[var(--space-2)] type-sm text-[var(--surface)]"
            >
              {String(block.props.label || "CTA")}
            </span>
          );
        }
        if (block.type === "FORM_EMBED") {
          return (
            <div
              key={block.id}
              className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] p-[var(--space-3)] type-xs text-[var(--text-muted)]"
            >
              Form embed: {String(block.props.formSlug || "(slug)")}
            </div>
          );
        }
        if (block.type === "IMAGE") {
          return (
            <div
              key={block.id}
              className="rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--space-3)] type-xs text-[var(--text-muted)]"
            >
              Image: {String(block.props.alt || block.props.src || "(src)")}
            </div>
          );
        }
        return <hr key={block.id} className="border-[var(--border)]" />;
      })}
    </div>
  );
}

export function MarketingStudioEditor({
  initial,
  onSave,
  disabled,
}: {
  initial?: StudioDocument | null;
  onSave: (studio: StudioDocument) => Promise<void>;
  disabled?: boolean;
}) {
  const [doc, setDoc] = useState<StudioDocument>(initial ?? emptyStudio());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [dragId, setDragId] = useState<string | null>(null);

  useEffect(() => {
    setDoc(initial ?? emptyStudio());
  }, [initial]);

  const clientError = useMemo(() => validateStudioClient(doc), [doc]);

  const addBlock = (type: StudioBlock["type"]) => {
    setDoc((prev) => ({
      ...prev,
      blocks: [
        ...prev.blocks,
        {
          id: newId(),
          type,
          props:
            type === "HERO"
              ? { headline: "", subcopy: "" }
              : type === "CTA"
                ? { label: "Continue", href: "" }
                : type === "RICH_TEXT"
                  ? { markdown: "" }
                  : type === "FORM_EMBED"
                    ? { formSlug: "" }
                    : type === "IMAGE"
                      ? { src: "", alt: "" }
                      : {},
        },
      ],
    }));
  };

  const updateProp = (id: string, key: string, value: string) => {
    setDoc((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) =>
        b.id === id ? { ...b, props: { ...b.props, [key]: value } } : b,
      ),
    }));
  };

  const removeBlock = (id: string) => {
    setDoc((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((b) => b.id !== id),
    }));
  };

  const moveBlock = (id: string, direction: -1 | 1) => {
    setDoc((prev) => {
      const idx = prev.blocks.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const next = idx + direction;
      if (next < 0 || next >= prev.blocks.length) return prev;
      const blocks = [...prev.blocks];
      const [item] = blocks.splice(idx, 1);
      blocks.splice(next, 0, item);
      return { ...prev, blocks };
    });
  };

  const onDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    setDoc((prev) => {
      const from = prev.blocks.findIndex((b) => b.id === dragId);
      const to = prev.blocks.findIndex((b) => b.id === targetId);
      if (from < 0 || to < 0) return prev;
      const blocks = [...prev.blocks];
      const [item] = blocks.splice(from, 1);
      blocks.splice(to, 0, item);
      return { ...prev, blocks };
    });
    setDragId(null);
  };

  return (
    <div className="space-y-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--space-4)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {BLOCK_TYPES.map((type) => (
            <Button
              key={type}
              type="button"
              size="sm"
              variant="outline"
              disabled={disabled || saving}
              onClick={() => addBlock(type)}
            >
              + {type}
            </Button>
          ))}
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setShowPreview((v) => !v)}
        >
          {showPreview ? "Hide preview" : "Show preview"}
        </Button>
      </div>

      <div className="grid gap-[var(--space-4)] lg:grid-cols-2">
        <div className="space-y-[var(--space-3)]">
          {doc.blocks.length === 0 ? (
            <p className="type-xs text-[var(--text-muted)]">
              No blocks yet. Drag to reorder after adding HERO / CTA /
              FORM_EMBED.
            </p>
          ) : (
            <ul className="space-y-[var(--space-3)]">
              {doc.blocks.map((block, index) => (
                <li
                  key={block.id}
                  draggable={!disabled && !saving}
                  onDragStart={() => setDragId(block.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(block.id)}
                  className="grid gap-2 border-t border-[var(--border)] pt-[var(--space-3)] cursor-grab active:cursor-grabbing"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge tone="info">{index + 1}</Badge>
                      <p className="type-sm font-medium">{block.type}</p>
                      <span className="type-xs text-[var(--text-muted)]">
                        drag
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={disabled || saving || index === 0}
                        onClick={() => moveBlock(block.id, -1)}
                        aria-label="Move block up"
                      >
                        ↑
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={
                          disabled ||
                          saving ||
                          index === doc.blocks.length - 1
                        }
                        onClick={() => moveBlock(block.id, 1)}
                        aria-label="Move block down"
                      >
                        ↓
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={disabled || saving}
                        onClick={() => removeBlock(block.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                  {Object.keys(block.props).map((key) =>
                    key === "markdown" ? (
                      <textarea
                        key={key}
                        className={fieldControlClass}
                        placeholder="markdown (**bold**, *italic*, `code`, [label](url))"
                        rows={4}
                        value={String(block.props[key] ?? "")}
                        disabled={disabled || saving}
                        onChange={(e) =>
                          updateProp(block.id, key, e.target.value)
                        }
                      />
                    ) : (
                      <input
                        key={key}
                        className={fieldControlClass}
                        placeholder={key}
                        value={String(block.props[key] ?? "")}
                        disabled={disabled || saving}
                        onChange={(e) =>
                          updateProp(block.id, key, e.target.value)
                        }
                      />
                    ),
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {showPreview ? (
          <div className="space-y-2">
            <p className="type-xs font-medium text-[var(--text-secondary)]">
              Live preview
            </p>
            <StudioPreview doc={doc} />
          </div>
        ) : null}
      </div>

      {clientError || error ? (
        <p className="type-xs text-[var(--danger)]">{clientError ?? error}</p>
      ) : (
        <p className="type-xs text-[var(--text-muted)]">
          {doc.blocks.length} block{doc.blocks.length === 1 ? "" : "s"} · schema
          v1
        </p>
      )}

      <Button
        type="button"
        size="sm"
        disabled={disabled || saving || Boolean(clientError)}
        onClick={() => {
          const validation = validateStudioClient(doc);
          if (validation) {
            setError(validation);
            return;
          }
          setSaving(true);
          setError(null);
          onSave(doc)
            .catch((err) =>
              setError(err instanceof Error ? err.message : "Save failed"),
            )
            .finally(() => setSaving(false));
        }}
      >
        {saving ? "Saving…" : "Save studio"}
      </Button>
    </div>
  );
}
