---
title: 'APP_FLOW_STANDARD'
description: 'Template and process for writing APP_FLOW documentation. Defines required sections, user journey format, and state definitions.'
category: reference
status: active
phase: all
last_updated: 2026-02-04
last_verified: 2026-02-07
depends_on: []
---

# APP_FLOW Standard

---

## Overview

APP_FLOW.md documents **every screen, route, and user journey** for an application or tool. It serves as the authoritative reference for:

- How users navigate through the interface
- What triggers each flow
- Decision points and branching logic
- Success and error states
- Screen inventory with routes

This standard defines HOW to create APP_FLOW documentation for any playground or tool in this project.

---

## Why APP_FLOW Matters

Without APP_FLOW documentation:

- Agents guess how users move through the interface
- Navigation inconsistencies emerge
- Error states are forgotten
- User journeys aren't tested end-to-end

With APP_FLOW documentation:

- Every path is explicit and testable
- Agents build exactly what's specified
- Design reviews can verify flows are implemented
- New team members understand the tool quickly

---

## Template Structure

Every APP_FLOW document must include these sections:

### 1. Tool Overview

```markdown
## Tool Overview

**Name**: [Tool Name]
**Purpose**: [One sentence describing what the tool does]
**Primary User**: [Who uses this tool]
**Entry Points**: [How users discover/access this tool]
```

### 2. Screen Inventory

List every screen/view with its route:

```markdown
## Screen Inventory

| Screen        | Route/State         | Description                   |
| ------------- | ------------------- | ----------------------------- |
| Home          | `/` or default view | Landing state when tool opens |
| [Screen Name] | [route or state]    | [Brief description]           |
| [Screen Name] | [route or state]    | [Brief description]           |
```

### 3. User Journeys

Document each distinct user journey. A journey is a sequence of steps to accomplish a goal.

```markdown
## User Journeys

### Journey 1: [Journey Name]

**Goal**: [What the user is trying to accomplish]
**Trigger**: [What initiates this journey]
**Prerequisites**: [What must be true before starting]

#### Flow

1. **[Step Name]**
   - User action: [What the user does]
   - System response: [What happens]
   - Next: [Where they go next]

2. **[Step Name]**
   - User action: [What the user does]
   - System response: [What happens]
   - Decision point: [If applicable]
     - If [condition A]: [Go to step X]
     - If [condition B]: [Go to step Y]

3. **[Step Name]**
   - ...

#### Success State

- [What the user sees when journey completes successfully]
- [Any confirmation or feedback]

#### Error States

| Error Condition | User Sees             | Recovery Action  |
| --------------- | --------------------- | ---------------- |
| [Condition]     | [Error message/state] | [How to recover] |
```

### 4. Navigation Map

A visual or textual representation of how screens connect:

```markdown
## Navigation Map

[Screen A] --action--> [Screen B]
[Screen B] --action--> [Screen C]
[Screen B] --back--> [Screen A]
[Screen C] --complete--> [Screen A]
```

Or use Mermaid for visual representation:

```markdown
## Navigation Map

​`mermaid
flowchart TD
    A[Home] -->|Click Start| B[Setup]
    B -->|Configure| C[Main View]
    C -->|Complete| D[Results]
    D -->|Reset| A
    C -->|Cancel| A
​`
```

### 5. State Definitions

Document important UI states:

```markdown
## State Definitions

### Empty State

- **When**: [Condition that triggers empty state]
- **Shows**: [What the user sees]
- **Action**: [What the user can do]

### Loading State

- **When**: [Condition that triggers loading]
- **Shows**: [Loading indicator description]
- **Duration**: [Expected duration or timeout]

### Error State

- **When**: [Condition that triggers error]
- **Shows**: [Error message/UI]
- **Recovery**: [How user recovers]
```

### 6. Keyboard Shortcuts (if applicable)

```markdown
## Keyboard Shortcuts

| Key     | Action      | Context              |
| ------- | ----------- | -------------------- |
| `Esc`   | Close modal | When modal is open   |
| `Enter` | Submit      | When form is focused |
| `?`     | Show help   | Global               |
```

---

## Process for Creating APP_FLOW

### Step 1: Identify the Tool's Purpose

Answer these questions:

