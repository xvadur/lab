import { randomUUID } from "node:crypto";
import cors from "cors";
import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { getCockpitEnv } from "./env";
import { createMcpServer } from "./mcp-server";

async function main() {
  const env = getCockpitEnv();
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "2mb" }));

  const transports = new Map<string, StreamableHTTPServerTransport>();

  app.get("/", (_req, res) => {
    res.status(200).json({
      ok: true,
      service: "chatgpt-writing-cockpit",
      mcp: "/mcp",
      health: "/health",
    });
  });

  app.post("/mcp", async (req, res) => {
    const server = createMcpServer(env.PUBLIC_BASE_URL);

    const sessionHeader = req.headers["mcp-session-id"];
    const sessionId = Array.isArray(sessionHeader) ? sessionHeader[0] : sessionHeader;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports.has(sessionId)) {
      transport = transports.get(sessionId)!;
    } else {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (newId) => {
          transports.set(newId, transport);
        },
      });

      transport.onclose = () => {
        if (transport.sessionId) transports.delete(transport.sessionId);
      };

      await server.connect(transport);
    }

    await transport.handleRequest(req, res, req.body);
  });

  app.get("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    const transport = sessionId ? transports.get(sessionId) : undefined;

    if (!transport) {
      res.status(400).json({ error: "Bad Request: invalid or missing session ID" });
      return;
    }

    await transport.handleRequest(req, res);
  });

  app.delete("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    const transport = sessionId ? transports.get(sessionId) : undefined;

    if (!transport) {
      res.status(400).json({ error: "Bad Request: invalid or missing session ID" });
      return;
    }

    await transport.handleRequest(req, res);
  });

  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true, service: "chatgpt-writing-cockpit" });
  });

  app.use((_req, res) => {
    res.status(404).json({
      ok: false,
      error: "Not Found",
      hint: "Use /mcp for MCP and /health for health check.",
    });
  });

  app.listen(env.MCP_PORT, () => {
    console.log(`MCP server listening on http://localhost:${env.MCP_PORT}/mcp`);
  });
}

main().catch((err) => {
  console.error("Failed to start MCP server", err);
  process.exit(1);
});
