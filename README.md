# Neo AI

A simple Neo AI chat app using GitHub Pages for the frontend, a Cloudflare Worker for the private API layer, and Ollama Cloud for model inference.

## Architecture

```
GitHub Pages
    ↓
Cloudflare Worker
    ↓
Ollama Cloud
```

The Ollama API key stays inside the Cloudflare Worker and is never shipped to the browser.

## Models

The UI includes:

- gpt-oss:20b-cloud
- gpt-oss:120b-cloud
- qwen3-coder:480b-cloud
- glm-4.7:cloud

Ollama's cloud API is used by the Worker, so your old local `localhost:11434` server is no longer required for the hosted version. Ollama documents direct cloud API access through `https://ollama.com/api/chat`. citeturn1search0

## 1. Deploy the Cloudflare Worker

Install Wrangler in the repo:

```bash
npm install
npm i -D wrangler@latest
```

Log into Cloudflare:

```npx wrangler login
```

Add your Ollama API key as a Worker secret:

```npx wrangler secret put OLLAMA_API_KEY
```

Paste your Ollama API key when prompted. Do not put the key in GitHub or `worker/index.js`.

Deploy:

```npx wrangler deploy
```

Cloudflare's current Wrangler docs use `wrangler deploy` for Worker deployment and `wrangler secret put` for encrypted Worker secrets. citeturn2search1turn2search4

After deployment, Cloudflare gives you a URL similar to:

```
https://neo-ai-api.<your-subdomain>.workers.dev
```

## 2. Connect GitHub Pages to the Worker

In GitHub:

**Settings → Secrets and variables → Actions → Variables → New repository variable**

Create:

```
NEO_API_URL
```

Set its value to your Worker URL, for example:

```
https://neo-ai-api.<your-subdomain>.workers.dev
```

Do not put your Ollama API key here.

The Pages workflow in `.github/workflows/pages.yml` inserts this URL into `public/config.js` when the site deploys.

## 3. Enable GitHub Pages

Go to:

**Settings → Pages**

Set the source to **GitHub Actions**.

Every push to `main` will then redeploy the `public/` frontend. GitHub supports custom Pages workflows using `configure-pages`, `upload-pages-artifact`, and `deploy-pages`. citeturn2search0

## Local development

The original local Node/Express backend is still available:

```bash
npm install
npm start
```

But the hosted GitHub Pages version uses the Cloudflare Worker instead.

## Important

Never commit:

- Ollama API keys
- Cloudflare API tokens
- `.dev.vars`
- `.env`

The Ollama API key belongs in the Cloudflare Worker secret named `OLLAMA_API_KEY`.
