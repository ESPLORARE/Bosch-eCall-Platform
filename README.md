<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/f017d928-a66a-4af2-b3f3-18f193f884da

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. If you need server-side secrets, create `.env.local` from `.env.example`
3. Keep API keys server-side only. Do not use `VITE_` for secrets and do not inject them into the frontend bundle.
4. Run the app:
   `npm run dev`

## Backend and Database

The local server uses Express with a persistent SQLite database. On first start it creates
`./data/bosch-ecall-platform.sqlite`, runs the schema migration, and seeds the platform with
demo incidents, vehicles, hospitals, operators, weather, and audit metadata.

Useful backend endpoints:
- `GET /api/health` checks database connectivity and record counts.
- `GET /api/audit-events` returns recent operational audit events.
- Existing `/api/incidents`, `/api/vehicles`, `/api/operators`, `/api/analytics`, and assistant APIs now read from the database.

Set `DATABASE_PATH` in `.env.local` if you want the database file somewhere else.

Secrets policy:
`GEMINI_API_KEY` and similar values belong in `.env.local` or your deployment secret manager only.
`VITE_*` variables are public and will be visible in the browser.

## GitHub Pages

This repo is configured to deploy to GitHub Pages from GitHub Actions.

1. In GitHub, open `Settings -> Pages`
2. Set `Source` to `GitHub Actions`
3. Push to `main`

The Pages workflow builds the static frontend with:
`npm run build:pages`

The deployed URL is:
`https://ESPLORARE.github.io/Bosch-eCall-Platform/`

GitHub Pages is static hosting. It cannot run the Express backend or SQLite database.
Use Render for the real full-stack app.

## Render Full-Stack Deployment

This repo includes `render.yaml` for Render Blueprint deployment.

1. Push the latest code to GitHub.
2. In Render, create a new Blueprint from this repository.
3. Set `REGISTRATION_CODE` when Render asks for secret env vars.
4. Open the Render URL, for example `https://bosch-ecall-platform.onrender.com`.

Render runs:

- Build: `npm ci && npm run build`
- Start: `npm start`
- Health check: `/api/health`
- SQLite path: `/var/data/bosch-ecall-platform.sqlite`

See `DEPLOY_RENDER.md` for the detailed deployment checklist.
