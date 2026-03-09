---
title: 'ADR-005: Service Type Polymorphism'
description: 'Quotes and jobs share a single architecture with service-type-specific configuration rather than separate modules per service type.'
category: decision
status: active
adr_status: accepted
adr_number: 005
date: 2026-03-08
depends_on: []
---

# ADR-005: Service Type Polymorphism

## Status

Accepted

## Context

Screen printing, DTF (direct-to-film), and embroidery have meaningfully different pricing axes, production stages, and artwork metadata requirements. One approach is to build a separate quote/job module for each service type. The alternative is a shared architecture where service-type-specific behavior is expressed through configuration rather than separate code paths.

Separate modules guarantee clean separation but introduce duplication of every shared concept — customers, sequence numbers, status workflows, invoicing, payments — across all service types. Changes to shared concepts must be made in multiple places.

## Decision

Quotes and jobs use a shared architecture. Service-type-specific behavior (pricing config, production stage templates, artwork metadata fields, print config) is expressed through a `service_type` discriminator and associated config records rather than separate entity trees. Line items are polymorphic per service type.

## Consequences

All service types share customers, sequence numbers, status workflows, invoicing, and payment logic automatically. New service types can be added by defining config without duplicating the core quote/job/invoice structure. The trade-off is that the shared model must accommodate all service types, which requires careful schema design to avoid bloating shared entities with type-specific fields. Service-type-specific config is isolated in dedicated config tables to keep the core tables clean.
