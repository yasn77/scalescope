import { classifySelector, selectorLabel, type SelectorType } from "./classify";
import { parseDstEntry, parseIpCapability, type DstEntry } from "./ports";

export type NodeKind = SelectorType;

export interface GraphNode {
  id: string;
  label: string;
  kind: NodeKind;
  raw: string;
  members?: string[];
  resolved?: string;
}

export type EdgeLayer = "acl" | "grant" | "ssh" | "test" | "tagOwner" | "groupMember" | "hostAlias";

export interface EdgeRule {
  layer: EdgeLayer;
  index: number;
  raw: string;
  action?: string;
  ports?: string;
  proto?: string;
  users?: string[];
  via?: string[];
  app?: Record<string, unknown>;
  srcPosture?: string[];
  accept?: boolean;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  layer: EdgeLayer;
  rules: EdgeRule[];
  ports: string[];
  protos: string[];
}

export interface GraphModel {
  nodes: GraphNode[];
  edges: GraphEdge[];
  warnings: string[];
}

export interface PolicyData {
  acls?: unknown[];
  grants?: unknown[];
  ssh?: unknown[];
  tests?: unknown[];
  groups?: Record<string, string[]>;
  hosts?: Record<string, string>;
  ipsets?: Record<string, string[]>;
  tagOwners?: Record<string, string[]>;
  autoApprovers?: Record<string, unknown>;
  nodeAttrs?: unknown[];
  postures?: Record<string, string[]>;
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function asRecord(v: unknown): Record<string, unknown> | null {
  if (typeof v === "object" && v !== null && !Array.isArray(v)) return v as Record<string, unknown>;
  return null;
}

function asStringArray(v: unknown): string[] {
  return asArray(v).filter((x): x is string => typeof x === "string");
}

function addNode(map: Map<string, GraphNode>, raw: string, members?: string[], resolved?: string): GraphNode {
  const id = raw;
  if (map.has(id)) {
    const existing = map.get(id)!;
    if (members) existing.members = members;
    if (resolved) existing.resolved = resolved;
    return existing;
  }
  const node: GraphNode = {
    id,
    label: selectorLabel(raw),
    kind: classifySelector(raw),
    raw,
    members,
    resolved,
  };
  map.set(id, node);
  return node;
}

function addEdge(
  map: Map<string, GraphEdge>,
  source: string,
  target: string,
  layer: EdgeLayer,
  rule: EdgeRule
): void {
  const key = `${source}\u0000${target}\u0000${layer}`;
  if (map.has(key)) {
    const edge = map.get(key)!;
    edge.rules.push(rule);
    if (rule.ports) edge.ports.push(rule.ports);
    if (rule.proto) edge.protos.push(rule.proto);
  } else {
    map.set(key, {
      id: key,
      source,
      target,
      layer,
      rules: [rule],
      ports: rule.ports ? [rule.ports] : [],
      protos: rule.proto ? [rule.proto] : [],
    });
  }
}

export function buildGraphModel(data: Record<string, unknown>): GraphModel {
  const policy = data as PolicyData;
  const nodeMap = new Map<string, GraphNode>();
  const edgeMap = new Map<string, GraphEdge>();
  const warnings: string[] = [];

  const groups = policy.groups ?? {};
  const hosts = policy.hosts ?? {};
  const ipsets = policy.ipsets ?? {};
  const tagOwners = policy.tagOwners ?? {};

  for (const [groupName, members] of Object.entries(groups)) {
    addNode(nodeMap, groupName, members);
    for (const member of asStringArray(members)) {
      addNode(nodeMap, member);
      addEdge(edgeMap, groupName, member, "groupMember", {
        layer: "groupMember",
        index: 0,
        raw: `${groupName} → ${member}`,
      });
    }
  }

  for (const [alias, target] of Object.entries(hosts)) {
    if (alias.includes("@")) {
      warnings.push(`Host alias "${alias}" contains '@' which is not allowed`);
    }
    addNode(nodeMap, alias, undefined, typeof target === "string" ? target : undefined);
    if (typeof target === "string") {
      addNode(nodeMap, target);
      addEdge(edgeMap, alias, target, "hostAlias", {
        layer: "hostAlias",
        index: 0,
        raw: `${alias} = ${target}`,
      });
    }
  }

  for (const [setName, members] of Object.entries(ipsets)) {
    addNode(nodeMap, `ipset:${setName}`, members);
    for (const member of asStringArray(members)) {
      addNode(nodeMap, member);
      addEdge(edgeMap, `ipset:${setName}`, member, "groupMember", {
        layer: "groupMember",
        index: 0,
        raw: `ipset:${setName} → ${member}`,
      });
    }
  }

  for (const [tag, owners] of Object.entries(tagOwners)) {
    if (!tag.startsWith("tag:")) {
      warnings.push(`tagOwners key "${tag}" does not start with "tag:"`);
    }
    addNode(nodeMap, tag);
    for (const owner of asStringArray(owners)) {
      addNode(nodeMap, owner);
      addEdge(edgeMap, owner, tag, "tagOwner", {
        layer: "tagOwner",
        index: 0,
        raw: `${owner} owns ${tag}`,
      });
    }
  }

  const acls = asArray(policy.acls);
  acls.forEach((rule, idx) => {
    const r = asRecord(rule);
    if (!r) return;
    const srcs = asStringArray(r.src);
    const dsts = asStringArray(r.dst);
    const proto = typeof r.proto === "string" ? r.proto : undefined;
    const action = typeof r.action === "string" ? r.action : undefined;
    for (const src of srcs) {
      addNode(nodeMap, src);
      for (const dst of dsts) {
        const parsed: DstEntry = parseDstEntry(dst);
        if (parsed.ports.kind === "all" && !dst.endsWith(":*") && !dst.endsWith("*")) {
          warnings.push(`ACL rule #${idx}: could not parse port from "${dst}", treating as wildcard`);
        }
        addNode(nodeMap, parsed.host);
        const portSummary = parsed.ports.raw;
        addEdge(edgeMap, src, parsed.host, "acl", {
          layer: "acl",
          index: idx,
          raw: dst,
          action,
          ports: portSummary,
          proto,
        });
      }
    }
  });

  const grants = asArray(policy.grants);
  grants.forEach((rule, idx) => {
    const r = asRecord(rule);
    if (!r) return;
    const srcs = asStringArray(r.src);
    const dsts = asStringArray(r.dst);
    const ipCaps = asStringArray(r.ip);
    const via = asStringArray(r.via);
    const srcPosture = asStringArray(r.srcPosture);
    const app = asRecord(r.app) ?? undefined;
    for (const src of srcs) {
      addNode(nodeMap, src);
      for (const dst of dsts) {
        addNode(nodeMap, dst);
        const caps = ipCaps.map(parseIpCapability);
        for (const cap of caps) {
          addEdge(edgeMap, src, dst, "grant", {
            layer: "grant",
            index: idx,
            raw: cap.raw,
            ports: cap.raw,
            proto: cap.proto ?? "any",
            via: via.length ? via : undefined,
            srcPosture: srcPosture.length ? srcPosture : undefined,
            app,
          });
        }
        if (caps.length === 0) {
          addEdge(edgeMap, src, dst, "grant", {
            layer: "grant",
            index: idx,
            raw: `${src} → ${dst}`,
            ports: "*",
            proto: "any",
            via: via.length ? via : undefined,
            srcPosture: srcPosture.length ? srcPosture : undefined,
            app,
          });
        }
      }
    }
  });

  const sshRules = asArray(policy.ssh);
  sshRules.forEach((rule, idx) => {
    const r = asRecord(rule);
    if (!r) return;
    const srcs = asStringArray(r.src);
    const dsts = asStringArray(r.dst);
    const users = asStringArray(r.users);
    const action = typeof r.action === "string" ? r.action : undefined;
    for (const src of srcs) {
      addNode(nodeMap, src);
      for (const dst of dsts) {
        addNode(nodeMap, dst);
        addEdge(edgeMap, src, dst, "ssh", {
          layer: "ssh",
          index: idx,
          raw: `${src} → ${dst}`,
          action,
          users,
        });
      }
    }
  });

  const tests = asArray(policy.tests);
  tests.forEach((test, idx) => {
    const t = asRecord(test);
    if (!t) return;
    const src = typeof t.src === "string" ? t.src : null;
    if (!src) return;
    addNode(nodeMap, src);
    const accepts = asStringArray(t.accept);
    const denies = asStringArray(t.deny);
    const proto = typeof t.proto === "string" ? t.proto : undefined;
    for (const dst of accepts) {
      const parsed = parseDstEntry(dst);
      addNode(nodeMap, parsed.host);
      addEdge(edgeMap, src, parsed.host, "test", {
        layer: "test",
        index: idx,
        raw: `accept: ${dst}`,
        proto,
        ports: parsed.ports.raw,
        accept: true,
      });
    }
    for (const dst of denies) {
      const parsed = parseDstEntry(dst);
      addNode(nodeMap, parsed.host);
      addEdge(edgeMap, src, parsed.host, "test", {
        layer: "test",
        index: idx,
        raw: `deny: ${dst}`,
        proto,
        ports: parsed.ports.raw,
        accept: false,
      });
    }
  });

  return {
    nodes: Array.from(nodeMap.values()),
    edges: Array.from(edgeMap.values()),
    warnings,
  };
}
