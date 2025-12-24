/**
 * API Route: App Proxy Render
 * Handles Shopify App Proxy requests for native Liquid rendering.
 *
 * Storefront URL: https://shop.myshopify.com/apps/blocksmith-preview?code=...
 * Returns: Content-Type: application/liquid for Shopify native rendering
 */

import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

// Max base64 code length (~75KB decoded) to prevent DoS attacks
const MAX_CODE_LENGTH = 100_000;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // HMAC validation + liquid helper from Shopify app package
  const { liquid, session } = await authenticate.public.appProxy(request);

  // Check if app is installed
  if (!session) {
    return liquid(
      `<div style="color: red; padding: 20px;">
        App not installed. Please install Blocksmith first.
      </div>`,
      { layout: false }
    );
  }

  const url = new URL(request.url);
  const liquidCode = url.searchParams.get("code");

  if (!liquidCode) {
    return liquid(
      `<div style="color: orange; padding: 20px;">
        No Liquid code provided.
      </div>`,
      { layout: false }
    );
  }

  // DoS protection: reject oversized payloads
  if (liquidCode.length > MAX_CODE_LENGTH) {
    return liquid(
      `<div style="color: red;">Code exceeds maximum allowed size</div>`,
      { layout: false }
    );
  }

  // Decode base64-encoded Liquid code
  let decodedCode: string;
  try {
    decodedCode = Buffer.from(liquidCode, "base64").toString("utf-8");
  } catch {
    return liquid(
      `<div style="color: red;">Invalid code encoding</div>`,
      { layout: false }
    );
  }

  // Strip schema block (not renderable by Shopify Liquid engine)
  // Handles both {%schema%} and {%-schema-%} whitespace control syntax
  const cleanedCode = decodedCode.replace(
    /{%-?\s*schema\s*-?%}[\s\S]*?{%-?\s*endschema\s*-?%}/gi,
    ""
  );

  // Return Liquid for Shopify to render natively
  return liquid(cleanedCode, { layout: false });
};
