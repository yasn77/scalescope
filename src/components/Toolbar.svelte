<script lang="ts">
  import type { ThemeMode } from "../lib/color";

  interface Props {
    themeMode: ThemeMode;
    layoutMode: "free" | "flow";
    onOpenEditor: () => void;
    onThemeChange: (mode: ThemeMode) => void;
    onLayoutChange: (mode: "free" | "flow") => void;
    onResetZoom: () => void;
    onExportPng: () => void;
  }

  let { themeMode, layoutMode, onOpenEditor, onThemeChange, onLayoutChange, onResetZoom, onExportPng }: Props = $props();

  function cycleTheme(): void {
    const modes: ThemeMode[] = ["system", "light", "dark"];
    const idx = modes.indexOf(themeMode);
    onThemeChange(modes[(idx + 1) % modes.length]);
  }

  function themeIcon(): string {
    if (themeMode === "light") return "☀";
    if (themeMode === "dark") return "☾";
    return "◐";
  }

  function themeLabel(): string {
    if (themeMode === "light") return "Light";
    if (themeMode === "dark") return "Dark";
    return "System";
  }
</script>

<div class="toolbar">
  <div class="left">
    <button class="btn primary" onclick={onOpenEditor}>
      <span class="icon">⬆</span>
      Load Policy
    </button>
  </div>
  <div class="center">
    <div class="segmented">
      <button
        class="seg-btn"
        class:active={layoutMode === "free"}
        onclick={() => onLayoutChange("free")}
        title="Free force-directed layout"
      >
        Force
      </button>
      <button
        class="seg-btn"
        class:active={layoutMode === "flow"}
        onclick={() => onLayoutChange("flow")}
        title="Left-to-right flow layout"
      >
        Flow
      </button>
    </div>
  </div>
  <div class="right">
    <button class="icon-btn" onclick={onResetZoom} title="Reset zoom">
      <span>⟲</span>
    </button>
    <button class="icon-btn" onclick={onExportPng} title="Export as PNG">
      <span>⤓</span>
    </button>
    <button class="icon-btn" onclick={cycleTheme} title="Theme: {themeLabel()}">
      <span>{themeIcon()}</span>
    </button>
  </div>
</div>

<style>
  .toolbar {
    position: absolute;
    top: 12px;
    left: 12px;
    right: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 10;
    pointer-events: none;
  }
  .left, .center, .right {
    display: flex;
    align-items: center;
    gap: 8px;
    pointer-events: auto;
  }
  .btn {
    padding: 8px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid var(--border);
    background: var(--bg-panel);
    color: var(--text);
    display: flex;
    align-items: center;
    gap: 6px;
    backdrop-filter: blur(8px);
  }
  .btn:hover {
    border-color: var(--accent);
  }
  .btn.primary {
    background: var(--accent);
    color: white;
    border-color: var(--accent);
  }
  .btn.primary:hover {
    opacity: 0.9;
  }
  .icon {
    font-size: 14px;
  }
  .segmented {
    display: flex;
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    background: var(--bg-panel);
    backdrop-filter: blur(8px);
  }
  .seg-btn {
    padding: 7px 14px;
    font-size: 12px;
    font-weight: 500;
    border: none;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
  }
  .seg-btn:hover {
    color: var(--text);
  }
  .seg-btn.active {
    background: var(--accent);
    color: white;
  }
  .icon-btn {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--bg-panel);
    color: var(--text);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    backdrop-filter: blur(8px);
  }
  .icon-btn:hover {
    border-color: var(--accent);
    color: var(--accent);
  }
</style>
