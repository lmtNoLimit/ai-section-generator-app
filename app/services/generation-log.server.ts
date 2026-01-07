/**
 * Generation Log Service
 * Immutable audit trail for all AI generations
 */

import prisma from "../db.server";
import type { Subscription } from "@prisma/client";

interface LogGenerationInput {
  shop: string;
  sectionId: string;
  messageId?: string;
  prompt: string;
  tokenCount?: number;
  modelId?: string;
  userTier: "free" | "pro" | "agency";
  wasCharged?: boolean;
  subscription?: Subscription | null; // Pass to calculate correct billing cycle
}

/**
 * Create immutable generation log entry
 * Called after successful code extraction
 */
export async function logGeneration(input: LogGenerationInput) {
  const billingCycle = getBillingCycleStart(input.subscription);

  return await prisma.generationLog.create({
    data: {
      shop: input.shop,
      sectionId: input.sectionId,
      messageId: input.messageId,
      prompt: input.prompt.slice(0, 500), // Truncate for DB optimization
      tokenCount: input.tokenCount,
      modelId: input.modelId ?? "gemini-2.5-flash",
      userTier: input.userTier,
      billingCycle,
      wasCharged: input.wasCharged ?? false,
    },
  });
}

/**
 * Get billing cycle start (calendar month for free, Shopify cycle for paid)
 */
export function getBillingCycleStart(subscription?: Subscription | null): Date {
  if (subscription?.currentPeriodEnd) {
    // Paid: cycle start = period end - 30 days
    const cycleStart = new Date(subscription.currentPeriodEnd);
    cycleStart.setDate(cycleStart.getDate() - 30);
    cycleStart.setHours(0, 0, 0, 0);
    return cycleStart;
  }

  // Free: calendar month start
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  return startOfMonth;
}

/**
 * Count generations for shop in current billing cycle
 */
export async function countGenerationsThisCycle(shop: string): Promise<number> {
  const billingCycle = getBillingCycleStart();

  return await prisma.generationLog.count({
    where: {
      shop,
      generatedAt: { gte: billingCycle },
    },
  });
}
