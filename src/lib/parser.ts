import { parse as hujsonParse, HujsonSyntaxError, toJsonValue } from "@jaxxstorm/hujsonkit";

export interface ParseDiagnostic {
  line: number;
  column: number;
  offset: number;
  message: string;
}

export interface ParseResult {
  ok: true;
  data: Record<string, unknown>;
}

export interface ParseError {
  ok: false;
  error: ParseDiagnostic;
}

function offsetToLineCol(input: string, offset: number): { line: number; column: number } {
  let line = 1;
  let column = 1;
  for (let i = 0; i < offset && i < input.length; i++) {
    if (input[i] === "\n") {
      line++;
      column = 1;
    } else {
      column++;
    }
  }
  return { line, column };
}

export function parseHujson(input: string): ParseResult | ParseError {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, error: { line: 1, column: 1, offset: 0, message: "Input is empty" } };
  }
  try {
    const ast = hujsonParse(input);
    const json = toJsonValue(ast);
    if (typeof json !== "object" || json === null || Array.isArray(json)) {
      return { ok: false, error: { line: 1, column: 1, offset: 0, message: "Policy file must be a JSON object" } };
    }
    return { ok: true, data: json as Record<string, unknown> };
  } catch (e) {
    if (e instanceof HujsonSyntaxError) {
      const { line, column } = offsetToLineCol(input, e.offset);
      return { ok: false, error: { line, column, offset: e.offset, message: e.message } };
    }
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: { line: 1, column: 1, offset: 0, message: msg } };
  }
}
