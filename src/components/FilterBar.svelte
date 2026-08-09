<script lang="ts">
  import type { EdgeLayer, NodeKind } from "../lib/model";
  import { edgeLayerColor, layerLabel, nodeColor, nodeKindLabel } from "../lib/color";

  interface Props {
    activeLayers: Set<EdgeLayer>;
    filterKinds: Set<string>;
    searchQuery: string;
    className?: string;
    onToggleLayer: (layer: EdgeLayer) => void;
    onToggleKind: (kind: string) => void;
    onClearKinds: () => void;
    onSearchChange: (query: string) => void;
  }

  let {
    activeLayers,
    filterKinds,
    searchQuery,
    className = "",
    onToggleLayer,
    onToggleKind,
    onClearKinds,
    onSearchChange,
  }: Props = $props();

  const LAYERS: EdgeLayer[] = ["acl", "grant", "ssh", "test", "tagOwner", "groupMember", "hostAlias"];
  const KINDS: NodeKind[] = ["user", "group", "tag", "autogroup", "host", "ip", "cidr", "svc", "wildcard", "ipset"];
</script>

<div class="filter-bar {className}">
  <div class="search">
    <input
      type="text"
      placeholder="Search nodes..."
      value={searchQuery}
      oninput={(e) => onSearchChange(e.currentTarget.value)}
    />
  </div>
  <div class="section">
    <div class="section-title">Layers</div>
    <div class="chips">
      {#each LAYERS as layer}
        <button
          class="chip"
          class:active={activeLayers.has(layer)}
          style="--chip-color: {edgeLayerColor(layer)}"
          onclick={() => onToggleLayer(layer)}
        >
          {layerLabel(layer)}
        </button>
      {/each}
    </div>
  </div>
  <div class="section">
    <div class="section-title">Node Types</div>
    <div class="chips">
      {#each KINDS as kind}
        <button
          class="chip kind-chip"
          class:active={filterKinds.has(kind)}
          style="--chip-color: {nodeColor(kind)}"
          onclick={() => onToggleKind(kind)}
        >
          {nodeKindLabel(kind)}
        </button>
      {/each}
      {#if filterKinds.size > 0}
        <button class="chip clear" onclick={onClearKinds}>Clear</button>
      {/if}
    </div>
  </div>
</div>

<style>
  .filter-bar {
    position: absolute;
    bottom: 12px;
    right: 12px;
    background: var(--bg-panel);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px;
    backdrop-filter: blur(12px);
    z-index: 10;
    width: 260px;
  }
  @media (max-width: 768px) {
    .filter-bar {
      display: none;
    }
    .filter-bar.mobile-open {
      display: block;
      width: calc(100vw - 24px);
      bottom: 64px;
      right: 12px;
    }
  }
  .search {
    margin-bottom: 10px;
  }
  .search input {
    width: 100%;
    padding: 6px 10px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--bg);
    color: var(--text);
    font-size: 12px;
    font-family: monospace;
  }
  .search input:focus {
    outline: none;
    border-color: var(--accent);
  }
  .section {
    margin-bottom: 8px;
  }
  .section:last-child {
    margin-bottom: 0;
  }
  .section-title {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-muted);
    margin-bottom: 6px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .chip {
    font-size: 10px;
    padding: 3px 8px;
    border-radius: 4px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
  }
  .chip:hover {
    border-color: var(--chip-color);
    color: var(--text);
  }
  .chip.active {
    background: var(--chip-color);
    color: white;
    border-color: var(--chip-color);
  }
  .chip.clear {
    color: var(--text-muted);
    font-style: italic;
  }
</style>
