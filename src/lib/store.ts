import type { GraphModel, EdgeLayer } from "./model";
import type { ThemeMode } from "./color";

export interface AppState {
  policyText: string;
  graphModel: GraphModel | null;
  parseError: { line: number; column: number; message: string } | null;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  hoveredNodeId: string | null;
  hoveredEdgeId: string | null;
  activeLayers: Set<EdgeLayer>;
  themeMode: ThemeMode;
  layoutMode: "free" | "flow";
  editorOpen: boolean;
  searchQuery: string;
  filterKinds: Set<string>;
}

function loadPolicy(): string {
  try {
    return localStorage.getItem("scalescope:policy") ?? "";
  } catch {
    return "";
  }
}

function savePolicy(text: string): void {
  try {
    localStorage.setItem("scalescope:policy", text);
  } catch {}
}

function loadTheme(): ThemeMode {
  try {
    const v = localStorage.getItem("scalescope:theme");
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {}
  return "system";
}

function saveTheme(mode: ThemeMode): void {
  try {
    localStorage.setItem("scalescope:theme", mode);
  } catch {}
}

function loadLayout(): "free" | "flow" {
  try {
    const v = localStorage.getItem("scalescope:layout");
    if (v === "free" || v === "flow") return v;
  } catch {}
  return "free";
}

function saveLayout(mode: "free" | "flow"): void {
  try {
    localStorage.setItem("scalescope:layout", mode);
  } catch {}
}

export function createStore(): AppState {
  const state: AppState = {
    policyText: loadPolicy(),
    graphModel: null,
    parseError: null,
    selectedNodeId: null,
    selectedEdgeId: null,
    hoveredNodeId: null,
    hoveredEdgeId: null,
    activeLayers: new Set<EdgeLayer>(["acl", "grant"]),
    themeMode: loadTheme(),
    layoutMode: loadLayout(),
    editorOpen: false,
    searchQuery: "",
    filterKinds: new Set<string>(),
  };
  return state;
}

export function setPolicyText(state: AppState, text: string): void {
  state.policyText = text;
  savePolicy(text);
}

export function setThemeMode(state: AppState, mode: ThemeMode): void {
  state.themeMode = mode;
  saveTheme(mode);
}

export function setLayoutMode(state: AppState, mode: "free" | "flow"): void {
  state.layoutMode = mode;
  saveLayout(mode);
}

export function toggleLayer(state: AppState, layer: EdgeLayer): void {
  if (state.activeLayers.has(layer)) {
    state.activeLayers.delete(layer);
  } else {
    state.activeLayers.add(layer);
  }
}

export function selectNode(state: AppState, id: string | null): void {
  state.selectedNodeId = id;
  state.selectedEdgeId = null;
}

export function selectEdge(state: AppState, id: string | null): void {
  state.selectedEdgeId = id;
  state.selectedNodeId = null;
}

export function hoverNode(state: AppState, id: string | null): void {
  state.hoveredNodeId = id;
}

export function hoverEdge(state: AppState, id: string | null): void {
  state.hoveredEdgeId = id;
}
