# Billing Bugs & Subscription Tracking Prevention Research
**Date**: 2026-01-07 | **Focus**: Common billing failures, tracking patterns, idempotency, recovery, audit logging

---

## 1. COMMON BILLING BUGS IN AI SAAS APPS

### Critical Issues
- **Duplicate Charges**: Network timeouts + client retries = multiple charges same transaction
- **Usage Meter Failures**: Malformed events, dropped events during downtime, incorrect scaling (common with AI: "one outcome = many events")
- **Reconciliation Gaps**: Usage billed separately from invoicing (Excel manual re-entry = human errors)
- **Unpredictable Bills**: Customers can't forecast spend with usage-based models; drives anxiety & chargebacks
- **Status Mismatch**: Case-sensitivity bugs (Shopify sends "ACTIVE", code expects "active")
- **Cycle Reset Bugs**: Counters not resetting on billing cycle boundary; stale `currentPeriodEnd` causing double-counting

### AI-Specific Risks
- Usage event explosion: 1 generation ≠ 1 charge due to nested API calls & retries
- Unclear cost attribution: Which action triggered $X charge? Hard to trace
- Metering at scale: Events can get lost in distributed systems

---

## 2. PAID USER USAGE TRACKING (CORRECTNESS)

### Design Patterns
1. **Pre-Check + Post-Log**: Verify quota BEFORE action, record usage AFTER success
2. **Immutable Record**: Save UsageRecord to DB immediately (chargeStatus="pending") before calling Shopify
3. **Graceful Degradation**: If Shopify API fails, mark locally but don't block merchant
4. **Timestamp Anchoring**: Tie each record to billing cycle `currentPeriodEnd`, not "now"

### Best Practices
- **Event Normalization**: Map all usage events to single unit (1 generation = 1 record, regardless of API calls behind it)
- **Deduplication at Source**: Use unique IDs per user action (sectionId + timestamp)
- **Retention Policy**: Keep 90+ day audit trail; reconcile monthly
- **Monitoring Alerts**: Log if usage >= 90% quota; flag if patterns change
- **Billing Cycle Anchoring**: Use Shopify's `currentPeriodEnd` as truth, not calendar dates

---

## 3. IDEMPOTENT CHARGE PATTERNS

### How It Works
- Client generates unique `idempotencyKey` per charge attempt
- Format: `${shop}-${sectionId}-${timestamp}` (high entropy, collision-free)
- Server checks if key exists in DB before processing
- If exists: return cached result (no new charge)
- If new: process charge, cache result for 24-48 hours

### Implementation (Current App)
✓ **Already doing**: UsageRecord.idempotencyKey (unique index)
✓ **Already doing**: Timestamp generation prevents collisions per shop/section
⚠️ **Gap**: Key format doesn't include attempt counter (retry storms could reuse same key)
⚠️ **Gap**: No cache expiry strategy documented

### Hardening Strategy
- Store idempotency keys in fast cache (Redis) for 48h fallback to DB
- Reject requests if payload hash differs from cached key
- Implement retry-after backoff (3 retries max, exponential backoff 1-4-8s)
- Log all idempotent hits vs. new attempts for monitoring

---

## 4. FAILED CHARGE RECOVERY

### Shopify's Native Approach
- Usage charges auto-retry on next billing period (deferred, not instant)
- Failed charges moved to next month's invoice
- App cannot directly trigger retry (no API for that)

### Industry Best Practices (Stripe/Stripe Billing)
- **Smart Retries**: ML-driven retry timing (9% better recovery vs. fixed schedule)
- **Recovery Rate**: 56% avg, 65% with smart retries; Chargeflow case: 48% recovered
- **Dunning Process**: Contact customer → offer to update payment method
- **Backup Methods**: Secondary card auto-attempts on primary failure

### Recommended for This App
1. **Passive Retry**: Let Shopify handle (usage rolls to next bill)
2. **FailedUsageCharge Table**: Capture errors for manual ops team review
3. **Weekly Audit**: Query Shopify for disputed charges; track resolution
4. **Customer Comms**: Email merchant if usage charge approaches cap (90%, 100%)
5. **Retry Logic**:
   - Mark failed record: `chargeStatus="error"` + `errorMessage`
   - Scheduled job: Daily check failed charges; retry once if:
     - `retryCount < 3`
     - Last attempt > 24h ago
     - `chargeStatus="error"` only
   - Cap: 3 retries per charge before manual intervention

---

## 5. AUDIT LOGGING FOR DISPUTES

### What to Log (Every Transaction)
```
BillingAuditLog:
  - id, timestamp, shop, action
  - actor (system|webhook|user), source (client|server)
  - resource (Subscription|UsageRecord|Section)
  - before_state, after_state (JSON snapshots)
  - idempotency_key, request_hash
  - response (success|error), error_code, error_msg
  - latency_ms, api_endpoint
  - outcome: created|updated|failed|retried
```

