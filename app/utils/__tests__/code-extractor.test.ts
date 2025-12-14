// @jest-environment jsdom
import { extractCodeFromResponse, isCompleteLiquidSection } from '../code-extractor';

describe('extractCodeFromResponse', () => {
  it('should extract full Liquid section with schema', () => {
    const content = `Here's the updated code:

{% schema %}
{
  "name": "Hero Section",
  "settings": []
}
{% endschema %}

<div class="hero">Hello</div>

I've made these changes:
- Added hero section
- Updated styling`;

    const result = extractCodeFromResponse(content);

    expect(result.hasCode).toBe(true);
    expect(result.code).toContain('{% schema %}');
    expect(result.code).toContain('{% endschema %}');
    expect(result.code).toContain('<div class="hero">');
    expect(result.changes).toBeDefined();
    expect(result.changes?.length).toBeGreaterThan(0);
  });

  it('should extract fenced liquid code block', () => {
    const content = `Here's your code:

\`\`\`liquid
{% schema %}
{
  "name": "Test",
  "settings": []
}
{% endschema %}

<div>Test</div>
\`\`\`

This adds a simple test section.`;

    const result = extractCodeFromResponse(content);

    expect(result.hasCode).toBe(true);
    expect(result.code).toContain('{% schema %}');
    expect(result.explanation).toBeDefined();
  });

  it('should extract fenced html code block', () => {
    const content = `\`\`\`html
{% schema %}
{"name": "HTML Section"}
{% endschema %}
<section>Content</section>
\`\`\``;

    const result = extractCodeFromResponse(content);

    expect(result.hasCode).toBe(true);
    expect(result.code).toContain('{% schema %}');
  });

  it('should extract generic fenced code with Liquid syntax', () => {
    const content = `\`\`\`
{% schema %}
{"name": "Generic"}
{% endschema %}
{{ section.settings.heading }}
\`\`\``;

    const result = extractCodeFromResponse(content);

    expect(result.hasCode).toBe(true);
    expect(result.code).toContain('{{ section.settings');
  });

  it('should return hasCode false for explanation only', () => {
    const content = `The section has the following settings:
- heading: A text input for the main heading
- bg_color: A color picker for background
- padding: A range slider for spacing

You can customize these in the theme editor.`;

    const result = extractCodeFromResponse(content);

    expect(result.hasCode).toBe(false);
    expect(result.explanation).toBe(content);
  });

  it('should extract bullet point changes', () => {
    const content = `{% schema %}{"name": "Test"}{% endschema %}<div></div>

Changes made:
- Updated the heading style
- Added responsive padding
* Changed background color`;

    const result = extractCodeFromResponse(content);

    expect(result.changes).toContain('Updated the heading style');
    expect(result.changes).toContain('Added responsive padding');
    expect(result.changes).toContain('Changed background color');
  });

  it('should extract numbered list changes', () => {
    const content = `{% schema %}{"name": "Test"}{% endschema %}<div></div>

Updates:
1. Increased font size
2. Added button styles
3. Fixed mobile layout`;

    const result = extractCodeFromResponse(content);

    expect(result.changes).toContain('Increased font size');
    expect(result.changes).toContain('Added button styles');
    expect(result.changes).toContain('Fixed mobile layout');
  });
});

describe('isCompleteLiquidSection', () => {
  it('should return true for complete section', () => {
    const code = `{% schema %}
{
  "name": "Complete Section"
}
{% endschema %}

<div class="section">
  <h2>{{ section.settings.heading }}</h2>
</div>`;

    expect(isCompleteLiquidSection(code)).toBe(true);
  });

  it('should return false for schema only', () => {
    const code = `{% schema %}{"name": "Schema Only"}{% endschema %}`;
    expect(isCompleteLiquidSection(code)).toBe(false);
  });

  it('should return false for markup only', () => {
    const code = `<div class="section"><h2>Hello</h2></div>`;
    expect(isCompleteLiquidSection(code)).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isCompleteLiquidSection('')).toBe(false);
  });
});
