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

export async function action({ request }: ActionFunctionArgs) {
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
    const password = formData.get("password");

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
