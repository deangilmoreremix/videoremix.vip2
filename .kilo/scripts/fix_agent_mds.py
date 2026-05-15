#!/usr/bin/env python3
"""
Clean up all agent Markdown files in .kilo/agents/.
Processes 16 skills from .kilo/skills/<name>/SKILL.md
and 2 netlify agents from .kilo/agents/ directly.
Produces frontmatter with description (from first meaningful body line
or fm_name fallback) and mode: all, followed by the full body text.
"""

import re
import os

SKILLS_DIR = "/Users/shasheemoore/Downloads/videoremix2026/videoremix.vip2/.kilo/skills"
AGENTS_DIR = "/Users/shasheemoore/Downloads/videoremix2026/videoremix.vip2/.kilo/agents"

# The 16 skills to process (source = skills/<name>/SKILL.md)
SKILLS = [
    "app-completion",
    "brainstorming",
    "dispatching-parallel-agents",
    "executing-plans",
    "finishing-a-development-branch",
    "impeccable",
    "receiving-code-review",
    "requesting-code-review",
    "subagent-driven-development",
    "systematic-debugging",
    "test-driven-development",
    "using-git-worktrees",
    "using-superpowers",
    "verification-before-completion",
    "writing-plans",
    "writing-skills",
]

# The 2 netlify agent files (source = agents/ directly, no skills SKILL.md)
NETLIFY_AGENTS = ["netlify-api.md", "netlify-deploy.md"]

# Strings that mark lines to be skipped when scanning for the description.
# Must match opening tags BEFORE closing tags so alternation backtracks correctly.
# Use a character class for the slash to ensure [/<]SUBAGENT-STOP syntax:
SKIP_LINE_PATTERNS = re.compile(
    r'^\s*(?:</?SUBAGENT-STOP\s*>|</?EXTREMELY-IMPORTANT\s*>)\s*$'
)

def parse_frontmatter_and_body(text):
    """
    Split text into (frontmatter_dict, body_start_line, raw_lines).
    fm is the dict from the first --- block.
    body_start_line is the index of the first line AFTER the closing ---.
    """
    lines = text.split("\n")
    fm_lines = []
    in_fm = False
    first_fm_end = None   # index of the closing --- line

    for i, line in enumerate(lines):
        if line.strip() == "---":
            if not in_fm:
                # Opening frontmatter
                in_fm = True
                fm_lines = [line]
            else:
                # Closing frontmatter
                first_fm_end = i
                fm_lines.append(line)
                break
        elif in_fm:
            fm_lines.append(line)

    # Body starts at the line after the closing ---
    if first_fm_end is not None:
        body_idx = first_fm_end + 1
    else:
        body_idx = 0

    body_lines = lines[body_idx:]

    # Parse fm dict
    fm = {}
    fm_text = "\n".join(fm_lines[1:-1])
    for line in fm_text.split("\n"):
        line = line.strip()
        if ":" in line:
            key, _, val = line.partition(":")
            fm[key.strip()] = val.strip()

    return fm, body_lines, lines


def extract_description_from_body(body_lines):
    """
    Find the first non-blank, non-XML-bearing line in body_lines.
    If it starts with '# ', strip '# '.
    Return None if no such line exists.
    """
    for line in body_lines:
        stripped = line.strip()
        if not stripped:
            continue
        if SKIP_LINE_PATTERNS.match(stripped):
            continue
        # Found a meaningful line
        if stripped.startswith("# "):
            stripped = stripped[2:]
        return stripped
    return None


def extract_description_from_fm(fm, body_lines):
    """
    Return description from fm if available, otherwise fm_name, otherwise 'impeccable'.
    """
    desc = fm.get("description") or fm.get("Name")
    if desc:
        return desc
    fm_name = fm.get("name", "")
    return fm_name if fm_name else "impeccable"


def build_new_frontmatter(description, mode="all"):
    """Build the new YAML frontmatter block."""
    return f'---\ndescription: {description}\nmode: {mode}\n---'


def get_body_text(body_lines):
    """Return all body lines as a single string (preserving all whitespace)."""
    return "\n".join(body_lines)


def process_skill_file(skill_name):
    """Process a skill SKILL.md → agents/<skill_name>.md."""
    skill_path = os.path.join(SKILLS_DIR, skill_name, "SKILL.md")
    agents_path  = os.path.join(AGENTS_DIR, f"{skill_name}.md")

    with open(skill_path, "r", encoding="utf-8") as f:
        raw = f.read()

    fm, body_lines, all_lines = parse_frontmatter_and_body(raw)

    # Skip inadequate body (impeccable has only fm + heading, no real body)
    desc_from_body = extract_description_from_body(body_lines)
    if desc_from_body is None:
        # No usable body lines (e.g. impeccable — only fm + heading, no prose).
        # Use fm "description" as the trigger-conditions sentence for the frontmatter
        # description field, and the fm description itself as the body content.
        fm_desc_raw = fm.get("description", "") or ""
        # Use the raw description as-is (it is already the trigger-conditions sentence)
        desc = fm_desc_raw
        body_text = get_body_text(body_lines).rstrip()
        if not body_text.strip():
            # Truly empty effective body — use fm description as body too
            body_text = fm_desc_raw
    else:
        desc = desc_from_body
        body_text = get_body_text(body_lines).rstrip()

    new_fm = build_new_frontmatter(desc)

    if body_text:
        output = f"{new_fm}\n{body_text}\n"
    else:
        output = f"{new_fm}\n"

    with open(agents_path, "w", encoding="utf-8") as f:
        f.write(output)

    print(f"  [OK] {skill_name}.md  |  description={desc[:70]}")
    return agents_path


def process_netlify_agent(filename):
    """Process an existing netlify agent file (source = agents/ directly)."""
    source_path = os.path.join(AGENTS_DIR, filename)
    target_path = source_path           # overwrite in-place

    with open(source_path, "r", encoding="utf-8") as f:
        raw = f.read()

    fm, body_lines, all_lines = parse_frontmatter_and_body(raw)
    desc = extract_description_from_body(body_lines) or extract_description_from_fm(fm, body_lines)
    body_text = get_body_text(body_lines).rstrip()

    new_fm = build_new_frontmatter(desc)
    if body_text:
        output = f"{new_fm}\n{body_text}\n"
    else:
        output = f"{new_fm}\n"

    with open(target_path, "w", encoding="utf-8") as f:
        f.write(output)

    print(f"  [OK] {filename}  |  description={desc[:70]}")
    return target_path


def head_of_file(filepath, n=30):
    with open(filepath, "r", encoding="utf-8") as f:
        return "\n".join(f.read().split("\n")[:n])


if __name__ == "__main__":
    os.makedirs(AGENTS_DIR, exist_ok=True)

    generated_files = []

    print("=== Processing 16 skill files ===")
    for skill_name in SKILLS:
        generated_files.append(process_skill_file(skill_name))

    print("\n=== Processing 2 netlify agent files ===")
    for filename in NETLIFY_AGENTS:
        generated_files.append(process_netlify_agent(filename))

    print("\n" + "=" * 72)
    print("QUICK CHECK — head of each generated .md file")
    print("=" * 72)

    for f in generated_files:
        fname = os.path.basename(f)
        print(f"\n─── {fname} ───")
        print(head_of_file(f))
