<script lang="ts">
  import { nodeColor, edgeLayerColor, layerLabel, protoColor } from "../lib/color";
  import { getIcon, getIconLabel } from "../lib/icons";
  import type { NodeKind, EdgeLayer } from "../lib/model";

  interface Props {
    className?: string;
  }

  let { className = "" }: Props = $props();

  const NODE_KINDS: NodeKind[] = ["user", "group", "tag", "autogroup", "host", "ip", "cidr", "svc", "wildcard", "ipset"];
  const EDGE_LAYERS: EdgeLayer[] = ["acl", "grant", "ssh", "test", "tagOwner", "groupMember", "hostAlias"];
  const PROTOS = ["tcp", "udp", "icmp"];
</script>

<div class="legend {className}">
  <div class="section">
    <div class="section-title">Nodes</div>
    <div class="items">
      {#each NODE_KINDS as kind}
        <div class="item">
          <svg class="node-icon" viewBox="{getIcon(kind).viewBox}" style="color: {nodeColor(kind)}">
            <path d={getIcon(kind).path} fill="currentColor" />
          </svg>
          <span>{getIconLabel(kind)}</span>
        </div>
      {/each}
    </div>
  </div>
  <div class="section">
    <div class="section-title">Edges</div>
    <div class="items">
      {#each EDGE_LAYERS as layer}
        <div class="item">
          <div class="edge-swatch" style="background: {edgeLayerColor(layer)}"></div>
          <span>{layerLabel(layer)}</span>
        </div>
      {/each}
    </div>
  </div>
  <div class="section">
    <div class="section-title">Protocols</div>
    <div class="items">
      {#each PROTOS as proto}
        <div class="item">
          <div class="proto-swatch" style="background: {protoColor(proto)}"></div>
          <span>{proto.toUpperCase()}</span>
        </div>
      {/each}
    </div>
  </div>
  <div class="section">
    <div class="section-title">Tip</div>
    <div class="tip">Click a node to see traffic flow</div>
  </div>
</div>

<style>
  .legend {
    position: absolute;
    bottom: 12px;
    left: 12px;
    background: var(--bg-panel);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px;
    backdrop-filter: blur(12px);
    font-size: 11px;
    z-index: 10;
    max-width: 240px;
  }
  @media (max-width: 768px) {
    .legend {
      display: none;
    }
    .legend.mobile-open {
      display: block;
      max-width: calc(100vw - 24px);
    }
  }
  .section {
    margin-bottom: 10px;
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
  .items {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 8px;
  }
  .item {
    display: flex;
    align-items: center;
    gap: 5px;
    color: var(--text);
  }
  .node-icon {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }
  .edge-swatch {
    width: 14px;
    height: 3px;
    border-radius: 1px;
  }
  .proto-swatch {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }
  .tip {
    font-size: 10px;
    color: var(--text-muted);
    font-style: italic;
  }
</style>
