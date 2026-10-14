// tests/agentos/harness.ts
//
// An in-memory Supabase mock for the AgentOS service tests.
//
// WHY THIS EXISTS
//   The AgentOS services are RLS-gated against a live Supabase project. Testing
//   them without a project means reproducing, in-process, the two things that
//   define their security boundary:
//
//     1. OWNERSHIP. Every agentos row is owned by the Clerk user id in the
//        verified JWT, and the DB stamps owner_clerk_id on INSERT. The mock
//        reproduces both: it filters reads and writes to the current caller,
//        and it overwrites any client-supplied owner_clerk_id.
//
//     2. RELATIONSHIPS. agentos.workspace_members has a composite primary key
//        (workspace_id, member_clerk_id) and NO owner_clerk_id column — its
//        access is derived from the parent workspace. The mock resolves it the
//        same way the SQL is_workspace_member() helper does, by looking up the
//        parent row. Getting this wrong is what made the earlier harness fail
//        the workspace tests.
//
// It also records every write and every functions.invoke call, so a test can
// assert what the service actually asked the backend to do rather than only
// checking the return value.

import { vi } from "vitest";
import type { AgentOSResult } from "../../src/types/agentos";

type Row = Record<string, unknown>;

interface TableState {
  rows: Row[];
  /** The tenant a row belongs to. Null means "not tenant-scoped" (a catalog). */
  ownerOf: (row: Row) => string | null;
  /**
   * Whether the table physically has an owner_clerk_id column, so the
   * BEFORE INSERT trigger can stamp it. False for tables whose tenant is
   * derived from a parent (workspace_members) or that are not tenant-scoped.
   */
  stampsOwner: boolean;
  /**
   * RLS write predicate. Postgres evaluates this for INSERT / UPDATE / DELETE;
   * a statement that violates it affects ZERO rows rather than raising, which
   * is why the mock filters the affected set instead of throwing.
   */
  writableBy: (row: Row | undefined, caller: string | null) => boolean;
}

export interface MockSupabase {
  readonly tables: Map<string, TableState>;
  from: (table: string) => TableBuilder;
  functions: {
    invoke: (
      name: string,
      params: { body?: unknown },
    ) => Promise<{ data: unknown; error: unknown }>;
  };
  rpc: (
    name: string,
    params?: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: unknown }>;
  calls: Array<{ op: string; table: string; payload?: Row; where?: Record<string, unknown> }>;
  invokeCalls: Array<{ name: string; body: unknown }>;
}

interface Filter {
  column: string;
  op: "eq" | "is" | "in" | "gt" | "neq";
  value: unknown;
}

// ---------------------------------------------------------------------------
// The "verified JWT": which Clerk user is making the current request.
// ---------------------------------------------------------------------------

let caller: string | null = null;

export function setCaller(clerkUserId: string | null): void {
  caller = clerkUserId;
}

