# ChatGPT Writing Cockpit App

Submission-ready ChatGPT App scaffold for advanced writing flows (5 tools) backed by local OpenClaw.

## Architecture

- `server/`: MCP server (`/mcp`) with 5 tool handlers and widget resource registration
- `shared/`: Zod contracts shared by tools and widget
- `widget/`: React cockpit UI bundle
- `tests/`: schema, handler, and widget tests

## Tools

- `generate_draft`
- `rewrite_text`
- `summarize_text`
- `tone_score`
- `compare_variants`

All tools normalize errors to:

```json
{
  "ok": false,
  "code": "BAD_REQUEST | GATEWAY_UNREACHABLE | TIMEOUT | AUTH_FAILED | INTERNAL",
  "message": "...",
  "traceId": "..."
}
```

## Local run

1. Copy env:

```bash
cp .env.example .env
```

2. Install deps:

```bash
npm install
```

3. Build widget and start server:

```bash
npm run build:widget
npm run dev
```

4. Health check:

```bash
curl http://localhost:9090/health
```

MCP endpoint is at `http://localhost:9090/mcp`.

## Connect in ChatGPT Developer Mode

1. Run tunnel (example with ngrok):

```bash
ngrok http 9090
```

2. Copy HTTPS URL and append `/mcp`, e.g. `https://<id>.ngrok-free.app/mcp`.
3. In ChatGPT: Settings -> Apps & Connectors -> Advanced settings -> enable Developer Mode.
4. Add a new app and paste the MCP URL.
5. Refresh the app after tool metadata changes.

## Verification

```bash
npm run verify
```

## Submission artifacts

See `docs/submission-checklist.md`.

## Docs grounding

- https://developers.openai.com/apps-sdk/build/mcp-server
- https://developers.openai.com/apps-sdk/build/chatgpt-ui
- https://developers.openai.com/apps-sdk/build/examples
- https://developers.openai.com/apps-sdk/plan/tools
- https://developers.openai.com/apps-sdk/reference
- https://developers.openai.com/apps-sdk/deploy/submission
- https://developers.openai.com/apps-sdk/app-submission-guidelines
