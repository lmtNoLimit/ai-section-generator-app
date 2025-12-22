import prisma from "../db.server";
import { DEFAULT_TEMPLATES, type DefaultTemplate } from "../data/default-templates";

/**
 * Template Seeder Service
 *
 * Seeds default section templates for a shop on first access.
 * Prevents duplicate seeding by checking if shop already has templates.
 */
export const templateSeeder = {
  /**
   * Check if shop has any templates
   */
  async hasTemplates(shop: string): Promise<boolean> {
    const count = await prisma.sectionTemplate.count({
      where: { shop },
    });
    return count > 0;
  },

  /**
   * Seed default templates for a shop
   * Only seeds if shop has no existing templates
   */
  async seedDefaultTemplates(shop: string): Promise<{ seeded: boolean; count: number }> {
    // Check if already seeded
    const hasExisting = await this.hasTemplates(shop);
    if (hasExisting) {
      return { seeded: false, count: 0 };
    }

    // Seed all default templates
    const templates = DEFAULT_TEMPLATES.map((template: DefaultTemplate) => ({
      shop,
      title: template.title,
      description: template.description,
      category: template.category,
      icon: template.icon,
      prompt: template.prompt,
      code: template.code || null, // Include pre-built code if available
    }));

    await prisma.sectionTemplate.createMany({
      data: templates,
    });

    return { seeded: true, count: templates.length };
  },

  /**
   * Reset templates to defaults
   * Deletes all existing templates and reseeds
   */
  async resetToDefaults(shop: string): Promise<{ count: number }> {
    // Delete all existing templates for shop
    await prisma.sectionTemplate.deleteMany({
      where: { shop },
    });

    // Seed default templates
    const templates = DEFAULT_TEMPLATES.map((template: DefaultTemplate) => ({
      shop,
      title: template.title,
      description: template.description,
      category: template.category,
      icon: template.icon,
      prompt: template.prompt,
      code: template.code || null, // Include pre-built code if available
    }));

    await prisma.sectionTemplate.createMany({
      data: templates,
    });

    return { count: templates.length };
  },

  /**
   * Get count of default templates
   */
  getDefaultTemplateCount(): number {
    return DEFAULT_TEMPLATES.length;
  },

  /**
   * Get default templates (for reference/preview)
   */
  getDefaultTemplates(): DefaultTemplate[] {
    return DEFAULT_TEMPLATES;
  },
};
