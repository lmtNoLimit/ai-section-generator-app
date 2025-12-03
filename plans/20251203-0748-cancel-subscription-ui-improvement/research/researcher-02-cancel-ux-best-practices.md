# Cancel Subscription UX Best Practices Research

**Research Date:** 2025-12-03
**Focus:** Confirmation dialogs, retention strategies, Shopify patterns

---

## 1. CONFIRMATION DIALOG DESIGN

### Modal vs Inline Confirmation
- **Modal dialogs** are standard for destructive subscription actions - keeps users in context without page navigation
- Polaris supports modals for "two-phased commit process" with confirmation messages for important settings
- Clean modals preferred over inline confirmations for subscription cancellations

### Warning Message Content & Tone
**Content Requirements:**
- Be short and clear, use positive imperatives
- Avoid negation like "do not cancel my unsubscription" or "don't cancel"
- Show crystal clear repercussions of canceling in simple wording (bullet points recommended)
- Make explicit what happens next (e.g., "access continues until end of billing period")
- Polite, positive tone: "Thank you for this journey. We hope we'll meet again"

**What to Show:**
- Premium features user will lose (be specific, not generic)
- Billing information (remaining credits, prorated refunds)
- Data loss implications
- Alternative options available

### Action Button Placement & Labeling
**Critical UX Issue:**
- Placing "Cancel Subscription" button next to "Cancel" button creates confusion
- Users can cancel subscription by accident when buttons use similar words

**Best Practice - Button Labeling:**
1. **Primary (safe) action:** "Keep Subscription" or "Keep Plan"
   - "Keep Plan" creates stronger contrast via different terminology
   - Counter-argument: Using different words violates UX consistency - if modal mentions "subscription", button should say "Keep Subscription"

2. **Secondary (destructive) action:** "Cancel Subscription"
   - Name buttons for what they do, not ambiguous terms
   - Use destructive styling (Polaris: destructive buttons for delete/remove actions)

