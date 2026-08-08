# ScaleScope

Visualize your Tailscale ACL rules as an interactive force-directed graph.

## Features

- **Paste & visualize** — paste your tailnet policy file (huJSON) and see all network flows
- **Full policy support** — ACLs, grants, SSH rules, tests, groups, hosts, tag owners, IP sets
- **Layer toggles** — show/hide ACL, grant, SSH, test, tag owner, and membership layers
- **Node type filters** — filter by user, group, tag, autogroup, host, IP, CIDR, service, etc.
- **Search** — find nodes by name
- **Interactive graph** — zoom, pan, drag nodes, hover to highlight connections, click to inspect
- **Side panel** — inspect any node or edge to see the raw rules, ports, protocols
- **Layout modes** — free force-directed (default) or left-to-right flow
- **Theme** — dark/light/system with manual toggle
- **Export** — save the graph as PNG
- **Samples** — load official Tailscale example policies to explore

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

## License

MIT
