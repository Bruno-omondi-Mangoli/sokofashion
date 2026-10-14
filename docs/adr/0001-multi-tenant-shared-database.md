# 0001 Multi-tenant shared database with Row Level Security

Status: accepted

## Context

Many small shops will use the platform. We are a solo developer on free tiers, so running one database per shop is too costly and too much work to maintain.

## Decision

All shops share one database. Every tenant-owned table has a shop_id column and is protected by Row Level Security.

## Consequences

Cheapest to run and simplest to maintain. Isolation depends on correct security rules, so we must write automated tests that try to read and change another shop's data. A mistake in a rule is serious, which is why those tests are required before any feature is built on top.
