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
const IPV6_BRACKETED_RE = /^\[[0-9a-fA-F:]+\]$/;
const IPV6_BARE_RE = /^[0-9a-fA-F:]+$/;
const CIDR6_RE = /^[0-9a-fA-F:]+\/\d{1,3}$/;
const RANGE_RE = /^(\d{1,3}\.){3}\d{1,3}-(\d{1,3}\.){3}\d{1,3}$/;
const USER_RE = /^[^\s@]+@[^\s@]+$/;

function isValidIPv4(s: string): boolean {
  const parts = s.split(".");
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    const n = Number(p);
    return !isNaN(n) && n >= 0 && n <= 255;
  });
}

function isValidCIDR4(s: string): boolean {
  const [ip, prefix] = s.split("/");
  return isValidIPv4(ip) && Number(prefix) >= 0 && Number(prefix) <= 32;
}

function isValidIPv6(s: string): boolean {
  if (!s.includes(":")) return false;
  if (s === "::") return true;
  if (s.includes(":::")) return false;
  const hasDoubleColon = s.includes("::");
  const parts = s.split(":");
  if (!hasDoubleColon && parts.length !== 8) return false;
  if (parts.length < 2 || parts.length > 9) return false;
  for (const part of parts) {
    if (part === "") continue;
    if (!/^[0-9a-fA-F]{1,4}$/.test(part)) return false;
  }
  return true;
}

function isValidCIDR6(s: string): boolean {
  const [ip, prefix] = s.split("/");
  return isValidIPv6(ip) && Number(prefix) >= 0 && Number(prefix) <= 128;
}

function isValidRange(s: string): boolean {
  const [a, b] = s.split("-");
  return isValidIPv4(a) && isValidIPv4(b);
}

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
  if (RANGE_RE.test(s) && isValidRange(s)) return "range";
  if (RANGE_RE.test(s)) return "unknown";
  if (CIDR4_RE.test(s) && isValidCIDR4(s)) return "cidr";
  if (CIDR4_RE.test(s)) return "unknown";
  if (CIDR6_RE.test(s) && isValidCIDR6(s)) return "cidr";
  if (CIDR6_RE.test(s)) return "unknown";
  if (IPV4_RE.test(s) && isValidIPv4(s)) return "ip";
  if (IPV4_RE.test(s)) return "unknown";
  if (IPV6_BRACKETED_RE.test(s)) {
    const inner = s.slice(1, -1);
    if (isValidIPv6(inner)) return "ip";
    return "unknown";
  }
  if (IPV6_BARE_RE.test(s) && isValidIPv6(s)) return "ip";
  if (IPV6_BARE_RE.test(s)) return "unknown";
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