1. What is the primary task users accomplish?
2. Who are the users?
3. How do they discover this tool?

### Step 2: Inventory All Screens

Walk through the tool and list every distinct view/state:

- What screens exist?
- What routes or state changes trigger them?
- What's the hierarchy (main views vs sub-views)?

### Step 3: Map User Journeys

For each major task, trace the path:

1. Where does the user start?
2. What actions do they take?
3. What decisions do they face?
4. Where do they end up?

### Step 4: Document States

For each screen, identify:

- Default state (with data)
- Empty state (no data)
- Loading state (waiting)
- Error state (something wrong)
- Success state (action completed)

### Step 5: Validate with Walkthrough

Walk through each journey as a user would:

- Is every step documented?
- Are all decision points captured?
- Are error recoveries clear?

---

## Example: Minimal APP_FLOW

```markdown
# APP_FLOW: Settings Panel

## Tool Overview

**Name**: Settings Panel
**Purpose**: Configure user preferences
**Primary User**: Any user
**Entry Points**: Gear icon in header

## Screen Inventory

| Screen          | Route/State       | Description                |
| --------------- | ----------------- | -------------------------- |
| Settings List   | default           | List of setting categories |
| Category Detail | selected category | Settings for one category  |
| Confirmation    | after save        | Success feedback           |

## User Journeys

### Journey 1: Change a Setting

**Goal**: Modify a configuration value
**Trigger**: User clicks gear icon
**Prerequisites**: None

#### Flow

1. **Open Settings**
   - User action: Click gear icon
   - System response: Settings panel opens with category list
   - Next: Select category

2. **Select Category**
   - User action: Click category name
   - System response: Show settings for that category
   - Next: Modify setting

3. **Modify Setting**
   - User action: Change value (toggle, input, select)
   - System response: Mark as modified (unsaved indicator)
   - Next: Save or Cancel

4. **Save Changes**
   - User action: Click Save button
   - System response: Persist changes, show confirmation
   - Decision point:
     - If save succeeds: Show success toast, close panel
     - If save fails: Show error message, keep panel open

#### Success State

- Toast notification: "Settings saved"
- Panel closes
- Changes take effect immediately

#### Error States

| Error Condition | User Sees                           | Recovery Action |
| --------------- | ----------------------------------- | --------------- |
| Network error   | "Could not save. Check connection." | Retry button    |
| Invalid value   | Field highlighted red with message  | Correct value   |

## Navigation Map

​`mermaid
flowchart TD
    A[Closed] -->|Click gear| B[Settings List]
    B -->|Click category| C[Category Detail]
    C -->|Save| D{Success?}
    D -->|Yes| E[Toast + Close]
    D -->|No| F[Error State]
    F -->|Retry| C
    C -->|Cancel| B
    B -->|Close| A
​`

## State Definitions

### Empty State

- **When**: Category has no settings
- **Shows**: "No settings available for this category"
- **Action**: User can select different category

### Loading State

- **When**: Saving changes
- **Shows**: Spinner on Save button, button disabled
- **Duration**: Typically < 1s

### Error State

- **When**: Save fails
- **Shows**: Red banner with error message
- **Recovery**: Retry button or fix invalid values
```

---

## Checklist for APP_FLOW Review

Before considering an APP_FLOW document complete:

- [ ] Tool overview is clear and complete
- [ ] All screens are inventoried with routes/states
- [ ] Every user journey has explicit steps
- [ ] Decision points show all branches
- [ ] Success states are defined
- [ ] Error states have recovery paths
- [ ] Empty states are documented
- [ ] Loading states are documented
- [ ] Navigation map shows all connections
- [ ] Keyboard shortcuts listed (if applicable)

---

## Related Documents

- [FRONTEND_GUIDELINES.md](../reference/FRONTEND_GUIDELINES.md) - Design system and components
- [PLAYGROUND_AUDIT_PROTOCOL.md](./PLAYGROUND_AUDIT_PROTOCOL.md) - Quality checklist
- [WORKFLOW_STAGES.md](../reference/WORKFLOW_STAGES.md) - Development workflow

---

## Version History

| Date       | Change                   |
| ---------- | ------------------------ |
| 2026-02-04 | Initial standard created |
