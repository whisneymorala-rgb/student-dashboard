// Static, client-safe metadata about each connector — no fetchStudents
// implementations here, so this file can be imported from "use client"
// components without bundling server-only network code.
export interface ConnectorMeta {
  id: "teachable" | "thinkific" | "csv" | "manual";
  label: string;
  configFields: { key: string; label: string; secret?: boolean }[];
}

export const connectorMeta: ConnectorMeta[] = [
  {
    id: "manual",
    label: "Manual entry (no platform connection)",
    configFields: [],
  },
  {
    id: "csv",
    label: "CSV upload (any platform)",
    configFields: [],
  },
  {
    id: "teachable",
    label: "Teachable",
    configFields: [{ key: "apiKey", label: "Teachable API key", secret: true }],
  },
  {
    id: "thinkific",
    label: "Thinkific",
    configFields: [
      { key: "apiKey", label: "Thinkific API key", secret: true },
      { key: "subdomain", label: "Thinkific subdomain (e.g. yourschool)" },
    ],
  },
];
