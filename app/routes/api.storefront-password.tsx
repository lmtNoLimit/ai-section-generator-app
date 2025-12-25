/**
 * API Route: Get Storefront Password for Browser-Side Authentication
 *
 * Returns the decrypted storefront password for the current session's shop.
 * Used by the preview iframe to authenticate against password-protected stores.
 *
 * Security:
 * - Requires authenticated admin session
 * - Password only returned to the shop's own admin users
 * - Uses encrypted storage with AES-256-GCM
 */

import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { authenticate } from "../shopify.server";
import { settingsService } from "../services/settings.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);

  if (!session) {
    return data({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const password = await settingsService.getStorefrontPassword(session.shop);

    return data({
      hasPassword: !!password,
      password: password || null,
      shop: session.shop,
    });
  } catch (error) {
    console.error("[StorefrontPassword] Error:", error);
    return data({ error: "Failed to retrieve password" }, { status: 500 });
  }
}
