import prisma from "../db.server";
import type { Section } from "@prisma/client";
import {
  SECTION_STATUS,
  type SectionStatus,
  isValidTransition,
  getTransitionErrorMessage,
} from "../types/section-status";

/**
 * Extract the "name" field from Liquid schema block
 * Returns null if unable to parse
 */
function extractSchemaName(liquidCode: string): string | null {
  const schemaMatch = liquidCode.match(
    /{% schema %}\s*([\s\S]*?)\s*{% endschema %}/
  );

  if (!schemaMatch?.[1]) {
    return null;
  }

  try {
    const schema = JSON.parse(schemaMatch[1]);
    if (schema.name && typeof schema.name === 'string') {
      return schema.name.trim();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Generate a default section name from prompt text
 * Used as fallback when schema name extraction fails
 * Truncates to ~50 chars at last word boundary
 */
function generateDefaultName(prompt: string): string {
  const maxLength = 50;
  const trimmed = prompt.trim();
  if (trimmed.length <= maxLength) return trimmed;

  const truncated = trimmed.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > 20) {
    return truncated.substring(0, lastSpace) + "...";
  }
  return truncated + "...";
}

export interface CreateSectionInput {
  shop: string;
  prompt: string;
  code: string;
  name?: string;
  tone?: string;
  style?: string;
  // status intentionally omitted - always starts as DRAFT
  themeId?: string;
  themeName?: string;
  fileName?: string;
}

export interface UpdateSectionInput {
  name?: string;
  code?: string;
  themeId?: string;
  themeName?: string;
  fileName?: string;
  status?: SectionStatus;
}

export interface GetByShopOptions {
  page?: number;
  limit?: number;
  status?: SectionStatus;
  search?: string;
  sort?: "newest" | "oldest";
  includeInactive?: boolean; // Default false - excludes inactive unless explicitly included
}

/**
 * Section service for managing AI-generated sections
 */
export const sectionService = {
  /**
   * Create a new section - always starts as DRAFT
   * Uses schema name from generated code if user doesn't provide a name
   */
  async create(input: CreateSectionInput): Promise<Section> {
    // Priority: user-provided name > schema name > prompt-based fallback
    const schemaName = extractSchemaName(input.code);
    const defaultName = input.name || schemaName || generateDefaultName(input.prompt);

    return prisma.section.create({
      data: {
        shop: input.shop,
        name: defaultName,
        prompt: input.prompt,
        code: input.code,
        tone: input.tone,
        style: input.style,
        status: SECTION_STATUS.DRAFT, // Always start as draft
        themeId: input.themeId,
        themeName: input.themeName,
        fileName: input.fileName,
      },
    });
  },

  /**
   * Update section with status transition validation
   */
  async update(id: string, shop: string, input: UpdateSectionInput): Promise<Section | null> {
    const existing = await prisma.section.findFirst({
      where: { id, shop },
    });

    if (!existing) return null;

    // Validate status transition if status is being changed
    if (input.status && input.status !== existing.status) {
      const currentStatus = existing.status as SectionStatus;
      const newStatus = input.status;

      if (!isValidTransition(currentStatus, newStatus)) {
        throw new Error(getTransitionErrorMessage(currentStatus, newStatus));
      }
    }

    return prisma.section.update({
      where: { id },
      data: input,
    });
  },

  /**
   * Archive a section (soft delete)
   * Can archive from DRAFT or ACTIVE status
   */
  async archive(id: string, shop: string): Promise<Section | null> {
    return this.update(id, shop, { status: SECTION_STATUS.ARCHIVE });
  },

  /**
   * Restore an archived or inactive section back to DRAFT
   */
  async restore(id: string, shop: string): Promise<Section | null> {
    const existing = await prisma.section.findFirst({
      where: { id, shop },
    });

    if (!existing) return null;

    const currentStatus = existing.status as SectionStatus;
    if (currentStatus !== SECTION_STATUS.ARCHIVE && currentStatus !== SECTION_STATUS.INACTIVE) {
      throw new Error(`Cannot restore: section is not archived or inactive (current status: ${currentStatus})`);
    }

    return prisma.section.update({
      where: { id },
      data: { status: SECTION_STATUS.DRAFT },
    });
  },

  /**
   * Publish section to theme (sets status to ACTIVE)
   */
  async publish(
    id: string,
    shop: string,
    themeData: { themeId: string; themeName: string; fileName: string }
  ): Promise<Section | null> {
    return this.update(id, shop, {
      status: SECTION_STATUS.ACTIVE,
      ...themeData,
    });
  },

  /**
   * Unpublish section (sets status back to DRAFT, clears theme data)
   */
  async unpublish(id: string, shop: string): Promise<Section | null> {
    return this.update(id, shop, {
      status: SECTION_STATUS.DRAFT,
      themeId: undefined,
      themeName: undefined,
      fileName: undefined,
    });
  },

  /**
   * Get paginated sections for a shop
   * Excludes INACTIVE by default unless includeInactive=true
   */
  async getByShop(
    shop: string,
    options: GetByShopOptions = {}
  ): Promise<{ items: Section[]; total: number; page: number; totalPages: number }> {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      sort = "newest",
      includeInactive = false,
    } = options;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = { shop };

    // Status filter
    if (status) {
      where.status = status;
    } else if (!includeInactive) {
      // Exclude archive by default (soft-deleted sections)
      where.status = { not: SECTION_STATUS.ARCHIVE };
    }

    // Search filter - search in both prompt and name
    if (search) {
      where.OR = [
        { prompt: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.section.findMany({
        where,
        orderBy: { createdAt: sort === "newest" ? "desc" : "asc" },
        skip,
        take: limit,
      }),
      prisma.section.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Get single section by ID
   */
  async getById(id: string, shop: string): Promise<Section | null> {
    return prisma.section.findFirst({
      where: { id, shop },
    });
  },

  /**
   * Delete section entry
   */
  async delete(id: string, shop: string): Promise<boolean> {
    const existing = await prisma.section.findFirst({
      where: { id, shop },
    });

    if (!existing) return false;

    await prisma.section.delete({ where: { id } });
    return true;
  },

  /**
   * Get most recent section for a shop
   * Excludes INACTIVE and ARCHIVE sections
   */
  async getMostRecent(shop: string): Promise<Section | null> {
    return prisma.section.findFirst({
      where: {
        shop,
        status: { notIn: [SECTION_STATUS.INACTIVE, SECTION_STATUS.ARCHIVE] },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Get total count of non-archived sections for a shop
   * Used to determine if EmptyState vs EmptySearchResult should show
   * Excludes ARCHIVE status (soft-deleted sections)
   */
  async getTotalCount(shop: string): Promise<number> {
    return prisma.section.count({
      where: {
        shop,
        status: { not: SECTION_STATUS.ARCHIVE },
      },
    });
  },

  /**
   * Get count of archived sections for a shop
   */
  async getArchivedCount(shop: string): Promise<number> {
    return prisma.section.count({
      where: { shop, status: SECTION_STATUS.ARCHIVE },
    });
  },
};
