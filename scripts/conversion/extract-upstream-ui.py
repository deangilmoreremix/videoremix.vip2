#!/usr/bin/env python3
"""Extract each upstream Awesome LLM app's screen from its source code.

Usage:
    python3 -I scripts/conversion/extract-upstream-ui.py <upstream-root> \
        scripts/conversion/upstream-map.json src/config/upstreamAppSpecs.generated.ts

<upstream-root> is a checkout of github.com/Shubhamsaboo/awesome-llm-apps. The
map names each catalog slug's folder in it. The code is only parsed (ast),
never imported or run.

For a Streamlit app the spec records, in source order: the page title and
intro text, every input widget (label, kind, options, default, help,
placeholder, whether it is in the sidebar, in which tab), the buttons, the
tabs, and the kinds of output the app shows. API-key fields are marked, so the
dashboard can leave them out (it uses the user's saved key).

Apps that are not Streamlit (Next.js, agent skills, CLIs) get kind "other"
with their README title and summary; their specs are written by hand in
src/config/upstreamAppSpecs.manual.ts.
"""

import ast
import json
import os
import re
import sys

INPUT_WIDGETS = {
    "text_input": "text",
    "text_area": "textarea",
    "number_input": "number",
    "slider": "slider",
    "select_slider": "select",
    "selectbox": "select",
    "multiselect": "multiselect",
    "radio": "radio",
    "checkbox": "checkbox",
    "toggle": "checkbox",
    "file_uploader": "file",
    "date_input": "date",
    "time_input": "time",
    "color_picker": "color",
    "camera_input": "file",
    "audio_input": "file",
}
TEXT_ELEMENTS = {"title", "header", "subheader", "caption", "markdown", "write", "info", "text"}
OUTPUTS = {
    "image": "image",
    "audio": "audio",
    "video": "video",
    "download_button": "download",
    "json": "json",
    "dataframe": "table",
    "table": "table",
    "code": "code",
    "plotly_chart": "chart",
    "pyplot": "chart",
    "altair_chart": "chart",
    "line_chart": "chart",
    "bar_chart": "chart",
    "chat_message": "chat",
}
KEY_FIELD = re.compile(r"(api[\s_-]*key|token|secret|password)", re.I)


def literal(node, consts):
    """A string or simple value from a node, or None when it is computed."""
    if node is None:
        return None
    if isinstance(node, ast.Constant):
        return node.value
    if isinstance(node, ast.Name) and node.id in consts:
        return consts[node.id]
    if isinstance(node, ast.JoinedStr):
        parts = []
        for value in node.values:
            if isinstance(value, ast.Constant):
                parts.append(str(value.value))
            else:
                parts.append("…")
        return "".join(parts)
    if isinstance(node, (ast.List, ast.Tuple)):
        items = [literal(element, consts) for element in node.elts]
        return items if all(item is not None for item in items) else None
    if isinstance(node, ast.Dict):
        keys = [literal(key, consts) for key in node.keys]
        return keys if all(key is not None for key in keys) else None
    if isinstance(node, ast.BinOp) and isinstance(node.op, ast.Add):
        left, right = literal(node.left, consts), literal(node.right, consts)
        if isinstance(left, str) and isinstance(right, str):
            return left + right
    if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.USub):
        value = literal(node.operand, consts)
        return -value if isinstance(value, (int, float)) else None
    return None


def kwarg(call, name):
    for keyword in call.keywords:
        if keyword.arg == name:
            return keyword.value
    return None


