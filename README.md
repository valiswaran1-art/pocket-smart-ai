# PocketSmart AI

A small, dependency-free full-stack budgeting assistant with a responsive dashboard, account sign-in, home/party/jewelry planners, saved plans, and Gemini recommendations.

## Run locally

Requires Node.js 20 or later.

1. Install Node.js 20 or later from [nodejs.org](https://nodejs.org/) if it is not installed.
2. Connect your computer and phone to the **same private Wi-Fi**. Open PowerShell in this project folder. From VS Code, use **Terminal → New Terminal**, then run:

   ```powershell
   .\start.ps1
   ```

   Enter a **new** Gemini key at the hidden prompt. The key is only kept in server memory; press Enter to start with sample plans instead.
3. Keep that terminal open. It prints a phone-ready address like `http://192.168.1.20:3000`. Open that exact address on your phone.
4. Create an account using an email address and a password of at least 10 characters, then open a planner and generate a plan.

If PowerShell blocks the script, run it for this invocation with:

```powershell
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

Optionally set `GEMINI_MODEL` (defaults to `gemini-3.8-flash`) before launching to choose a model available to your API key.

The key entered at startup is sent to Google in an authorization header when generating plans. It is never returned to a browser or written to project files, and remains in server memory only until the server stops. Without a key, planners remain usable with explicitly labeled illustrative sample allocations and search links. Sample estimates are not researched product prices or seller quotes. The originally specified “Gemini 1.5 Flash Pro” is not used as a model ID; configure a Gemini model ID available to your API account using `GEMINI_MODEL`.

## Important notes

- Recommendation prices are AI-generated estimates, not verified product prices, stock, or availability. Platform links search the named platform; they are not endorsements or confirmed product listings.
- Outfit photos are sent to Gemini only when submitted in a jewelry plan and are not saved with the account.
- Accounts and saved plans are stored as JSON files in `data/`. This is intended for local/demo use, not a production multi-user deployment. Use a managed database, HTTPS, a durable session-secret, rate limiting, and a reviewed identity/authentication setup before exposing the app publicly.
- The phone link works only while both devices are on the same trusted Wi-Fi and the server terminal stays open. Do not use public Wi-Fi or forward this port to the internet. For access from anywhere, deploy behind HTTPS with a protected server-side key.

## Publish a demo on Render

The included `render.yaml` is a starting point for a public, HTTPS Render demo. It does not contain the Gemini key.

1. Create a private GitHub repository and upload the app source: `package.json`, `server.mjs`, `render.yaml`, `.gitignore`, `README.md`, and the `public/` directory. Do not upload `data/`, `.env` files, or API keys.
2. In Render, create a **Blueprint** from that GitHub repository and apply the `render.yaml` configuration.
3. Enter a **new, unexposed** Gemini key when Render prompts for `GEMINI_API_KEY`. Render keeps it as a private server environment variable.
4. Wait for the deployment health check to pass, then open the `onrender.com` HTTPS URL Render provides. That link works from a phone on any network.

The free Render service can sleep when idle, and its local JSON account/plan files are ephemeral: they may be reset when the instance restarts or redeploys. This is a presentation prototype only—use fake/demo account details, not real personal or financial data. A public production app needs durable managed storage, stronger authentication and abuse protection, and a security review before collecting real users' data.
- Gemini model access depends on the API key and current Google AI availability. Set `GEMINI_MODEL` to a model available to your account if the default is unavailable.
