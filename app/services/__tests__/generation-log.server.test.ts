// @jest-environment node
import type { Mock } from 'jest';
import type { Subscription } from '@prisma/client';

// Mock Prisma BEFORE importing generation-log service
jest.mock('../../db.server', () => ({
  __esModule: true,
  default: {
    generationLog: {
      create: jest.fn(),
      count: jest.fn(),
    },
  },
}));

import {
  logGeneration,
  getBillingCycleStart,
  countGenerationsThisCycle,
} from '../generation-log.server';
import prisma from '../../db.server';

// Type alias for convenience
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockedFunction<T extends (...args: any[]) => any> = Mock<ReturnType<T>, Parameters<T>>;

const mockedGenerationLog = prisma.generationLog as {
  create: MockedFunction<typeof prisma.generationLog.create>;
  count: MockedFunction<typeof prisma.generationLog.count>;
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

describe('GenerationLogService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // logGeneration
  // ============================================================================
  describe('logGeneration', () => {
    it('creates immutable generation log entry for free tier', async () => {
      const mockLog = {
        id: 'log-123',
        shop: 'myshop.myshopify.com',
        sectionId: 'section-abc',
        prompt: 'Create a hero banner',
        userTier: 'free',
        wasCharged: false,
      };
      mockedGenerationLog.create.mockResolvedValue(mockLog as never);

      await logGeneration({
        shop: 'myshop.myshopify.com',
        sectionId: 'section-abc',
        prompt: 'Create a hero banner',
        userTier: 'free',
      });

      expect(mockedGenerationLog.create).toHaveBeenCalledTimes(1);
      const createCall = mockedGenerationLog.create.mock.calls[0][0];
      expect(createCall.data.shop).toBe('myshop.myshopify.com');
      expect(createCall.data.sectionId).toBe('section-abc');
      expect(createCall.data.userTier).toBe('free');
      expect(createCall.data.wasCharged).toBe(false);
    });

    it('creates log entry for pro tier with subscription', async () => {
      const subscription = createMockSubscription({ currentPeriodEnd: new Date('2025-02-15') });
      mockedGenerationLog.create.mockResolvedValue({} as never);

      await logGeneration({
        shop: 'myshop.myshopify.com',
        sectionId: 'section-abc',
        prompt: 'Create a product grid',
        userTier: 'pro',
        wasCharged: true,
        subscription,
      });

      expect(mockedGenerationLog.create).toHaveBeenCalledTimes(1);
      const createCall = mockedGenerationLog.create.mock.calls[0][0];
      expect(createCall.data.userTier).toBe('pro');
      expect(createCall.data.wasCharged).toBe(true);
      // billingCycle should be calculated from subscription.currentPeriodEnd - 30 days
      expect(createCall.data.billingCycle).toBeInstanceOf(Date);
    });

    it('truncates long prompts to 500 characters', async () => {
      const longPrompt = 'A'.repeat(600);
      mockedGenerationLog.create.mockResolvedValue({} as never);

      await logGeneration({
        shop: 'myshop.myshopify.com',
        sectionId: 'section-abc',
        prompt: longPrompt,
        userTier: 'free',
      });

      const createCall = mockedGenerationLog.create.mock.calls[0][0];
      expect(createCall.data.prompt.length).toBe(500);
    });

    it('includes optional fields when provided', async () => {
      mockedGenerationLog.create.mockResolvedValue({} as never);

      await logGeneration({
        shop: 'myshop.myshopify.com',
        sectionId: 'section-abc',
        messageId: 'msg-123',
        prompt: 'Create FAQ section',
        tokenCount: 500,
        modelId: 'gemini-2.5-pro',
        userTier: 'agency',
      });

      const createCall = mockedGenerationLog.create.mock.calls[0][0];
      expect(createCall.data.messageId).toBe('msg-123');
      expect(createCall.data.tokenCount).toBe(500);
      expect(createCall.data.modelId).toBe('gemini-2.5-pro');
      expect(createCall.data.userTier).toBe('agency');
    });

    it('uses default modelId when not provided', async () => {
      mockedGenerationLog.create.mockResolvedValue({} as never);

      await logGeneration({
        shop: 'myshop.myshopify.com',
        sectionId: 'section-abc',
        prompt: 'Create hero',
        userTier: 'free',
      });

      const createCall = mockedGenerationLog.create.mock.calls[0][0];
      expect(createCall.data.modelId).toBe('gemini-2.5-flash');
    });
  });

  // ============================================================================
  // getBillingCycleStart
  // ============================================================================
  describe('getBillingCycleStart', () => {
    it('returns first of month for free tier (no subscription)', () => {
      const result = getBillingCycleStart();

      const expected = new Date();
      expected.setDate(1);
      expected.setHours(0, 0, 0, 0);

      expect(result.getDate()).toBe(1);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
    });

    it('returns first of month for null subscription', () => {
      const result = getBillingCycleStart(null);

      expect(result.getDate()).toBe(1);
      expect(result.getHours()).toBe(0);
    });

    it('calculates cycle start from subscription currentPeriodEnd', () => {
      const subscription = createMockSubscription({
        currentPeriodEnd: new Date('2025-02-15T10:30:00.000Z'),
      });

      const result = getBillingCycleStart(subscription);

      // Should be 30 days before currentPeriodEnd
      const expected = new Date('2025-01-16T00:00:00.000Z');
      expected.setHours(0, 0, 0, 0);

      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(16);
      expect(result.getHours()).toBe(0);
    });
  });

  // ============================================================================
  // countGenerationsThisCycle
  // ============================================================================
  describe('countGenerationsThisCycle', () => {
    it('counts generations for shop in current billing cycle', async () => {
      mockedGenerationLog.count.mockResolvedValue(3);

      const result = await countGenerationsThisCycle('myshop.myshopify.com');

      expect(result).toBe(3);
      expect(mockedGenerationLog.count).toHaveBeenCalledTimes(1);

      const countCall = mockedGenerationLog.count.mock.calls[0][0];
      expect(countCall.where.shop).toBe('myshop.myshopify.com');
      expect(countCall.where.generatedAt).toBeDefined();
      expect(countCall.where.generatedAt.gte).toBeInstanceOf(Date);
    });

    it('returns 0 when no generations exist', async () => {
      mockedGenerationLog.count.mockResolvedValue(0);

      const result = await countGenerationsThisCycle('newshop.myshopify.com');

      expect(result).toBe(0);
    });

    it('filters by billing cycle start date', async () => {
      mockedGenerationLog.count.mockResolvedValue(5);

      await countGenerationsThisCycle('myshop.myshopify.com');

      const countCall = mockedGenerationLog.count.mock.calls[0][0];
      const billingCycleStart = countCall.where.generatedAt.gte;

      // Should be start of current month
      expect(billingCycleStart.getDate()).toBe(1);
      expect(billingCycleStart.getHours()).toBe(0);
    });
  });
});
