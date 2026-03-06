---
title: 'Vercel Setup with Access Code Protection'
subtitle: '4Ink demo deployment infrastructure'
date: 2026-02-08
phase: 1
pipelineName: meta
pipelineType: horizontal
products: []
tools: [knowledge-base]
stage: build
tags: [build]
sessionId: '09b70260-83ac-4830-9b02-ed8c0683f699'
branch: 'feat/vercel-setup'
status: complete
---

## Overview

Set up Vercel deployment for Mokumo with password protection using an access code stored securely in Vercel's environment variables. This allows secure demo access to 4Ink without exposing the app publicly.

**Security Note:** The actual access code is stored in the `DEMO_ACCESS_CODE` environment variable in Vercel. Never commit the code to git. To view it:

```
vercel env list
```

## What Was Built

### Vercel Project Linked

- Linked GitHub repository to Vercel hobby account
- Project auto-configured for Next.js 16.1.6
- Auto-detected production settings

### Access Code Protection System

- **Middleware** (`middleware.ts`) — Protects all routes except login pages
- **Login Page** (`/demo-login`) — Clean, branded interface for access code entry
- **API Route** (`/api/demo-login`) — Validates code and sets secure httpOnly cookie
- **Environment Variable** — `DEMO_ACCESS_CODE` encrypted in Vercel

### Security Details

- Cookie is `httpOnly` (cannot be accessed via JavaScript)
- Cookie is `secure` (only sent over HTTPS in production)
- Cookie is `sameSite=lax` (CSRF protection)
- Cookie expires in 30 days
- Access code stored as encrypted environment variable
- Protection only active in production (dev mode bypassed for testing)

## How It Works

1. User visits deployed app (e.g., `mokumo.vercel.app`)
2. Middleware checks for `demo-access` cookie
3. If missing, redirect to `/demo-login`
4. User enters access code
5. API validates against environment variable
6. If valid, cookie is set and user redirected to dashboard
7. Cookie persists for 30 days or until browser cleared

## Files Changed

- [middleware.ts (created)](https://github.com/cmbays/mokumo/blob/main/middleware.ts)
- [app/demo-login/page.tsx (created)](https://github.com/cmbays/mokumo/blob/main/app/demo-login/page.tsx)
- [app/api/demo-login/route.ts (created)](https://github.com/cmbays/mokumo/blob/main/app/api/demo-login/route.ts)
- [PR #4](https://github.com/cmbays/mokumo/pull/4)

## Next Steps

### To Deploy to Production

1. PR receives CodeRabbit review
2. Merge to main when approved
3. Vercel auto-deploys main branch
4. Get production URL from Vercel dashboard
5. Share URL with 4Ink, access code separately

### To View or Change Access Code

**View current code:**

```
vercel env list
```

**Change the code:**

Update `DEMO_ACCESS_CODE` in the Vercel dashboard (recommended) or via CLI:

```
vercel env rm DEMO_ACCESS_CODE && printf "your-new-code" | vercel env add DEMO_ACCESS_CODE production
```

Then redeploy: `vercel deploy --prod`
