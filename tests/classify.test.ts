import { describe, it, expect } from "vitest";
import { classifySelector, selectorLabel, isSourceLike, isDestLike } from "../src/lib/classify";

describe("classifySelector", () => {
  it("classifies wildcard", () => {
    expect(classifySelector("*")).toBe("wildcard");
  });

  it("classifies users", () => {
    expect(classifySelector("alice@example.com")).toBe("user");
    expect(classifySelector("alice@github")).toBe("user");
    expect(classifySelector("alice@passkey")).toBe("user");
    expect(classifySelector("user:*@example.com")).toBe("user");
  });

  it("classifies groups", () => {
    expect(classifySelector("group:engineering")).toBe("group");
    expect(classifySelector("group:devops@example.com")).toBe("group");
  });

  it("classifies tags", () => {
    expect(classifySelector("tag:frontend")).toBe("tag");
    expect(classifySelector("tag:prod")).toBe("tag");
  });

  it("classifies autogroups", () => {
    expect(classifySelector("autogroup:member")).toBe("autogroup");
    expect(classifySelector("autogroup:admin")).toBe("autogroup");
    expect(classifySelector("autogroup:self")).toBe("autogroup");
    expect(classifySelector("autogroup:internet")).toBe("autogroup");
    expect(classifySelector("autogroup:tagged")).toBe("autogroup");
    expect(classifySelector("autogroup:shared")).toBe("autogroup");
  });

  it("classifies ipsets", () => {
    expect(classifySelector("ipset:prod")).toBe("ipset");
  });

  it("classifies services", () => {
    expect(classifySelector("svc:web-server")).toBe("svc");
  });

  it("classifies IPs", () => {
    expect(classifySelector("100.100.123.123")).toBe("ip");
    expect(classifySelector("192.168.1.1")).toBe("ip");
  });

  it("classifies CIDRs", () => {
    expect(classifySelector("192.168.1.0/24")).toBe("cidr");
    expect(classifySelector("10.0.0.0/8")).toBe("cidr");
  });

  it("classifies IP ranges", () => {
    expect(classifySelector("192.168.1.1-192.168.1.10")).toBe("range");
  });

  it("rejects invalid IPv4 octets", () => {
    expect(classifySelector("999.999.999.999")).toBe("unknown");
    expect(classifySelector("256.1.1.1")).toBe("unknown");
    expect(classifySelector("1.2.3.999")).toBe("unknown");
  });

  it("rejects invalid CIDR prefixes", () => {
    expect(classifySelector("10.0.0.0/99")).toBe("unknown");
    expect(classifySelector("10.0.0.0/33")).toBe("unknown");
  });

  it("classifies bare IPv6 addresses", () => {
    expect(classifySelector("2001:db8::1")).toBe("ip");
    expect(classifySelector("fe80::1")).toBe("ip");
    expect(classifySelector("::1")).toBe("ip");
  });

  it("classifies bracketed IPv6 addresses", () => {
    expect(classifySelector("[2001:db8::1]")).toBe("ip");
    expect(classifySelector("[::1]")).toBe("ip");
  });

  it("rejects invalid IPv6", () => {
    expect(classifySelector(":::::")).toBe("unknown");
    expect(classifySelector("gggg::1")).toBe("unknown");
  });

  it("classifies hosts", () => {
    expect(classifySelector("frontend-server-01")).toBe("host");
    expect(classifySelector("dev-network")).toBe("host");
  });
});

describe("selectorLabel", () => {
  it("extracts label from prefixed selectors", () => {
    expect(selectorLabel("group:engineering")).toBe("engineering");
    expect(selectorLabel("tag:frontend")).toBe("frontend");
    expect(selectorLabel("autogroup:member")).toBe("member");
    expect(selectorLabel("ipset:prod")).toBe("prod");
    expect(selectorLabel("svc:web")).toBe("web");
  });

  it("returns raw for non-prefixed selectors", () => {
    expect(selectorLabel("alice@example.com")).toBe("alice@example.com");
    expect(selectorLabel("*")).toBe("*");
    expect(selectorLabel("192.168.1.1")).toBe("192.168.1.1");
  });
});

describe("isSourceLike", () => {
  it("identifies source-like selectors", () => {
    expect(isSourceLike("*")).toBe(true);
    expect(isSourceLike("alice@example.com")).toBe(true);
    expect(isSourceLike("group:engineering")).toBe(true);
    expect(isSourceLike("autogroup:member")).toBe(true);
  });

  it("rejects dest-like selectors", () => {
    expect(isSourceLike("tag:frontend")).toBe(false);
    expect(isSourceLike("192.168.1.1")).toBe(false);
    expect(isSourceLike("svc:web")).toBe(false);
  });
});

describe("isDestLike", () => {
  it("identifies dest-like selectors", () => {
    expect(isDestLike("tag:frontend")).toBe(true);
    expect(isDestLike("192.168.1.1")).toBe(true);
    expect(isDestLike("svc:web")).toBe(true);
    expect(isDestLike("autogroup:self")).toBe(true);
  });

  it("rejects source-only selectors", () => {
    expect(isDestLike("group:engineering")).toBe(false);
  });
});