class Extractor(ast.NodeVisitor):
    def __init__(self, consts):
        self.consts = consts
        self.page_title = None
        self.texts = []
        self.fields = []
        self.buttons = []
        self.tabs = []
        self.outputs = []
        self.chat = False
        self.sidebar_depth = 0
        self.tab_stack = []
        self.tab_vars = {}
        self.form = False
        self.target = None

    # ``with st.sidebar:`` / ``with tab1:`` / ``with st.form(...)``
    def visit_With(self, node):
        entered_sidebar = 0
        pushed_tab = False
        for item in node.items:
            expr = item.context_expr
            if isinstance(expr, ast.Attribute) and expr.attr == "sidebar":
                entered_sidebar += 1
            if isinstance(expr, ast.Name) and expr.id in self.tab_vars:
                self.tab_stack.append(self.tab_vars[expr.id])
                pushed_tab = True
            if isinstance(expr, ast.Call) and isinstance(expr.func, ast.Attribute) and expr.func.attr == "form":
                self.form = True
        self.sidebar_depth += entered_sidebar
        self.generic_visit(node)
        self.sidebar_depth -= entered_sidebar
        if pushed_tab:
            self.tab_stack.pop()

    def visit_Assign(self, node):
        # tab1, tab2 = st.tabs(["A", "B"])
        value = node.value
        if isinstance(value, ast.Call) and isinstance(value.func, ast.Attribute) and value.func.attr == "tabs":
            labels = literal(value.args[0], self.consts) if value.args else None
            if isinstance(labels, list):
                self.tabs.extend(str(label) for label in labels)
                target = node.targets[0]
                if isinstance(target, (ast.Tuple, ast.List)):
                    for element, label in zip(target.elts, labels):
                        if isinstance(element, ast.Name):
                            self.tab_vars[element.id] = str(label)
        # The variable a widget is assigned to names it when its label is empty.
        target = node.targets[0] if len(node.targets) == 1 else None
        previous = self.target
        self.target = target.id if isinstance(target, ast.Name) else None
        self.generic_visit(node)
        self.target = previous

    def visit_Call(self, node):
        func = node.func
        if isinstance(func, ast.Attribute):
            name = func.attr
            owner = func.value
            in_sidebar = self.sidebar_depth > 0 or (
                isinstance(owner, ast.Attribute) and owner.attr == "sidebar"
            )
            is_st = self._is_streamlit(owner)
            if is_st:
                self._record(name, node, in_sidebar)
        self.generic_visit(node)

    def _is_streamlit(self, owner):
        while isinstance(owner, ast.Attribute):
            if owner.attr == "sidebar":
                return True
            owner = owner.value
        if isinstance(owner, ast.Name):
            return owner.id in {"st", "streamlit"} or owner.id in self.tab_vars or owner.id.startswith("col")
        return False

    def _record(self, name, node, in_sidebar):
        first = literal(node.args[0], self.consts) if node.args else None
        if name == "set_page_config":
            self.page_title = literal(kwarg(node, "page_title"), self.consts) or self.page_title
        elif name in TEXT_ELEMENTS and isinstance(first, str) and first.strip():
            if len(self.texts) < 12:
                self.texts.append({"kind": name, "text": first.strip()[:600], "sidebar": in_sidebar})
        elif name in INPUT_WIDGETS:
            label = first if isinstance(first, str) else literal(kwarg(node, "label"), self.consts)
            if not (isinstance(label, str) and label.strip()):
                placeholder = literal(kwarg(node, "placeholder"), self.consts)
                if isinstance(placeholder, str) and placeholder.strip():
                    label = placeholder.strip().rstrip(".…")
                elif self.target:
                    label = self.target.replace("_", " ").capitalize()
                else:
                    label = None
            field = {
                "kind": INPUT_WIDGETS[name],
                "widget": name,
                "label": label if isinstance(label, str) and label.strip() else None,
                "sidebar": in_sidebar,
                "tab": self.tab_stack[-1] if self.tab_stack else None,
            }
            options = literal(kwarg(node, "options"), self.consts)
            if options is None and name in {"selectbox", "multiselect", "radio", "select_slider"} and len(node.args) > 1:
                options = literal(node.args[1], self.consts)
            if isinstance(options, list):
                field["options"] = [str(option) for option in options][:40]
            for key in ("value", "index", "placeholder", "help", "min_value", "max_value", "step", "type", "default"):
                value = literal(kwarg(node, key), self.consts)
                if value is not None and not isinstance(value, (list, dict)) or isinstance(value, list) and key == "default":
                    field[key] = value
            if name == "slider" and "value" not in field and len(node.args) > 3:
                value = literal(node.args[3], self.consts)
                if value is not None:
                    field["value"] = value
            if name == "file_uploader":
                accepted = literal(kwarg(node, "type"), self.consts)
                if accepted is not None:
                    field["accept"] = accepted if isinstance(accepted, list) else [accepted]
                    field.pop("type", None)
                multiple = literal(kwarg(node, "accept_multiple_files"), self.consts)
                if multiple:
                    field["multiple"] = True
            label_text = field["label"] or ""
            field["is_api_key"] = bool(KEY_FIELD.search(label_text)) or field.get("type") == "password"
            self.fields.append(field)
        elif name in {"button", "form_submit_button"}:
            label = first if isinstance(first, str) else literal(kwarg(node, "label"), self.consts)
            if isinstance(label, str) and label.strip():
                self.buttons.append({"label": label.strip(), "sidebar": in_sidebar})
        elif name == "chat_input":
            self.chat = True
            placeholder = first if isinstance(first, str) else literal(kwarg(node, "placeholder"), self.consts)
            self.fields.append({
                "kind": "chat",
                "widget": "chat_input",
                "label": placeholder if isinstance(placeholder, str) else "Message",
                "sidebar": False,
                "tab": None,
                "is_api_key": False,
            })
        elif name in OUTPUTS:
            kind = OUTPUTS[name]
            if kind not in self.outputs:
                self.outputs.append(kind)