function currentCaller(): string | null {
  return caller;
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

class TableBuilder {
  private filters: Filter[] = [];
  private orderBy: { column: string; ascending: boolean } | null = null;
  private limitCount: number | null = null;
  private readResult: Promise<{ data: unknown; error: unknown }> | null = null;

  constructor(
    private readonly state: MockSupabase,
    private readonly table: string,
  ) {}

  private tableState(): TableState | undefined {
    return this.state.tables.get(this.table);
  }

  private executeRead(): Promise<{ data: unknown; error: unknown }> {
    if (this.readResult) return this.readResult;

    this.readResult = (async () => {
      const table = this.tableState();
      if (!table) {
        return {
          data: null,
          error: { message: `relation agentos.${this.table} does not exist` },
        };
      }

      // RLS. A row is visible when the caller owns it OR the table is not
      // tenant-scoped at all (the seeded catalogs: model_catalog,
      // integrations). Requiring an exact owner match would hide those
      // catalogs from every authenticated user, which is not what the real
      // policies do.
      const sub = currentCaller();
      let rows = sub
        ? table.rows.filter((row) => {
            const owner = table.ownerOf(row);
            return owner === sub || owner === null;
          })
        : // Unauthenticated: only non-tenant-scoped catalogs are readable.
          table.rows.filter((row) => table.ownerOf(row) === null);

      for (const filter of this.filters) {
        rows = rows.filter((row) => matchesFilter(row, filter));
      }

      if (this.orderBy) {
        const { column, ascending } = this.orderBy;
        rows = [...rows].sort((a, b) => {
          const left = String(a[column] ?? "");
          const right = String(b[column] ?? "");
          const cmp = left === right ? 0 : left < right ? -1 : 1;
          return ascending ? cmp : -cmp;
        });
      } else {
        // PostgREST default ordering is unspecified; the services all sort
        // explicitly, but a stable newest-first default keeps tests honest.
        rows = [...rows].sort((a, b) =>
          String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")),
        );
      }

      if (this.limitCount !== null) rows = rows.slice(0, this.limitCount);
      return { data: rows.map((row) => ({ ...row })), error: null };
    })();

    return this.readResult;
  }

  /** Reset cached read so a subsequent filter/order re-runs the query. */
  private invalidate(): void {
    this.readResult = null;
  }

  select(_columns?: string) {
    this.invalidate();
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, op: "eq", value });
    this.invalidate();
    return this;
  }

  is(column: string, value: unknown) {
    this.filters.push({ column, op: "is", value });
    this.invalidate();
    return this;
  }

  in(column: string, values: unknown[]) {
    this.filters.push({ column, op: "in", value: values });
    this.invalidate();
    return this;
  }

  gt(column: string, value: unknown) {
    this.filters.push({ column, op: "gt", value });
    this.invalidate();
    return this;
  }

  neq(column: string, value: unknown) {
    this.filters.push({ column, op: "neq", value });
    this.invalidate();
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: options?.ascending ?? true };
    this.invalidate();
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    this.invalidate();
    return this;
  }

  // --- terminal reads -----------------------------------------------------

  then<TResult1 = { data: unknown; error: unknown }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: unknown; error: unknown }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.executeRead().then(onfulfilled, onrejected);
  }

  private async singleOrNull(mode: "single" | "maybeSingle") {
    const { data, error } = await this.executeRead();
    if (error) return { data: null, error };
    const rows = Array.isArray(data) ? data : data === null ? [] : [data];
    if (mode === "maybeSingle") return { data: rows[0] ?? null, error: null };
    if (rows.length !== 1) {
      return { data: null, error: { message: `expected exactly 1 row, got ${rows.length}` } };
    }
    return { data: rows[0], error: null };
  }

  maybeSingle() {
    return this.singleOrNull("maybeSingle");
  }

  single() {
    return this.singleOrNull("single");
  }

  // --- writes -------------------------------------------------------------

  insert(payload: Row | Row[]) {
    const rows = Array.isArray(payload) ? payload : [payload];
    const self = this;

    const run = async (mode: "array" | "single" | "maybeSingle") => {
      const table = self.tableState();
      if (!table) {
        return { data: mode === "array" ? [] : null, error: { message: "unknown table" } };
      }
      const caller = currentCaller();

      const written: Row[] = [];
      for (const raw of rows) {
        const row: Row = { ...raw };

        // RLS: BEFORE INSERT trigger stamps ownership from the verified JWT.
        if (table.stampsOwner) row.owner_clerk_id = caller;
        if (!row.id) row.id = `id-${Math.random().toString(36).slice(2, 10)}`;
        if (!row.created_at) row.created_at = new Date().toISOString();
        if (!row.updated_at) row.updated_at = row.created_at as string;

        // RLS: the INSERT policy. A violating row is silently not inserted, so
        // the mock skips it rather than raising.
        if (!table.writableBy(row, caller)) continue;

        // UNIQUE(worker_id, tool_key) on worker_tools.
        if (self.table === "worker_tools") {
          const existing = table.rows.findIndex(
            (candidate) =>
              candidate.worker_id === row.worker_id && candidate.tool_key === row.tool_key,
          );
          if (existing >= 0) {
            table.rows[existing] = { ...table.rows[existing], ...row };
            written.push({ ...table.rows[existing] });
            continue;
          }
        }

        table.rows.push(row);
        written.push({ ...row });
      }

      self.state.calls.push({ op: "insert", table: self.table, payload: rows[0] });
      if (mode === "array") return { data: written, error: null };
      return { data: written[0] ?? null, error: null };
    };

    return this.wrapWrite(run);
  }

  update(payload: Row) {
    const self = this;
    const run = async (mode: "array" | "single" | "maybeSingle") => {
      const table = self.tableState();
      if (!table) return { data: mode === "array" ? [] : null, error: { message: "unknown table" } };
      const caller = currentCaller();

      // The RLS UPDATE policy has WITH CHECK owner_clerk_id = current user, so a
      // client-supplied owner reassignment is dropped by the database.
      const patch: Row = { ...payload };
      if ("owner_clerk_id" in patch) delete patch.owner_clerk_id;

      const matching = table.rows.filter((row) =>
        self.filters.every((filter) => matchesFilter(row, filter)),
      );
      // RLS: only rows the caller can read AND write are affected. An UPDATE
      // blocked by policy affects zero rows — Postgres reports that as success
      // with no returned data, which is exactly what the mock returns.
      const allowed = matching.filter((row) => table.writableBy(row, caller));

      for (const row of allowed) {
        Object.assign(row, patch, { updated_at: new Date().toISOString() });
      }

      self.state.calls.push({ op: "update", table: self.table, payload });
      if (mode === "array") return { data: allowed.map((row) => ({ ...row })), error: null };
      return { data: allowed[0] ? { ...allowed[0] } : null, error: null };
    };

    return this.wrapWrite(run);
  }

  delete() {
    const self = this;
    const run = async (mode: "array" | "single" | "maybeSingle") => {
      const table = self.tableState();
      if (!table) return { data: mode === "array" ? [] : null, error: { message: "unknown table" } };
      const caller = currentCaller();

      const matching = table.rows.filter((row) =>
        self.filters.every((filter) => matchesFilter(row, filter)),
      );
      const allowed = matching.filter((row) => table.writableBy(row, caller));
      table.rows = table.rows.filter((row) => !allowed.includes(row));

      self.state.calls.push({ op: "delete", table: self.table });
      if (mode === "array") return { data: [], error: null };
      return { data: null, error: null };
    };

    return this.wrapWrite(run);
  }

  /**
   * Make a write chainable (`.select()`, `.single()`, `.maybeSingle()`,
   * `.eq()`, ...) while remaining awaitable, exactly like PostgREST.
   *
   * Filters chained onto a write DO narrow the affected rows (that is what
   * `.delete().eq("id", x)` means), so they are recorded onto the same filter
   * list the reads use rather than discarded.
   */
  private wrapWrite(
    run: (mode: "array" | "single" | "maybeSingle") => Promise<{ data: unknown; error: unknown }>,
  ) {
    const apply = (build: (self: TableBuilder) => void) => {
      build(this);
      this.invalidate();
      return chainable;
    };

    const chainable = {
      then: (
        onfulfilled?: ((value: { data: unknown; error: unknown }) => unknown) | null,
        onrejected?: ((reason: unknown) => unknown) | null,
      ) => run("array").then(onfulfilled, onrejected),
      select: () => chainable,
      eq: (column: string, value: unknown) => apply((self) => self.filters.push({ column, op: "eq", value })),
      is: (column: string, value: unknown) => apply((self) => self.filters.push({ column, op: "is", value })),
      in: (column: string, values: unknown[]) =>
        apply((self) => self.filters.push({ column, op: "in", value: values })),
      gt: (column: string, value: unknown) => apply((self) => self.filters.push({ column, op: "gt", value })),
      neq: (column: string, value: unknown) =>
        apply((self) => self.filters.push({ column, op: "neq", value })),
      order: () => chainable,
      limit: () => chainable,
      single: async () => {
        const { data, error } = await run("single");
        if (!error && data === null) return { data: null, error: { message: "no rows" } };
        return { data, error };
      },
      maybeSingle: async () => run("maybeSingle"),
    };
    return chainable;
  }
}

