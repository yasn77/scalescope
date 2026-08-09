import { describe, it, expect } from "vitest";
import { buildGraphModel } from "../src/lib/model";

describe("buildGraphModel", () => {
  it("builds model from allow-all policy", () => {
    const data = {
      acls: [
        {
          action: "accept",
          src: ["*"],
          dst: ["*:*"],
        },
      ],
    };
    const model = buildGraphModel(data);
    expect(model.nodes.length).toBeGreaterThan(0);
    expect(model.edges.length).toBeGreaterThan(0);
    const wildcardNode = model.nodes.find((n) => n.id === "*");
    expect(wildcardNode).toBeDefined();
    expect(wildcardNode?.kind).toBe("wildcard");
  });

  it("builds model from tag-based policy", () => {
    const data = {
      acls: [
        {
          action: "accept",
          src: ["tag:frontend"],
          dst: ["tag:backend:*"],
        },
      ],
    };
    const model = buildGraphModel(data);
    const frontendNode = model.nodes.find((n) => n.id === "tag:frontend");
    const backendNode = model.nodes.find((n) => n.id === "tag:backend");
    expect(frontendNode).toBeDefined();
    expect(backendNode).toBeDefined();
    expect(frontendNode?.kind).toBe("tag");
    expect(backendNode?.kind).toBe("tag");
    const edge = model.edges.find(
      (e) => e.source === "tag:frontend" && e.target === "tag:backend"
    );
    expect(edge).toBeDefined();
    expect(edge?.layer).toBe("acl");
  });

  it("builds model with groups and members", () => {
    const data = {
      groups: {
        "group:engineering": ["alice@example.com", "bob@example.com"],
      },
      acls: [
        {
          action: "accept",
          src: ["group:engineering"],
          dst: ["tag:frontend:*"],
        },
      ],
    };
    const model = buildGraphModel(data);
    const groupNode = model.nodes.find((n) => n.id === "group:engineering");
    expect(groupNode).toBeDefined();
    expect(groupNode?.members).toEqual(["alice@example.com", "bob@example.com"]);
    const aliceNode = model.nodes.find((n) => n.id === "alice@example.com");
    expect(aliceNode).toBeDefined();
    expect(aliceNode?.kind).toBe("user");
    const membershipEdge = model.edges.find(
      (e) => e.source === "group:engineering" && e.target === "alice@example.com"
    );
    expect(membershipEdge).toBeDefined();
    expect(membershipEdge?.layer).toBe("groupMember");
  });

  it("builds model with hosts", () => {
    const data = {
      hosts: {
        "frontend-server": "100.100.123.123",
      },
      acls: [
        {
          action: "accept",
          src: ["frontend-server"],
          dst: ["tag:backend:*"],
        },
      ],
    };
    const model = buildGraphModel(data);
    const hostNode = model.nodes.find((n) => n.id === "frontend-server");
    expect(hostNode).toBeDefined();
    expect(hostNode?.resolved).toBe("100.100.123.123");
    const ipNode = model.nodes.find((n) => n.id === "100.100.123.123");
    expect(ipNode).toBeDefined();
    expect(ipNode?.kind).toBe("ip");
  });

  it("builds model with grants", () => {
    const data = {
      grants: [
        {
          src: ["group:engineering"],
          dst: ["tag:webserver"],
          ip: ["tcp:443", "tcp:80"],
        },
      ],
      groups: {
        "group:engineering": ["alice@example.com"],
      },
    };
    const model = buildGraphModel(data);
    const edge = model.edges.find(
      (e) => e.source === "group:engineering" && e.target === "tag:webserver"
    );
    expect(edge).toBeDefined();
    expect(edge?.layer).toBe("grant");
    expect(edge?.ports).toContain("tcp:443");
    expect(edge?.ports).toContain("tcp:80");
  });

  it("builds model with SSH rules", () => {
    const data = {
      ssh: [
        {
          action: "check",
          src: ["autogroup:member"],
          dst: ["autogroup:self"],
          users: ["autogroup:nonroot", "root"],
        },
      ],
    };
    const model = buildGraphModel(data);
    const edge = model.edges.find(
      (e) => e.source === "autogroup:member" && e.target === "autogroup:self"
    );
    expect(edge).toBeDefined();
    expect(edge?.layer).toBe("ssh");
    expect(edge?.rules[0].users).toEqual(["autogroup:nonroot", "root"]);
  });

  it("builds model with tests", () => {
    const data = {
      acls: [
        {
          action: "accept",
          src: ["alice@example.com"],
          dst: ["tag:dev:*"],
        },
      ],
      tests: [
        {
          src: "alice@example.com",
          accept: ["tag:dev:80"],
          deny: ["tag:prod:80"],
        },
      ],
    };
    const model = buildGraphModel(data);
    const acceptEdge = model.edges.find(
      (e) => e.source === "alice@example.com" && e.target === "tag:dev" && e.layer === "test"
    );
    expect(acceptEdge).toBeDefined();
    expect(acceptEdge?.rules[0].accept).toBe(true);
    const denyEdge = model.edges.find(
      (e) => e.source === "alice@example.com" && e.target === "tag:prod" && e.layer === "test"
    );
    expect(denyEdge).toBeDefined();
    expect(denyEdge?.rules[0].accept).toBe(false);
  });

  it("builds model with tagOwners", () => {
    const data = {
      tagOwners: {
        "tag:frontend": ["autogroup:admin"],
      },
    };
    const model = buildGraphModel(data);
    const edge = model.edges.find(
      (e) => e.source === "autogroup:admin" && e.target === "tag:frontend"
    );
    expect(edge).toBeDefined();
    expect(edge?.layer).toBe("tagOwner");
  });

  it("builds model with ipsets", () => {
    const data = {
      ipsets: {
        prod: ["192.168.1.0/24", "10.0.0.0/8"],
      },
      acls: [
        {
          action: "accept",
          src: ["ipset:prod"],
          dst: ["tag:web:*"],
        },
      ],
    };
    const model = buildGraphModel(data);
    const ipsetNode = model.nodes.find((n) => n.id === "ipset:prod");
    expect(ipsetNode).toBeDefined();
    expect(ipsetNode?.members).toEqual(["192.168.1.0/24", "10.0.0.0/8"]);
    const cidrNode = model.nodes.find((n) => n.id === "192.168.1.0/24");
    expect(cidrNode).toBeDefined();
    expect(cidrNode?.kind).toBe("cidr");
  });

  it("handles empty policy", () => {
    const model = buildGraphModel({});
    expect(model.nodes).toEqual([]);
    expect(model.edges).toEqual([]);
  });

  it("handles deny-all policy", () => {
    const data = { acls: [] };
    const model = buildGraphModel(data);
    expect(model.nodes).toEqual([]);
    expect(model.edges).toEqual([]);
  });

  it("parses dst with multiple ports", () => {
    const data = {
      acls: [
        {
          action: "accept",
          src: ["tag:monitoring"],
          dst: ["*:80,443,9100"],
        },
      ],
    };
    const model = buildGraphModel(data);
    const edge = model.edges.find((e) => e.source === "tag:monitoring" && e.target === "*");
    expect(edge).toBeDefined();
    expect(edge?.ports).toContain("80,443,9100");
  });

  it("parses dst with port range", () => {
    const data = {
      acls: [
        {
          action: "accept",
          src: ["group:dev"],
          dst: ["tag:app:1000-2000"],
        },
      ],
    };
    const model = buildGraphModel(data);
    const edge = model.edges.find(
      (e) => e.source === "group:dev" && e.target === "tag:app"
    );
    expect(edge).toBeDefined();
    expect(edge?.ports).toContain("1000-2000");
  });

  it("parses ACL with proto field", () => {
    const data = {
      acls: [
        {
          action: "accept",
          src: ["alice@example.com"],
          proto: "tcp",
          dst: ["tag:web:443"],
        },
      ],
    };
    const model = buildGraphModel(data);
    const edge = model.edges.find(
      (e) => e.source === "alice@example.com" && e.target === "tag:web"
    );
    expect(edge).toBeDefined();
    expect(edge?.rules[0].proto).toBe("tcp");
  });

  it("captures ACL action field", () => {
    const data = {
      acls: [
        {
          action: "accept",
          src: ["alice@example.com"],
          dst: ["tag:web:443"],
        },
      ],
    };
    const model = buildGraphModel(data);
    const edge = model.edges.find(
      (e) => e.source === "alice@example.com" && e.target === "tag:web"
    );
    expect(edge).toBeDefined();
    expect(edge?.rules[0].action).toBe("accept");
  });

  it("captures SSH action field", () => {
    const data = {
      ssh: [
        {
          action: "check",
          src: ["autogroup:member"],
          dst: ["autogroup:self"],
          users: ["autogroup:nonroot"],
        },
      ],
    };
    const model = buildGraphModel(data);
    const edge = model.edges.find(
      (e) => e.source === "autogroup:member" && e.target === "autogroup:self"
    );
    expect(edge).toBeDefined();
    expect(edge?.rules[0].action).toBe("check");
  });

  it("captures proto in test rules", () => {
    const data = {
      tests: [
        {
          src: "alice@example.com",
          proto: "udp",
          accept: ["tag:web:443"],
        },
      ],
    };
    const model = buildGraphModel(data);
    const edge = model.edges.find(
      (e) => e.source === "alice@example.com" && e.target === "tag:web" && e.layer === "test"
    );
    expect(edge).toBeDefined();
    expect(edge?.rules[0].proto).toBe("udp");
  });

  it("uses hostAlias layer for host aliases", () => {
    const data = {
      hosts: {
        "frontend-server": "100.100.123.123",
      },
    };
    const model = buildGraphModel(data);
    const edge = model.edges.find(
      (e) => e.source === "frontend-server" && e.target === "100.100.123.123"
    );
    expect(edge).toBeDefined();
    expect(edge?.layer).toBe("hostAlias");
  });

  it("generates warnings for invalid tagOwners keys", () => {
    const data = {
      tagOwners: {
        "frontend": ["autogroup:admin"],
      },
    };
    const model = buildGraphModel(data);
    expect(model.warnings.length).toBeGreaterThan(0);
    expect(model.warnings.some((w) => w.includes("frontend"))).toBe(true);
  });

  it("generates warnings for host aliases containing @", () => {
    const data = {
      hosts: {
        "bad@host": "100.100.123.123",
      },
    };
    const model = buildGraphModel(data);
    expect(model.warnings.some((w) => w.includes("@"))).toBe(true);
  });
});
