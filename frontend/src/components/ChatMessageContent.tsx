import type { ReactNode } from "react";

type Props = {
  content: string;
};

export function ChatMessageContent({ content }: Props) {
  return <div className="chat-markdown">{parseBlocks(content)}</div>;
}

function parseBlocks(content: string): ReactNode[] {
  const lines = content.replaceAll("\r", "").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        code.push(lines[index]);
        index += 1;
      }
      index += 1;
      blocks.push(<pre key={`code-${index}`}><code>{code.join("\n")}</code></pre>);
      continue;
    }

    const heading = line.match(/^#{1,3}\s+(.+)$/);
    if (heading) {
      blocks.push(<h4 key={`heading-${index}`}>{renderInline(heading[1])}</h4>);
      index += 1;
      continue;
    }

    if (isTableSeparator(lines[index + 1])) {
      const headers = splitTableRow(line);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index].includes("|")) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }
      blocks.push(<div className="chat-markdown-table" key={`table-${index}`}><table><thead><tr>{headers.map((header, cellIndex) => <th key={`${cellIndex}-${header}`}>{renderInline(header)}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={`row-${rowIndex}`}>{headers.map((_, cellIndex) => <td key={`${rowIndex}-${cellIndex}`}>{renderInline(row[cellIndex] ?? "")}</td>)}</tr>)}</tbody></table></div>);
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ""));
        index += 1;
      }
      blocks.push(<ul key={`list-${index}`}>{items.map((item, itemIndex) => <li key={`${itemIndex}-${item}`}>{renderInline(item)}</li>)}</ul>);
      continue;
    }

    if (/^\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+[.)]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+[.)]\s+/, ""));
        index += 1;
      }
      blocks.push(<ol key={`ordered-${index}`}>{items.map((item, itemIndex) => <li key={`${itemIndex}-${item}`}>{renderInline(item)}</li>)}</ol>);
      continue;
    }

    if (/^-{3,}$/.test(line)) {
      index += 1;
      continue;
    }

    blocks.push(<p key={`paragraph-${index}`}>{renderInline(line)}</p>);
    index += 1;
  }

  return blocks;
}

function isTableSeparator(line?: string): boolean {
  return Boolean(line && /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(line));
}

function splitTableRow(line: string): string[] {
  const normalized = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return normalized.split("|").map(cell => cell.trim());
}

function renderInline(text: string): ReactNode[] {
  const normalized = text.replaceAll(/\\([_*~])/g, "$1");
  const tokenPattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  const result: ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(normalized)) !== null) {
    if (match.index > cursor) result.push(normalized.slice(cursor, match.index));
    const token = match[0];
    if (token.startsWith("**")) result.push(<strong key={`${match.index}-${token}`}>{token.slice(2, -2)}</strong>);
    else if (token.startsWith("`")) result.push(<code key={`${match.index}-${token}`}>{token.slice(1, -1)}</code>);
    else result.push(<em key={`${match.index}-${token}`}>{token.slice(1, -1)}</em>);
    cursor = match.index + token.length;
  }

  if (cursor < normalized.length) result.push(normalized.slice(cursor));
  return result;
}
