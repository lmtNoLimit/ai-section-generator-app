import { authenticate } from "../shopify.server";
import type {
  Theme,
  ThemesQueryResponse,
  ThemeFilesUpsertResponse,
  ThemeFileMetadata,
  ThemeServiceInterface
} from "../types";

/** Prefix for all sections created by this app to avoid conflicts */
const SECTION_PREFIX = 'bsm-';

/**
 * Truncate name to Shopify's 25-char limit for schema names
 */
function truncateName(name: string, maxLength = 25): string {
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength - 3).trim() + '...';
}

/**
 * Update schema "name" and preset names in Liquid code
 * Returns original code if parsing fails (safe fallback)
 */
function updateSchemaName(liquidCode: string, newName: string): string {
  const safeName = truncateName(newName.trim());

  const schemaMatch = liquidCode.match(
    /{% schema %}\s*([\s\S]*?)\s*{% endschema %}/
  );

  if (!schemaMatch?.[1]) {
    console.warn('updateSchemaName: No schema block found');
    return liquidCode;
  }

  try {
    const schema = JSON.parse(schemaMatch[1]);
    schema.name = safeName;

    // Sync preset names
    if (Array.isArray(schema.presets)) {
      schema.presets = schema.presets.map((preset: Record<string, unknown>) => ({
        ...preset,
        name: safeName
      }));
    }

    return liquidCode.replace(
      /{% schema %}\s*[\s\S]*?\s*{% endschema %}/,
      `{% schema %}\n${JSON.stringify(schema, null, 2)}\n{% endschema %}`
    );
  } catch (error) {
    console.error('updateSchemaName: Failed to parse schema JSON', error);
    return liquidCode; // Safe fallback
  }
}

export class ThemeService implements ThemeServiceInterface {
  async getThemes(request: Request): Promise<Theme[]> {
    const { admin } = await authenticate.admin(request);
    const response = await admin.graphql(
      `#graphql
      query getThemes {
        themes(first: 10) {
          edges {
            node {
              id
              name
              role
            }
          }
        }
      }`
    );

    const data = await response.json() as ThemesQueryResponse;
    return data.data?.themes?.edges.map(edge => edge.node) || [];
  }

  async createSection(
    request: Request,
    themeId: string,
    fileName: string,
    content: string,
    sectionName?: string
  ): Promise<ThemeFileMetadata> {
    const { admin } = await authenticate.admin(request);

    // Apply section name to schema if provided
    let finalContent = content;
    if (sectionName?.trim()) {
      finalContent = updateSchemaName(content, sectionName);
    }

    // Extract base filename (remove path prefix and .liquid extension)
    let baseName = fileName.includes('/')
      ? fileName.split('/').pop()!
      : fileName;
    baseName = baseName.replace(/\.liquid$/, '');

    // Add BSM prefix if not already present (prevents conflicts, identifies app-created sections)
    if (!baseName.startsWith(SECTION_PREFIX)) {
      baseName = `${SECTION_PREFIX}${baseName}`;
    }

    // Construct full filename with sections/ folder and .liquid extension
    const fullFilename = `sections/${baseName}.liquid`;

    const mutation = `
      mutation themeFilesUpsert($files: [OnlineStoreThemeFilesUpsertFileInput!]!, $themeId: ID!) {
        themeFilesUpsert(files: $files, themeId: $themeId) {
          upsertedThemeFiles {
            filename
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await admin.graphql(mutation, {
      variables: {
        themeId: themeId,
        files: [
          {
            filename: fullFilename,
            body: {
              type: "TEXT",
              value: finalContent
            }
          }
        ]
      }
    });

    const data = await response.json() as ThemeFilesUpsertResponse;

    // Check for errors
    if (data.data?.themeFilesUpsert?.userErrors?.length) {
      const errors = data.data.themeFilesUpsert.userErrors;
      throw new Error(`Failed to save theme file: ${errors.map(e => e.message).join(', ')}`);
    }

    const file = data.data?.themeFilesUpsert?.upsertedThemeFiles?.[0];
    if (!file) {
      throw new Error('No file returned from upsert');
    }

    return file;
  }
}

export const themeService = new ThemeService();
