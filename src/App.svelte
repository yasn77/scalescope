<script lang="ts">
  import ForceGraph from "./components/ForceGraph.svelte";
  import EditorOverlay from "./components/EditorOverlay.svelte";
  import Toolbar from "./components/Toolbar.svelte";
  import SidePanel from "./components/SidePanel.svelte";
  import Legend from "./components/Legend.svelte";
  import FilterBar from "./components/FilterBar.svelte";
  import { parseHujson } from "./lib/parser";
  import { buildGraphModel, type EdgeLayer } from "./lib/model";
  import { LIGHT_THEME, DARK_THEME, type ThemeColors, type ThemeMode } from "./lib/color";
  import {
    createStore,
    setPolicyText,
    setThemeMode,
    setLayoutMode,
    toggleLayer,
    selectNode,
    selectEdge,
    hoverNode,
    hoverEdge,
    type AppState,
  } from "./lib/store";

  const appState: AppState = createStore();

  let resolvedTheme = $state<"light" | "dark">("dark");

  function resolveTheme(mode: ThemeMode): "light" | "dark" {
    if (mode === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return mode;
  }

  function applyTheme(theme: "light" | "dark"): void {
    document.documentElement.setAttribute("data-theme", theme);
  }

  $effect(() => {
    resolvedTheme = resolveTheme(appState.themeMode);
    applyTheme(resolvedTheme);
  });

  $effect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (appState.themeMode === "system") {
        resolvedTheme = mq.matches ? "dark" : "light";
        applyTheme(resolvedTheme);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  });

  let themeColors: ThemeColors = $derived(resolvedTheme === "dark" ? DARK_THEME : LIGHT_THEME);

  function handleApplyPolicy(text: string): void {
    setPolicyText(appState, text);
    const result = parseHujson(text);
    if (result.ok) {
      appState.parseError = null;
      appState.graphModel = buildGraphModel(result.data);
    } else {
      appState.parseError = { line: result.error.line, column: result.error.column, message: result.error.message };
      appState.graphModel = null;
    }
  }

  function handleTextChange(text: string): void {
    setPolicyText(appState, text);
  }

  function handleOpenEditor(): void {
    appState.editorOpen = true;
  }

  function handleCloseEditor(): void {
    appState.editorOpen = false;
  }

  function handleThemeChange(mode: ThemeMode): void {
    setThemeMode(appState, mode);
  }

  function handleLayoutChange(mode: "free" | "flow"): void {
    setLayoutMode(appState, mode);
  }

  function handleToggleLayer(layer: EdgeLayer): void {
    toggleLayer(appState, layer);
  }

  function handleNodeSelect(id: string | null): void {
    selectNode(appState, id);
  }

  function handleEdgeSelect(id: string | null): void {
    selectEdge(appState, id);
  }

  function handleNodeHover(id: string | null): void {
    hoverNode(appState, id);
  }

  function handleEdgeHover(id: string | null): void {
    hoverEdge(appState, id);
  }

  function handleToggleKind(kind: string): void {
    if (appState.filterKinds.has(kind)) {
      appState.filterKinds.delete(kind);
    } else {
      appState.filterKinds.add(kind);
    }
  }

  function handleSearchChange(query: string): void {
    appState.searchQuery = query;
  }

  function handleClearKinds(): void {
    appState.filterKinds = new Set();
  }

  function handleResetZoom(): void {
    window.dispatchEvent(new CustomEvent("scalescope:reset-zoom"));
  }

  function handleExportPng(): void {
    const svg = document.querySelector(".graph-container svg") as SVGSVGElement | null;
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", String(rect.width));
    clone.setAttribute("height", String(rect.height));
    const data = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(2, 2);
      ctx.fillStyle = resolvedTheme === "dark" ? "#0b0f14" : "#f8fafc";
      ctx.fillRect(0, 0, rect.width, rect.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement("a");
        a.download = "scalescope.png";
        a.href = URL.createObjectURL(blob);
        a.click();
        URL.revokeObjectURL(a.href);
      }, "image/png");
    };
    img.src = url;
  }

  let initialized = false;
  $effect(() => {
    if (!initialized && appState.policyText) {
      initialized = true;
      handleApplyPolicy(appState.policyText);
    }
  });
