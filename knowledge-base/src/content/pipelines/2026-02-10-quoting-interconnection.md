---
title: 'Quoting-Customer Interconnection'
subtitle: 'Enhanced CustomerCombobox with lifecycle badges, enriched customer context, and cross-vertical search.'
date: 2026-02-10
phase: 1
pipelineName: quoting
pipelineType: vertical
products: [quotes, customers, invoices]
tools: []
stage: build
tags: [feature, build]
sessionId: '633cdbe3-a795-443a-b712-f03c868b4c2e'
branch: 'session/0210-quoting-interconnection'
status: complete
---

## Summary

This session connects the Customer Management data model to the existing Quoting vertical. The CustomerCombobox now surfaces lifecycle stages, type tags, and contact roles — giving the shop owner richer context when selecting a customer on a quote.

| Stat          | Value |
| ------------- | ----- |
| Files Changed | 3     |
| Tests Passing | 264   |
| Type Errors   | 0     |

## What Changed

### CustomerCombobox — Enriched Dropdown

- **Lifecycle badges** replace legacy tag badges in the dropdown list (prospect, new, repeat, contract with semantic colors)
- **Expanded search** — type "contract", "wholesale", "sports" to filter by lifecycle stage or type tags
- **Enriched info card** when a customer is selected:
  - Company name (prominent, first row)
  - Contact name + role badge (Ordering, Billing, Art Approver, etc.)
  - Email + phone
  - Lifecycle badge + type tag badges (Retail, Sports/School, Corporate, etc.)
  - "View Customer" link → `/customers/{id}` in new tab

### QuoteForm — Customer Option Mapping

Added `customerOptions` useMemo that maps full Customer objects to CustomerOption with a derived `contactRole` from the primary contact. This keeps the combobox interface clean while surfacing rich data.

### QuoteDetailView — Lifecycle Badge

Replaced the legacy `CustomerTag` badge with the `LifecycleBadge` component in the quote detail header. Now shows "Prospect", "New", "Repeat", or "Contract" with matching semantic colors.

## Files Modified

- `components/features/CustomerCombobox.tsx` — Main enhancement
- `app/(dashboard)/quotes/_components/QuoteForm.tsx` — Customer mapping
- `app/(dashboard)/quotes/_components/QuoteDetailView.tsx` — Badge swap

## PR

[#28 — feat: Enhanced CustomerCombobox with lifecycle badges and enriched context](https://github.com/cmbays/mokumo/pull/28)
