/**
 * Webhook handler for APP_SUBSCRIPTIONS_UPDATE
 *
 * Triggered when subscription status changes (activated, cancelled, expired, etc.)
 */

import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { updateSubscriptionStatus } from "../services/billing.server";
import type { SubscriptionUpdateWebhook, SubscriptionStatus } from "../types/billing";

export const action = async ({ request }: ActionFunctionArgs) => {
  // Declare variables outside try block for error logging access
  let shop: string | undefined;
  let app_subscription: SubscriptionUpdateWebhook["app_subscription"] | undefined;

  try {
    // authenticate.webhook() validates HMAC signature automatically
    const { topic, shop: webhookShop, session, admin, payload } = await authenticate.webhook(request);
    shop = webhookShop;

    // Validate topic
    if (topic !== "APP_SUBSCRIPTIONS_UPDATE") {
      console.error("[Webhook] Invalid topic:", topic);
      return new Response("Invalid webhook topic", { status: 400 });
    }

    const webhookPayload = payload as SubscriptionUpdateWebhook;
    app_subscription = webhookPayload.app_subscription;

    // Validate payload structure
    if (!app_subscription || !app_subscription.admin_graphql_api_id) {
      console.error("[Webhook] Invalid payload structure");
      return new Response("Invalid payload", { status: 400 });
    }

    console.log(`[Webhook] APP_SUBSCRIPTIONS_UPDATE for ${shop}:`, {
      subscriptionId: app_subscription.admin_graphql_api_id,
      status: app_subscription.status,
      currentPeriodEnd: app_subscription.current_period_end,
    });

    // Import billing service for GraphQL fallback
    const { fetchCurrentPeriodEnd } = await import("../services/billing.server");

    // Verify shop matches subscription (fetch from DB first)
    const prisma = (await import("../db.server")).default;
    const subscription = await prisma.subscription.findUnique({
      where: { shopifySubId: app_subscription.admin_graphql_api_id }
    });

    if (!subscription) {
      // Could be new subscription approval webhook
      console.log("[Webhook] Subscription not found in DB, checking for pending...");

      if (app_subscription.status.toLowerCase() === "active") {
        // Find most recent pending subscription for this shop
        const pendingSubscription = await prisma.subscription.findFirst({
          where: {
            shop,
            status: "pending",
          },
          orderBy: { createdAt: "desc" }
        });

        if (pendingSubscription) {
          console.log("[Webhook] Found pending subscription, updating to active:", {
            oldId: pendingSubscription.shopifySubId,
            newId: app_subscription.admin_graphql_api_id,
          });

          // Fetch currentPeriodEnd for new active subscription
          let currentPeriodEnd: Date | undefined;
          if (app_subscription.current_period_end) {
            currentPeriodEnd = new Date(app_subscription.current_period_end);
          } else if (admin) {
            const fetchedDate = await fetchCurrentPeriodEnd(admin, app_subscription.admin_graphql_api_id);
            currentPeriodEnd = fetchedDate ?? undefined;
          }

          // Update pending record with actual Shopify ID
          await prisma.subscription.update({
            where: { id: pendingSubscription.id },
            data: {
              shopifySubId: app_subscription.admin_graphql_api_id,
              status: "active",
              currentPeriodEnd: currentPeriodEnd ?? pendingSubscription.currentPeriodEnd,
              usageThisCycle: 0,
              overagesThisCycle: 0,
            }
          });

          console.log("[Webhook] Successfully activated pending subscription");
          return new Response("Webhook processed", { status: 200 });
        }
      }

      console.error("[Webhook] Subscription not found:", app_subscription.admin_graphql_api_id);
      return new Response("Subscription not found", { status: 404 });
    }

    if (subscription.shop !== shop) {
      console.error("[Webhook] Shop mismatch:", {
        webhookShop: shop,
        subscriptionShop: subscription.shop
      });
      return new Response("Shop validation failed", { status: 400 });
    }

    // Handle currentPeriodEnd safely
    let currentPeriodEnd: Date | undefined;

    if (app_subscription.current_period_end) {
      // Webhook includes period end - use it
      currentPeriodEnd = new Date(app_subscription.current_period_end);
    } else if (app_subscription.status.toLowerCase() === "active" && admin) {
      // ACTIVE subscription but no period end - query Shopify
      console.log("[Webhook] Missing currentPeriodEnd, querying Shopify...");
      const fetchedDate = await fetchCurrentPeriodEnd(admin, app_subscription.admin_graphql_api_id);
      currentPeriodEnd = fetchedDate ?? undefined;
    }

    // Update subscription status in database (normalize to lowercase)
    await updateSubscriptionStatus(
      app_subscription.admin_graphql_api_id,
      app_subscription.status.toLowerCase() as SubscriptionStatus,
      currentPeriodEnd, // May be undefined - billing service handles it
    );

    // If status is active and current_period_end changed, it's a new billing cycle
    // Usage counters are automatically reset in updateSubscriptionStatus

    console.log(`[Webhook] Successfully processed for ${shop}`, {
      subscriptionId: app_subscription.admin_graphql_api_id,
      status: app_subscription.status,
      hadPeriodEnd: !!app_subscription.current_period_end,
      queriedShopify: !app_subscription.current_period_end && app_subscription.status.toLowerCase() === "active",
    });
    return new Response("Webhook processed", { status: 200 });
  } catch (error) {
    console.error("[Webhook] Error processing APP_SUBSCRIPTIONS_UPDATE:", {
      error: error instanceof Error ? error.message : error,
      shop,
      subscriptionId: app_subscription?.admin_graphql_api_id,
      status: app_subscription?.status,
    });
    return new Response("Error processing webhook", { status: 500 });
  }
};
