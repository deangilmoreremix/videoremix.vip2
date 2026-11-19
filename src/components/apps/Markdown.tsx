// src/components/apps/Markdown.tsx
//
// A small markdown renderer for app results: headings, paragraphs, bold,
// italic, inline code, code blocks, bullet and numbered lists, block quotes,
// tables, rules and links. It builds React elements and never injects HTML,
// so model output cannot run script in the page; links are allowed only to
// http(s) and mailto addresses.

import { Fragment, type ReactNode } from "react";

const SAFE_URL = /^(https?:\/\/|mailto:)/i;

/** Inline markdown: **bold**, *italic*, `code` and [text](url). */
export function renderInline(text: string, keyPrefix = "i"): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(`[^`]+`)|(\*\*[^*]+\*\*)|(__[^_]+__)|(\*[^*\s][^*]*\*)|(_[^_\s][^_]*_)|(\[[^\]]+\]\([^)\s]+\))|(https?:\/\/[^\s)]+)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${index++}`;
    if (match[1]) {
      nodes.push(
        <code key={key} className="rounded bg-white/10 px-1 py-0.5 font-mono text-[0.85em]">
          {token.slice(1, -1)}
        </code>,
      );
    } else if (match[2] || match[3]) {
      nodes.push(<strong key={key}>{renderInline(token.slice(2, -2), key)}</strong>);
    } else if (match[4] || match[5]) {
      nodes.push(<em key={key}>{renderInline(token.slice(1, -1), key)}</em>);
    } else if (match[6]) {
      const [, label, href] = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(token) ?? [];
      nodes.push(
        href && SAFE_URL.test(href) ? (
          <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="text-agentos-brand-soft underline">
            {label}
          </a>
        ) : (
          label ?? token
        ),
      );
    } else if (match[7]) {
      nodes.push(
        <a key={key} href={token} target="_blank" rel="noopener noreferrer" className="break-all text-agentos-brand-soft underline">
          {token}
        </a>,
      );
    }
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function isTableRow(line: string): boolean {
  return /^\s*\|.*\|\s*$/.test(line);
}

function cells(line: string): string[] {
  return line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
}

export const Markdown: React.FC<{ source: string; className?: string }> = ({ source, className }) => {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;
  let key = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (/^\s*```/.test(line)) {
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !/^\s*```/.test(lines[index])) code.push(lines[index++]);
      index += 1;
      blocks.push(
        <pre key={key++} className="overflow-x-auto rounded-lg bg-black/40 p-3 font-mono text-xs leading-5 text-white/85">
          <code>{code.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const size = level <= 1 ? "text-xl" : level === 2 ? "text-lg" : "text-base";
      blocks.push(
        <p key={key++} role="heading" aria-level={Math.min(level + 1, 6)} className={`${size} mt-2 font-semibold text-white`}>
          {renderInline(heading[2], `h${key}`)}
        </p>,
      );
      index += 1;
      continue;
    }

    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      blocks.push(<hr key={key++} className="border-white/10" />);
      index += 1;
      continue;
    }

    if (isTableRow(line) && index + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[index + 1])) {
      const header = cells(line);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && isTableRow(lines[index])) rows.push(cells(lines[index++]));
      blocks.push(
        <div key={key++} className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr>
                {header.map((cell, column) => (
                  <th key={column} className="border-b border-white/15 px-2 py-1.5 font-medium text-white">
                    {renderInline(cell, `th${key}-${column}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, column) => (
                    <td key={column} className="border-b border-white/[0.06] px-2 py-1.5 text-white/80">
                      {renderInline(cell, `td${key}-${rowIndex}-${column}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    if (/^\s*([-*+]|\d+[.)])\s+/.test(line)) {
      const ordered = /^\s*\d+[.)]\s+/.test(line);
      const items: string[] = [];
      while (index < lines.length && /^\s*([-*+]|\d+[.)])\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*([-*+]|\d+[.)])\s+/, ""));
        index += 1;
      }
      const List = ordered ? "ol" : "ul";
      blocks.push(
        <List key={key++} className={`${ordered ? "list-decimal" : "list-disc"} space-y-1 pl-5 text-white/85`}>
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item, `li${key}-${itemIndex}`)}</li>
          ))}
        </List>,
      );
      continue;
    }

    if (/^\s*>/.test(line)) {
      const quote: string[] = [];
      while (index < lines.length && /^\s*>/.test(lines[index])) quote.push(lines[index++].replace(/^\s*>\s?/, ""));
      blocks.push(
        <blockquote key={key++} className="border-l-2 border-agentos-brand/50 pl-3 text-white/70">
          {renderInline(quote.join(" "), `q${key}`)}
        </blockquote>,
      );
      continue;
    }

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const paragraph: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^\s*(```|#{1,6}\s|>|([-*+]|\d+[.)])\s+)/.test(lines[index]) &&
      !isTableRow(lines[index])
    ) {
      paragraph.push(lines[index++]);
    }
    blocks.push(
      <p key={key++} className="leading-7 text-white/85">
        {paragraph.map((text, lineIndex) => (
          <Fragment key={lineIndex}>
            {lineIndex > 0 ? <br /> : null}
            {renderInline(text, `p${key}-${lineIndex}`)}
          </Fragment>
        ))}
      </p>,
    );
  }

  return <div className={`space-y-3 text-sm ${className ?? ""}`}>{blocks}</div>;
};

export default Markdown;
