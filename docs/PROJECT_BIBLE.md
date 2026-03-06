---
title: 'PROJECT_BIBLE'
description: 'Original project context document. Domain workflows, core business logic, and initial tech stack decisions. Superseded by CLAUDE.md for daily use.'
category: reference
status: active
phase: all
last_updated: 2026-02-07
last_verified: 2026-02-07
depends_on: []
---

# **Mokumo \- Project Bible**

## **1\. Project Overview**

"Mokumo" is a high-performance management software for screen printing shops (inspired by The Print Life and Printavo). It manages the entire lifecycle of a garment: from Quote \-\> Artwork Approval \-\> Screen Room \-\> Production \-\> Shipping.

## **2\. Core Industry Workflows (The Business Logic)**

Claude must maintain context on these specific industry patterns:

- **The Quote Matrix:** Pricing is dynamic based on Quantity, Number of Colors, and Number of Print Locations.
- **Garment Sourcing:** SanMar/AlphaBroder integration logic (Mockup \-\> SKU selection).
- **The Screen Room:** Tracking "Burn" status, Mesh Counts, and Emulsion types.
- **Production States:** Design \-\> Approval \-\> Burning \-\> Press \-\> Finishing \-\> Shipped.

## **3\. The Tech Stack (The Guardrails)**

- **Framework:** Next.js 15+ (App Router, TypeScript).
- **Styling:** Tailwind CSS (Utility-first, no separate CSS files).
- **UI Components:** shadcn/ui (Radix Primitives). Always check @/components/ui before creating new components.
- **Icons:** Lucide React (Predictable naming conventions).
- **Forms & Validation:** React Hook Form \+ Zod (Strict schema-first data).
- **Routing/Navigation:** TanStack Router or Next.js App Router.
- **State Management:** URL Query Parameters for filters/search (Persistent state).

## **4\. Coding Standards (AI Commands)**

- **DRY Components:** Wrap repeated UI patterns into reusable appliances in @/components/.
- **Logic Separation:** Keep "Electricity" (React hooks/logic) separated from "Paint" (Tailwind classes).
- **Type Safety:** Every data object must have a Zod schema or a TypeScript Interface.
- **Navigation:** Use Breadcrumbs for deep-nested views (e.g., Home \> Jobs \> \#1024 \> Mockups).

## **5\. Development Workflow (Agent Commands)**

- **Phase 1: Mockup First.** Build high-fidelity UI screens using mock data before writing backend logic.
- **Phase 2: Vibe & Iterate.** Use v0.dev for complex UI components and refine them in Claude Code.
- **Phase 3: Schema Locking.** Once the UI "vibe" is correct, lock down the Zod schemas to inform the future Database structure.

## **6\. Directory Map**

- /app: Pages and Layouts (Routes).
- /components/ui: shadcn/ui primitives.
- /components/features: Feature-specific appliances (e.g., QuoteCalculator.tsx).
- /lib: Helper functions and Zod schemas.
