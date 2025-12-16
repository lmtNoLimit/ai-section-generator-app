import prisma from "../db.server";
import type { NewsItem } from "../types/dashboard.types";

const VALID_NEWS_TYPES = ["update", "feature", "announcement"] as const;
type ValidNewsType = (typeof VALID_NEWS_TYPES)[number];

/**
 * Validate and normalize news type with fallback
 */
function normalizeNewsType(type: string): ValidNewsType {
  return VALID_NEWS_TYPES.includes(type as ValidNewsType)
    ? (type as ValidNewsType)
    : "update";
}

/**
 * News service for managing dashboard announcements
 */
export const newsService = {
  /**
   * Get active news items for dashboard display
   * Returns items that are active and not expired
   */
  async getActiveNews(limit: number = 5): Promise<NewsItem[]> {
    const now = new Date();

    const items = await prisma.news.findMany({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { publishedAt: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        url: true,
        type: true,
        publishedAt: true,
      },
    });

    return items.map((item) => ({
      ...item,
      url: item.url ?? undefined,
      type: normalizeNewsType(item.type),
    }));
  },

  /**
   * Create a news item (admin use)
   */
  async create(data: {
    title: string;
    description: string;
    url?: string;
    type?: string;
    expiresAt?: Date;
  }) {
    return prisma.news.create({ data });
  },

  /**
   * Deactivate a news item
   */
  async deactivate(id: string) {
    return prisma.news.update({
      where: { id },
      data: { isActive: false },
    });
  },
};
