'use client';
import { useState, useMemo, useEffect } from "react";
import { PRESETS, PRESET_NAMES, STATUS_COLORS } from "./presets";
import type { Column, Row, Variant } from "./presets";
import "./Records.scss";

type Store = { active: string; variants: Record<string, Variant> };

const STORAGE_KEY = "records.state";
const TYPES = ["text", "number", "date", "status"];
const MAX_VARIANTS = 20;

const clonePreset = (name: string): Variant => {
  const p = PRESETS[name as keyof typeof PRESETS];
  return { columns: p.columns.map((c) => ({ ...c })), rows: p.rows.map((r) => ({ ...r })) };
};

// Persisted shape: { active, variants: { [name]: { columns, rows } } }.
// Each variant keeps its own edited data, so switching never discards changes.
const freshStore = (): Store => ({ active: "Invoices", variants: { Invoices: clonePreset("Invoices") } });

// Only call in the browser (after mount) — localStorage is absent during prerender.
const readStore = (): Store => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw) as Store;
      if (s && s.variants && s.active) return s;
    }
  } catch { /* fall through to fresh */ }
  return freshStore();
};

const writeStore = (store: Store) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch { /* quota */ }
};

// Typed comparison for column sorting.
const compare = (a: string | number, b: string | number, type: string) => {
  if (type === "number") return (parseFloat(String(a)) || 0) - (parseFloat(String(b)) || 0);
  if (type === "date") return (Date.parse(String(a)) || 0) - (Date.parse(String(b)) || 0);
  return String(a ?? "").localeCompare(String(b ?? ""));
};

const statusStyle = (col: Column, value: string | number) => {
  const idx = Math.max(0, (col.options || []).indexOf(String(value)));
  return STATUS_COLORS[idx % STATUS_COLORS.length];
};

// RFC-4180-ish CSV: quote every field, double internal quotes, CRLF rows.
const toCSV = (columns: Column[], rows: Row[]) => {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = columns.map((c) => esc(c.label)).join(",");
  const body = rows.map((r) => columns.map((c) => esc(r[c.key])).join(",")).join("\r\n");
  return head + "\r\n" + body;
};

