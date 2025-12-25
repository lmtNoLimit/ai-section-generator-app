import prisma from "../db.server";
import type { ShopSettings } from "@prisma/client";
import type { CTAState } from "../types/dashboard.types";
import { encrypt, decrypt, isEncryptionConfigured } from "./encryption.server";

interface PreferencesInput {
  defaultTone: string;
  defaultStyle: string;
  autoSaveEnabled: boolean;
}

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
   * Mark settings as configured (for onboarding step 3)
   */
  async markSettingsConfigured(shop: string): Promise<ShopSettings> {
    return prisma.shopSettings.upsert({
      where: { shop },
      update: { hasConfiguredSettings: true },
      create: { shop, hasConfiguredSettings: true },
    });
  },

  /**
   * Update onboarding step completion state
   * Valid keys: hasGeneratedSection, hasSavedTemplate, hasConfiguredSettings
   */
  async updateOnboardingStep(
    shop: string,
    stepKey: "hasGeneratedSection" | "hasSavedTemplate" | "hasConfiguredSettings",
    completed: boolean
  ): Promise<ShopSettings> {
    return prisma.shopSettings.upsert({
      where: { shop },
      update: { [stepKey]: completed },
      create: { shop, [stepKey]: completed },
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

  /**
   * Update shop preferences
   */
  async updatePreferences(
    shop: string,
    preferences: PreferencesInput
  ): Promise<ShopSettings> {
    return prisma.shopSettings.upsert({
      where: { shop },
      update: preferences,
      create: { shop, ...preferences },
    });
  },

  /**
   * Save storefront password (encrypted)
   * Used for bypassing password-protected storefronts in native preview
   */
  async saveStorefrontPassword(shop: string, password: string): Promise<void> {
    if (!isEncryptionConfigured()) {
      throw new Error("Encryption not configured. Set ENCRYPTION_KEY environment variable.");
    }

    const encryptedPassword = encrypt(password);

    await prisma.shopSettings.upsert({
      where: { shop },
      update: {
        storefrontPassword: encryptedPassword,
        passwordVerifiedAt: null, // Reset until verified
      },
      create: {
        shop,
        storefrontPassword: encryptedPassword,
      },
    });
  },

  /**
   * Get storefront password (decrypted)
   * Returns null if no password stored or encryption not configured
   */
  async getStorefrontPassword(shop: string): Promise<string | null> {
    if (!isEncryptionConfigured()) {
      return null;
    }

    const settings = await prisma.shopSettings.findUnique({
      where: { shop },
      select: { storefrontPassword: true },
    });

    if (!settings?.storefrontPassword) {
      return null;
    }

    return decrypt(settings.storefrontPassword);
  },

  /**
   * Mark storefront password as verified
   * Called after successful authentication with the password
   */
  async markPasswordVerified(shop: string): Promise<void> {
    await prisma.shopSettings.update({
      where: { shop },
      data: { passwordVerifiedAt: new Date() },
    });
  },

  /**
   * Clear storefront password
   */
  async clearStorefrontPassword(shop: string): Promise<void> {
    await prisma.shopSettings.update({
      where: { shop },
      data: {
        storefrontPassword: null,
        passwordVerifiedAt: null,
      },
    });
  },

  /**
   * Check if storefront password is configured
   */
  async hasStorefrontPassword(shop: string): Promise<boolean> {
    const settings = await prisma.shopSettings.findUnique({
      where: { shop },
      select: { storefrontPassword: true },
    });
    return settings?.storefrontPassword != null;
  },
};
