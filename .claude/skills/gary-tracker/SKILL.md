---
name: gary-tracker
description: Auto-detect and track questions for the shop owner (Gary) during interview and research sessions
trigger: Active during interview and research phases. Triggered by uncertainty phrases like "need to ask Gary", "I don't know", "that's a question for the owner"
prerequisites:
  - Active KB doc being written
  - Vertical context established
---

# Gary Tracker

## Overview

During interviews and research sessions, questions arise that only the shop owner (Gary) can answer. This skill automatically detects these moments and embeds structured HTML blocks in the KB doc for later tracking.

The KB site aggregates all Gary questions across sessions into a unified tracker view with status (unanswered/answered), vertical grouping, and answer capture.

## Trigger Phrases

Watch for these patterns in conversation (case-insensitive):

- "I don't know"
- "need to ask Gary" / "ask Gary" / "Gary would know"
- "that's a question for the owner" / "owner decision"
- "we'd need to check" / "need to verify with"
- "not sure about that" / "uncertain"
- "depends on the shop" / "shop-specific"
- "real-world data needed" / "need actual numbers"
- User says "?" or "hmm" followed by deferral
- User explicitly tags something as a Gary question

## Process

### When a trigger is detected:

1. **Confirm with user**: "That sounds like a Gary question — should I tag it?"
   - If yes: proceed
   - If user says the info is available elsewhere: skip

2. **Compose the question block**:
   - Extract the core question from context
   - Write a brief context line explaining why it matters
   - Assign a unique question ID: `{VERTICAL}-q{N}` (increment N per vertical)

3. **Insert the HTML block** into the current KB doc:

```html
<div
  class="gary-question"
  data-question-id="{VERTICAL}-q{N}"
  data-vertical="{VERTICAL}"
  data-status="unanswered"
>
  <p class="gary-question-text">{THE QUESTION}?</p>
  <p class="gary-question-context">{WHY THIS MATTERS — 1-2 sentences}</p>
  <div class="gary-answer" data-answered-date=""></div>
</div>
```

4. **Track the count**: Maintain a running count of Gary questions in the session. Summarize at the end of the KB doc.

### When answering a Gary question:

If the user provides an answer to a previously tagged question during the session:

1. Find the matching question block by ID
2. Update the status: `data-status="answered"`
3. Fill in the answer date: `data-answered-date="YYYY-MM-DD"`
4. Add the answer text inside the `gary-answer` div:

```html
<div class="gary-answer" data-answered-date="2026-02-14">
  <p>{THE ANSWER}</p>
</div>
```

## Question ID Convention

Format: `{vertical}-q{N}`

Examples:

- `quoting-q1`, `quoting-q2`, `quoting-q3`
- `jobs-q1`, `jobs-q2`
- `invoicing-q1`

To find the next ID, check existing KB docs for the vertical:

```bash
gh issue list --repo cmbays/mokumo --label "gary-question" --label "product/{VERTICAL}" --state all --json number --jq 'length'
```

## Proactive Detection

Don't just wait for explicit trigger phrases. Proactively suggest Gary-tagging when:

- User hesitates or gives vague answers about operational details
- Discussion involves pricing, timing, or capacity that varies by shop
- User says "usually" or "it depends" about a process detail
- A design decision requires real-world data the user doesn't have handy

Frame it naturally: "This seems like something Gary would have specific numbers for — want me to tag it as a Gary question?"

## Summary Block

At the end of every interview/research KB doc, include a Gary Questions summary:

```markdown
## Gary Questions

| ID            | Question        | Status                |
| ------------- | --------------- | --------------------- |
| {VERTICAL}-q1 | {Question text} | unanswered            |
| {VERTICAL}-q2 | {Question text} | answered (2026-02-14) |
```

## Tips

- Keep questions specific and actionable — "What's the typical turnaround for a rush order?" not "Tell me about rush orders"
- Include context so Gary understands why it matters without reading the whole doc
- Group related questions when possible — "pricing questions" vs scattered individual items
- Don't over-tag — only questions that genuinely need the shop owner's input
