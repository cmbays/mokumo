---
title: 'Mobile Optimization — Journey Map'
description: 'Mobile user journeys mapped across competitor experiences and our target experience'
category: competitive-analysis
status: complete
phase: 1
created: 2026-02-14
last-verified: 2026-02-14
---

# Mobile Optimization — Journey Map

**Purpose**: Map the mobile user experience across competitors and define friction points, time metrics, and success criteria for mobile workflows.
**Input**: Competitive analysis, web research, user review mining
**Status**: Complete

---

## Terminology

| Term                | Definition                                                                                       | Phase         |
| ------------------- | ------------------------------------------------------------------------------------------------ | ------------- |
| **Mobile Check**    | Quick status lookup from phone (< 30 seconds). The most common mobile use case.                  | **Phase 1**   |
| **Mobile Action**   | Performing an action from phone (approve, update status, create quick quote). Takes 1-5 minutes. | **Phase 1**   |
| **Mobile Workflow** | Extended task on phone (full quote creation, detailed job review). Takes 5-15 minutes.           | **Phase 1-2** |

---

## Journey Overview: Shop Operator Mobile Day

Based on industry research, a typical shop owner/operator touches their phone for shop management at these moments:

| Time     | Context                        | Need                                      | Journey Type      |
| -------- | ------------------------------ | ----------------------------------------- | ----------------- |
| 7:00 AM  | Morning coffee, before shop    | "What's on the schedule today?"           | Mobile Check      |
| 9:30 AM  | On shop floor, at press        | "What's the ink color spec for this job?" | Mobile Check      |
| 11:00 AM | Customer calls                 | "Let me look up their order history"      | Mobile Check      |
| 12:30 PM | Lunch meeting with customer    | "Let me give you a quick quote"           | Mobile Action     |
| 2:00 PM  | Walking between stations       | "Is the Smith order approved yet?"        | Mobile Check      |
| 3:30 PM  | Customer texts mockup approval | "Let me update the job status"            | Mobile Action     |
| 5:30 PM  | Leaving shop                   | "What's the status of everything?"        | Mobile Check      |
| 8:00 PM  | At home, phone buzzes          | "Payment received notification"           | Push Notification |
| 9:00 PM  | Planning tomorrow              | "What jobs need to ship tomorrow?"        | Mobile Check      |

**Key insight**: 7 of 9 daily mobile touches are **quick checks** (< 30 seconds). The mobile experience must optimize for speed of information retrieval.

---

## Journey 1: "Morning Status Check" (Most Common)

### Current Experience (Competitor — Printavo)

```
Open phone browser → Type printavo.com → Wait for load (3-5s)
→ Login screen (if session expired) → Type email → Type password → Wait (2-3s)
→ Dashboard loads → Scroll to find today's schedule → Pinch-to-zoom on table
→ Tap a job → Wait for detail page → Scroll to find status
→ Back button → Repeat for next job

Total: 45-90 seconds per job check | Friction: HIGH
```

**Friction points**:

1. 🔴 No persistent session — must log in frequently
2. 🔴 Dashboard not optimized for mobile — requires pinch/zoom
3. 🟡 Tables unreadable on mobile — text too small
4. 🟡 No "today's jobs" quick view
5. 🟡 Multiple taps to reach job detail

### Current Experience (Printavo Native App)

```
Open Printavo app → App doesn't load → Force quit → Reopen → Still doesn't load
→ Give up, open browser instead → Same friction as web

Total: 60-120 seconds (if app works) or ABANDONED | Friction: CRITICAL
```

### Target Experience (Mokumo — Phase 1)

```
Open browser → App loads instantly (cached shell)
→ Dashboard shows "Today's Jobs" card stack at top
→ See all job statuses at a glance (card per job with status badge)
→ Tap any card → Full detail slides in
→ Swipe back → Continue reviewing

Total: 5-10 seconds for full status overview | Friction: MINIMAL
```

### Target Experience (Mokumo — Phase 2 PWA)

```
Tap home screen icon → App opens instantly (service worker)
→ Dashboard shows cached data immediately, live data loads in background
→ Push notification badge shows 2 updates
→ Glance at today's jobs → Done

Total: 3-5 seconds | Friction: NONE
```

---

## Journey 2: "Customer Lookup on a Call"

### Current Experience (Competitors)

```
Customer calls → "Let me look up your order"
→ Open browser → Navigate to customer list → Search by name
→ Wait for results → Tap customer → Scroll to find orders
→ Tap order → Wait for detail → Read status to customer

Total: 30-60 seconds | Customer hears: "Hold on, let me find that..."
Friction: MODERATE (embarrassment factor — looks unprofessional)
```

### Target Experience (Mokumo)

```
Customer calls → Tap "Customers" tab
→ Search bar auto-focused → Type first few letters → Results appear instantly
→ Tap customer → See order history with status badges
→ "Your order is in production, should ship Thursday"

Total: 8-12 seconds | Customer hears: immediate professional response
Friction: MINIMAL
```

