<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import * as d3 from "d3";
  import type { GraphModel, GraphEdge, EdgeLayer, NodeKind } from "../lib/model";
  import { nodeColor, edgeColor, edgeLayerColor } from "../lib/color";
  import { isSourceLike, isDestLike } from "../lib/classify";
  import { getIcon } from "../lib/icons";
  import type { ThemeColors } from "../lib/color";

  interface Props {
    model: GraphModel | null;
    activeLayers: Set<EdgeLayer>;
    layoutMode: "free" | "flow";
    theme: ThemeColors;
    selectedNodeId: string | null;
    selectedEdgeId: string | null;
    hoveredNodeId: string | null;
    hoveredEdgeId: string | null;
    searchQuery: string;
    filterKinds: Set<string>;
    onNodeSelect: (id: string | null) => void;
    onEdgeSelect: (id: string | null) => void;
    onNodeHover: (id: string | null) => void;
    onEdgeHover: (id: string | null) => void;
  }

  let {
    model,
    activeLayers,
    layoutMode,
    theme,
    selectedNodeId,
    selectedEdgeId,
    hoveredNodeId,
    hoveredEdgeId,
    searchQuery,
    filterKinds,
    onNodeSelect,
    onEdgeSelect,
    onNodeHover,
    onEdgeHover,
  }: Props = $props();

  let svgEl: SVGSVGElement | undefined = $state();
  let simulation: d3.Simulation<SimNode, SimLink> | undefined;
  let width = $state(800);
  let height = $state(600);
  let zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | undefined;

  interface SimNode extends d3.SimulationNodeDatum {
    id: string;
    label: string;
    kind: NodeKind;
    raw: string;
    members?: string[];
    resolved?: string;
  }

  interface SimLink extends d3.SimulationLinkDatum<SimNode> {
    id: string;
    layer: EdgeLayer;
    ports: string[];
    protos: string[];
    rules: unknown[];
  }

  let adjacency = $derived.by(() => {
    const adj = new Map<string, Set<string>>();
    if (!model) return adj;
    for (const e of model.edges) {
      if (!activeLayers.has(e.layer)) continue;
      if (!adj.has(e.source)) adj.set(e.source, new Set());
      if (!adj.has(e.target)) adj.set(e.target, new Set());
      adj.get(e.source)!.add(e.target);
      adj.get(e.target)!.add(e.source);
    }
    return adj;
  });

  function getFilteredData(): { nodes: SimNode[]; links: SimLink[] } {
    if (!model) return { nodes: [], links: [] };
    const nodes: SimNode[] = model.nodes
      .filter((n) => filterKinds.size === 0 || filterKinds.has(n.kind))
      .map((n) => ({ id: n.id, label: n.label, kind: n.kind, raw: n.raw, members: n.members, resolved: n.resolved }));
    const nodeIds = new Set(nodes.map((n) => n.id));
    const links: SimLink[] = model.edges
      .filter((e) => activeLayers.has(e.layer))
      .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
      .map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        layer: e.layer,
        ports: e.ports,
        protos: e.protos,
        rules: e.rules,
      }));
    return { nodes, links };
  }

  function isNodeHighlighted(nodeId: string): boolean {
    if (hoveredNodeId === nodeId || selectedNodeId === nodeId) return true;
    const focusId = hoveredNodeId ?? selectedNodeId;
    if (focusId && adjacency.get(focusId)?.has(nodeId)) return true;
    if (searchQuery && nodeMatchesSearch(nodeId)) return true;
    return false;
  }

  function isEdgeHighlighted(edge: GraphEdge | undefined): boolean {
    if (!edge) return false;
    if (edge.id === hoveredEdgeId || edge.id === selectedEdgeId) return true;
    const focusId = hoveredNodeId ?? selectedNodeId;
    if (focusId && (edge.source === focusId || edge.target === focusId)) return true;
    return false;
  }

  function isEdgeFlowing(edge: GraphEdge | undefined): boolean {
    if (!edge) return false;
    const focusId = selectedNodeId;
    if (focusId && (edge.source === focusId || edge.target === focusId)) return true;
    return false;
  }

  function isDimmed(nodeId: string): boolean {
    const hasHover = hoveredNodeId || selectedNodeId;
    const hasSearch = searchQuery.length > 0;
    if (!hasHover && !hasSearch) return false;
    return !isNodeHighlighted(nodeId);
  }

  function isEdgeDimmed(edge: GraphEdge | undefined): boolean {
    const hasHover = hoveredNodeId || selectedNodeId || hoveredEdgeId || selectedEdgeId;
    if (!hasHover) return false;
    return !isEdgeHighlighted(edge);
  }

  function nodeMatchesSearch(nodeId: string): boolean {
    if (!searchQuery) return false;
    const q = searchQuery.toLowerCase();
    const node = model?.nodes.find((n) => n.id === nodeId);
    if (!node) return false;
    return node.id.toLowerCase().includes(q) || node.label.toLowerCase().includes(q);
  }

  function renderNodeIcon(sel: d3.Selection<SVGGElement, SimNode, SVGGElement, unknown>): void {
    sel.each(function (d) {
      const g = d3.select(this);
      g.selectAll("*").remove();
      const color = nodeColor(d.kind);
      const icon = getIcon(d.kind);
      const s = icon.size;
      const half = s / 2;

      g.append("circle")
        .attr("r", half + 4)
        .attr("fill", color)
        .attr("fill-opacity", 0.15)
        .attr("stroke", color)
        .attr("stroke-width", 2);

      g.append("path")
        .attr("d", icon.path)
        .attr("transform", `translate(${-half},${-half})`)
        .attr("fill", color)
        .attr("stroke", "none");

      g.append("text")
        .attr("dy", half + 16)
        .attr("text-anchor", "middle")
        .attr("fill", theme.text)
        .attr("font-size", "11px")
        .attr("font-family", "monospace")
        .text(d.label.length > 16 ? d.label.slice(0, 14) + "…" : d.label);
    });
  }

  function initGraph(): void {
    if (!svgEl) return;
    simulation?.stop();
    const svg = d3.select(svgEl);
    svg.on(".zoom", null);
    svg.on("click", null);
    svg.selectAll("*").remove();

    const { nodes, links } = getFilteredData();
    if (nodes.length === 0) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", theme.textMuted)
        .attr("font-size", "14px")
        .text("No data to display. Paste a policy file to visualize.");
      return;
    }

    const defs = svg.append("defs");
    defs
      .append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 28)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", theme.textMuted);

    const g = svg.append("g");

    zoomBehavior = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.1, 4]).on("zoom", (event) => {
      g.attr("transform", event.transform);
    });
    svg.call(zoomBehavior);

    const linkG = g.append("g").attr("class", "links");
    const nodeG = g.append("g").attr("class", "nodes");

    const linkSel = linkG
      .selectAll<SVGLineElement, SimLink>("line")
      .data(links, (d) => d.id)
      .join("line")
      .attr("stroke", (d) => edgeColor(d.layer, d.protos))
      .attr("stroke-width", (d) => Math.max(1.5, Math.min(d.rules.length * 1.5, 6)))
      .attr("stroke-opacity", (d) => (d.layer === "ssh" || d.layer === "test" ? 0.5 : 0.7))
      .attr("stroke-dasharray", (d) => (d.layer === "ssh" || d.layer === "test" ? "4,2" : "none"))
      .attr("marker-end", "url(#arrowhead)")
      .on("click", (event, d) => {
        event.stopPropagation();
        onEdgeSelect(d.id);
      })
      .on("mouseenter", (event, d) => onEdgeHover(d.id))
      .on("mouseleave", () => onEdgeHover(null));

    const nodeSel = nodeG
      .selectAll<SVGGElement, SimNode>("g")
      .data(nodes, (d) => d.id)
      .join("g")
      .attr("cursor", "pointer")
      .call(
        d3
          .drag<SVGGElement, SimNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation?.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation?.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      )
      .on("click", (event, d) => {
        event.stopPropagation();
        onNodeSelect(d.id);
      })
      .on("mouseenter", (event, d) => onNodeHover(d.id))
      .on("mouseleave", () => onNodeHover(null));

    nodeSel.call(renderNodeIcon);

    simulation = d3
      .forceSimulation<SimNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance(80)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide(30));

    if (layoutMode === "flow") {
      simulation.force(
        "x",
        d3.forceX<SimNode>((d) => {
          if (isSourceLike(d.raw)) return width * 0.2;
          if (isDestLike(d.raw)) return width * 0.8;
          return width * 0.5;
        }).strength(0.1)
      );
      simulation.force("y", d3.forceY(height / 2).strength(0.03));
    }

    simulation.on("tick", () => {
      linkSel
        .attr("x1", (d) => (d.source as SimNode).x!)
        .attr("y1", (d) => (d.source as SimNode).y!)
        .attr("x2", (d) => (d.target as SimNode).x!)
        .attr("y2", (d) => (d.target as SimNode).y!);
      nodeSel.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    svg.on("click", () => {
      onNodeSelect(null);
      onEdgeSelect(null);
    });
  }

  function updateColors(): void {
    if (!svgEl || !simulation) return;
    const svg = d3.select(svgEl);
    svg.selectAll<SVGGElement, SimNode>("g.nodes > g").each(function (d) {
      const g = d3.select(this);
      const color = nodeColor(d.kind);
      const icon = getIcon(d.kind);
      const half = icon.size / 2;
      g.select("circle").attr("fill", color).attr("stroke", color);
      g.select("path").attr("fill", color);
      g.select("text").attr("fill", theme.text);
    });
    svg
      .selectAll<SVGLineElement, SimLink>("g.links > line")
      .attr("stroke", (d) => edgeColor(d.layer, d.protos));
    svg.select("marker path").attr("fill", theme.textMuted);
    svg.select("text").attr("fill", theme.textMuted);
  }

  function updateHighlights(): void {
    if (!svgEl) return;
    const svg = d3.select(svgEl);
    svg.selectAll<SVGGElement, SimNode>("g.nodes > g").attr("opacity", (d) => (isDimmed(d.id) ? 0.2 : 1));
    svg
      .selectAll<SVGLineElement, SimLink>("g.links > line")
      .each(function (d) {
        const edge = model?.edges.find((e) => e.id === d.id);
        const dimmed = isEdgeDimmed(edge);
        const flowing = isEdgeFlowing(edge);
        const line = d3.select(this);
        line.attr("opacity", dimmed ? 0.1 : 1);
        if (flowing) {
          line.classed("flowing", true);
          line.attr("stroke-dasharray", "8,4");
        } else {
          line.classed("flowing", false);
          line.attr("stroke-dasharray", d.layer === "ssh" || d.layer === "test" ? "4,2" : "none");
        }
      });
  }

  onMount(() => {
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        width = entry.contentRect.width;
        height = entry.contentRect.height;
        if (svgEl) {
          svgEl.setAttribute("width", String(width));
          svgEl.setAttribute("height", String(height));
        }
        if (simulation) {
          (simulation.force("center") as d3.ForceCenter<SimNode>)?.x(width / 2)?.y(height / 2);
          simulation.alpha(0.3).restart();
        }
      }
    });
    if (svgEl?.parentElement) ro.observe(svgEl.parentElement);
    initGraph();
    return () => ro.disconnect();
  });

  $effect(() => {
    model;
    activeLayers;
    layoutMode;
    filterKinds;
    initGraph();
  });

  $effect(() => {
    theme;
    updateColors();
  });

  $effect(() => {
    selectedNodeId;
    selectedEdgeId;
    hoveredNodeId;
    hoveredEdgeId;
    searchQuery;
    updateHighlights();
  });

  onDestroy(() => {
    simulation?.stop();
  });
</script>

<div class="graph-container">
  <svg bind:this={svgEl}></svg>
</div>

<style>
  .graph-container {
    width: 100%;
    height: 100%;
    position: relative;
    touch-action: none;
  }
  svg {
    display: block;
  }
  :global(.flowing) {
    animation: scalescope-flow 0.8s linear infinite;
  }
  @keyframes scalescope-flow {
    from {
      stroke-dashoffset: 12;
    }
    to {
      stroke-dashoffset: 0;
    }
  }
</style>
