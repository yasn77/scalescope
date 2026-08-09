# ScaleScope

[![Deploy to GitHub Pages](https://github.com/yasn77/scalescope/actions/workflows/deploy.yml/badge.svg)](https://github.com/yasn77/scalescope/actions/workflows/deploy.yml)
[![GitHub Pages](https://img.shields.io/badge/Live-Demo-blue)](https://yasn77.github.io/scalescope/)

Visualize your Tailscale ACL rules as an interactive force-directed graph.

## Features

- **Paste & visualize** — paste your tailnet policy file (huJSON) and see all network flows
- **Full policy support** — ACLs, grants, SSH rules, tests, groups, hosts, tag owners, IP sets
- **Layer toggles** — show/hide ACL, grant, SSH, test, tag owner, and membership layers
- **Node type filters** — filter by user, group, tag, autogroup, host, IP, CIDR, service, etc.
- **Search** — find nodes by name
- **Interactive graph** — zoom, pan, drag nodes, hover to highlight connections, click to inspect
- **Traffic flow animation** — click a node to see animated traffic flow on connected edges
- **Representative icons** — each node type has a distinct SVG icon (user, group, tag, shield, server, globe, etc.)
- **Side panel** — inspect any node or edge to see the raw rules, ports, protocols
- **Layout modes** — free force-directed (default) or left-to-right flow
- **Theme** — dark/light/system with manual toggle
- **Export** — save the graph as PNG
- **Samples** — load official Tailscale example policies to explore
- **Mobile responsive** — touch-friendly layout with collapsible panels

## Usage

1. Open the app
2. Click "Load Policy" or press the button in the empty state
3. Paste your tailnet policy file (huJSON format) or upload a file
4. Click "Visualize"

The graph shows:
- **Nodes** = selectors (users, groups, tags, hosts, IPs, autogroups, etc.)
- **Edges** = access rules (ACL, grant, SSH, test assertions)
- **Edge width** = number of merged rules between a pair
- **Edge color** = protocol (TCP=cyan, UDP=violet, ICMP=amber) or layer

## Development

```bash
npm install
npm run dev      # dev server
npm run build    # production build
npm test         # run tests
npm run check    # type check
npm run lint     # lint
```

## Deployment

The app deploys to GitHub Pages via GitHub Actions on push to `main`.

Enable Pages in your repo settings: **Settings → Pages → Source: GitHub Actions**.

## Tech Stack

- Svelte 5 + TypeScript + Vite
- D3.js v7 (force-directed graph)
- @jaxxstorm/hujsonkit (huJSON parser)
- Vitest (tests)

## AI Assistant Integration (Design)

The SPA is designed to support an AI assistant that can answer questions about the loaded ACL policy. The architecture would work as follows:

### Architecture

```
User question → LLM API → Structured query → Graph engine → Visual response
```

The AI assistant would live in a chat panel (replacing or alongside the side panel). It would have access to the parsed `GraphModel` — the same data structure the D3 renderer uses — enabling it to both answer questions and drive visual highlights.

### Capabilities

- **Natural language queries**: "Who can access tag:prod?", "What ports are open to the internet?", "Show me rules that allow all traffic"
- **Policy analysis**: "Is there any rule that's too permissive?", "Which users have access to production?", "Are there any orphaned tags?"
- **Visual actions**: The assistant can programmatically select nodes, toggle layers, and highlight paths to answer questions visually
- **Rule suggestions**: "You should restrict access to tag:prod to only group:devops", "Consider adding a test for this rule"

### Implementation approach

1. **Client-side query engine**: Build a query layer over `GraphModel` that can answer structured questions (reachable nodes, path finding, permissive rule detection) without an LLM — this powers both the AI and direct UI features
2. **LLM integration**: Send the user's question + a compact summary of the policy (not the raw policy) to an LLM API. The LLM returns a structured query from a fixed schema, which the client-side engine executes
3. **Visual response**: The engine returns nodes/edges to highlight, and the renderer animates them (using the existing traffic flow animation)
4. **Provider-agnostic**: Support OpenAI, Anthropic, or a local model via a configurable endpoint. API key stored in localStorage (client-side only, no server needed for the SPA)

### Privacy consideration

Since this is a static SPA with no backend, the policy file would be sent to the LLM provider's API. Users should be warned and given the option to use a local model or a privacy-preserving provider.

### License

MIT