---

## Journey 3: "Quick Quote at Customer Meeting"

### Current Experience (Competitors)

```
Customer asks "How much for 100 tees, 2-color front?"
→ "Let me get back to you" (can't quote on phone)
→ OR: Open browser → Navigate to quotes → New quote form
→ Form is desktop-sized → Pinch/zoom → Miss fields → Mistype on tiny inputs
→ Calculate manually → Text/email customer later

Total: Deferred (hours/days) or 5-10 minutes of fumbling | Friction: HIGH
```

### Target Experience (Mokumo — Phase 2)

```
Customer asks "How much for 100 tees, 2-color front?"
→ Tap "Quick Quote" from bottom tab
→ Large touch targets: Quantity slider → 100, Colors → 2, Locations → Front
→ Price calculated instantly: "$847 setup + $8.47/shirt"
→ "One-tap share" → Text message sent to customer

Total: 15-20 seconds | Customer sees: professional, instant response
Friction: NONE
```

---

## Journey 4: "Update Job Status on Shop Floor"

### Current Experience (Competitors)

```
Job finished printing → Walk to desk computer → Open browser → Find job → Update status
→ OR: Don't update until end of day (status tracking falls behind)

Total: 2-5 minutes per update | Friction: HIGH (physical interruption)
```

### Target Experience (Mokumo)

```
Job finished printing → Pull phone from pocket
→ Tap "Jobs" → Find job (search or scroll cards) → Tap status badge
→ Select new status from bottom sheet → Confirmed with haptic feedback
→ Team notified automatically

Total: 8-12 seconds | Friction: MINIMAL
```

---

## Friction Point Inventory

| #   | Friction Point                                               | Severity    | Frequency              | Competitor Impact | Our Fix                           | Phase |
| --- | ------------------------------------------------------------ | ----------- | ---------------------- | ----------------- | --------------------------------- | ----- |
| 1   | No mobile navigation — sidebar hidden, no alternative        | 🔴 Critical | Every visit            | All competitors   | Bottom tab bar + drawer           | 1     |
| 2   | Tables unreadable on mobile — tiny text, horizontal overflow | 🔴 Critical | Every list view        | All competitors   | Card-based mobile layouts         | 1     |
| 3   | Touch targets too small — buttons, links < 44px              | 🔴 Critical | Every interaction      | All competitors   | Global touch target audit + fix   | 1     |
| 4   | Forms broken on mobile — multi-column, tiny inputs           | 🔴 Critical | Quote/Invoice creation | All competitors   | Single-column mobile forms        | 1     |
| 5   | No persistent session on mobile — frequent re-login          | 🟡 Major    | Daily                  | Printavo, others  | Long-lived auth tokens            | 1     |
| 6   | No "today's view" — must dig for current status              | 🟡 Major    | Daily morning check    | All competitors   | Dashboard priority cards          | 1     |
| 7   | Kanban board unusable on mobile — columns overflow           | 🟡 Major    | Job management         | All competitors   | Swipe between columns / accordion | 1     |
| 8   | Dialogs/modals too small on mobile                           | 🟡 Major    | Various actions        | All competitors   | Full-screen mobile modals         | 1     |
| 9   | No push notifications                                        | 🟡 Major    | Missed updates         | All competitors   | PWA push notifications            | 2     |
| 10  | No offline access                                            | 🟢 Minor    | Low connectivity       | All competitors   | Service worker caching            | 2     |
| 11  | No camera integration                                        | 🟢 Minor    | Photo documentation    | All competitors   | Camera capture workflow           | 2     |
| 12  | No quick quote tool                                          | 🟢 Minor    | Customer meetings      | All competitors   | Mobile-optimized calculator       | 2     |

---

## Time Distribution

| Workflow             | Competitor Today       | Our Phase 1 Target  | Our Phase 2 Target  |
| -------------------- | ---------------------- | ------------------- | ------------------- |
| Morning status check | 45-90s                 | 5-10s               | 3-5s                |
| Customer lookup      | 30-60s                 | 8-12s               | 5-8s                |
| Quick quote          | Deferred (hours)       | 2-3 min (full form) | 15-20s (calculator) |
| Job status update    | 2-5 min (walk to desk) | 8-12s               | 8-12s               |
| End-of-day review    | 3-5 min                | 30-60s              | 20-30s              |

---

## Success Metrics

| Metric                             | Competitor Today        | Phase 1 Target      | Phase 2 Target         |
| ---------------------------------- | ----------------------- | ------------------- | ---------------------- |
| Time to first useful info (mobile) | 10-30s                  | < 3s                | < 2s                   |
| Taps to check job status           | 5-8                     | 2-3                 | 1-2                    |
| Mobile task completion rate        | ~40% (abandon)          | > 90%               | > 95%                  |
| Mobile session duration            | Short (frustrated exit) | Appropriate to task | Appropriate to task    |
| User satisfaction (mobile)         | Low (broken apps)       | Good (functional)   | Excellent (delightful) |
