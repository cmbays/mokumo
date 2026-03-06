---
title: 'Jobs Vertical — Current Journey Map'
description: 'Step-by-step journey map of how production jobs flow today at 4Ink, with friction points from competitor analysis and user interview'
category: competitive-analysis
status: complete
phase: 1
vertical: jobs-production
created: 2026-02-12
last-verified: 2026-02-12
depends-on:
  - docs/competitive-analysis/jobs-vertical-synthesis.md
---

# Jobs Vertical — Current Journey Map

**Purpose**: Document how production jobs actually flow at 4Ink today, identifying every friction point that Mokumo's Jobs vertical must address
**Input**: User interview with 4Ink owner, Playwright exploration of Printavo + PrintLife, web research
**Status**: Complete

---

## Current State: How 4Ink Works Today

### Tools in Use

- **PrintLife**: Quote creation, basic production Kanban (4 lanes)
- **Wall calendar**: Primary daily/weekly planning tool
- **Memory**: Gary's mental model of capacity and priorities
- **Phone/email**: Customer communication

### Team Structure

- **Gary** (owner): Quotes, screen prep, coordination, planning — the hub for all decisions
- **2-3 employees**: Press operation (automatic + manual), bagging, boxing, shipping
- **No digital assignment system** — Gary verbally directs work

### Service Types

1. **Screen Printing** — Main business. Large jobs (50-500+ shirts). Multi-day production.
2. **DTF (Direct to Film)** — High-volume rush orders. Often selling prints only. Interrupt-driven throughout the day.
3. **Embroidery** — Periodic large jobs. Requires digitizer setup. Different equipment/skills.

---

## Journey: New Screen Printing Job (Happy Path)

```text
TRIGGER: Customer calls/emails requesting 200 black tees with front print

PHASE 1: CAPTURE & QUOTE
═══════════════════════════

Step 1: Receive Request
  • Gary gets phone call, email, or social message
  • Information lives in: his head, maybe a scribbled note
  • ⚠️ FRICTION: No quick-capture mechanism. Must remember until he has time.
  • ⚠️ RISK: Can forget if busy. No digital record until quote is started.
  • Time: 2-5 min (call duration)

Step 2: Build Quote in PrintLife
  • Opens PrintLife, clicks "+ NEW QUOTE"
  • 6-step wizard: Add Items → Select QTY → Add Art → Ink Style → Finishing → Overview
  • ⚠️ FRICTION: Qty entry blocks on server recalculation (2-3 min waste)
  • ⚠️ FRICTION: Mandatory Ink Style/Finishing steps even when not needed
  • ⚠️ FRICTION: Quote = Invoice in PrintLife (no separate tracking)
  • Clicks: ~20-30
  • Time: ~10 min (simple), ~15-20 min (complex)

Step 3: Communicate with Customer
  • Sends quote via email/phone
  • ⚠️ FRICTION: No formal quote approval workflow in current system
  • ⚠️ FRICTION: No tracking of "sent" vs "accepted" vs "pending" states
  • Customer responds via email/phone — no centralized record
  • Time: variable (hours to days)

Step 4: Quote Accepted → Job Created
  • In PrintLife, quote IS the invoice — no conversion step
  • Job appears on Invoice Dashboard in DESIGN > ASSIGN lane
  • ⚠️ FRICTION: No explicit "accepted" moment. Just starts working on it.
  • Clicks: ~0 (automatic in PrintLife)

PHASE 2: DESIGN & PREP
═══════════════════════

Step 5: Design / Art Prep
  • Gary reviews art files, creates mockup if needed
  • May need back-and-forth with customer on design changes
  • Uploads mockup to PrintLife
  • ⚠️ FRICTION: Art revision cycle has no structured tracking
  • ⚠️ FRICTION: Customer communication happens outside the system
  • Time: 30 min - several days

Step 6: Screen Prep (Gary does this personally)
  • Select mesh count for each color/screen
  • Apply emulsion, dry screens
  • Burn screens from film positives
  • Register screens on press
  • ⚠️ FRICTION: NO TRACKING in any system. PrintLife has no Screen Room stage.
  • ⚠️ FRICTION: Entirely in Gary's head — which screens for which job
  • ⚠️ FRICTION: If Gary is sick/unavailable, no one knows the screen status
  • Time: 1-4 hours depending on complexity

PHASE 3: PRODUCTION
════════════════════

Step 7: Check Blanks Arrival
  • Verify ordered garments have arrived
  • Count and check for correct sizes/colors
  • ⚠️ FRICTION: No receiving tracking. Manual check against order.
  • ⚠️ FRICTION: If blanks are short/wrong, discovered at press time — delays job
  • Time: 15-30 min

Step 8: Print
  • Gary or employees run the press (automatic or manual printer)
  • Multiple runs for multiple colors
  • ⚠️ FRICTION: No tracking of which run is in progress
  • ⚠️ FRICTION: DTF rush orders interrupt planned production
  • Time: 2-8 hours depending on quantity and colors

Step 9: Quality Check (INFORMAL)
  • Visual inspection of prints
  • ⚠️ FRICTION: No formal QC gate. The embroidery incident — shipped bad
  •   work twice because no checkpoint existed.
  • ⚠️ FRICTION: Employee discretion on "good enough" — no standard
  • Time: 5-15 min (often rushed or skipped)

PHASE 4: FULFILLMENT
═════════════════════

Step 10: Finishing (Fold, Bag, Box)
  • Fold shirts, bag individually if needed
  • Pack into shipping boxes
  • ⚠️ FRICTION: No tracking. Blurs with production.
  • Time: 30 min - 2 hours

Step 11: Ship / Deliver
  • Print shipping label
  • Drop at post office or arrange pickup
  • Some customers pick up in person
  • ⚠️ FRICTION: No automated shipping notification to customer
  • Time: 15-30 min

Step 12: Invoice & Payment
  • Invoice already exists (PrintLife: quote = invoice)
  • Customer pays (various methods)
  • ⚠️ FRICTION: Payment tracking disconnected from production tracking
  • ⚠️ FRICTION: No "job complete but unpaid" visibility
  • Time: variable (days to weeks)

END: Job completed. No record of actual production time or throughput.
```

