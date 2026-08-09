import type { NodeKind } from "./model";

interface IconSpec {
  path: string;
  viewBox: string;
  size: number;
}

const ICONS: Record<NodeKind, IconSpec> = {
  user: {
    path: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
    viewBox: "0 0 24 24",
    size: 28,
  },
  group: {
    path: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
    viewBox: "0 0 24 24",
    size: 28,
  },
  tag: {
    path: "M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z",
    viewBox: "0 0 24 24",
    size: 28,
  },
  autogroup: {
    path: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z",
    viewBox: "0 0 24 24",
    size: 28,
  },
  ipset: {
    path: "M3 5v14h18V5H3zm16 12H5V7h14v10zm-2-8H7v2h10V9zm0 4H7v2h10v-2z",
    viewBox: "0 0 24 24",
    size: 28,
  },
  svc: {
    path: "M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z",
    viewBox: "0 0 24 24",
    size: 28,
  },
  ip: {
    path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z",
    viewBox: "0 0 24 24",
    size: 28,
  },
  cidr: {
    path: "M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2zM7 4h2v16H7V4zm8 0h2v16h-2V4z",
    viewBox: "0 0 24 24",
    size: 28,
  },
  range: {
    path: "M7 7h10v2H7V7zm0 4h10v2H7v-2zm0 4h10v2H7v-2zM4 4h2v16H4V4zm14 0h2v16h-2V4z",
    viewBox: "0 0 24 24",
    size: 28,
  },
  host: {
    path: "M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2zM6 2h12v3H6V2zm0 17h12v3H6v-3z",
    viewBox: "0 0 24 24",
    size: 28,
  },
  wildcard: {
    path: "M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6L12 2z",
    viewBox: "0 0 24 24",
    size: 28,
  },
  unknown: {
    path: "M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z",
    viewBox: "0 0 24 24",
    size: 28,
  },
};

export function getIcon(kind: NodeKind): IconSpec {
  return ICONS[kind] ?? ICONS.unknown;
}

export function getIconLabel(kind: NodeKind): string {
  const labels: Record<NodeKind, string> = {
    user: "User",
    group: "Group",
    tag: "Tag",
    autogroup: "Autogroup",
    ipset: "IP Set",
    svc: "Service",
    ip: "IP",
    cidr: "CIDR",
    range: "Range",
    host: "Host",
    wildcard: "Wildcard",
    unknown: "Unknown",
  };
  return labels[kind] ?? "Unknown";
}
