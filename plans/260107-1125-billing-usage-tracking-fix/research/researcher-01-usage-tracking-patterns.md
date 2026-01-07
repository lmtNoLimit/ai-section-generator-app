# SaaS Usage Tracking & Billing Best Practices Research

## Executive Summary

Two primary architectures dominate production SaaS billing: **immutable event logs** (event sourcing) for real-time accuracy & flexibility, vs **counter-based aggregation** for simplicity. Shopify Billing API supports both hybrid approaches. Free tier abuse prevention requires multi-layer defense: disposable email blocking, device fingerprinting, phone verification, IP monitoring.

---

## 1. Usage Tracking Architectures

### Event-Based (Immutable Log) Model
- **How it works**: Each usage action creates immutable event record; aggregated into metrics at billing time
- **Throughput**: Lago handles 15K+ events/sec; Stripe Meter Events: 1K/sec standard, 10K/sec with batching
- **Advantages**:
  - Real-time data accuracy & flexibility
  - Easy metric changes without re-integration
  - Lower fraud risk (complete audit trail)
  - Better for high-frequency operations (token counts, API calls)
- **Drawbacks**: Higher infrastructure complexity, increased storage overhead

### Counter-Based (Metered Aggregation) Model
- **How it works**: Periodic aggregation of usage snapshots; requires manual data pipeline setup
- **Advantages**: Simpler architecture, lower overhead for stable pricing
- **Drawbacks**:
  - Lossy metrics (loses granularity between aggregations)
  - Slow pricing updates (requires re-integration)
  - Difficult for dynamic contracts
  - Higher under-billing risk if aggregation fails

### Recommended Hybrid Approach
- **Production pattern**: Event-based ingestion + in-memory aggregation + periodic batch settlement
- **Benefits**: Low latency, scalable, maintains audit trail durability
- **Caveat**: Requires 24hr backup windows to prevent data loss during node failures

---

## 2. Anti-Fraud Patterns for Free Tier Abuse

### Create-Delete Loop Prevention
**Problem**: Users create multiple accounts to reset free quotas infinitely

**Multi-Layer Defense Stack**:
1. **Disposable Email Blocking** - Block all known disposable domains (Temp Mail, 10Minutemail, etc.)
2. **Device Fingerprinting** - Track hardware config + location; flag repeat offenders
3. **Phone Verification** - SMS validation; harder/costlier to obtain multiple numbers than emails
4. **IP Address Monitoring** - Rate-limit signups per IP; block after N accounts from same source
5. **Credit Card Verification** - $0 pre-authorization; filters ~90% of casual abusers
6. **OAuth/Social Login** - Outsource identity verification to Google/GitHub/LinkedIn
7. **Strategic Free Tier Design** - Limit valuable features (not actions); e.g., watermark exports instead of action count limits

**Time-Limited Trials**: 14-30 day expiration prevents indefinite abuse via new accounts

**Engagement Requirement**: Force account-specific setup (projects, configs, data); makes re-creation tedious

### Early Detection Metrics
- Free-to-paid conversion <10% with high free signup suggests abuse
- >30% of signups from disposable emails = active fraud ring
- 3+ accounts from same IP in 24hrs = suspicious pattern

---

## 3. Usage Audit Trail Best Practices

### Immutability Requirement
- **Core principle**: Append-only logging; no modification/deletion of historical records
- **Implementation options**:
  - **WORM Storage** (Write-Once-Read-Many) - Traditional but requires special infrastructure
  - **Cryptographic Hashing** - Hash chain each record; tampering immediately detectable
  - **Amazon QLDB** - Quantum Ledger DB handles crypto verification automatically
  - **SQL Chaining** (startup-friendly) - Keep records simple; add hash verification in app layer

### Financial Ledger Pattern (Critical for Billing)
- **Rule**: Funds "move," never "change"; track balance-before + balance-after for every entry
- **Idempotency Keys**: Mandatory on all transactions to prevent double-charging on retries
- **Result**: Current balance deterministically derives from cumulative history (provably auditable)

### Access Control & Security
- Role-based audit log access (read-only for finance, no modification for anyone)
- Encrypt logs in transit + at rest
- Export/stream to SIEM (Splunk, AWS CloudWatch) for forensic analysis
- Digital signatures for chain-of-custody verification

### Adoption Reality Check
- **IDC finding**: 82% of large enterprises use immutable storage or cryptographic signatures
- If implementing now, audit friction increases; past breaches become harder to investigate

