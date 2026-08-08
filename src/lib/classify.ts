export type SelectorType =
  | "wildcard"
  | "user"
  | "group"
  | "tag"
  | "autogroup"
  | "ipset"
  | "svc"
  | "ip"
  | "cidr"
  | "range"
  | "host"
  | "unknown";

const IPV4_RE = /^(\d{1,3}\.){3}\d{1,3}$/;
const CIDR4_RE = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
const IPV6_RE = /^\[?[0-9a-fA-F:]+\]?:\d+$/;
const CIDR6_RE = /^[0-9a-fA-F:]+\/\d{1,3}$/;
const RANGE_RE = /^(\d{1,3}\.){3}\d{1,3}-(\d{1,3}\.){3}\d{1,3}$/;
const USER_RE = /^[^\s@]+@[^\s@]+$/;

export function classifySelector(sel: string): SelectorType {
  const s = sel.trim();
  if (!s) return "unknown";
  if (s === "*") return "wildcard";
  if (s.startsWith("group:")) return "group";
  if (s.startsWith("tag:")) return "tag";
  if (s.startsWith("autogroup:")) return "autogroup";
  if (s.startsWith("ipset:")) return "ipset";
  if (s.startsWith("svc:")) return "svc";
  if (s.startsWith("user:")) return "user";
  if (RANGE_RE.test(s)) return "range";
  if (CIDR4_RE.test(s) || CIDR6_RE.test(s)) return "cidr";
  if (IPV4_RE.test(s)) return "ip";
  if (IPV6_RE.test(s)) return "ip";
  if (USER_RE.test(s)) return "user";
  if (/^[a-zA-Z0-9._-]+$/.test(s) && !s.includes("@")) return "host";
  return "unknown";
}

export function selectorLabel(sel: string): string {
  const s = sel.trim();
  if (s === "*") return "*";
  if (s.startsWith("group:")) return s.slice(6);
  if (s.startsWith("tag:")) return s.slice(4);
  if (s.startsWith("autogroup:")) return s.slice(10);
  if (s.startsWith("ipset:")) return s.slice(6);
  if (s.startsWith("svc:")) return s.slice(4);
  if (s.startsWith("user:")) return s.slice(5);
  return s;
}

export function isSourceLike(sel: string): boolean {
  const t = classifySelector(sel);
  return t === "user" || t === "group" || t === "autogroup" || t === "wildcard";
}

export function isDestLike(sel: string): boolean {
  const t = classifySelector(sel);
  return t === "tag" || t === "host" || t === "ip" || t === "cidr" || t === "svc" || t === "autogroup";
}
