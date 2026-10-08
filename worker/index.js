const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json(
        { ok: true, provider: "ollama-cloud", model: env.NEO_MODEL || "gpt-oss:20b" },
        { headers: corsHeaders }
      );
    }

    if (url.pathname !== "/chat" || request.method !== "POST") {
      return Response.json({ error: "Not found" }, { status: 404, headers: corsHeaders });
    }

    if (!env.OLLAMA_API_KEY) {
      return Response.json(
        { error: "OLLAMA_API_KEY is not configured on the worker." },
        { status: 500, headers: corsHeaders }
      );
    }

    try {
      const body = await request.json();
      const messages = Array.isArray(body.messages) ? body.messages : [];
      const model = typeof body.model === "string" && body.model.trim()
        ? body.model.trim()
        : (env.NEO_MODEL || "gpt-oss:20b");

      if (!messages.length) {
        return Response.json({ error: "messages must be a non-empty array" }, { status: 400, headers: corsHeaders });
      }

      const upstream = await fetch("https://ollama.com/api/chat", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.OLLAMA_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: messages.slice(-30),
          stream: true,
          options: { temperature: 0.7 }
        })
      });

      if (!upstream.ok) {
        const errorText = await upstream.text();
        return new Response(errorText || "Ollama Cloud request failed", {
          status: upstream.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      return new Response(upstream.body, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/x-ndjson; charset=utf-8",
          "Cache-Control": "no-cache"
        }
      });
    } catch (error) {
      return Response.json(
        { error: error?.message || "Invalid request" },
        { status: 500, headers: corsHeaders }
      );
    }
  }
};
