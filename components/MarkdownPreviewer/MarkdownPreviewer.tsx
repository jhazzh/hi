'use client';
import React, { useState } from "react";
import "./MarkdownPreviewer.scss";

const DEFAULT = [
  "# Markdown Previewer",
  "",
  "A tiny live renderer — type on the left, see it **instantly** on the right.",
  "",
  "## What it handles",
  "",
  "- Headings, **bold**, and *italic*",
  "- [Links](https://example.com) and `inline code`",
  "- Lists, quotes, and tables",
  "",
  "> Built to learn how parsers turn text into structure.",
  "",
  "```",
  "function greet(name) {",
  // eslint-disable-next-line no-template-curly-in-string
  "  return `Hello, ${name}!`;",
  "}",
  "```",
  "",
  "| Project | Stack |",
  "| --- | --- |",
  "| Calculator | React |",
  "| Weather | API |",
  "",
  "---",
  "",
  "Made with **Markdown**.",
].join("\n");

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const inline = (s: string) =>
  s
    .replace(/`([^`]+)`/g, (_m: string, c: string) => "<code>" + c + "</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/_([^_]+)_/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

const parse = (md: string) => {
  const lines = esc(md).split("\n");
  let html = "", i = 0;
  let para: string[] = [];
  const flushPara = () => {
    if (para.length) html += "<p>" + inline(para.join(" ")) + "</p>";
    para = [];
  };

  while (i < lines.length) {
    const line = lines[i];

    if (/^```/.test(line)) {
      flushPara();
      const code = []; i++;
      while (i < lines.length && !/^```/.test(lines[i])) { code.push(lines[i]); i++; }
      i++;
      html += "<pre><code>" + code.join("\n") + "</code></pre>";
      continue;
    }
    if (/^#{1,3}\s/.test(line)) {
      flushPara();
      const lvl = (line.match(/^#+/)?.[0].length) ?? 1;
      html += "<h" + lvl + ">" + inline(line.replace(/^#+\s/, "")) + "</h" + lvl + ">";
      i++; continue;
    }
    if (/^\s*>\s?/.test(line)) {
      flushPara();
      const q = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) { q.push(lines[i].replace(/^\s*>\s?/, "")); i++; }
      html += "<blockquote>" + inline(q.join(" ")) + "</blockquote>";
      continue;
    }
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
      flushPara(); html += "<hr>"; i++; continue;
    }
    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1])) {
      flushPara();
      const rows = [];
      while (i < lines.length && /\|/.test(lines[i])) { rows.push(lines[i]); i++; }
      const cells = (r: string) => r.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map((c) => c.trim());
      const head = cells(rows[0]);
      html += "<table><thead><tr>" + head.map((c) => "<th>" + inline(c) + "</th>").join("") + "</tr></thead><tbody>";
      for (let r = 2; r < rows.length; r++) {
        html += "<tr>" + cells(rows[r]).map((c) => "<td>" + inline(c) + "</td>").join("") + "</tr>";
      }
      html += "</tbody></table>";
      continue;
    }
    if (/^\s*[-*+]\s/.test(line)) {
      flushPara();
      const items = [];
      while (i < lines.length && /^\s*[-*+]\s/.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*+]\s/, "")); i++; }
      html += "<ul>" + items.map((t) => "<li>" + inline(t) + "</li>").join("") + "</ul>";
      continue;
    }
    if (/^\s*\d+\.\s/.test(line)) {
      flushPara();
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s/.test(lines[i])) { items.push(lines[i].replace(/^\s*\d+\.\s/, "")); i++; }
      html += "<ol>" + items.map((t) => "<li>" + inline(t) + "</li>").join("") + "</ol>";
      continue;
    }
    if (/^\s*$/.test(line)) { flushPara(); i++; continue; }

    para.push(line.trim()); i++;
  }
  flushPara();
  return html;
};

const MarkdownPreviewer = () => {
  const [source, setSource] = useState(DEFAULT);

  return (
    <div className="md-page">

      <main className="md-main">
        <div className="md-titleblock">
          <p className="md-kicker">React · Marked</p>
          <h1 className="md-title">Markdown Previewer</h1>
        </div>

        <div className="md-grid">
          <div className="md-pane">
            <div className="md-pane-head">
              <span className="md-pane-label">Markdown</span>
              <button className="md-reset" onClick={() => setSource(DEFAULT)}>Reset</button>
            </div>
            <textarea
              className="md-editor"
              spellCheck="false"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </div>

          <div className="md-pane">
            <div className="md-pane-head">
              <span className="md-pane-label">Preview</span>
            </div>
            <div className="md-preview">
              <div className="md-out" dangerouslySetInnerHTML={{ __html: parse(source) }} />
            </div>
          </div>
        </div>

        <p className="md-tip">Supports headings, bold, italic, links, lists, quotes, code, tables and rules.</p>
      </main>
    </div>
  );
};

export default MarkdownPreviewer;