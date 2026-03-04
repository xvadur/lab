# OpenClaw AI Showcase

Multi-panel AI writing console built with Next.js + TypeScript, using a server-side OpenClaw adapter.

## Quickstart

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Copy `.env.example` to `.env.local` and set:

- `OPENCLAW_GATEWAY_URL` (default `ws://127.0.0.1:18789`)
- `OPENCLAW_GATEWAY_TOKEN` (required)
- `OPENCLAW_AGENT_ID` (default `main`)
- `OPENCLAW_TIMEOUT_MS` (default `20000`)

## Scripts

- `npm run dev` - local dev server
- `npm run lint` - lint check
- `npm run test` - unit/integration tests
- `npm run test:e2e` - Playwright smoke tests
- `npm run verify` - lint + tests + e2e

## Safe Fast Git workflow

See [WORKFLOW.md](./WORKFLOW.md).

Helper scripts:

```bash
bash scripts/new-exp.sh "openclaw-showcase"
bash scripts/sync.sh
bash scripts/push.sh
```

## Adapter mode

v1 uses a CLI bridge (`openclaw gateway call`) from server routes. Gateway token never leaves server code.
