/**
 * Feature Gate Service
 *
 * Centralized feature gating logic for plan-based access control.
 * Gates features by checking subscription plan's featureFlags array.
 */

import { getPlanConfig, getSubscription } from "./billing.server";
import prisma from "../db.server";
import type { FeatureFlag, PlanTier } from "../types/billing";

/**
 * Result from feature access check
 */
export interface FeatureGateResult {
  allowed: boolean;
  reason?: string;
  upgradeRequired?: PlanTier;
}

/**
 * Features summary for UI display
 */
export interface FeaturesSummary {
  canPublish: boolean;
  canLivePreview: boolean;
  canChatRefine: boolean;
  refinementLimit: number;
  refinementUsed: number;
  teamSeatLimit: number;
  planName: PlanTier;
}

/**
 * Check if shop has access to a specific feature
 */
export async function hasFeature(shop: string, feature: FeatureFlag): Promise<boolean> {
  const subscription = await getSubscription(shop);
  const planName: PlanTier = (subscription?.planName as PlanTier) ?? "free";
  const plan = await getPlanConfig(planName);
  return plan.featureFlags.includes(feature);
}

/**
 * Get refinement limit for shop based on plan
 * Free: 0, Pro: 5, Agency: Infinity
 */
export async function getRefinementLimit(shop: string): Promise<number> {
  const subscription = await getSubscription(shop);
  if (!subscription) return 0;
  if (subscription.planName === "agency") return Infinity;
  if (subscription.planName === "pro") return 5;
  return 0;
}

/**
 * Get team seat limit for shop based on plan
 * Free/Pro: 1, Agency: 3
 */
export async function getTeamSeatLimit(shop: string): Promise<number> {
  const subscription = await getSubscription(shop);
  if (subscription?.planName === "agency") return 3;
  return 1;
}

/**
 * Get refinement count for a conversation
 * Counts assistant messages (each = 1 refinement turn)
 */
export async function getConversationRefinementCount(conversationId: string): Promise<number> {
  const count = await prisma.message.count({
    where: {
      conversationId,
      role: "assistant",
      isError: false,
    },
  });
  return count;
}

/**
 * Check feature access with detailed result for UI
 */
export async function checkFeatureAccess(
  shop: string,
  feature: FeatureFlag
): Promise<FeatureGateResult> {
  const hasAccess = await hasFeature(shop, feature);
  if (hasAccess) return { allowed: true };

  const requiredPlan = getRequiredPlan(feature);

  return {
    allowed: false,
    reason: `${formatFeatureName(feature)} requires ${requiredPlan} plan`,
    upgradeRequired: requiredPlan,
  };
}

/**
 * Check refinement access with limit tracking
 */
export async function checkRefinementAccess(
  shop: string,
  conversationId: string
): Promise<FeatureGateResult & { used: number; limit: number }> {
  const subscription = await getSubscription(shop);
  const planName = (subscription?.planName as PlanTier) ?? "free";

  // Free tier: no refinement
  if (planName === "free") {
    return {
      allowed: false,
      reason: "Chat refinement requires Pro plan",
      upgradeRequired: "pro",
      used: 0,
      limit: 0,
    };
  }

  const limit = await getRefinementLimit(shop);
  const used = await getConversationRefinementCount(conversationId);

  // Agency: unlimited
  if (limit === Infinity) {
    return { allowed: true, used, limit: Infinity };
  }

  // Pro: 5 turns per conversation
  if (used >= limit) {
    return {
      allowed: false,
      reason: `Refinement limit reached (${used}/${limit})`,
      upgradeRequired: "agency",
      used,
      limit,
    };
  }

  return { allowed: true, used, limit };
}

/**
 * Get features summary for UI display
 */
export async function getFeaturesSummary(
  shop: string,
  conversationId?: string
): Promise<FeaturesSummary> {
  const subscription = await getSubscription(shop);
  const planName = (subscription?.planName as PlanTier) ?? "free";
  const plan = await getPlanConfig(planName);

  const canPublish = plan.featureFlags.includes("publish_theme");
  // Live preview is available for ALL plans to showcase app value
  // The conversion trigger is publishing (gated to Pro+), not previewing
  const canLivePreview = true;
  const canChatRefine = plan.featureFlags.includes("chat_refinement");

  const refinementLimit = await getRefinementLimit(shop);
  const refinementUsed = conversationId
    ? await getConversationRefinementCount(conversationId)
    : 0;
  const teamSeatLimit = await getTeamSeatLimit(shop);

  return {
    canPublish,
    canLivePreview,
    canChatRefine,
    refinementLimit,
    refinementUsed,
    teamSeatLimit,
    planName,
  };
}

/**
 * Determine minimum plan required for a feature
 */
function getRequiredPlan(feature: FeatureFlag): PlanTier {
  const agencyOnly: FeatureFlag[] = ["team_seats", "batch_generation", "custom_templates"];
  return agencyOnly.includes(feature) ? "agency" : "pro";
}

/**
 * Format feature name for display
 */
function formatFeatureName(feature: FeatureFlag): string {
  const names: Record<FeatureFlag, string> = {
    live_preview: "Live preview",
    publish_theme: "Publish to theme",
    chat_refinement: "Chat refinement",
    team_seats: "Team seats",
    batch_generation: "Batch generation",
    custom_templates: "Custom templates",
  };
  return names[feature] || feature;
}
