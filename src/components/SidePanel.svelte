<script lang="ts">
  import type { GraphModel, GraphNode, GraphEdge } from "../lib/model";
  import { nodeColor, nodeKindLabel, edgeLayerColor, layerLabel } from "../lib/color";

  interface Props {
    model: GraphModel | null;
    selectedNodeId: string | null;
    selectedEdgeId: string | null;
    onClose: () => void;
  }

  let { model, selectedNodeId, selectedEdgeId, onClose }: Props = $props();

  let selectedNode: GraphNode | undefined = $derived(
    model?.nodes.find((n) => n.id === selectedNodeId)
  );

  let selectedEdge: GraphEdge | undefined = $derived(
    model?.edges.find((e) => e.id === selectedEdgeId)
  );

  let connectedEdges: GraphEdge[] = $derived(
    selectedNode && model
      ? model.edges.filter(
          (e) => e.source === selectedNode.id || e.target === selectedNode.id
        )
      : []
  );
</script>

{#if selectedNode || selectedEdge}
  <div class="side-panel">
    <div class="header">
      <h3>{selectedNode ? "Node" : "Edge"} Details</h3>
      <button class="close-btn" onclick={onClose}>×</button>
    </div>
    <div class="content">
      {#if selectedNode}
        <div class="node-detail">
          <div class="node-header">
            <div class="node-badge" style="background: {nodeColor(selectedNode.kind)}"></div>
            <div>
              <div class="node-label">{selectedNode.label}</div>
              <div class="node-type">{nodeKindLabel(selectedNode.kind)}</div>
            </div>
          </div>
          <div class="node-raw">
            <code>{selectedNode.raw}</code>
          </div>
          {#if selectedNode.members && selectedNode.members.length > 0}
            <div class="section">
              <div class="section-title">Members ({selectedNode.members.length})</div>
              <div class="member-list">
                {#each selectedNode.members as member}
                  <div class="member">{member}</div>
                {/each}
              </div>
            </div>
          {/if}
          {#if selectedNode.resolved}
            <div class="section">
              <div class="section-title">Resolves to</div>
              <code>{selectedNode.resolved}</code>
            </div>
          {/if}
          <div class="section">
            <div class="section-title">Connected Edges ({connectedEdges.length})</div>
            <div class="edge-list">
              {#each connectedEdges as edge}
                <div class="edge-item" style="border-left-color: {edgeLayerColor(edge.layer)}">
                  <div class="edge-layer">{layerLabel(edge.layer)}</div>
                  <div class="edge-desc">
                    {edge.source === selectedNode.id ? `→ ${edge.target}` : `← ${edge.source}`}
                  </div>
                  {#if edge.ports.length > 0}
                    <div class="edge-ports">{edge.ports.join(", ")}</div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        </div>
      {:else if selectedEdge}
        <div class="edge-detail">
          <div class="edge-header">
            <div class="edge-badge" style="background: {edgeLayerColor(selectedEdge.layer)}"></div>
            <div>
              <div class="edge-label">{layerLabel(selectedEdge.layer)}</div>
              <div class="edge-path">{selectedEdge.source} → {selectedEdge.target}</div>
            </div>
          </div>
          {#if selectedEdge.ports.length > 0}
            <div class="section">
              <div class="section-title">Ports</div>
              <div class="port-list">
                {#each selectedEdge.ports as port}
                  <span class="port-chip">{port}</span>
                {/each}
              </div>
            </div>
          {/if}
          {#if selectedEdge.protos.length > 0}
            <div class="section">
              <div class="section-title">Protocols</div>
              <div class="port-list">
                {#each selectedEdge.protos as proto}
                  <span class="port-chip">{proto}</span>
                {/each}
              </div>
            </div>
          {/if}
          <div class="section">
            <div class="section-title">Rules ({selectedEdge.rules.length})</div>
            <div class="rule-list">
              {#each selectedEdge.rules as rule, i}
                <div class="rule-item">
                  <div class="rule-index">#{i + 1}</div>
                  <pre class="rule-raw">{rule.raw}</pre>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .side-panel {
    position: absolute;
    right: 12px;
    top: 60px;
    bottom: 12px;
    width: 320px;
    background: var(--bg-panel);
    border: 1px solid var(--border);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    backdrop-filter: blur(12px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    z-index: 10;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px;
    border-bottom: 1px solid var(--border);
  }
  .header h3 {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
  }
  .close-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 20px;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
  }
  .close-btn:hover {
    background: var(--border);
    color: var(--text);
  }
  .content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }
  .node-header, .edge-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }
  .node-badge, .edge-badge {
    width: 12px;
    height: 12px;
    border-radius: 3px;
  }
  .node-label, .edge-label {
    font-size: 14px;
    font-weight: 600;
    font-family: monospace;
  }
  .node-type {
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 2px;
  }
  .edge-path {
    font-size: 11px;
    color: var(--text-muted);
    font-family: monospace;
    margin-top: 2px;
    word-break: break-all;
  }
  .node-raw {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 8px;
    margin-bottom: 12px;
  }
  .node-raw code {
    font-size: 11px;
    font-family: monospace;
    word-break: break-all;
  }
  .section {
    margin-bottom: 16px;
  }
  .section-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-muted);
    margin-bottom: 8px;
  }
  .member-list, .edge-list, .rule-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .member {
    font-size: 12px;
    font-family: monospace;
    padding: 4px 8px;
    background: var(--bg);
    border-radius: 4px;
    word-break: break-all;
  }
  .edge-item {
    padding: 8px;
    background: var(--bg);
    border-radius: 4px;
    border-left: 3px solid var(--border);
  }
  .edge-layer {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .edge-desc {
    font-size: 12px;
    font-family: monospace;
    margin-top: 2px;
    word-break: break-all;
  }
  .edge-ports {
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 2px;
  }
  .port-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .port-chip {
    font-size: 11px;
    font-family: monospace;
    padding: 3px 8px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 4px;
  }
  .rule-item {
    display: flex;
    gap: 8px;
    padding: 8px;
    background: var(--bg);
    border-radius: 4px;
  }
  .rule-index {
    font-size: 10px;
    font-weight: 600;
    color: var(--text-muted);
    min-width: 24px;
  }
  .rule-raw {
    font-size: 11px;
    font-family: monospace;
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
    flex: 1;
  }
</style>
