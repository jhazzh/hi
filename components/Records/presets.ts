// Preset schemas + seed rows for the dynamic records manager.
// Each column: { key, label, type, options? }  type ∈ text|number|date|status
// `options` lists the allowed chips for a status column.

export type ColType = "text" | "number" | "date" | "status";
export type Column = { key: string; label: string; type: ColType; options?: string[] };
export type Row = Record<string, string | number>;
export type Variant = { columns: Column[]; rows: Row[] };
export type Preset = { name: string; columns: Column[]; rows: Row[] };

export const INVOICES: Preset = {
  name: "Invoices",
  columns: [
    { key: "no", label: "No.", type: "text" },
    { key: "client", label: "Client", type: "text" },
    { key: "amount", label: "Amount", type: "number" },
    { key: "due", label: "Due", type: "date" },
    { key: "status", label: "Status", type: "status", options: ["Draft", "Sent", "Paid"] },
  ],
  rows: [
    { no: "INV-1001", client: "Aurora Studio", amount: 1200, due: "2026-07-02", status: "Sent" },
    { no: "INV-1002", client: "Bluepeak Co", amount: 540, due: "2026-06-28", status: "Paid" },
    { no: "INV-1003", client: "Cobalt Labs", amount: 3150, due: "2026-07-15", status: "Draft" },
    { no: "INV-1004", client: "Dune & Co", amount: 880, due: "2026-06-20", status: "Paid" },
    { no: "INV-1005", client: "Evergreen", amount: 2090, due: "2026-07-09", status: "Sent" },
  ],
};

export const TICKETS: Preset = {
  name: "Tickets",
  columns: [
    { key: "id", label: "ID", type: "text" },
    { key: "subject", label: "Subject", type: "text" },
    { key: "assignee", label: "Assignee", type: "text" },
    { key: "created", label: "Created", type: "date" },
    { key: "status", label: "Status", type: "status", options: ["Open", "Pending", "Closed"] },
  ],
  rows: [
    { id: "T-41", subject: "Login redirect loop", assignee: "Mia", created: "2026-06-10", status: "Open" },
    { id: "T-42", subject: "Slow PLP filter", assignee: "Jon", created: "2026-06-12", status: "Pending" },
    { id: "T-43", subject: "Checkout typo", assignee: "Mia", created: "2026-06-14", status: "Closed" },
    { id: "T-44", subject: "RTL spacing", assignee: "Sara", created: "2026-06-16", status: "Open" },
  ],
};

export const INVENTORY: Preset = {
  name: "Inventory",
  columns: [
    { key: "sku", label: "SKU", type: "text" },
    { key: "item", label: "Item", type: "text" },
    { key: "qty", label: "Qty", type: "number" },
    { key: "price", label: "Price", type: "number" },
    { key: "status", label: "Status", type: "status", options: ["In stock", "Low", "Out"] },
  ],
  rows: [
    { sku: "MAT-Q", item: "Queen Mattress", qty: 24, price: 699, status: "In stock" },
    { sku: "MAT-K", item: "King Mattress", qty: 3, price: 899, status: "Low" },
    { sku: "PIL-2", item: "Pillow 2-pack", qty: 0, price: 49, status: "Out" },
    { sku: "FRM-Q", item: "Queen Frame", qty: 11, price: 320, status: "In stock" },
  ],
};

export const PRESETS = { Invoices: INVOICES, Tickets: TICKETS, Inventory: INVENTORY };
export const PRESET_NAMES = ["Invoices", "Tickets", "Inventory"];

// Chip color per status label (cycles through the palette by index within its column).
export const STATUS_COLORS = [
  { bg: "#EAF0FB", fg: "oklch(0.45 0.13 256)" }, // blue
  { bg: "#FBF3E6", fg: "#8a5a1f" },              // amber
  { bg: "#E9F4EC", fg: "#2f6b42" },              // green
  { bg: "#F2F0E9", fg: "#6E6A60" },              // neutral
];