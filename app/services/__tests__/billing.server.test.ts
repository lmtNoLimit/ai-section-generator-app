// @jest-environment node
import type { Mock } from 'jest';
import type { Subscription, PlanConfiguration } from '@prisma/client';

// Mock Prisma BEFORE importing billing service
jest.mock('../../db.server', () => ({
  __esModule: true,
  default: {
    subscription: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    planConfiguration: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    generationLog: {
      count: jest.fn(),
    },
    section: {
      count: jest.fn(),
    },
    usageRecord: {
      create: jest.fn(),
      update: jest.fn(),
    },
    failedUsageCharge: {
      create: jest.fn(),
    },
  },
}));

import {
  checkQuota,
  getSubscription,
  getPlanConfig,
} from '../billing.server';
import prisma from '../../db.server';

// Type alias for convenience
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockedFunction<T extends (...args: any[]) => any> = Mock<ReturnType<T>, Parameters<T>>;

const mockedPrismaSubscription = prisma.subscription as {
  findFirst: MockedFunction<typeof prisma.subscription.findFirst>;
};

const mockedPrismaPlanConfig = prisma.planConfiguration as {
  findUnique: MockedFunction<typeof prisma.planConfiguration.findUnique>;
};

const mockedGenerationLog = prisma.generationLog as {
  count: MockedFunction<typeof prisma.generationLog.count>;
};

const mockedSection = prisma.section as {
  count: MockedFunction<typeof prisma.section.count>;
};

// ============================================================================
// Test Data
// ============================================================================