---

## 4. Shopify Billing API Integration Patterns

### Usage-Based Subscriptions
- **Mutation**: `appSubscriptionCreate` with `cappedAmount` (max merchant pays per cycle)
- **Usage Recording**: Call `createUsageRecord()` for each billable event
- **Cycle**: 30-day billing period; merchant charged at cycle end
- **Key constraint**: Calls should be infrequent (batch in $10 chunks, not per-action)

### Combining Recurring + Usage Charges
- Plan structure: 1 recurring + 1 usage line item (only if recurring interval = 30 days)
- **Example**: $99/month base + $0.10 per generated section
- Avoids merchant fatigue from confirmation dialogs

### Webhook Monitoring
- `APP_SUBSCRIPTIONS_UPDATE` - Merchant changes capped amount
- `APP_SUBSCRIPTIONS_APPROACHING_CAPPED_AMOUNT` - Trigger at 90% cap (send warning email)

### Best Practice: Bulk Metering
Instead of:
```graphql
createUsageRecord(quantity: 1)  // Per section generated
```

Use:
```graphql
createUsageRecord(quantity: 10)  // Every 10 sections (batch settlement)
```

Reduces Shopify API calls, improves merchant UX (fewer billing notifications)

---

## 5. Technical Debt Risk Assessment

### Current Blocksmith Gaps
- **No immutable audit trail** for usage events → hard to dispute charges later
- **No idempotency keys** on billing mutations → vulnerable to duplicate charges if webhooks retry
- **No anti-fraud mechanisms** on free tier → "generate-delete-repeat" exploits available
- **Missing usage preview** before billing → poor UX for approaching capped amount

### Implementation Priority (YAGNI order)
1. **Critical**: Immutable usage ledger + idempotency guards (legal/compliance requirement)
2. **High**: Anti-fraud for free tier (cost control)
3. **Medium**: Webhook monitoring for capped amount (UX)
4. **Low**: Usage dashboard (nice-to-have analytics)

---

## Sources

### Event-Based Architecture
- [AWS SaaS Architecture Fundamentals: Metering](https://docs.aws.amazon.com/whitepapers/latest/saas-architecture-fundamentals/metering-metrics-and-billing.html)
- [WarpStream: Serverless Usage-Based Billing Anatomy](https://www.warpstream.com/blog/anatomy-of-a-serverless-usage-based-billing-system)
- [Orb: Metered Billing vs Usage-Based Billing](https://www.withorb.com/blog/metered-billing-vs-usage-based-billing-what-are-the-key-differences)

### Free Tier Abuse Prevention
- [Clearout: SaaS Free Trial Abuse Prevention](https://clearout.io/blog/saas-free-trial-abuse-prevention/)
- [Togai: Free Trial Abuse Prevention Guide](https://www.togai.com/blog/saas-free-trial-abuse-prevention/)
- [Geocodio: Preventing Free Tier Abuse](https://www.geocod.io/code-and-coordinates/2025-02-19-preventing-abuse/)

### Audit Trail & Immutability
- [DEV Community: Immutable Audit Logs for Health SaaS](https://dev.to/beck_moulton/immutable-by-design-building-tamper-proof-audit-logs-for-health-saas-22dc)
- [Medium: Building Audit Logs for Applications](https://medium.com/@tony.infisical/guide-to-building-audit-logs-for-application-software-b0083bb58604)
- [WebDigest: Monetization Engine High-Integrity SaaS Billing](https://www.webdigestpro.com/architecting-an-abstract-monetization-engine-a-technical-guide-to-high-integrity-saas-billing/)

### Shopify Billing API
- [Shopify: Create Usage-Based Subscriptions](https://shopify.dev/docs/apps/launch/billing/subscription-billing/create-usage-based-subscriptions)
- [Shopify: Billing Cycle Overview](https://www.shopify.com/partners/blog/getting-paid-an-overview-of-shopify-app-billing-cycles)
- [Gadget: Shopify App Billing Guide](https://docs.gadget.dev/guides/plugins/shopify/billing)

### Stripe Metering (Reference)
- [Stripe: Record Usage for Billing](https://docs.stripe.com/billing/subscriptions/usage-based/recording-usage-api)
- [Stripe: Meter Usage Analytics](https://docs.stripe.com/billing/subscriptions/usage-based/analytics)

---

**Document Generated**: 2026-01-07 | **Research Scope**: Production billing patterns, 2025-2026 adoption trends