---

## Journey Variants

### DTF Rush Order (Interrupt-Driven)

```text
TRIGGER: Customer walks in or calls needing DTF prints today

Step 1: Quick intake (verbal/phone)
  • ⚠️ FRICTION: Interrupts planned screen printing work
  • ⚠️ FRICTION: No quick way to log and prioritize against existing work

Step 2: May or may not create a formal quote
  • Small DTF orders often handled informally
  • ⚠️ FRICTION: Revenue not always tracked for small orders

Step 3: Print DTF transfers on large-format printer
  • Run gang sheet through DTF printer
  • Time: 15-60 min depending on quantity

Step 4: Press transfers onto garments (if customer wants pressing)
  • Heat press application
  • Some customers just buy the transfers
  • Time: 10-30 min

Step 5: Hand off to customer or ship
  • Often same-day or next-day delivery
  • Time: 5-15 min

KEY DIFFERENCE: No design phase, no screen prep, no blanks ordering.
Much simpler flow but competes for capacity with screen printing.
```

### Embroidery Job

```text
TRIGGER: Customer requests embroidered hats/jackets/etc.

Step 1-4: Same as Screen Printing (quote, accept, art)

Step 5: Digitize design (INSTEAD of screen prep)
  • Convert artwork to embroidery stitch file
  • Set up digitizer machine
  • ⚠️ FRICTION: Different equipment, different skills than screen printing
  • ⚠️ FRICTION: No tracking of digitizing status in any system
  • Time: 1-4 hours

Step 6: Embroider
  • Run embroidery machine
  • Time: varies greatly by stitch count and quantity

Step 7-12: Same as Screen Printing (QC, finish, ship)

KEY DIFFERENCE: Digitizing replaces screen prep. Different equipment path.
```

---

## Friction Point Summary (Ranked by Impact)

### Critical (Blocks core workflow)

