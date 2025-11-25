import type { Theme } from '../../types/shopify-api.types';

export const mockThemes: Theme[] = [
  {
    id: 'gid://shopify/Theme/123456789',
    name: 'Dawn',
    role: 'MAIN',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-11-20T14:30:00Z'
  },
  {
    id: 'gid://shopify/Theme/987654321',
    name: 'Development Theme',
    role: 'DEVELOPMENT',
    createdAt: '2024-11-01T08:00:00Z',
    updatedAt: '2024-11-24T09:15:00Z'
  },
  {
    id: 'gid://shopify/Theme/555555555',
    name: 'Custom Backup',
    role: 'UNPUBLISHED',
    createdAt: '2024-09-10T12:00:00Z',
    updatedAt: '2024-10-05T16:45:00Z'
  }
];

export const mockSections: Record<string, string> = {
  'hero-section': `
{% schema %}
{
  "name": "Hero Section",
  "settings": [
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "Welcome to our store"
    }
  ]
}
{% endschema %}

<style>
#shopify-section-{{ section.id }} {
  padding: 60px 20px;
  text-align: center;
}
</style>

<div class="hero-section">
  <h1>{{ section.settings.heading }}</h1>
</div>
  `.trim(),

  'product-grid': `
{% schema %}
{
  "name": "Product Grid",
  "settings": [
    {
      "type": "range",
      "id": "products_per_row",
      "label": "Products per row",
      "min": 2,
      "max": 4,
      "default": 3
    }
  ]
}
{% endschema %}

<style>
#shopify-section-{{ section.id }} .product-grid {
  display: grid;
  grid-template-columns: repeat({{ section.settings.products_per_row }}, 1fr);
  gap: 20px;
}
</style>

<div class="product-grid">
  <!-- Product items will be rendered here -->
</div>
  `.trim()
};

export function generateMockSection(prompt: string): string {
  return `
{% schema %}
{
  "name": "Generated ${prompt}",
  "settings": [
    {
      "type": "text",
      "id": "title",
      "label": "Title",
      "default": "Section Title"
    }
  ]
}
{% endschema %}

<style>
#shopify-section-{{ section.id }} {
  padding: 40px 20px;
}
</style>

<div class="generated-section">
  <h2>{{ section.settings.title }}</h2>
  <p>Generated from prompt: "${prompt}"</p>
</div>
  `.trim();
}