const downloadCSV = (columns: Column[], rows: Row[], name: string) => {
  const blob = new Blob([toCSV(columns, rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = (name || "records").toLowerCase() + ".csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const slug = (label: string) =>
  label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "col";

// Return a shallow copy of `obj` without `omitKey`.
const omitKey = <T extends Record<string, unknown>>(obj: T, omitKey: string): Partial<T> => {
  const out: Partial<T> = {};
  Object.keys(obj).forEach((k) => { if (k !== omitKey) out[k as keyof T] = obj[k as keyof T]; });
  return out;
};

const Records = () => {
  // Start from the fresh default so server and first client render match;
  // load any saved store from localStorage after mount.
  const [store, setStore] = useState(freshStore);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setStore(readStore()); setLoaded(true); }, []);

  const preset = store.active;
  const { columns, rows } = store.variants[preset];

  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState("asc");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showSchema, setShowSchema] = useState(false);
  const [newCol, setNewCol] = useState<{ label: string; type: string }>({ label: "", type: "text" });
  const [dragIdx, setDragIdx] = useState<number | null>(null);   // column being dragged
  const [overIdx, setOverIdx] = useState<number | null>(null);   // drop target
  const [tab, setTab] = useState("records");      // "records" | "variants"

  // Persist the whole store on every change.
  const commitStore = (next: Store) => { setStore(next); writeStore(next); };

  // Patch the active variant's columns and/or rows, then persist.
  const commit = (patch: { columns?: Column[]; rows?: Row[] }) => {
    commitStore({
      ...store,
      variants: {
        ...store.variants,
        [preset]: { columns: patch.columns ?? columns, rows: patch.rows ?? rows },
      },
    });
  };

  const statusCol = columns.find((c) => c.type === "status");

  const view = useMemo(() => {
    let r = rows;
    if (query.trim()) {
      const q = query.toLowerCase();
      r = r.filter((row) => columns.some((c) => String(row[c.key] ?? "").toLowerCase().includes(q)));
    }
    if (statusCol && statusFilter !== "All") {
      r = r.filter((row) => row[statusCol.key] === statusFilter);
    }
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      const dir = sortDir === "asc" ? 1 : -1;
      r = [...r].sort((x, y) => compare(x[sortKey], y[sortKey], col ? col.type : "text") * dir);
    }
    return r;
  }, [rows, columns, query, statusFilter, statusCol, sortKey, sortDir]);

  // --- actions ---
  // Built-in presets first (canonical order), then user-created variants.
  const variantNames = [
    ...PRESET_NAMES.filter((n) => store.variants[n]),
    ...Object.keys(store.variants).filter((n) => !PRESET_NAMES.includes(n)),
  ];

  const resetView = () => { setQuery(""); setSortKey(null); setStatusFilter("All"); };

  const switchPreset = (name: string) => {
    // Activate the variant, seeding it from its preset only if never visited.
    setStore((s) => {
      const next: Store = {
        active: name,
        variants: s.variants[name]
          ? s.variants
          : { ...s.variants, [name]: (PRESETS as Record<string, unknown>)[name] ? clonePreset(name) : { columns: [], rows: [] } },
      };
      writeStore(next);
      return next;
    });
    resetView();
  };

  // Built-in presets first, then user variants — for a given variants map.
  const orderedNames = (variants: Record<string, Variant>) => [
    ...PRESET_NAMES.filter((n) => variants[n]),
    ...Object.keys(variants).filter((n) => !PRESET_NAMES.includes(n)),
  ];

  // --- variant CRUD (used by the Variants tab) ---
  const createVariant = (rawName: string | null) => {
    if (variantNames.length >= MAX_VARIANTS) {
      window.alert(`Limit of ${MAX_VARIANTS} variants reached.`);
      return false;
    }
    const name = (rawName || "").trim();
    if (!name) return false;
    if (store.variants[name]) { window.alert(`"${name}" already exists.`); return false; }
    commitStore({
      active: name,
      variants: { ...store.variants, [name]: { columns: [{ key: "name", label: "Name", type: "text" }], rows: [] } },
    });
    resetView();
    return true;
  };

  const renameVariant = (oldName: string) => {
    if (PRESET_NAMES.includes(oldName)) return; // built-ins are fixed
    const raw = window.prompt(`Rename "${oldName}" to:`, oldName);
    const name = (raw || "").trim();
    if (!name || name === oldName) return;
    if (store.variants[name]) { window.alert(`"${name}" already exists.`); return; }
    // Rebuild preserving order, swapping the key.
    const variants: Record<string, Variant> = {};
    Object.keys(store.variants).forEach((k) => {
      variants[k === oldName ? name : k] = store.variants[k];
    });
    commitStore({ active: store.active === oldName ? name : store.active, variants });
  };

  const duplicateVariant = (srcName: string) => {
    if (variantNames.length >= MAX_VARIANTS) {
      window.alert(`Limit of ${MAX_VARIANTS} variants reached.`);
      return;
    }
    let name = `${srcName} copy`;
    let i = 2;
    while (store.variants[name]) name = `${srcName} copy ${i++}`;
    const src = store.variants[srcName];
    const copy = { columns: src.columns.map((c) => ({ ...c })), rows: src.rows.map((r) => ({ ...r })) };
    commitStore({ active: store.active, variants: { ...store.variants, [name]: copy } });
  };

  const deleteVariantByName = (name: string) => {
    if (PRESET_NAMES.includes(name)) return; // built-ins aren't deletable
    if (!window.confirm(`Delete variant "${name}"?`)) return;
    const variants = omitKey(store.variants, name) as Record<string, Variant>;
    let active = store.active;
    if (active === name) {
      active = orderedNames(variants)[0] || "Invoices";
      if (!variants[active]) variants[active] = clonePreset("Invoices");
    }
    commitStore({ active, variants });
    if (store.active === name) resetView();
  };

  const openVariant = (name: string) => { switchPreset(name); setTab("records"); };

  // toolbar shortcuts (Records tab)
  const addVariant = () => {
    const raw = window.prompt(`New variant name (max ${MAX_VARIANTS} total):`);
    if (createVariant(raw)) setShowSchema(true);
  };
  const deleteVariant = () => deleteVariantByName(preset);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const editCell = (rowIdx: number, key: string, value: string | number) => {
    commit({ rows: rows.map((r, i) => (i === rowIdx ? { ...r, [key]: value } : r)) });
  };

  const addRow = () => {
    const blank: Row = {};
    columns.forEach((c) => { blank[c.key] = c.type === "status" ? (c.options?.[0] ?? "") : ""; });
    commit({ rows: [...rows, blank] });
  };

  const deleteRow = (rowIdx: number) => {
    // rowIdx is the index in the unfiltered rows array (passed from the rendered row)
    commit({ rows: rows.filter((_, i) => i !== rowIdx) });
  };

  const addColumn = () => {
    if (!newCol.label.trim()) return;
    const used = new Set(columns.map((c) => c.key));
    let key = slug(newCol.label);
    while (used.has(key)) key += "_";
    const col: Column = { key, label: newCol.label.trim(), type: newCol.type as Column["type"] };
    if (newCol.type === "status") col.options = ["New", "Done"];
    commit({
      columns: [...columns, col],
      rows: rows.map((r) => ({ ...r, [key]: newCol.type === "status" ? "New" : "" })),
    });
    setNewCol({ label: "", type: "text" });
  };

  const renameColumn = (key: string, label: string) =>
    commit({ columns: columns.map((c) => (c.key === key ? { ...c, label } : c)) });

  const deleteColumn = (key: string) =>
    commit({
      columns: columns.filter((c) => c.key !== key),
      rows: rows.map((r) => omitKey(r, key) as Row),
    });

  // Move the column at `from` to index `to` (drag-to-reorder in the schema editor).
  const moveColumn = (from: number | null, to: number | null) => {
    if (from === to || from == null || to == null) return;
    const next = [...columns];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    commit({ columns: next });
  };

  // Map a row object back to its index in `rows` for edit/delete on the filtered view.
  const rowIndex = (row: Row) => rows.indexOf(row);

  return (
    <div className="rec-page">

      <main className="rec-main">
        <div className="rec-titleblock">
          <p className="rec-kicker">React · CSV</p>
          <h1 className="rec-title">Records</h1>
        </div>

        <div className="rec-tabs">
          <button
            className={"rec-tab" + (tab === "records" ? " is-active" : "")}
            onClick={() => setTab("records")}
          >Records</button>
          <button
            className={"rec-tab" + (tab === "variants" ? " is-active" : "")}
            onClick={() => setTab("variants")}
          >Variants</button>
        </div>

        {tab === "records" && (
        <div className="rec-card">
          <div className="rec-toolbar">
            <select className="rec-select" value={preset} onChange={(e) => switchPreset(e.target.value)}>
              {variantNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>

            <button
              className="rec-btn"
              onClick={addVariant}
              disabled={variantNames.length >= MAX_VARIANTS}
              title={variantNames.length >= MAX_VARIANTS ? `Limit of ${MAX_VARIANTS} variants` : "Create a new variant"}
            >
              + New
            </button>

            {!PRESET_NAMES.includes(preset) && (
              <button className="rec-btn" onClick={deleteVariant} title="Delete this variant">Delete</button>
            )}

            <input
              className="rec-search"
              placeholder="Search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            {statusCol && (
              <select className="rec-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">All status</option>
                {(statusCol.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            )}

            <div className="rec-toolbar-spacer" />

            <button className="rec-btn" onClick={() => setShowSchema((v) => !v)}>
              {showSchema ? "Done" : "Columns"}
            </button>
            <button className="rec-btn" onClick={() => window.print()}>Print</button>
            <button className="rec-btn rec-btn--primary" onClick={() => downloadCSV(columns, view, preset)}>
              Export CSV
            </button>
          </div>

          {showSchema && (
            <div className="rec-schema">
              <div className="rec-schema-list">
                {columns.map((c, i) => (
                  <div
                    className={
                      "rec-schema-row"
                      + (dragIdx === i ? " is-dragging" : "")
                      + (overIdx === i && dragIdx !== i ? " is-over" : "")
                    }
                    key={c.key}
                    onDragOver={(e) => { e.preventDefault(); setOverIdx(i); }}
                    onDrop={(e) => { e.preventDefault(); moveColumn(dragIdx, i); setDragIdx(null); setOverIdx(null); }}
                  >
                    <span
                      className="rec-drag"
                      aria-label="drag to reorder"
                      draggable
                      onDragStart={() => setDragIdx(i)}
                      onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
                    >⠿</span>
                    <input
                      className="rec-schema-name"
                      value={c.label}
                      onChange={(e) => renameColumn(c.key, e.target.value)}
                    />
                    <span className="rec-schema-type">{c.type}</span>
                    <button className="rec-x" onClick={() => deleteColumn(c.key)} aria-label="delete column">×</button>
                  </div>
                ))}
              </div>
              <div className="rec-schema-add">
                <input
                  className="rec-schema-name"
                  placeholder="New column"
                  value={newCol.label}
                  onChange={(e) => setNewCol((s) => ({ ...s, label: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addColumn()}
                />
                <select
                  className="rec-select"
                  value={newCol.type}
                  onChange={(e) => setNewCol((s) => ({ ...s, type: e.target.value }))}
                >
                  {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <button className="rec-btn" onClick={addColumn}>Add</button>
              </div>
            </div>
          )}

          <div className="rec-table-wrap">
            <table className="rec-table">
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th key={c.key} onClick={() => toggleSort(c.key)}>
                      {c.label}
                      <span className="rec-sort">{sortKey === c.key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}</span>
                    </th>
                  ))}
                  <th className="rec-th-actions" />
                </tr>
              </thead>
              <tbody>
                {view.map((row) => {
                  const idx = rowIndex(row);
                  return (
                    <tr key={idx}>
                      {columns.map((c) => (
                        <td key={c.key}>
                          {c.type === "status" ? (
                            <select
                              className="rec-chip-select"
                              value={row[c.key] ?? ""}
                              style={{ background: statusStyle(c, row[c.key]).bg, color: statusStyle(c, row[c.key]).fg }}
                              onChange={(e) => editCell(idx, c.key, e.target.value)}
                            >
                              {(c.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                          ) : (
                            <input
                              className="rec-cell"
                              type={c.type === "number" ? "number" : c.type === "date" ? "date" : "text"}
                              value={row[c.key] ?? ""}
                              onChange={(e) => editCell(idx, c.key, e.target.value)}
                            />
                          )}
                        </td>
                      ))}
                      <td className="rec-td-actions">
                        <button className="rec-x" onClick={() => deleteRow(idx)} aria-label="delete row">×</button>
                      </td>
                    </tr>
                  );
                })}
                {view.length === 0 && (
                  <tr><td className="rec-empty" colSpan={columns.length + 1}>No records.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="rec-footer">
            <button className="rec-btn" onClick={addRow}>+ Add row</button>
            <span className="rec-count">{view.length} of {rows.length} shown</span>
          </div>
        </div>
        )}

        {tab === "variants" && (
        <div className="rec-card">
          <div className="rec-toolbar">
            <button
              className="rec-btn rec-btn--primary"
              onClick={() => createVariant(window.prompt(`New variant name (max ${MAX_VARIANTS} total):`))}
              disabled={variantNames.length >= MAX_VARIANTS}
              title={variantNames.length >= MAX_VARIANTS ? `Limit of ${MAX_VARIANTS} variants` : "Create a new variant"}
            >+ New variant</button>
            <div className="rec-toolbar-spacer" />
            <span className="rec-count">{variantNames.length} / {MAX_VARIANTS}</span>
          </div>

          <div className="rec-table-wrap">
            <table className="rec-table">
              <thead>
                <tr>
                  <th>Variant</th>
                  <th>Type</th>
                  <th>Columns</th>
                  <th>Rows</th>
                  <th className="rec-th-actions" />
                </tr>
              </thead>
              <tbody>
                {variantNames.map((name) => {
                  const v = store.variants[name];
                  const builtin = PRESET_NAMES.includes(name);
                  return (
                    <tr key={name} className={name === preset ? "is-current" : ""}>
                      <td className="rec-vname">
                        {name}{name === preset && <span className="rec-badge">active</span>}
                      </td>
                      <td className="rec-muted">{builtin ? "Preset" : "Custom"}</td>
                      <td className="rec-muted">{v.columns.length}</td>
                      <td className="rec-muted">{v.rows.length}</td>
                      <td className="rec-td-actions rec-row-actions">
                        <button className="rec-btn rec-btn--sm" onClick={() => openVariant(name)}>Open</button>
                        <button className="rec-btn rec-btn--sm" onClick={() => duplicateVariant(name)}>Duplicate</button>
                        <button
                          className="rec-btn rec-btn--sm"
                          onClick={() => renameVariant(name)}
                          disabled={builtin}
                          title={builtin ? "Presets can't be renamed" : "Rename"}
                        >Rename</button>
                        <button
                          className="rec-btn rec-btn--sm"
                          onClick={() => deleteVariantByName(name)}
                          disabled={builtin}
                          title={builtin ? "Presets can't be deleted" : "Delete"}
                        >Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        )}

        <p className="rec-tip">
          {tab === "records"
            ? "Define columns, add rows, filter and sort, then export to CSV — all stored locally."
            : "Create, rename, duplicate, or delete variants. Presets are protected; custom variants are fully editable."}
        </p>
      </main>
    </div>
  );
};

export default Records;