### Compliance Requirements
- **Immutable Storage**: Once written, no delete/update (append-only log)
- **Retention**: 8 years minimum (India Rule 11(g), similar to GDPR/SOX)
- **Access Control**: Only authorized ops team can query; no user access
- **Tamper Detection**: Hash-chain or blockchain approach (detect if modified)

### Dispute Evidence Chain
When customer disputes charge:
1. Pull UsageRecord + BillingAuditLog for that shop/cycle
2. Show: request timestamp, idempotency_key, Shopify response ID, section generated
3. Prove: Merchant approved plan, used feature, charge within terms
4. Output: Export audit trail as PDF for chargeback team

### SaaS Chargeback Prevention
- Document everything: Clear T&S, refund policy, cancellation links
- Dynamic billing descriptor: Include company name + support email
- Pre-renewal alerts: Email merchant 7d before charge
- Easy cancellation: Self-serve in-app cancel (prevent "can't find cancel link" disputes)
- Win rate tracking: Monitor dispute outcomes; <50% win rate = revise evidence package

---

## 6. CURRENT APP GAPS vs. BEST PRACTICES

| Issue | Current State | Risk | Recommended Fix |
|-------|---------------|------|-----------------|
| Idempotency Keys | Format: `${shop}-${sectionId}-${timestamp}` | Retry storms could reuse key | Add attempt counter: `${...}-${attempt}` |
| Charge Failure Handling | FailedUsageCharge table exists but no retry logic | Charges stuck in error state | Implement daily retry job (3 attempts) |
| Billing Audit Logs | No dedicated audit table | Disputes hard to prove; no compliance trail | Create BillingAuditLog (immutable) |
| Status Case Sensitivity | Fixed in getSubscription (case-insensitive) | Edge case: older records uppercase | Migrate all to lowercase; add CI test |
| Graceful Degradation | Error logged, counters increment locally | Risk: Shopify thinks unused, app thinks used | Add reconciliation job (weekly) |
| Pre-renewal Alerts | No email before charge | Customer surprise → chargeback | Send 7d notice before cycle renews |
| Cycle Reset Timing | Tied to Shopify webhook `currentPeriodEnd` | Webhook delay causes late reset | Add scheduled job: daily check for expired cycles |

---

## 7. RECOMMENDED PRIORITY FIXES

### HIGH PRIORITY (Week 1)
1. **Immutable BillingAuditLog table** + logging service
   - Log every billing action (create sub, record usage, cancel, update status)
   - Timestamp, actor, before/after state, error messages
   - Used for dispute evidence

2. **Idempotency Key Hardening**
   - Include attempt counter to prevent retry collisions
   - Test: Trigger 5 rapid retries for same charge; verify only 1 processed

### MEDIUM PRIORITY (Week 2)
3. **Failed Charge Recovery Job**
   - Daily scan FailedUsageCharge table
   - Retry failed charges (max 3 attempts, 24h+ apart)
   - Alert ops if >5 consecutive failures (possible API issue)

4. **Pre-renewal Email**
   - 7 days before `currentPeriodEnd`, email merchant
   - Show estimated charge (base + overage projection)
   - Link to billing dashboard

### LOW PRIORITY (Week 3+)
5. **Billing Reconciliation Service**
   - Weekly: Query Shopify for all charges in past 30d
   - Compare to local UsageRecord table
   - Log any deltas (missing, orphaned, disputed)

---

## UNRESOLVED QUESTIONS
1. Where is the Shopify webhook handler for `APP_SUBSCRIPTIONS_UPDATE`? (Confirm file location)
2. Is `FailedUsageCharge` model being used? (No retry logic found in codebase)
3. Is pre-renewal email notification implemented? (No evidence found)
4. What's the SLA if Shopify API is down? (Current: charges queued locally, but no retry job)
5. How are disputes/chargebacks currently being tracked? (No chargeback management integration found)

---

**Sources**:
- [Paid.ai: Usage-Based Pricing & AI Breaking It](https://paid.ai/blog/ai-monetization/usage-based-pricing-for-saas-what-it-is-and-how-ai-agents-are-breaking-it)
- [Orb: Common Usage-Based Billing Errors](https://www.withorb.com/blog/three-common-usage-based-billing-errors-and-how-to-solve-them)
- [Stripe: Smart Retries](https://docs.stripe.com/billing/revenue-recovery/smart-retries)
- [Airbnb Engineering: Avoiding Double Payments](https://medium.com/airbnb-engineering/avoiding-double-payments-in-a-distributed-payments-system-2981f6b070bb)
- [API Dog: Payment Idempotency](https://apidog.com/blog/payment-api-idempotency/)
- [Chargeflow: Failed Payment Recovery](https://stripe.com/customers/chargeflow)
- [Justt: SaaS Chargeback Prevention](https://justt.ai/blog/saas-chargeback-prevention/)
- [AuditBoard: Audit Trails](https://auditboard.com/blog/what-is-an-audit-trail)
- [HubiFi: Immutable Audit Trails](https://www.hubifi.com/blog/immutable-data-stripe)