def module_constants(tree):
    consts = {}
    for node in tree.body:
        if isinstance(node, ast.Assign) and len(node.targets) == 1 and isinstance(node.targets[0], ast.Name):
            value = literal(node.value, consts)
            if value is not None:
                consts[node.targets[0].id] = value
    return consts


def streamlit_files(folder):
    found = []
    for dirpath, dirnames, files in os.walk(folder):
        dirnames[:] = [d for d in dirnames if not d.startswith(".") and d not in {"node_modules", "tests", "evals", "__pycache__"}]
        for name in files:
            if not name.endswith(".py"):
                continue
            path = os.path.join(dirpath, name)
            try:
                source = open(path, encoding="utf-8", errors="replace").read()
            except OSError:
                continue
            if re.search(r"^\s*import streamlit|^\s*from streamlit", source, re.M):
                widgets = len(re.findall(r"\bst\.(?:sidebar\.)?(?:" + "|".join(INPUT_WIDGETS) + r"|chat_input|button)\(", source))
                found.append((widgets, -path.count(os.sep), path, source))
    found.sort(reverse=True)
    return found


def readme_summary(folder):
    for name in ("README.md", "readme.md", "SKILL.md"):
        path = os.path.join(folder, name)
        if os.path.exists(path):
            text = open(path, encoding="utf-8", errors="replace").read()
            title = next((line.lstrip("# ").strip() for line in text.splitlines() if line.startswith("#")), None)
            paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip() and not p.strip().startswith(("#", "!", "<", "```", "|", "-", "*", "[!"))]
            return title, (paragraphs[0][:500] if paragraphs else None)
    return None, None


def extract(root, rel):
    folder = os.path.join(root, rel)
    title, summary = readme_summary(folder)
    files = streamlit_files(folder)
    if not files:
        kind = "skill" if os.path.exists(os.path.join(folder, "SKILL.md")) else (
            "nextjs" if any(os.path.exists(os.path.join(folder, d, "package.json")) for d in ("", "frontend", "web", "ui", "app")) else "other")
        return {"kind": kind, "upstream_path": rel, "readme_title": title, "readme_summary": summary}
    _, _, path, source = files[0]
    try:
        tree = ast.parse(source)
    except SyntaxError:
        return {"kind": "other", "upstream_path": rel, "readme_title": title, "readme_summary": summary}
    extractor = Extractor(module_constants(tree))
    extractor.visit(tree)
    heading = next((t["text"] for t in extractor.texts if t["kind"] == "title"), None)
    return {
        "kind": "streamlit",
        "upstream_path": rel,
        "entry_file": os.path.relpath(path, root),
        "page_title": extractor.page_title,
        "title": heading or extractor.page_title or title,
        "texts": extractor.texts,
        "fields": extractor.fields,
        "buttons": extractor.buttons,
        "tabs": extractor.tabs,
        "outputs": extractor.outputs,
        "chat": extractor.chat,
        "readme_title": title,
        "readme_summary": summary,
    }


def main():
    root, map_path, out_path = sys.argv[1], sys.argv[2], sys.argv[3]
    mapping = json.load(open(map_path))
    specs = {}
    for slug, entry in sorted(mapping.items()):
        rel = entry["path"] if isinstance(entry, dict) else entry
        specs[slug] = extract(root, rel)
    body = json.dumps(specs, indent=1, ensure_ascii=False)
    with open(out_path, "w") as handle:
        if out_path.endswith(".ts"):
            handle.write(
                "// GENERATED by scripts/conversion/extract-upstream-ui.py from\n"
                "// github.com/Shubhamsaboo/awesome-llm-apps. Do not edit by hand:\n"
                "// change the extractor, or the hand-written specs in upstreamAppSpecs.manual.ts.\n\n"
                "/* eslint-disable */\n"
                "export const GENERATED_SPECS: Record<string, any> = "
            )
            handle.write(body)
            handle.write(";\n")
        else:
            handle.write(body + "\n")
    kinds = {}
    for spec in specs.values():
        kinds[spec["kind"]] = kinds.get(spec["kind"], 0) + 1
    print(len(specs), kinds)


if __name__ == "__main__":
    main()
