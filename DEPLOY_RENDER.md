# Deploy to Render

This project can run as one Render Web Service:

- React/Vite is built into `dist/`
- Express serves the frontend and `/api/*`
- SQLite is stored on a Render Persistent Disk

## 1. Push the repo to GitHub

Render deploys from a GitHub repository. Commit and push the latest code first.

## 2. Create the service

Recommended path:

1. Open Render Dashboard.
2. Click **New +**.
3. Choose **Blueprint**.
4. Select this repository.
5. Render will read `render.yaml`.

The Blueprint creates:

- Web Service: `bosch-ecall-platform`
- Build command: `npm ci && npm run build`
- Start command: `npm start`
- Health check: `/api/health`
- Persistent disk: `/var/data`

## 3. Set secret environment variables

Render will ask for values marked `sync: false`.

Required:

```bash
REGISTRATION_CODE=Monash001
```

Optional:

```bash
GEMINI_API_KEY=your_server_side_key
```

Already configured in `render.yaml`:

```bash
NODE_ENV=production
NODE_VERSION=22.22.0
VITE_BASE_PATH=/
DATABASE_PATH=/var/data/bosch-ecall-platform.sqlite
COOKIE_SECURE=true
```

## 4. Open the deployed URL

Render will give you a URL like:

```text
https://bosch-ecall-platform.onrender.com
```

Use that URL instead of GitHub Pages when you need real login, registration, admin APIs, and database persistence.

## 5. Custom domain later

After the service works, add your domain in Render and point DNS from Cloudflare to the Render target.

## Notes

- GitHub Pages is still useful for a static frontend demo, but it cannot run this backend.
- SQLite persistence requires the Render disk at `/var/data`.
- For heavier enterprise use, migrate SQLite to PostgreSQL later.