| #   | Friction                                                              | Current Impact                                       | Frequency                  |
| --- | --------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------- |
| 1   | **No quick capture** — opportunities lost when Gary is busy           | Forgotten leads, missed revenue                      | Daily                      |
| 2   | **No capacity awareness** — can't confidently commit delivery dates   | Over-promising, rush stress, late deliveries         | Multiple times/week        |
| 3   | **No quality gate** — shipped bad work (embroidery incident)          | Customer complaints, rework costs, reputation damage | Occasional but devastating |
| 4   | **Screen prep invisible** — no tracking of screens, mesh, burn status | Only Gary knows. Bus factor = 1.                     | Every screen printing job  |

### High (Significant daily friction)

| #   | Friction                                                                    | Current Impact                                       | Frequency           |
| --- | --------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------- |
| 5   | **Wall calendar is single source of truth** — fragile, not shareable        | Can't plan remotely, no backup, limited space        | Constant            |
| 6   | **DTF interrupts disrupt planned work** — no way to assess impact           | Delays screen printing jobs, creates capacity crunch | Several times/day   |
| 7   | **No "what do I work on today?" view** — start each day figuring it out     | Wasted morning time, reactive instead of proactive   | Every morning       |
| 8   | **Quote pipeline has no states** — can't see what's pending, sent, accepted | No sales funnel visibility                           | Multiple times/week |

### Medium (Adds friction, workaround exists)

| #   | Friction                                                                            | Current Impact                                     | Frequency          |
| --- | ----------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------ |
| 9   | **No blocked-item visibility** — waiting on blanks, art, customer — just remembered | Items fall through cracks, surprised at press time | Weekly             |
| 10  | **Customer communication outside system** — email/phone, no central record          | Context lost, have to ask again, no history        | Constant           |
| 11  | **No production analytics** — no idea of throughput, trends, seasonality data       | Can't plan hiring, can't optimize scheduling       | Ongoing blind spot |
| 12  | **Payment disconnected from production** — job done but payment state unknown       | Manual reconciliation needed                       | Per job            |

---

## Time Analysis: Where Does the Day Go?

### Gary's Typical Day (estimated from interview)

| Activity                             | Time      | % of Day | Digital Tool Used |
| ------------------------------------ | --------- | -------- | ----------------- |
| Phone/email (customer communication) | 2 hrs     | 25%      | Email, phone      |
| Quote building                       | 1-2 hrs   | 15-20%   | PrintLife         |
| Screen prep (burn, register)         | 2-3 hrs   | 25-30%   | None              |
| Production oversight & coordination  | 1-2 hrs   | 15-20%   | None (verbal)     |
| Planning (wall calendar, mental)     | 30-60 min | 5-10%    | Wall calendar     |
| Admin (shipping labels, payments)    | 30-60 min | 5-10%    | Various           |

**Key insight**: Gary spends ~65% of his day on activities with NO digital tool support (screen prep, coordination, planning). The biggest opportunity isn't improving what he does in PrintLife — it's digitizing what he currently does from memory and wall calendars.

---

## Capacity Patterns (from Interview)

### Feast or Famine

- Some days: barely any work, employees under-utilized
- Other days: way over capacity, staying late, rushing
- No smoothing mechanism — reactive to incoming orders

### The Delivery Speed Trap

- 4Ink differentiates on fast turnaround
- This leads to over-promising when busy
- User's recommendation: dynamic rush pricing based on queue depth
- System should help answer: "Can we take this on without risking existing commitments?"

### Interrupt Pattern (DTF)

- Large screen printing jobs = planned, multi-day
- DTF orders = unplanned, interrupt-driven, same-day
- These two patterns compete for attention and capacity
- Board must handle both: planned work AND interrupt queue

---

## Related Documents

- `docs/competitive-analysis/jobs-vertical-synthesis.md` — Combined competitive analysis
- `docs/competitive-analysis/printavo-jobs-exploration.md` — Printavo deep-dive
- `docs/competitive-analysis/printlife-jobs-exploration.md` — PrintLife deep-dive
- `discovery-screenshots/NOTES.md` — Playwright screenshot notes