**Avoid:**
- Dismissive labels: "Not Now" or "Maybe Later" (implies future cancellation intent)
- Similar wording on both buttons (forces users to read carefully, which they don't)

**Polaris Patterns:**
- Use delete icon with destructive item in action lists
- Destructive buttons indicate actions that delete or remove data
- Toast notifications for non-disruptive feedback on action outcomes

### Information to Display Before Confirmation
**Personalized Value Loss:**
- Zoom shows precise data: "You'll lose access to 475 cloud recordings"
- Pull attributes from user's account rather than generic benefits
- Financial Times: "before you go" message outlining exactly what subscribers lose
- Telegraph: demonstrates value of exclusive subscriber benefits

**Billing Details:**
- When service ends (date)
- Whether access continues until billing period ends
- Prorated credit information (if applicable)
- No refund policies (if applicable)

---

## 2. RETENTION STRATEGIES

### Common Patterns to Prevent Accidental Cancellations

**Friction Levels:**
1. **Low friction:** Simple "Are you sure?" question
2. **Medium friction:** "Type this word to confirm" approach
3. **High friction:** Multi-step flow (max 5 steps recommended)

**Note:** Balance friction with respect for user's decision - avoid feeling like a trap

### Showing What User Will Lose
- Features they actively use (personalized, data-driven)
- Content/data (cloud recordings, saved items, etc.)
- Credits or remaining subscription value
- Community access or exclusive benefits

### Alternative Options

**1. Pause/Freeze Subscription:**
- Most effective retention strategy
- 51.7% of consumers who are likely to cancel would use pause features if available
- Could potentially keep 9.5M subscribers (PYMNTS research)
- Offer 1-3 month pause periods
- Fulfills customer's need to save money without forcing cancellation

**2. Plan Downgrade:**
- Based on usage patterns and segment data
- Noom example: offers $19/month plan at 65% off (no commitment)
- If user barely engaged after trial: extend trial by 7 days

**3. Discount Offers:**
- Personalized based on cancellation reason
- If "too expensive": offer limited-time discount
- Avoid generic emergency price reductions (hurts long-term retention)

**4. Skip Shipment (for physical subscriptions):**
- If customer says product build-up: suggest skipping next shipment
- Alternative to full cancellation

### Confirmation Steps

**Exit Survey / Feedback Collection:**
- Required field with disabled "Cancel" button until completed
- Make required status clear upfront (avoid error after submission)
- Dropdown with cancellation reasons: "Service no longer needed", "Too expensive", etc.
- Enables presenting customized incentive based on reason
- Micro-surveys gather immediately relevant feedback

**Type to Confirm:**
- Used as intentional friction point
- User must type specific word ("CANCEL") or account name
- Ensures deliberate action, not accidental click
- Should not feel like a trap

**Email Confirmation:**
- Adds security layer
- Prevents cancellations in shared account scenarios
- Password reconfirmation alternative for time-sensitive deletions

---

## 3. SHOPIFY APP PATTERNS

### Standard Patterns in Shopify Ecosystem

**Automatic Cancellation:**
- When app uninstalled, Shopify auto-cancels subscription
- No credit applied for remaining billing period

**App-Initiated Cancellation:**
- Use `appSubscriptionCancel` mutation for programmatic cancellation
- `replacementBehavior` setting options:
  - Disable auto-renewal (subscription continues until billing period ends)
  - Immediate cancel with prorated refunds

**Prorated Credits:**
- Developer chooses whether to issue prorated credits
- Auto-offered on downgrades based on price difference and days remaining
- Can be used toward future Shopify application purchases

**Plan Changes:**
- Upgrade/downgrade prompts merchant to agree to new recurring charge
- Only one active recurring charge per app allowed
- Existing charge cancelled and replaced by new one

**Third-Party Considerations:**
- Pausing/deactivating Shopify store doesn't auto-cancel third-party app subscriptions
- Manual cancellation required to avoid ongoing charges

### Polaris Design System Guidelines for Destructive Actions

**Component Usage:**
- Buttons for primary actions: 'Add', 'Close', 'Cancel', 'Save'
- Plain buttons for less important actions
- Destructive buttons styled distinctly for delete/remove actions
- Modals for confirmations, warnings, focused important tasks

**Feedback Patterns:**
- Toast component for non-disruptive feedback on action outcomes
- For unsuccessful completion: provide info on what prevented action and how to fix
- Clipboard actions: "copied to clipboard" toast within action lists

**Interaction State Guidelines:**
- Successful feedback = informative, not decorative
- Avoid elaborate transitions creating visual noise
- Avoid intense color changes (distracting, unpleasant)
- Consistent treatments create recognizable patterns
- Inconsistent feedback deteriorates pattern integrity and risks merchant confusion

**Delete Actions:**
- "Delete destroys an item or object and completely erases data from the system"
- Use delete icon with destructive item in action lists
- Destructive buttons indicate actions that delete/remove data (e.g., "Delete Product")

---

## 4. MULTI-STEP CANCELLATION FLOW (RECOMMENDED MODEL)

**Step 1: Initial Confirmation**
- Present confirmation screen reminding users of premium features they'll lose
- Encourages reflection on value being given up

**Step 2: Offer Pause Option**
- Before cancellation progresses, offer 1-3 month pause instead
- Customer-friendly for temporary non-use

**Step 3: Reason Collection**
- Ask user to select cancellation reason from list
- Enables valuable feedback capture for service improvement

**Step 4: Retention Offer (if applicable)**
- Based on selected reason and user segment
- Discount, trial extension, or plan downgrade

**Step 5: Final Confirmation**
- Double-check before final cancellation
- Data shows significant % backtrack at this point to accept previous offer

**Guidelines:**
- Never exceed 5 steps
- Best flows offer value immediately
- Use neutral, professional language
- Avoid guilt-inducing language

---

## 5. POST-CANCELLATION EMAIL BEST PRACTICES

**Required Elements:**
1. Confirm cancellation is being processed
2. Communicate when service will end
3. Thank customers for their business
4. Leave positive brand impression

**Additional Opportunities:**
- Provide hook for customers to return (leave door open)
- Avoid generating ill-will (prevents future returns)
- Keep concise and straightforward
- Automate for prompt, efficient communication

---

## 6. REGULATORY CONSIDERATIONS

**FTC "Click to Cancel" Rule:**
- Proposed rule requires companies allow cancellation same way as subscription
- Must be just as easy as subscribing
- Forces development of easy cancellation processes
- Ironically may improve retention by respecting user autonomy

---

## 7. WHAT TO AVOID (DARK PATTERNS)

- Phone-only cancellation (barrier method)
- Hiding cancellation button in endless menus
- Lengthy forms or secret links
- Forced support calls
- Guilt-inducing language
- Generic emergency price reductions (hurts long-term retention)
- Making customers wait for cancellation confirmation
- Elaborate transitions creating visual noise
- Inconsistent confirmation patterns across app

---

## SOURCES

- [Cancellation Flow Examples from Famous SaaS to Reduce Churn](https://userpilot.com/blog/cancellation-flow-examples/)
- [UX writing: an effective 'Cancel' dialog confirmation on Web](https://medium.com/@joaopegb/ux-writing-an-effective-cancel-dialog-confirmation-on-web-539b73a39929)
- [10 cancellation flow examples and why they work](https://medium.com/@benjbrandall/10-cancellation-flow-ux-examples-and-why-they-work-acd4a61b1af0)
- [10 cancellation flow examples and why they work - UX Magazine](https://uxmag.com/articles/10-cancellation-flow-examples-and-why-they-work)
- [When Cancel Buttons Should Not Say "Cancel"](https://uxmovement.com/buttons/when-cancel-buttons-should-not-say-cancel/)
- [Common actions — Shopify Polaris React](https://polaris-react.shopify.com/patterns/common-actions/overview)
- [Common actions — Shopify Polaris](https://polaris.shopify.com/patterns/common-actions)
- [About subscription billing - Shopify Dev](https://shopify.dev/docs/apps/launch/billing/subscription-billing)
- [appSubscriptionCancel - GraphQL Admin](https://shopify.dev/docs/api/admin-graphql/latest/mutations/appSubscriptionCancel)
- [10 Subscription Cancellation Flow Examples You Can Learn From](https://blog.funnelfox.com/cancellation-flow-examples/)

---

## UNRESOLVED QUESTIONS

1. Should we implement pause/freeze functionality in addition to full cancellation?
2. What specific data should we show users (generations used, credits remaining, etc.)?
3. Should we collect cancellation reason feedback? If yes, what options?
4. Do we need email confirmation step or is modal + password sufficient for security?
5. What retention offers make sense for our pricing tiers (if any)?
