# Section Preview Rendering Flow Research

**Date**: 2026-01-09 | **Scope**: Preview architecture, error detection, password handling

---

## 1. Current Preview Architecture

### Entry Point: `SectionPreview.tsx` (Lines 1-56)
- Wrapper component that delegates to `AppProxyPreviewFrame`
- Props: `liquidCode`, `deviceSize`, `settingsValues`, `blocksState`, `loadedResources`, `shopDomain`
- No error handling at this level—pure pass-through

### Rendering Path: App Proxy (Server-Side Native)
**Flow**: Client → `/api/preview/render` → App Proxy (`/apps/blocksmith-preview`) → Rendered HTML

1. **Client Hook**: `useNativePreviewRenderer.ts` (Lines 29-185)
   - Debounces code changes (600ms default)
   - Sends POST to `/api/preview/render` with base64-encoded payload
   - Payload includes: code, settings, blocks, product, collection handles
   - Returns: `{ html: string | null, error: string | null, shouldFallback: boolean }`

2. **Server Proxy**: `api.preview.render.tsx` (Lines 81-294)
   - Authenticates user via `authenticate.admin()`
   - Uses `session.shop` (not request body) for SSRF prevention
   - Fetches from `https://{shop}/apps/blocksmith-preview` with authenticated cookies
   - Sanitizes response with DOMPurify before returning HTML
   - Max code size: 100KB; URL threshold: 2000 chars (uses token-based storage for overflow)

3. **Iframe Injection**: `AppProxyPreviewFrame.tsx` (Lines 128-169)
   - Builds full HTML document with srcDoc injection
   - Includes height-reporting script (via postMessage with nonce validation)
   - Includes targeting script for element inspection
   - Renders in sandboxed iframe (allow-scripts only, NOT allow-same-origin)

---

## 2. Error Detection Mechanisms

### 2.1 Password-Protected Store Detection (Critical Flow)

**Line 189-205** (`api.preview.render.tsx`):
```
if (response.status === 302 || response.status === 301) {
  const location = response.headers.get("location") || "";
  if (location.includes("/password")) {
    return {
      error: cookies
        ? "Storefront password expired or invalid"
        : "Store is password-protected - configure password in settings"
    }
  }
}
```

**Line 263-270** (Silent password form detection):
```
if (rawHtml.includes('form_type="storefront_password"') ||
    rawHtml.includes('id="password"')) {
  return { error: "Store is password-protected" }
}
```

### 2.2 Error Propagation Chain
1. **Server errors** → Caught at lines 279-293, returned with mode="fallback"
2. **Client hook** receives response (lines 124-136):
   - If `mode === 'fallback'`: Sets `shouldFallback=true`, `error` message, clears HTML
   - If `result.error`: Throws Error, caught at lines 144-150
3. **UI rendering** (AppProxyPreviewFrame lines 197-205):
   - Error banner displays: `<s-banner tone="warning">{error}</s-banner>`
   - Includes "Retry" button calling `refetch()`

### 2.3 Error States Currently Handled
- ✅ Unauthorized (401) - No session
- ✅ Invalid JSON (400) - Malformed request body
- ✅ Missing code (400) - Required field
- ✅ Oversized code (400) - > 100KB
- ✅ Password redirect (302/301 + /password location)
- ✅ Password form silent detection (HTML content scan)
- ✅ HTTP errors (non-200 responses)
- ✅ Redirect failures (manual redirect follow fails)
- ✅ Timeout (10 second fetch timeout)
- ✅ Abort (request cancelled)

---

## 3. Where Password Errors Surface

### Current Error Display Path
1. **Server detects** password issue at `/api/preview/render` (lines 189-205)
2. **Returns** error message to client hook: `useNativePreviewRenderer`
3. **Hook sets** `error` state with message
4. **UI renders** warning banner: `AppProxyPreviewFrame` lines 197-205

### Error Messages Returned
- **No cookies configured**: `"Store is password-protected - configure password in settings"`
- **Cookies expired/invalid**: `"Storefront password expired or invalid"`
- **Silent password form**: `"Store is password-protected"`

### Current UI (Lines 197-205, AppProxyPreviewFrame.tsx)
```tsx
{error && (
  <s-banner tone="warning" dismissible>
    {error}
    <s-button slot="secondary-actions" variant="tertiary" onClick={refetch}>
      Retry
    </s-button>
  </s-banner>
)}
```

**Issue**: Error message says "configure password in settings" but there's no link/modal to actually do this. User must:
1. Read error
2. Navigate away from preview
3. Find settings (unclear where)
4. Add password
5. Return to preview and retry

---

## 4. App Proxy Authentication Flow

### Cookie Management
**Service**: `getAuthenticatedCookiesForShop()` (imported line 19)
- Retrieves pre-configured cookies from database (session/shop context)
- Returns null if not configured or auth fails
- Cookies added to request headers at line 176:
  ```
  if (cookies) {
    headers.Cookie = cookies;
  }
  ```

### Redirect Handling (Lines 207-242)
- Detects manual redirect on non-password redirects (207)
- Follows redirect with another fetch (216-220)
- Sanitizes final response before returning

### Detection Strategy
1. **Proactive**: Redirect detection (`/password` in location header)
2. **Fallback**: HTML content scanning for password form attributes
3. **Timeout**: 10-second fetch timeout to avoid hanging

---

## 5. Code References Summary

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| Main Preview | `SectionPreview.tsx` | 1-56 | Entry wrapper |
| Rendering Hook | `useNativePreviewRenderer.ts` | 29-185 | Client-side fetch & state mgmt |
| Server Proxy | `api.preview.render.tsx` | 81-294 | Server-side rendering + auth |
| Iframe Container | `AppProxyPreviewFrame.tsx` | 55-280 | HTML injection & error display |
| Iframe Host | `AppProxyPreviewFrame.tsx` | 128-169 | srcDoc HTML with scripts |
| Error Banner | `AppProxyPreviewFrame.tsx` | 197-205 | User-facing error display |
| Auth Service | `storefront-auth.server` | - | Cookie retrieval (not in scope) |

---

## Unresolved Questions

1. Where is `getAuthenticatedCookiesForShop()` implemented? How does password storage work?
2. What app settings/modal currently exist for password configuration?
3. Is there a flow for first-time password setup in the app?
4. How does the storefront auth service detect password-protected stores initially?
5. Are there user-facing docs on why "configure password in settings" message appears?
