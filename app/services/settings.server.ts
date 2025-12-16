import prisma from "../db.server";
import type { ShopSettings } from "@prisma/client";
import type { CTAState } from "../types/dashboard.types";

/**
 * Settings service for managing shop-level settings (onboarding, preferences)
 */
export const settingsService = {
  /**
   * Get shop settings
   */
  async get(shop: string): Promise<ShopSettings | null> {
    return prisma.shopSettings.findUnique({ where: { shop } });
  },

  /**
   * Mark history as viewed (for onboarding step)
   */
  async markHistoryViewed(shop: string): Promise<ShopSettings> {
    return prisma.shopSettings.upsert({
      where: { shop },
      update: { hasViewedHistory: true },
      create: { shop, hasViewedHistory: true },
    });
  },

  /**
   * Dismiss onboarding guide
   */
  async dismissOnboarding(shop: string): Promise<ShopSettings> {
    return prisma.shopSettings.upsert({
      where: { shop },
      update: { onboardingDismissed: true },
      create: { shop, onboardingDismissed: true },
    });
  },

  /**
   * Dismiss CTA banner
   */
  async dismissCTA(shop: string): Promise<void> {
    await prisma.shopSettings.upsert({
      where: { shop },
      create: { shop, ctaDismissedAt: new Date() },
      update: { ctaDismissedAt: new Date() },
    });
  },

  /**
   * Get CTA dismissal state
   */
  async getCTAState(shop: string): Promise<CTAState> {
    const settings = await prisma.shopSettings.findUnique({
      where: { shop },
      select: { ctaDismissedAt: true },
    });

    return {
      isDismissed: settings?.ctaDismissedAt != null,
      dismissedAt: settings?.ctaDismissedAt ?? undefined,
    };
  },
};