const createMockSubscription = (overrides: Partial<Subscription> = {}): Subscription => ({
  id: 'sub-123',
  shop: 'myshop.myshopify.com',
  shopifySubId: 'gid://shopify/AppSubscription/123',
  planName: 'pro',
  status: 'active',
  currentPeriodEnd: new Date('2025-02-01'),
  trialEndsAt: null,
  basePrice: 29,
  includedQuota: 30,
  overagePrice: 2,
  cappedAmount: 50,
  usageThisCycle: 5,
  overagesThisCycle: 0,
  usageLineItemId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockPlanConfig = (overrides: Partial<PlanConfiguration> = {}): PlanConfiguration => ({
  id: 'plan-123',
  planName: 'pro',
  displayName: 'Pro',
  description: 'For professional theme developers',
  basePrice: 29,
  includedQuota: 30,
  overagePrice: 2,
  cappedAmount: 50,
  features: ['30 sections/month', 'Live preview'],
  featureFlags: ['live_preview', 'publish_theme', 'chat_refinement'],
  badge: 'Popular',
  sortOrder: 1,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const FREE_PLAN = createMockPlanConfig({
  planName: 'free',
  displayName: 'Free',
  basePrice: 0,
  includedQuota: 5,
  featureFlags: [],
});

describe('BillingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // getSubscription
  // ============================================================================
  describe('getSubscription', () => {
    it('returns active subscription for shop', async () => {
      const mockSub = createMockSubscription();
      mockedPrismaSubscription.findFirst.mockResolvedValue(mockSub);

      const result = await getSubscription('myshop.myshopify.com');

      expect(result).toEqual(mockSub);
      expect(mockedPrismaSubscription.findFirst).toHaveBeenCalledWith({
        where: {
          shop: 'myshop.myshopify.com',
          status: { mode: 'insensitive', equals: 'active' },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('returns null when no active subscription exists', async () => {
      mockedPrismaSubscription.findFirst.mockResolvedValue(null);

      const result = await getSubscription('freeshop.myshopify.com');

      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // checkQuota - Free Tier Tests
  // ============================================================================
  describe('checkQuota - Free Tier', () => {
    beforeEach(() => {
      // No subscription = free tier
      mockedPrismaSubscription.findFirst.mockResolvedValue(null);
      mockedPrismaPlanConfig.findUnique.mockResolvedValue(FREE_PLAN);
    });

    it('returns hasQuota=true when under free tier limit', async () => {
      mockedGenerationLog.count.mockResolvedValue(3); // 3 of 5 used

      const result = await checkQuota('myshop.myshopify.com');

      expect(result.hasQuota).toBe(true);
      expect(result.usageThisCycle).toBe(3);
      expect(result.includedQuota).toBe(5);
      expect(result.subscription).toBeNull();
    });

    it('returns hasQuota=false when at free tier limit', async () => {
      mockedGenerationLog.count.mockResolvedValue(5); // 5 of 5 used

      const result = await checkQuota('myshop.myshopify.com');

      expect(result.hasQuota).toBe(false);
      expect(result.usageThisCycle).toBe(5);
      expect(result.percentUsed).toBe(100);
    });

    it('returns hasQuota=false when over free tier limit', async () => {
      mockedGenerationLog.count.mockResolvedValue(7); // 7 of 5 (edge case)

      const result = await checkQuota('myshop.myshopify.com');

      expect(result.hasQuota).toBe(false);
      expect(result.percentUsed).toBe(100); // Capped at 100%
    });

    it('uses GenerationLog count for quota (not Section.count)', async () => {
      mockedGenerationLog.count.mockResolvedValue(2);

      await checkQuota('myshop.myshopify.com');

      // Should check GenerationLog, not Section
      expect(mockedGenerationLog.count).toHaveBeenCalled();
    });

    it('falls back to Section.count during migration (no GenerationLog)', async () => {
      // First call: GenerationLog this month = 0
      // Second call: hasAnyLogs ever = 0 (migration case)
      mockedGenerationLog.count
        .mockResolvedValueOnce(0)  // This month
        .mockResolvedValueOnce(0); // Ever (migration check)
      mockedSection.count.mockResolvedValue(4); // Legacy sections

      const result = await checkQuota('myshop.myshopify.com');

      expect(result.usageThisCycle).toBe(4); // Uses legacy count
      expect(mockedSection.count).toHaveBeenCalled();
    });

    it('does NOT fall back if GenerationLog exists but is zero this month', async () => {
      // First call: GenerationLog this month = 0
      // Second call: hasAnyLogs ever = 5 (has history, just not this month)
      mockedGenerationLog.count
        .mockResolvedValueOnce(0)  // This month
        .mockResolvedValueOnce(5); // Ever (has logs from previous months)

      const result = await checkQuota('myshop.myshopify.com');

      expect(result.usageThisCycle).toBe(0); // Uses GenerationLog (0), not Section.count
      expect(mockedSection.count).not.toHaveBeenCalled();
    });

    it('hard-deleted sections do NOT restore quota', async () => {
      // GenerationLog survives section deletion
      mockedGenerationLog.count.mockResolvedValue(5); // All 5 generations logged

      const result = await checkQuota('myshop.myshopify.com');

      // Even if sections were deleted, quota still shows 5 used
      expect(result.usageThisCycle).toBe(5);
      expect(result.hasQuota).toBe(false);
    });
  });

  // ============================================================================
  // checkQuota - Paid Tier Tests
  // ============================================================================
  describe('checkQuota - Paid Tier', () => {
    it('returns hasQuota=true when within included quota', async () => {
      const subscription = createMockSubscription({
        usageThisCycle: 10,
        includedQuota: 30,
        overagesThisCycle: 0,
      });
      mockedPrismaSubscription.findFirst.mockResolvedValue(subscription);

      const result = await checkQuota('myshop.myshopify.com');

      expect(result.hasQuota).toBe(true);
      expect(result.usageThisCycle).toBe(10);
      expect(result.includedQuota).toBe(30);
      expect(result.subscription).toEqual(subscription);
    });

    it('returns hasQuota=true when in overage range', async () => {
      const subscription = createMockSubscription({
        usageThisCycle: 35, // Over 30 included
        includedQuota: 30,
        overagesThisCycle: 5,
        cappedAmount: 50,
        overagePrice: 2,
      });
      mockedPrismaSubscription.findFirst.mockResolvedValue(subscription);

      const result = await checkQuota('myshop.myshopify.com');

      // Max overages = 50 / 2 = 25, used 5, so 20 remaining
      expect(result.hasQuota).toBe(true);
      expect(result.overagesRemaining).toBe(20);
    });

    it('returns hasQuota=false when overage cap reached', async () => {
      const subscription = createMockSubscription({
        usageThisCycle: 55, // 30 included + 25 overages (max)
        includedQuota: 30,
        overagesThisCycle: 25, // Max at $50 cap with $2/overage
        cappedAmount: 50,
        overagePrice: 2,
      });
      mockedPrismaSubscription.findFirst.mockResolvedValue(subscription);

      const result = await checkQuota('myshop.myshopify.com');

      expect(result.hasQuota).toBe(false);
      expect(result.overagesRemaining).toBe(0);
    });

    it('calculates percentUsed correctly', async () => {
      const subscription = createMockSubscription({
        usageThisCycle: 15,
        includedQuota: 30,
        overagesThisCycle: 0,
        cappedAmount: 50,
        overagePrice: 2,
      });
      mockedPrismaSubscription.findFirst.mockResolvedValue(subscription);

      const result = await checkQuota('myshop.myshopify.com');

      // Total capacity = 30 included + 25 overages = 55
      // 15/55 = ~27.27%
      expect(result.percentUsed).toBeCloseTo(27.27, 1);
    });
  });

  // ============================================================================
  // getPlanConfig
  // ============================================================================
  describe('getPlanConfig', () => {
    it('returns plan configuration by name', async () => {
      mockedPrismaPlanConfig.findUnique.mockResolvedValue(FREE_PLAN);

      const result = await getPlanConfig('free');

      expect(result).toEqual(FREE_PLAN);
      expect(mockedPrismaPlanConfig.findUnique).toHaveBeenCalledWith({
        where: { planName: 'free' },
      });
    });

    it('throws error when plan not found', async () => {
      mockedPrismaPlanConfig.findUnique.mockResolvedValue(null);

      await expect(getPlanConfig('nonexistent' as never)).rejects.toThrow(
        'Plan configuration not found: nonexistent'
      );
    });
  });
});
