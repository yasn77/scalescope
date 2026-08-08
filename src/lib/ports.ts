export interface PortSpec {
  kind: "all" | "single" | "range" | "list";
  ports: number[];
  raw: string;
}

export interface DstEntry {
  host: string;
  ports: PortSpec;
  raw: string;
}

export interface IpCapability {
  proto: string | null;
  port: PortSpec;
  raw: string;
}

function parsePortList(s: string): PortSpec {
  const raw = s.trim();
  if (raw === "*") return { kind: "all", ports: [], raw };
  const parts = raw.split(",").map((p) => p.trim());
  if (parts.length > 1) {
    const ports: number[] = [];
    for (const p of parts) {
      if (p.includes("-")) {
        const [a, b] = p.split("-").map(Number);
        if (!isNaN(a) && !isNaN(b)) ports.push(a, b);
      } else {
        const n = Number(p);
        if (!isNaN(n)) ports.push(n);
      }
    }
    return { kind: "list", ports, raw };
  }
  const single = parts[0];
  if (single.includes("-")) {
    const [a, b] = single.split("-").map(Number);
    if (!isNaN(a) && !isNaN(b)) return { kind: "range", ports: [a, b], raw };
  }
  const n = Number(single);
  if (!isNaN(n)) return { kind: "single", ports: [n], raw };
  return { kind: "all", ports: [], raw };
}

function isPortLike(s: string): boolean {
  if (s === "*") return true;
  if (/^\d+$/.test(s)) return true;
  if (/^\d+(-\d+)?$/.test(s)) return true;
  if (/^\d+(,\d+)*(-\d+)?$/.test(s)) return true;
  return false;
}

export function parseDstEntry(entry: string): DstEntry {
  const raw = entry.trim();
  let host: string;
  let portStr: string;

  if (raw.startsWith("[")) {
    const closeBracket = raw.indexOf("]");
    if (closeBracket === -1) {
      return { host: raw, ports: { kind: "all", ports: [], raw: "*" }, raw };
    }
    host = raw.slice(0, closeBracket + 1);
    const rest = raw.slice(closeBracket + 1);
    portStr = rest.startsWith(":") ? rest.slice(1) : "*";
  } else {
    const lastColon = raw.lastIndexOf(":");
    if (lastColon === -1) {
      return { host: raw, ports: { kind: "all", ports: [], raw: "*" }, raw };
    }
    const candidateHost = raw.slice(0, lastColon);
    const candidatePort = raw.slice(lastColon + 1);
    if (isPortLike(candidatePort)) {
      host = candidateHost;
      portStr = candidatePort;
    } else {
      return { host: raw, ports: { kind: "all", ports: [], raw: "*" }, raw };
    }
  }

  return { host, ports: parsePortList(portStr), raw };
}

export function parseIpCapability(entry: string): IpCapability {
  const raw = entry.trim();
  if (raw === "*") {
    return { proto: null, port: { kind: "all", ports: [], raw: "*" }, raw };
  }
  const colonIdx = raw.indexOf(":");
  if (colonIdx === -1) {
    return { proto: null, port: parsePortList(raw), raw };
  }
  const proto = raw.slice(0, colonIdx).toLowerCase();
  const portStr = raw.slice(colonIdx + 1);
  return { proto, port: parsePortList(portStr), raw };
}

export function portSpecSummary(ps: PortSpec): string {
  if (ps.kind === "all") return "*";
  return ps.raw;
}

export function ipCapSummary(cap: IpCapability): string {
  const proto = cap.proto ? `${cap.proto}:` : "";
  return `${proto}${portSpecSummary(cap.port)}`;
}
