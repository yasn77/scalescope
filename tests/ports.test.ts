import { describe, it, expect } from "vitest";
import { parseDstEntry, parseIpCapability, portSpecSummary, ipCapSummary } from "../src/lib/ports";

describe("parseDstEntry", () => {
  it("parses host:*", () => {
    const result = parseDstEntry("tag:frontend:*");
    expect(result.host).toBe("tag:frontend");
    expect(result.ports.kind).toBe("all");
    expect(result.ports.raw).toBe("*");
  });

  it("parses host:port", () => {
    const result = parseDstEntry("tag:web:443");
    expect(result.host).toBe("tag:web");
    expect(result.ports.kind).toBe("single");
    expect(result.ports.ports).toEqual([443]);
  });

  it("parses host:port,port", () => {
    const result = parseDstEntry("tag:monitoring:80,443,9100");
    expect(result.host).toBe("tag:monitoring");
    expect(result.ports.kind).toBe("list");
    expect(result.ports.ports).toEqual([80, 443, 9100]);
  });

  it("parses host:port-range", () => {
    const result = parseDstEntry("tag:app:1000-2000");
    expect(result.host).toBe("tag:app");
    expect(result.ports.kind).toBe("range");
    expect(result.ports.ports).toEqual([1000, 2000]);
  });

  it("parses IPv6 with brackets", () => {
    const result = parseDstEntry("[::1]:443");
    expect(result.host).toBe("[::1]");
    expect(result.ports.kind).toBe("single");
    expect(result.ports.ports).toEqual([443]);
  });

  it("parses host without port", () => {
    const result = parseDstEntry("tag:frontend");
    expect(result.host).toBe("tag:frontend");
    expect(result.ports.kind).toBe("all");
  });

  it("parses wildcard host", () => {
    const result = parseDstEntry("*:80,443");
    expect(result.host).toBe("*");
    expect(result.ports.kind).toBe("list");
    expect(result.ports.ports).toEqual([80, 443]);
  });
});

describe("parseIpCapability", () => {
  it("parses wildcard", () => {
    const result = parseIpCapability("*");
    expect(result.proto).toBeNull();
    expect(result.port.kind).toBe("all");
  });

  it("parses port only", () => {
    const result = parseIpCapability("443");
    expect(result.proto).toBeNull();
    expect(result.port.kind).toBe("single");
    expect(result.port.ports).toEqual([443]);
  });

  it("parses proto:*", () => {
    const result = parseIpCapability("tcp:*");
    expect(result.proto).toBe("tcp");
    expect(result.port.kind).toBe("all");
  });

  it("parses proto:port", () => {
    const result = parseIpCapability("udp:443");
    expect(result.proto).toBe("udp");
    expect(result.port.kind).toBe("single");
    expect(result.port.ports).toEqual([443]);
  });

  it("parses proto:port-range", () => {
    const result = parseIpCapability("tcp:80-443");
    expect(result.proto).toBe("tcp");
    expect(result.port.kind).toBe("range");
    expect(result.port.ports).toEqual([80, 443]);
  });
});

describe("portSpecSummary", () => {
  it("returns * for all", () => {
    expect(portSpecSummary({ kind: "all", ports: [], raw: "*" })).toBe("*");
  });

  it("returns raw for single", () => {
    expect(portSpecSummary({ kind: "single", ports: [443], raw: "443" })).toBe("443");
  });

  it("returns raw for list", () => {
    expect(portSpecSummary({ kind: "list", ports: [80, 443], raw: "80,443" })).toBe("80,443");
  });
});

describe("ipCapSummary", () => {
  it("returns * for wildcard", () => {
    expect(ipCapSummary({ proto: null, port: { kind: "all", ports: [], raw: "*" }, raw: "*" })).toBe("*");
  });

  it("returns proto:port", () => {
    expect(ipCapSummary({ proto: "tcp", port: { kind: "single", ports: [443], raw: "443" }, raw: "tcp:443" })).toBe("tcp:443");
  });

  it("returns port only when no proto", () => {
    expect(ipCapSummary({ proto: null, port: { kind: "single", ports: [80], raw: "80" }, raw: "80" })).toBe("80");
  });
});
