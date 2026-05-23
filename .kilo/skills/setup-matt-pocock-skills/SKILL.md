---
name: setup-matt-pocock-skills
description: Sets up agent skills configuration for issue tracker (GitHub/GitLab/local), triage labels, and domain docs layout. Run before first use of to-issues, to-prd, triage, diagnose, tdd, improve-codebase-architecture, or zoom-out.
---

# Setup Matt Pocock's Skills

Scaffold the per-repo configuration that the engineering skills assume:

- **Issue tracker** — where issues live (GitHub by default; local markdown is also supported out of the box)
- **Triage labels** — the strings used for the five canonical triage roles
- **Domain docs** — where `CONTEXT.md` and ADRs live, and the consumer rules for reading them

This is a prompt-driven skill, not a deterministic script. Explore, present what you found, confirm with the user, then write.

## Process

### 1. Explore

Look at the current repo to understand its starting state. Read whatever exists; don't assume:

- `git remote -v` and `.git/config` — is this a GitHub repo? Which one?
- `AGENTS.md` and `CLAUDE.md` at the repo root — does either exist? Is there already an `## Agent skills` section in either?
- `CONTEXT.md` and `CONTEXT-MAP.md` at the repo root
- `docs/adr/` and any `src/*/docs/adr/` directories
- `docs/agents/` — does this skill's prior output already exist?

### 2. Present findings and ask

Summarise what's present and what's missing. Then walk the user through three decisions one at a time:

**Section A — Issue tracker.**
- **GitHub** — issues live in the repo's GitHub Issues (uses the `gh` CLI)
- **GitLab** — issues live in the repo's GitLab Issues (uses the `glab` CLI)
- **Local markdown** — issues live as files under `.scratch/<feature>/`
- **Other** (Jira, Linear, etc.) — ask the user to describe the workflow

**Section B — Triage label vocabulary.**

The five canonical roles:
- `needs-triage` — maintainer needs to evaluate
- `needs-info` — waiting on reporter
- `ready-for-agent` — fully specified, AFK-ready
- `ready-for-human` — needs human implementation
- `wontfix` — will not be actioned

**Section C — Domain docs.**

Confirm the layout:
- **Single-context** — one `CONTEXT.md` + `docs/adr/` at the repo root
- **Multi-context** — `CONTEXT-MAP.md` at the root pointing to per-context `CONTEXT.md` files

### 3. Confirm and edit

Show the user a draft of the `## Agent skills` block to add, and the three docs files. Let them edit before writing.

### 4. Write

Pick the file to edit:
- If `CLAUDE.md` exists, edit it.
- Else if `AGENTS.md` exists, edit it.
- If neither exists, ask the user which one to create.

Never create `AGENTS.md` when `CLAUDE.md` already exists (or vice versa).

If an `## Agent skills` block already exists, update its contents in-place rather than appending a duplicate.

### 5. Done

Tell the user the setup is complete and which engineering skills will now read from these files.