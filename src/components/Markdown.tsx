import React from "react";

// Lightweight Markdown renderer: headings, lists, tables, **bold**, *italic*,
// `code`, [links](url), paragraphs. Enough for coach replies.

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const key = `${keyPrefix}-${i++}`;
    if (m[2]) nodes.push(<strong key={key}>{m[2]}</strong>);
    else if (m[3]) nodes.push(<em key={key}>{m[3]}</em>);
    else if (m[4])
      nodes.push(
        <code key={key} className="rounded bg-slate-100 px-1 py-0.5 text-[0.85em]">
          {m[4]}
        </code>,
      );
    else if (m[5] && m[6])
      nodes.push(
        <a
          key={key}
          href={m[6]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-600 underline"
        >
          {m[5]}
        </a>,
      );
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function isTableRow(line: string): boolean {
  const t = line.trim();
  return t.startsWith("|") && t.endsWith("|") && t.length > 2;
}

export function parseTableRow(line: string): string[] {
  const t = line.trim();
  if (!isTableRow(t)) return [];
  return t
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim());
}

export function isTableSeparatorRow(line: string): boolean {
  const cells = parseTableRow(line);
  if (cells.length === 0) return false;
  return cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function renderTable(tableLines: string[], blockKey: number): React.ReactNode {
  const parsed = tableLines.map(parseTableRow);
  let header: string[] | null = null;
  let body = parsed;

  if (parsed.length >= 2 && isTableSeparatorRow(tableLines[1])) {
    header = parsed[0];
    body = parsed.slice(2);
  }

  return (
    <div key={blockKey} className="my-1 overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full min-w-[280px] border-collapse text-sm">
        {header && (
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {header.map((cell, i) => (
                <th
                  key={i}
                  className="px-3 py-2 text-left font-semibold text-ink"
                >
                  {renderInline(cell, `th-${blockKey}-${i}`)}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} className="border-b border-slate-100 last:border-0">
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className="px-3 py-2 align-top text-slate-700"
                >
                  {renderInline(cell, `td-${blockKey}-${ri}-${ci}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Markdown({ content }: { content: string }) {
  const lines = content.replace(/\r/g, "").split("\n");
  const blocks: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let key = 0;

  const flushList = () => {
    if (!list) return;
    const items = list.items.map((it, idx) => (
      <li key={idx}>{renderInline(it, `li-${key}-${idx}`)}</li>
    ));
    blocks.push(
      list.ordered ? (
        <ol key={key++} className="ml-5 list-decimal space-y-1">
          {items}
        </ol>
      ) : (
        <ul key={key++} className="ml-5 list-disc space-y-1">
          {items}
        </ul>
      ),
    );
    list = null;
  };

  for (let li = 0; li < lines.length; li++) {
    const raw = lines[li];
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    if (isTableRow(trimmed)) {
      flushList();
      const tableLines: string[] = [];
      while (li < lines.length) {
        const row = lines[li].trimEnd().trim();
        if (!row) break;
        if (!isTableRow(row) && !isTableSeparatorRow(row)) break;
        tableLines.push(row);
        li++;
      }
      li--;
      blocks.push(renderTable(tableLines, key++));
      continue;
    }

    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      flushList();
      const lvl = h[1].length;
      const cls = lvl === 1 ? "text-base font-bold" : "text-sm font-semibold";
      blocks.push(
        <p key={key++} className={`${cls} text-ink`}>
          {renderInline(h[2], `h-${key}`)}
        </p>,
      );
      continue;
    }

    const ol = /^\d+[.)]\s+(.*)$/.exec(line);
    const ul = /^[-*•]\s+(.*)$/.exec(line);
    if (ol) {
      if (!list || !list.ordered) {
        flushList();
        list = { ordered: true, items: [] };
      }
      list.items.push(ol[1]);
      continue;
    }
    if (ul) {
      if (!list || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      list.items.push(ul[1]);
      continue;
    }

    flushList();
    blocks.push(<p key={key++}>{renderInline(line, `p-${key}`)}</p>);
  }
  flushList();

  return <div className="space-y-2 leading-relaxed">{blocks}</div>;
}
