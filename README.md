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
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## GitHub Pages

This repo is configured to deploy to GitHub Pages from GitHub Actions.

1. In GitHub, open `Settings -> Pages`
2. Set `Source` to `GitHub Actions`
3. Push to `main`

The Pages workflow builds the static frontend with:
`npm run build:pages`

The deployed URL is:
`https://ESPLORARE.github.io/Bosch-eCall-Platform/`
