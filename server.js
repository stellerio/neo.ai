import express from "express";
import ollama from "ollama";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;
const ollamaHost = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
const defaultModel = process.env.NEO_MODEL || "gpt-oss:20b-cloud";

ollama.config({ host: ollamaHost });
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", async (_req, res) => {
  try {
    const response = await ollama.list();
    res.json({
      ok: true,
      model: defaultModel,
      models: (response.models || []).map((model) => model.name)
    });
  } catch {
    res.status(503).json({
      ok: false,
      model: defaultModel,
      error: "Neo cannot reach Ollama. Make sure Ollama is running and signed in."
    });
  }
});

app.post("/api/chat", async (req, res) => {
  const { messages, model } = req.body || {};

  if (!Array.isArray(messages) || !messages.length) {
    return res.status(400).json({ error: "messages must be a non-empty array" });
  }

  const safeMessages = messages
    .filter((m) => m && ["user", "assistant", "system"].includes(m.role) && typeof m.content === "string")
    .slice(-30);

  const selectedModel = typeof model === "string" && model.trim()
    ? model.trim()
    : defaultModel;

  try {
    const stream = await ollama.chat({
      model: selectedModel,
      messages: safeMessages,
      stream: true,
      options: { temperature: 0.7 }
    });

    res.status(200);
    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    for await (const chunk of stream) {
      res.write(JSON.stringify({
        message: chunk.message?.content || "",
        done: Boolean(chunk.done)
      }) + "\n");
    }
    res.end();
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      return res.status(500).json({ error: error?.message || "Ollama request failed" });
    }
    res.write(JSON.stringify({ error: error?.message || "Ollama request failed", done: true }) + "\n");
    res.end();
  }
});

app.get("*splat", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
  console.log(`Neo AI running at http://localhost:${port}`);
  console.log(`Ollama: ${ollamaHost}`);
  console.log(`Model: ${defaultModel}`);
});