function matchesFilter(row: Row, filter: Filter): boolean {
  const value = row[filter.column];
  switch (filter.op) {
    case "eq":
      return value === filter.value;
    case "neq":
      return value !== filter.value;
    case "is":
      // In Postgres an absent column value IS null, so is(null) must match both
      // an explicit null and a column a fixture never set. Treating undefined
      // as non-null here silently drops rows from every list query.
      return filter.value === null
        ? value === null || value === undefined
        : value === filter.value;
    case "in":
      return Array.isArray(filter.value) && filter.value.includes(value);
    case "gt":
      return new Date(String(value)).getTime() > new Date(String(filter.value)).getTime();
    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// Edge-function and RPC stubs
// ---------------------------------------------------------------------------

type InvokeHandler = (state: MockSupabase, body: Record<string, unknown>) => Promise<unknown>;
type RpcHandler = (state: MockSupabase, params: Record<string, unknown>) => Promise<unknown>;

const invokeHandlers = new Map<string, InvokeHandler>();
const rpcHandlers = new Map<string, RpcHandler>();

export function stubInvoke(name: string, handler: InvokeHandler): void {
  invokeHandlers.set(name, handler);
}

export function stubRpc(name: string, handler: RpcHandler): void {
  rpcHandlers.set(name, handler);
}

/** Clear all invoke/rpc stubs between tests. */
export function clearStubs(): void {
  invokeHandlers.clear();
  rpcHandlers.clear();
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export interface TableSpec {
  ownerOf?: (row: Row) => string | null;
  /** Set false when the table has no owner_clerk_id column (derived tenant). */
  stampsOwner?: boolean;
  writableBy?: (row: Row | undefined, caller: string | null) => boolean;
}

export function createMockSupabase(specs: Record<string, TableSpec> = {}): MockSupabase {
  const tables = new Map<string, TableState>();

  const DEFAULT_OWNER = (row: Row) => (row.owner_clerk_id as string) ?? null;
  const DEFAULT_WRITABLE = (row: Row | undefined, caller: string | null) => {
    if (!caller) return false;
    return row ? (row.owner_clerk_id as string | undefined) === caller : true;
  };

  /**
   * workspace_members carries no owner_clerk_id. Its access is derived from the
   * parent workspace's owner, exactly as agentos.is_workspace_member() does in
   * SQL. Closure over `tables` is deliberate: the parent may be seeded after
   * the members table is registered.
   */
  const WORKSPACE_MEMBERS_OWNER = (row: Row): string | null => {
    const workspace = tables
      .get("workspaces")
      ?.rows.find((candidate) => candidate.id === row.workspace_id);
    return workspace ? ((workspace.owner_clerk_id as string) ?? null) : null;
  };
  // The ws_members_insert/update/delete policies require the CALLER to own the
  // workspace, so this is a caller predicate rather than a row predicate.
  const WORKSPACE_MEMBERS_WRITABLE = (_row: Row | undefined, caller: string | null) => {
    if (!caller) return false;
    return (tables.get("workspaces")?.rows ?? []).some(
      (workspace) => workspace.owner_clerk_id === caller,
    );
  };

  const BUILT_IN_SPECS: Record<string, TableSpec> = {
    workspace_members: {
      ownerOf: WORKSPACE_MEMBERS_OWNER,
      stampsOwner: false,
      writableBy: WORKSPACE_MEMBERS_WRITABLE,
    },
    // Rendered by service_role only: no client INSERT/UPDATE policy exists, so
    // a browser write affects zero rows.
    execution_runs: { ownerOf: DEFAULT_OWNER, writableBy: () => false },
    execution_events: { ownerOf: DEFAULT_OWNER, writableBy: () => false },
    usage_records: { ownerOf: DEFAULT_OWNER, writableBy: () => false },
    audit_logs: { ownerOf: DEFAULT_OWNER, writableBy: () => false },
    // Seeded catalogs are world-readable and not tenant-scoped.
    model_catalog: { ownerOf: () => null, stampsOwner: false },
    integrations: { ownerOf: () => null, stampsOwner: false },
  };

  const allSpecs: Record<string, TableSpec> = { ...BUILT_IN_SPECS, ...specs };

  /**
   * Single source of truth for a table's tenant rules, used both at
   * construction and when an undeclared table is first touched. Keeping this in
   * one function is what stops a table quietly falling back to a permissive
   * default (e.g. "any authenticated caller may write") when a test seeds it
   * before it has ever been queried.
   */
  const resolve = (spec: TableSpec | undefined): TableState => ({
    rows: [],
    ownerOf: spec?.ownerOf ?? DEFAULT_OWNER,
    stampsOwner: spec?.stampsOwner ?? (spec?.ownerOf === undefined || spec?.ownerOf === DEFAULT_OWNER),
    writableBy: spec?.writableBy ?? DEFAULT_WRITABLE,
  });

  for (const [name, spec] of Object.entries(allSpecs)) {
    tables.set(name, resolve(spec));
  }

  const state: MockSupabase = {
    tables,
    from: (table: string) => {
      // Auto-register an undeclared table using the SAME spec resolution the
      // factory used, so built-in rules (workspace_members, catalogs,
      // append-only tables) still apply to a table a test never seeded.
      if (!tables.has(table)) {
        const spec = allSpecs[table];
        tables.set(table, resolve(table, spec));
      }
      return new TableBuilder(state, table);
    },
    functions: {
      invoke: async (name: string, params: { body?: unknown }) => {
        const body = params.body ?? {};
        state.invokeCalls.push({ name, body });
        const handler = invokeHandlers.get(name);
        if (!handler) {
          return {
            data: { error: { code: "not_found", message: `no handler registered for ${name}` } },
            error: null,
          };
        }
        return { data: await handler(state, body as Record<string, unknown>), error: null };
      },
    },
    rpc: async (name: string, params?: Record<string, unknown>) => {
      const handler = rpcHandlers.get(name);
      if (!handler) return { data: null, error: { message: `no rpc ${name}` } };
      return { data: await handler(state, params ?? {}), error: null };
    },
    calls: [],
    invokeCalls: [],
  };

  return state;
}

/** Seed rows directly (bypasses RLS, as a fixture would). */
export function seed(state: MockSupabase, table: string, rows: Row[]): void {
  // Declare the table first with the factory's real rules, so a table that a
  // test seeds before ever queryinging does not fall back to a permissive
  // default that would let any caller write any row.
  if (!state.tables.has(table)) {
    state.from(table);
  }
  state.tables.get(table)!.rows.push(...rows);
}

/** The error message on a result, or null. */
export function resultError<T>(result: AgentOSResult<T>): string | null {
  return result.error?.message ?? null;
}

/** Rows a test can read straight out of the mock. */
export function rowsOf(state: MockSupabase, table: string): Row[] {
  return state.tables.get(table)?.rows ?? [];
}

export { vi };