</script>

<div class="app" style="background: {themeColors.bg}; color: {themeColors.text}">
  <Toolbar
    themeMode={appState.themeMode}
    layoutMode={appState.layoutMode}
    onOpenEditor={handleOpenEditor}
    onThemeChange={handleThemeChange}
    onLayoutChange={handleLayoutChange}
    onResetZoom={handleResetZoom}
    onExportPng={handleExportPng}
  />
  <div class="graph-area">
    <ForceGraph
      model={appState.graphModel}
      activeLayers={appState.activeLayers}
      layoutMode={appState.layoutMode}
      theme={themeColors}
      selectedNodeId={appState.selectedNodeId}
      selectedEdgeId={appState.selectedEdgeId}
      hoveredNodeId={appState.hoveredNodeId}
      hoveredEdgeId={appState.hoveredEdgeId}
      searchQuery={appState.searchQuery}
      filterKinds={appState.filterKinds}
      onNodeSelect={handleNodeSelect}
      onEdgeSelect={handleEdgeSelect}
      onNodeHover={handleNodeHover}
      onEdgeHover={handleEdgeHover}
    />
  </div>
  {#if !appState.graphModel}
    <div class="empty-state">
      <div class="empty-icon">⬡</div>
      <h2>ScaleScope</h2>
      <p>Visualize your Tailscale ACL rules</p>
      <button class="start-btn" onclick={handleOpenEditor}>Load a Policy File</button>
    </div>
  {/if}
  <Legend />
  <FilterBar
    activeLayers={appState.activeLayers}
    filterKinds={appState.filterKinds}
    searchQuery={appState.searchQuery}
    onToggleLayer={handleToggleLayer}
    onToggleKind={handleToggleKind}
    onClearKinds={handleClearKinds}
    onSearchChange={handleSearchChange}
  />
  <SidePanel
    model={appState.graphModel}
    selectedNodeId={appState.selectedNodeId}
    selectedEdgeId={appState.selectedEdgeId}
    onClose={() => {
      selectNode(appState, null);
      selectEdge(appState, null);
    }}
  />
  <EditorOverlay
    open={appState.editorOpen}
    policyText={appState.policyText}
    parseError={appState.parseError}
    onClose={handleCloseEditor}
    onApply={handleApplyPolicy}
    onTextChange={handleTextChange}
  />
</div>

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  :global(:root) {
    --bg: #0b0f14;
    --bg-panel: rgba(15, 20, 30, 0.85);
    --text: #e2e8f0;
    --text-muted: #94a3b8;
    --border: rgba(226, 232, 240, 0.1);
    --accent: #818cf8;
  }
  :global([data-theme="light"]) {
    --bg: #f8fafc;
    --bg-panel: rgba(255, 255, 255, 0.85);
    --text: #0f172a;
    --text-muted: #64748b;
    --border: rgba(15, 23, 42, 0.1);
    --accent: #6366f1;
  }
  .app {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    position: relative;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  .graph-area {
    position: absolute;
    inset: 0;
  }
  .empty-state {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    pointer-events: none;
  }
  .empty-icon {
    font-size: 48px;
    color: var(--text-muted);
    margin-bottom: 12px;
    opacity: 0.5;
  }
  .empty-state h2 {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 8px;
  }
  .empty-state p {
    font-size: 14px;
    color: var(--text-muted);
    margin-bottom: 20px;
  }
  .start-btn {
    pointer-events: auto;
    padding: 10px 20px;
    border-radius: 8px;
    background: var(--accent);
    color: white;
    border: none;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
  }
  .start-btn:hover {
    opacity: 0.9;
  }
</style>
