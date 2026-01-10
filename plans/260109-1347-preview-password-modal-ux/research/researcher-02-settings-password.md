# Research: Password Management System
**Date**: 2026-01-09
**Focus**: Storefront password storage, Settings UI, and App Proxy authentication

---

## 1. ShopSettings Database Model

**File**: `prisma/schema.prisma` (lines 78-101)

```prisma
model ShopSettings {
  storefrontPassword    String?   // Encrypted with AES-256-GCM
  passwordVerifiedAt    DateTime? // Last successful authentication timestamp
  // ... other fields ...
}
```

**Key Design**:
- Password stored encrypted (AES-256-GCM) in MongoDB
- `passwordVerifiedAt` tracks last successful verification
- Never expose decrypted password to client (only status flags)

---

## 2. Settings Route & UI Components

**File**: `app/routes/app.settings.tsx`

**Loader** (lines 28-42):
- Exposes only password status, never the password value
- Returns `hasStorefrontPassword` (boolean) + `passwordVerifiedAt` (ISO timestamp)
- Example: `{ hasStorefrontPassword: true, passwordVerifiedAt: "2026-01-09T..." }`

**Actions** (lines 48-113):
- `intent="saveStorefrontPassword"`: Validates & saves password via `validateAndSaveStorefrontPassword()`
- `intent="clearStorefrontPassword"`: Clears password & cache via `clearStorefrontPasswordAndCache()`
- All password operations use try/catch with user-friendly error messages

**Component Integration** (line 208-211):
```tsx
<StorefrontPasswordSettings
  hasPassword={hasStorefrontPassword}
  verifiedAt={passwordVerifiedAt}
/>
```
Renders dedicated password settings component (exists in `app/components/settings/StorefrontPasswordSettings`)

---

## 3. Password Storage & Encryption Service

**File**: `app/services/settings.server.ts`

**Key Methods**:

| Method | Purpose | Details |
|--------|---------|---------|
| `saveStorefrontPassword(shop, password)` (lines 116-134) | Encrypt & store password | Uses AES-256-GCM encryption, resets verification until confirmed |
| `getStorefrontPassword(shop)` (lines 140-155) | Retrieve decrypted password | Server-only, checks encryption configured |
| `markPasswordVerified(shop)` (lines 161-166) | Update `passwordVerifiedAt` timestamp | Called after successful auth |
| `clearStorefrontPassword(shop)` (lines 171-179) | Nullify password & verification | Cleans both fields |
| `hasStorefrontPassword(shop)` (lines 184-190) | Check if password exists | Boolean check only |

**Encryption Details**:
- Uses `encrypt()` / `decrypt()` from `app/services/encryption.server`
- Requires `ENCRYPTION_KEY` environment variable (throws error if missing)
- All decryption server-side only (never exposed to client)

---

## 4. Validation & App Proxy Authentication

**File**: `app/services/storefront-auth.server.ts` (referenced in settings.tsx)

**Imported Functions**:
- `validateAndSaveStorefrontPassword(shop, password)` (line 87)
  - Validates password works against storefront
  - Saves only if verification succeeds
  - Returns `{ success: boolean, error?: string }`

- `clearStorefrontPasswordAndCache(shop)` (line 104)
  - Clears password from DB
  - Invalidates any cached auth tokens

**Usage in Settings**:
- Form input: `<password>` field (secured, not echoed)
- On save: Sends form data with `intent="saveStorefrontPassword"`
- Server validates password actually works before storing
- Toast notification on success/failure

---

## 5. Security & UX Considerations

| Aspect | Implementation |
|--------|-----------------|
| **Client Security** | Never expose encrypted or decrypted password in response |
| **Storage** | AES-256-GCM encryption with environment key |
| **Validation** | Server tests password against actual storefront before saving |
| **Verification** | Timestamp tracks last successful auth (`passwordVerifiedAt`) |
| **Clear Flow** | User can clear password + cache in one action |
| **Error Handling** | Server catches and returns user-friendly messages |

---

## 6. Code References

| Component | Path | Line Range |
|-----------|------|-----------|
| Settings Route | `app/routes/app.settings.tsx` | 1-216 |
| Preferences Loader | `app/routes/app.settings.tsx` | 28-42 |
| Password Actions | `app/routes/app.settings.tsx` | 79-110 |
| Settings Service | `app/services/settings.server.ts` | 116-190 |
| Password UI Component | `app/components/settings/StorefrontPasswordSettings` | TBD |
| Encryption Service | `app/services/encryption.server` | (encrypt/decrypt) |
| Storefront Auth | `app/services/storefront-auth.server.ts` | (validation logic) |

---

## 7. Password Flow Diagram

```
User Input (Settings UI)
    ↓
Settings Route Action Handler
    ↓
validateAndSaveStorefrontPassword() → Test password against storefront
    ↓
If valid: settingsService.saveStorefrontPassword()
    ├→ encrypt(password) with AES-256-GCM
    ├→ upsert into ShopSettings.storefrontPassword
    └→ reset passwordVerifiedAt to null (pending verification)
    ↓
markPasswordVerified() → Update passwordVerifiedAt timestamp
    ↓
Toast: "Storefront password saved and verified!"
```

---

## Unresolved Questions
1. **StorefrontPasswordSettings Component**: Full UI implementation details (form layout, validation feedback)
2. **App Proxy Authentication**: How `getStorefrontPassword()` is used in actual proxy requests
3. **Cache Invalidation**: Details of `clearStorefrontPasswordAndCache()` implementation (what cache is cleared?)
4. **Password Requirements**: Any min/max length or character validation rules?
