# Neo AI

A frontend-only Neo AI chat app hosted entirely on GitHub Pages.

## Architecture

GitHub Pages → Ollama Cloud

There is no Node server or Cloudflare Worker in the hosted version.

## Models

- gpt-oss:20b-cloud
- gpt-oss:120b-cloud
- qwen3-coder:480b-cloud
- glm-4.7:cloud

## API key

Because this is a static frontend, the browser talks directly to Ollama Cloud. That means an Ollama API key cannot be hidden from the browser.

Neo AI asks the user to enter their own key. The key is stored in that browser's localStorage and is not committed to this repository.

Do not put a personal Ollama API key into the source code.

## GitHub Pages

The site deploys directly from the `public/` folder with GitHub Actions. Every push to `main` redeploys the frontend.

## Security note

Frontend-only means the API key is visible to the browser while the app is using it. If you later want one private API key shared by everyone, you need a server-side API layer such as a Cloudflare Worker.
