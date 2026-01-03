import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { authenticate } from "../shopify.server";
import { aiService } from "../services/ai.server";
import { sanitizeUserInput } from "../utils/input-sanitizer";

// Rate limiting: Max requests per minute per shop
const RATE_LIMIT_PER_MINUTE = 10;
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Prompt Enhancement API endpoint
 * POST /api/enhance-prompt
 *
 * Body: JSON with { prompt, context? }
 * Returns: { enhanced, variations[] }
 */
export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  // Rate limiting check
  const now = Date.now();
  const shopLimit = rateLimitMap.get(shop);

  if (shopLimit) {
    if (now < shopLimit.resetTime) {
      if (shopLimit.count >= RATE_LIMIT_PER_MINUTE) {
        return data(
          { error: "Rate limit exceeded. Please wait before enhancing more prompts." },
          { status: 429 }
        );
      }
      shopLimit.count++;
    } else {
      // Reset the counter
      rateLimitMap.set(shop, { count: 1, resetTime: now + 60000 });
    }
  } else {
    rateLimitMap.set(shop, { count: 1, resetTime: now + 60000 });
  }

  // Parse JSON body
  let body: { prompt?: string; context?: { themeStyle?: string; sectionType?: string } };
  try {
    body = await request.json();
  } catch {
    return data({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { prompt, context } = body;

  // Validate prompt
  if (!prompt || typeof prompt !== "string") {
    return data({ error: "Prompt is required and must be a string" }, { status: 400 });
  }

  const trimmedPrompt = prompt.trim();
  if (trimmedPrompt.length === 0) {
    return data({ error: "Prompt cannot be empty" }, { status: 400 });
  }

  if (trimmedPrompt.length > 2000) {
    return data({ error: "Prompt exceeds maximum length of 2000 characters" }, { status: 400 });
  }

  // Sanitize prompt input
  const { sanitized, warnings } = sanitizeUserInput(trimmedPrompt);
  if (warnings.length > 0) {
    console.warn("[api.enhance-prompt] Input sanitization warnings:", warnings);
  }

  try {
    const result = await aiService.enhancePrompt(sanitized, context);

    return data({
      enhanced: result.enhanced,
      variations: result.variations,
    });
  } catch (error) {
    console.error("[api.enhance-prompt] Error:", error);
    return data(
      { error: "Enhancement failed. Please try again." },
      { status: 500 }
    );
  }
}
