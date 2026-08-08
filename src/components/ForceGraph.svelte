<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import * as d3 from "d3";
  import type { GraphModel, GraphNode, GraphEdge, EdgeLayer } from "../lib/model";
  import { nodeColor, nodeShape, edgeColor, edgeLayerColor, nodeKindLabel } from "../lib/color";
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
  let width = 800;
  let height = 600;

  interface SimNode extends d3.SimulationNodeDatum {
    id: string;
    label: string;
    kind: string;
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
    if (hoveredNodeId === nodeId) return true;
    if (selectedNodeId === nodeId) return true;
    if (hoveredNodeId && model) {
      const hovered = model.nodes.find((n) => n.id === hoveredNodeId);
      if (hovered) {
        const connected = model.edges.some(
          (e) =>
            activeLayers.has(e.layer) &&
            ((e.source === hoveredNodeId && e.target === nodeId) ||
              (e.target === hoveredNodeId && e.source === nodeId))
        );
        if (connected) return true;
      }
    }
    if (selectedNodeId && model) {
      const connected = model.edges.some(
        (e) =>
          activeLayers.has(e.layer) &&
          ((e.source === selectedNodeId && e.target === nodeId) ||
            (e.target === selectedNodeId && e.source === nodeId))
      );
      if (connected) return true;
    }
    if (searchQuery && nodeMatchesSearch(nodeId)) return true;
    return false;
  }

  function isEdgeHighlighted(edgeId: string): boolean {
    if (hoveredEdgeId === edgeId) return true;
    if (selectedEdgeId === edgeId) return true;
    if (hoveredNodeId && model) {
      const edge = model.edges.find((e) => e.id === edgeId);
      if (edge && (edge.source === hoveredNodeId || edge.target === hoveredNodeId)) return true;
    }
    if (selectedNodeId && model) {
      const edge = model.edges.find((e) => e.id === edgeId);
      if (edge && (edge.source === selectedNodeId || edge.target === selectedNodeId)) return true;
    }
    return false;
  }

  function isDimmed(nodeId: string): boolean {
    const hasHover = hoveredNodeId || selectedNodeId;
    const hasSearch = searchQuery.length > 0;
    if (!hasHover && !hasSearch) return false;
    return !isNodeHighlighted(nodeId);
  }

  function isEdgeDimmed(edgeId: string): boolean {
    const hasHover = hoveredNodeId || selectedNodeId || hoveredEdgeId || selectedEdgeId;
    if (!hasHover) return false;
    return !isEdgeHighlighted(edgeId);
  }

  function nodeMatchesSearch(nodeId: string): boolean {
    if (!searchQuery) return false;
    const q = searchQuery.toLowerCase();
    const node = model?.nodes.find((n) => n.id === nodeId);
    if (!node) return false;
    return node.id.toLowerCase().includes(q) || node.label.toLowerCase().includes(q);
  }

  function renderNodeShape(sel: d3.Selection<SVGGElement, SimNode, SVGGElement, unknown>): void {
    sel.each(function (d) {
      const g = d3.select(this);
      g.selectAll("*").remove();
      const color = nodeColor(d.kind as any);
      const shape = nodeShape(d.kind as any);
      const r = 20;
      if (shape === "circle") {
        g.append("circle").attr("r", r).attr("fill", color).attr("stroke", theme.text).attr("stroke-width", 1.5);
      } else if (shape === "rect") {
        g.append("rect")
          .attr("x", -r)
          .attr("y", -r)
          .attr("width", r * 2)
          .attr("height", r * 2)
          .attr("rx", 4)
          .attr("fill", color)
          .attr("stroke", theme.text)
          .attr("stroke-width", 1.5);
      } else if (shape === "diamond") {
        g.append("polygon")
          .attr("points", `0,${-r} ${r},0 0,${r} ${-r},0`)
          .attr("fill", color)
          .attr("stroke", theme.text)
          .attr("stroke-width", 1.5);
      } else if (shape === "hexagon") {
        const pts = Array.from({ length: 6 }, (_, i) => {
          const a = (Math.PI / 3) * i - Math.PI / 2;
          return `${r * Math.cos(a)},${r * Math.sin(a)}`;
        }).join(" ");
        g.append("polygon")
          .attr("points", pts)
          .attr("fill", color)
          .attr("stroke", theme.text)
          .attr("stroke-width", 1.5);
      } else if (shape === "triangle") {
        g.append("polygon")
          .attr("points", `0,${-r} ${r},${r} ${-r},${r}`)
          .attr("fill", color)
          .attr("stroke", theme.text)
          .attr("stroke-width", 1.5);
      }
      g.append("text")
        .attr("dy", r + 14)
        .attr("text-anchor", "middle")
        .attr("fill", theme.text)
        .attr("font-size", "11px")
        .attr("font-family", "monospace")
        .text(d.label.length > 16 ? d.label.slice(0, 14) + "…" : d.label);
    });
  }

  function initGraph(): void {
    if (!svgEl) return;
    const svg = d3.select(svgEl);
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

    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.1, 4]).on("zoom", (event) => {
      g.attr("transform", event.transform);
    });
    svg.call(zoom);

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

    nodeSel.call(renderNodeShape);

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
      simulation.force("x", d3.forceX(width / 2).strength(0.05));
      simulation.force("y", d3.forceY(height / 2).strength(0.05));
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

  function updateHighlights(): void {
    if (!svgEl) return;
    const svg = d3.select(svgEl);
    svg.selectAll<SVGGElement, SimNode>("g.nodes > g").attr("opacity", (d) => (isDimmed(d.id) ? 0.2 : 1));
    svg
      .selectAll<SVGLineElement, SimLink>("g.links > line")
      .attr("opacity", (d) => (isEdgeDimmed(d.id) ? 0.1 : 1));
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
    theme;
    filterKinds;
    initGraph();
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
  }
  svg {
    display: block;
  }
</style>
