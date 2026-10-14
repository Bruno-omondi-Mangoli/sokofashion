# 0002 Buyers pay the seller directly

Status: accepted

## Context

Taking a commission would require all buyer money to pass through the platform. That brings licensing, payout and reconciliation risk and a large amount of build work.

## Decision

Buyers pay the seller directly. The platform never holds seller funds. The platform earns through subscriptions only.

## Consequences

Simpler and safer to build and operate. Payment confirmation must rely on provider data or verified transaction codes recorded on the seller's side. A commission model remains possible later through a switched-off per-shop field, but would need legal advice first.
