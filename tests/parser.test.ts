import { describe, it, expect } from "vitest";
import { parseHujson } from "../src/lib/parser";

describe("parseHujson", () => {
  it("parses valid JSON", () => {
    const result = parseHujson('{"acls": []}');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ acls: [] });
    }
  });

  it("parses huJSON with line comments", () => {
    const input = `{
      // This is a comment
      "acls": [
        {
          "action": "accept",
          "src": ["*"],
          "dst": ["*:*"] // trailing comment
        }
      ]
    }`;
    const result = parseHujson(input);
    expect(result.ok).toBe(true);
  });

  it("parses huJSON with block comments", () => {
    const input = `{
      /* block comment */
      "acls": []
    }`;
    const result = parseHujson(input);
    expect(result.ok).toBe(true);
  });

  it("parses huJSON with trailing commas", () => {
    const input = `{
      "acls": [
        { "action": "accept", "src": ["*"], "dst": ["*:*"], },
      ],
    }`;
    const result = parseHujson(input);
    expect(result.ok).toBe(true);
  });

  it("handles strings containing // and /* */", () => {
    const input = `{
      "hosts": {
        "example": "https://example.com/path"
      },
      "acls": [{"action": "accept", "src": ["*"], "dst": ["example:*"]}]
    }`;
    const result = parseHujson(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect((result.data.hosts as any).example).toBe("https://example.com/path");
    }
  });

  it("returns error for empty input", () => {
    const result = parseHujson("");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("Input is empty");
    }
  });

  it("returns error for non-object JSON", () => {
    const result = parseHujson("[1, 2, 3]");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("Policy file must be a JSON object");
    }
  });

  it("returns error with line/column for syntax errors", () => {
    const input = `{
      "acls": [
        { "action": "accept"
      }
    }`;
    const result = parseHujson(input);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.line).toBeGreaterThan(0);
      expect(result.error.column).toBeGreaterThan(0);
    }
  });

  it("parses the default allow-all policy", () => {
    const input = `{
      "acls": [
        {
          "action": "accept",
          "src": ["*"],
          "dst": ["*:*"]
        }
      ],
      "ssh": [
        {
          "action": "check",
          "src": ["autogroup:member"],
          "dst": ["autogroup:self"],
          "users": ["autogroup:nonroot", "root"]
        }
      ]
    }`;
    const result = parseHujson(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.acls).toHaveLength(1);
      expect(result.data.ssh).toHaveLength(1);
    }
  });
});
