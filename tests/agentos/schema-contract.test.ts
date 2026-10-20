// tests/agentos/schema-contract.test.ts
//
// The AgentOS application talks to the `agentos` schema, and the schema is
// defined by the migrations. Nothing in the build or the test harness compares
// the two: the harness accepts any column name, and PostgREST only rejects an
// unknown column at runtime (PGRST100), with the whole query failing.
//
// That is how `agentos-tools` came to select `allowed_app_slugs` as if it were
// a column of `agentos.workers` — it is a key INSIDE the `permissions` jsonb —
// which silently broke every worker-scoped tool dispatch.
//
// This test reads the migrations and checks the application's column
// references against them, so the next drift fails here instead of on a live
// project.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = (() => {
  try {
    return fileURLToPath(new URL("../../", import.meta.url));
  } catch {
    return process.cwd();
  }
})();

const MIGRATIONS_DIR = join(ROOT, "supabase", "migrations");
const FUNCTIONS_DIR = join(ROOT, "supabase", "functions");

/** Every table column the migrations declare, keyed by lower-case table name. */
function agentosColumns(): Map<string, Set<string>> {
  const columns = new Map<string, Set<string>>();

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.includes("agentos"))
    .sort();

  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    const pattern = /CREATE TABLE IF NOT EXISTS agentos\.(\w+)\s*\(([\s\S]*?)\n\);/g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(sql)) !== null) {
      const table = match[1].toLowerCase();
      const body = match[2];
      const names = columns.get(table) ?? new Set<string>();

      for (const rawLine of body.split("\n")) {
        const line = rawLine.trim().replace(/,$/, "");
        if (!line || line.startsWith("--")) continue;
        if (/^(CONSTRAINT|PRIMARY|UNIQUE|CHECK|FOREIGN|EXCLUDE)\b/i.test(line)) continue;
        const name = /^([a-z_][a-z0-9_]*)\s/i.exec(line);
        if (name) names.add(name[1].toLowerCase());
      }

      columns.set(table, names);
    }

    // Columns added by a later migration with ALTER TABLE (the model
    // catalog's capability flags, the notifications' workspace, ...). Without
    // these the guard would call a real column missing and send the next
    // change to a function instead.
    const alterPattern =
      /ALTER TABLE agentos\.(\w+)\s+ADD COLUMN(?: IF NOT EXISTS)?\s+(\w+)/gi;
    let alter: RegExpExecArray | null;
    while ((alter = alterPattern.exec(sql)) !== null) {
      const table = alter[1].toLowerCase();
      const names = columns.get(table) ?? new Set<string>();
      names.add(alter[2].toLowerCase());
      columns.set(table, names);
    }
  }

  return columns;
}

function agentosSourceFiles(): string[] {
  const files: string[] = [];
  const dirs = [
    join(ROOT, "src", "services", "agentos"),
    join(ROOT, "src", "pages", "agentos"),
    join(ROOT, "src", "components", "agentos"),
  ];
  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir, { recursive: true })) {
      const name = String(entry);
      if (!/\.(ts|tsx)$/.test(name)) continue;
      if (name.endsWith(".test.ts") || name.endsWith(".test.tsx")) continue;
      files.push(join(dir, name));
    }
  }
  for (const entry of readdirSync(FUNCTIONS_DIR)) {
    if (entry.startsWith("agentos-") && existsSync(join(FUNCTIONS_DIR, entry, "index.ts"))) {
      files.push(join(FUNCTIONS_DIR, entry, "index.ts"));
    }
  }
  const shared = join(FUNCTIONS_DIR, "_shared");
  if (existsSync(shared)) {
    for (const entry of readdirSync(shared)) {
      if (/^agentos-.*\.ts$/.test(entry)) files.push(join(shared, entry));
    }
  }
  return files;
}

/** Every `.from('table')` in the source, with the columns referenced after it. */
function tableReferences(src: string): Array<{ table: string; columns: string[] }> {
  const references: Array<{ table: string; columns: string[] }> = [];

  // The segment of code that follows a `.from('table')` runs until the next
  // `.from(` (or the end of the file); only columns inside that segment belong
  // to this table.
  const fromPattern = /\.from\(\s*['"](\w+)['"]\s*\)/g;
  const matches: Array<{ table: string; start: number; end: number }> = [];
  let match: RegExpExecArray | null;
  while ((match = fromPattern.exec(src)) !== null) {
    matches.push({
      table: match[1].toLowerCase(),
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  matches.forEach((reference, index) => {
    const next = matches[index + 1];
    const tail = src.slice(reference.end, next ? next.start : src.length);
    const columns: string[] = [];
    const call = /\.(select|order|eq|is|in|gt|neq)\(\s*['"]([^'"]+)['"]/g;
    let callMatch: RegExpExecArray | null;
    while ((callMatch = call.exec(tail)) !== null) {
      if (callMatch[1] === "select") {
        for (const part of callMatch[2].split(",")) {
          const name = part.trim().toLowerCase();
          if (name) columns.push(name);
        }
      } else {
        columns.push(callMatch[2].trim().toLowerCase());
      }
    }
    references.push({ table: reference.table, columns });
  });

  return references;
}

describe("AgentOS schema contract", () => {
  const columns = agentosColumns();

  it("parses every agentos table from the migrations", () => {
    expect(columns.size).toBe(24);
    for (const table of ["workers", "tasks", "workspaces", "missions", "approvals"]) {
      expect(columns.get(table)?.size ?? 0).toBeGreaterThan(5);
    }
  });

  it("references only columns that exist in the agentos schema", () => {
    const problems: string[] = [];

    for (const file of agentosSourceFiles()) {
      const src = readFileSync(file, "utf8");
      for (const reference of tableReferences(src)) {
        const known = columns.get(reference.table);
        if (!known) {
          problems.push(
            `${file.replace(`${ROOT}/`, "")}: table ${reference.table} is not in the agentos schema`,
          );
          continue;
        }
        for (const column of reference.columns) {
          if (!column || column === "*" || column.includes("(")) continue;
          if (!known.has(column)) {
            problems.push(
              `${file.replace(`${ROOT}/`, "")}: ${reference.table}.${column} does not exist`,
            );
          }
        }
      }
    }

    expect(problems).toEqual([]);
  });
});
