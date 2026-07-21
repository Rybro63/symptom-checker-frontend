# AI Symptom Checker — Frontend

A React + Vite single-page app for the [AI Symptom Checker API](https://dsfk8nnzl6.execute-api.us-east-1.amazonaws.com/docs). Users describe their symptoms and receive an AI-generated triage assessment — urgency level, ranked possible conditions with confidence scores, and red-flag warning signs — rendered in a clean, color-coded interface.

> ⚠️ Educational only. Not a medical diagnosis.

**Try it live:** https://symptom-checker-frontend-nine.vercel.app/
Demo login — demo@symptomchecker.app / DemoUser2026

## Stack

React 18 · Vite · plain CSS (no UI framework) · Fetch API

## Architecture

```
React SPA  ──fetch──>  API Gateway ──> Lambda (FastAPI) ──> Claude API
                                            └──> DynamoDB
```

The frontend talks only to the backend API — it never holds the Anthropic key. The triage call happens server-side in Lambda.

## Auth setup (required)

The app now requires sign-in (AWS Cognito). After deploying the backend, copy `UserPoolId` and `UserPoolClientId` from the SAM deploy **Outputs** into `src/config.js` (or set `VITE_USER_POOL_ID` / `VITE_USER_POOL_CLIENT_ID` at build time). Users sign up with email + password and confirm via a 6-digit emailed code.

## Run locally

```bash
npm install
npm run dev
# open the printed localhost URL
```

The API base URL lives in `src/config.js` and defaults to the deployed AWS endpoint. To point at a different backend, set `VITE_API_URL` at build time:

```bash
VITE_API_URL=https://your-api-url npm run build
```

## Build

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build locally
```

## Deploy

Any static host works (Vercel, Netlify, GitHub Pages, S3 + CloudFront). The simplest is Vercel: import the GitHub repo, accept the auto-detected Vite settings, deploy. See the project notes for a full walkthrough.

## Features

- Symptom form with client-side validation (min length, age range)
- Color-coded triage banner (emergency / urgent / routine / self-care)
- Per-condition confidence bars
- Red-flag warnings and self-care guidance
- Recent-checks history pulled from the API
- Graceful error and loading states
- Responsive down to mobile; respects reduced-motion
