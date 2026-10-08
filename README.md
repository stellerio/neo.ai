# Neo AI

A simple AI chat app powered by Ollama Cloud models.

## Run it

1. Install Ollama.
2. Sign in:
```bash
ollama signin
```
3. Pull the default cloud model:
```bash
ollama pull gpt-oss:20b-cloud
```
4. Install dependencies:
```bash
npm install
```
5. Start Neo:
```bash
npm start
```
6. Open http://localhost:3000

Neo talks to Ollama through the local Ollama service, while the selected model runs on Ollama Cloud. Your Ollama login is not placed in browser code.

## Models

Default: `gpt-oss:20b-cloud`

The UI also includes `gpt-oss:120b-cloud`, `qwen3-coder:480b-cloud`, and `glm-4.7:cloud`.

Do not put an Ollama API key into frontend JavaScript or commit it to GitHub. For a public deployment, keep credentials server-side.
