import type { NodeKind, EdgeLayer } from "./model";

export type ThemeMode = "system" | "light" | "dark";

export interface ThemeColors {
  bg: string;
  bgPanel: string;
  bgOverlay: string;
  text: string;
  textMuted: string;
  border: string;
  accent: string;
  accentGlow: string;
}

export const LIGHT_THEME: ThemeColors = {
  bg: "#f8fafc",
  bgPanel: "rgba(255,255,255,0.85)",
  bgOverlay: "rgba(255,255,255,0.95)",
  text: "#0f172a",
  textMuted: "#64748b",
  border: "rgba(15,23,42,0.1)",
  accent: "#6366f1",
  accentGlow: "rgba(99,102,241,0.3)",
};

export const DARK_THEME: ThemeColors = {
  bg: "#0b0f14",
  bgPanel: "rgba(15,20,30,0.85)",
  bgOverlay: "rgba(15,20,30,0.95)",
  text: "#e2e8f0",
  textMuted: "#94a3b8",
  border: "rgba(226,232,240,0.1)",
  accent: "#818cf8",
  accentGlow: "rgba(129,140,248,0.4)",
};

const NODE_COLORS: Record<NodeKind, string> = {
  wildcard: "#f59e0b",
  user: "#3b82f6",
  group: "#8b5cf6",
  tag: "#10b981",
  autogroup: "#06b6d4",
  ipset: "#ec4899",
  svc: "#f97316",
  ip: "#64748b",
  cidr: "#78716c",
  range: "#a8a29e",
  host: "#6366f1",
  unknown: "#94a3b8",
};

const NODE_SHAPES: Record<NodeKind, string> = {
  wildcard: "circle",
  user: "circle",
  group: "rect",
  tag: "diamond",
  autogroup: "hexagon",
  ipset: "rect",
  svc: "triangle",
  ip: "triangle",
  cidr: "triangle",
  range: "triangle",
  host: "rect",
  unknown: "circle",
};

const EDGE_LAYER_COLORS: Record<EdgeLayer, string> = {
  acl: "#3b82f6",
  grant: "#10b981",
  ssh: "#f59e0b",
  test: "#ef4444",
  tagOwner: "#8b5cf6",
  groupMember: "#64748b",
  hostAlias: "#6366f1",
};

const PROTO_COLORS: Record<string, string> = {
  tcp: "#22d3ee",
  udp: "#a78bfa",
  icmp: "#fbbf24",
  any: "#94a3b8",
};

export function nodeColor(kind: NodeKind): string {
  return NODE_COLORS[kind] ?? NODE_COLORS.unknown;
}

export function nodeShape(kind: NodeKind): string {
  return NODE_SHAPES[kind] ?? "circle";
}

export function edgeLayerColor(layer: EdgeLayer): string {
  return EDGE_LAYER_COLORS[layer] ?? EDGE_LAYER_COLORS.acl;
}

export function protoColor(proto: string | null): string {
  if (!proto) return PROTO_COLORS.any;
  const p = proto.toLowerCase();
  if (p.includes("tcp")) return PROTO_COLORS.tcp;
  if (p.includes("udp")) return PROTO_COLORS.udp;
  if (p.includes("icmp")) return PROTO_COLORS.icmp;
  return PROTO_COLORS.any;
}

export function edgeColor(layer: EdgeLayer, protos: string[]): string {
  if (layer === "acl" || layer === "grant") {
    if (protos.length === 1) return protoColor(protos[0]);
    if (protos.length > 1) return "#94a3b8";
  }
  return edgeLayerColor(layer);
}

export function nodeKindLabel(kind: NodeKind): string {
  const labels: Record<NodeKind, string> = {
    wildcard: "Wildcard",
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
    unknown: "Unknown",
  };
  return labels[kind] ?? "Unknown";
}

export function layerLabel(layer: EdgeLayer): string {
  const labels: Record<EdgeLayer, string> = {
    acl: "ACL",
    grant: "Grant",
    ssh: "SSH",
    test: "Test",
    tagOwner: "Tag Owner",
    groupMember: "Membership",
    hostAlias: "Host Alias",
  };
  return labels[layer] ?? layer;
}
