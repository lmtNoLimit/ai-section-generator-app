# Phase 3: Create API Route for Password Save

**Context**: [plan.md](./plan.md) | **Effort**: 1h | **Dependencies**: None (parallel with Phase 1-2)

## Overview

Create dedicated API route `/api/preview/configure-password` for saving storefront password from the preview context. Reuses existing `validateAndSaveStorefrontPassword()` service.

## Requirements

1. Authenticate admin session
2. Accept password from form data
3. Validate password against storefront
4. Save encrypted password if valid
5. Return JSON response with success/error

## Architecture

```
POST /api/preview/configure-password
Content-Type: application/x-www-form-urlencoded

Body: password=<user_input>

Response (success):
{ "success": true }

Response (error):
{ "success": false, "error": "Invalid storefront password" }
```

**Security**:
- Uses `authenticate.admin()` - requires valid Shopify session
- Password never returned in response
- Uses existing AES-256-GCM encryption for storage
- Validates password works before storing

## Related Code Files

| File | Relevance |
|------|-----------|
| `app/routes/app.settings.tsx` | Pattern: action handler for password save (lines 79-99) |
| `app/services/storefront-auth.server.ts` | Service: `validateAndSaveStorefrontPassword()` |
| `app/routes/api.storefront-password.tsx` | Existing API pattern |

## Implementation Steps

### Step 1: Create route file

```bash
touch app/routes/api.preview.configure-password.tsx
```

### Step 2: Implement action handler

```tsx
/**
 * API Route: Configure Storefront Password from Preview Context
 *
 * Validates and saves storefront password for password-protected stores.
 * Called from PasswordConfigModal when user enters password in preview.
 *
 * Security:
 * - Requires authenticated admin session
 * - Password validated against storefront before saving
 * - Stored encrypted with AES-256-GCM
 */

import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { authenticate } from "../shopify.server";
import { validateAndSaveStorefrontPassword } from "../services/storefront-auth.server";

interface ActionResponse {
  success: boolean;
  error?: string;
}

export async function action({ request }: ActionFunctionArgs): Promise<Response> {
  // Require authenticated session
  const { session } = await authenticate.admin(request);

  if (!session) {
    return data<ActionResponse>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Only accept POST
  if (request.method !== "POST") {
    return data<ActionResponse>(
      { success: false, error: "Method not allowed" },
      { status: 405 }
    );
  }

  try {
    const formData = await request.formData();
    const password = formData.get("password") as string;

    // Validate input
    if (!password || typeof password !== "string" || password.length < 1) {
      return data<ActionResponse>(
        { success: false, error: "Password is required" },
        { status: 400 }
      );
    }

    // Validate and save password
    const result = await validateAndSaveStorefrontPassword(
      session.shop,
      password
    );

    if (result.success) {
      console.log(
        "[ConfigurePassword] Password saved successfully for",
        session.shop
      );
      return data<ActionResponse>({ success: true });
    }

    // Validation failed (invalid password)
    return data<ActionResponse>(
      { success: false, error: result.error || "Invalid password" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[ConfigurePassword] Error:", error);
    return data<ActionResponse>(
      { success: false, error: "Failed to save password" },
      { status: 500 }
    );
  }
}

// No loader - action only endpoint
export function loader() {
  return data({ error: "Method not allowed" }, { status: 405 });
}
```

### Step 3: Verify route registration

React Router v7 auto-registers routes from `app/routes/` directory based on filename:
- `api.preview.configure-password.tsx` → `/api/preview/configure-password`

No additional configuration needed.

## Comparison with Existing Settings Route

| Aspect | app.settings.tsx | api.preview.configure-password.tsx |
|--------|------------------|-------------------------------------|
| Authentication | `authenticate.admin()` | `authenticate.admin()` |
| Service call | `validateAndSaveStorefrontPassword()` | `validateAndSaveStorefrontPassword()` |
| Response format | `{ success, message, error }` | `{ success, error }` |
| Use case | Full settings page | Preview modal only |
| Intent handling | Multi-intent with switch | Single purpose |

## Todo List

- [ ] Create `app/routes/api.preview.configure-password.tsx`
- [ ] Implement action handler with authentication
- [ ] Add input validation
- [ ] Handle success/error responses
- [ ] Test with valid and invalid passwords

## Success Criteria

- [ ] Route responds to POST requests
- [ ] Returns 401 for unauthenticated requests
- [ ] Returns 400 for missing password
- [ ] Returns success for valid password
- [ ] Returns error message for invalid password
- [ ] Password saved encrypted in database

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Auth bypass | Very Low | Critical | Uses existing authenticate.admin() |
| Password leak in logs | Low | High | Only log shop, never password |
| Encryption key missing | Low | High | Error caught by settingsService |

## Testing Commands

```bash
# Manual test (requires valid session - use browser devtools)
# In browser console on app page:
fetch('/api/preview/configure-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: 'password=testpassword'
}).then(r => r.json()).then(console.log)
```
