const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "app", "(edge-console)", "edge");

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name === "page.tsx") out.push(p);
  }
  return out;
}

const pages = walk(root);
const rows = [];
for (const p of pages) {
  const c = fs.readFileSync(p, "utf8");
  const rel = path.relative(path.join(__dirname, ".."), p).replace(/\\/g, "/");
  const hasShell = c.includes("EdgeStudioShell");
  const hasSectionParam = c.includes("useStudioSectionParam");
  const hasTabsImport = c.includes('from "@/components/ui/tabs"');
  const hasTabsUsage = /<Tabs\b|<TabsList|<TabsTrigger/.test(c);
  const hasHeader = c.includes("EdgeStudioPageHeader") || c.includes("EdgePageHeader") || c.includes("EdgeDetailHeader") || /<h1\b/.test(c);
  const hasStates = /EdgeLoadingState|EdgeEmptyState|EdgeErrorState|EdgeForbiddenState/.test(c);
  const hasBreadcrumb = /Breadcrumb|breadcrumb/.test(c);
  const isDetail = /\[id\]|\[productId\]|\[section\]|\[tenantId\]/.test(rel);
  rows.push({ rel, hasShell, hasSectionParam, hasTabsImport, hasTabsUsage, hasHeader, hasStates, hasBreadcrumb, isDetail, lines: c.split("\n").length });
}

const shell = rows.filter((r) => r.hasShell);
const noShell = rows.filter((r) => !r.hasShell);
console.log(`TOTAL pages: ${rows.length} | with shell: ${shell.length} | without: ${noShell.length}`);
console.log(`Tabs imports anywhere: ${rows.filter((r) => r.hasTabsImport).length}`);
console.log("\n=== NO SHELL ===");
for (const r of noShell) {
  const flags = [
    r.hasSectionParam ? "sectionParam" : null,
    r.hasTabsImport ? "TABS-IMPORT" : null,
    r.hasTabsUsage ? "TABS-USAGE" : null,
    r.hasHeader ? "h1/header" : "NO-HEADER",
    r.hasStates ? "states" : "NO-STATES",
    r.hasBreadcrumb ? "breadcrumb" : null,
    r.isDetail ? "detail" : "list/hub",
  ].filter(Boolean);
  console.log(`  ${String(r.lines).padStart(4)}  ${r.rel}  [${flags.join(", ")}]`);
}
