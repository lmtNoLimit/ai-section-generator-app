// @jest-environment jsdom
import {
  extractCodeFromResponse,
  isCompleteLiquidSection,
  findOverlap,
  mergeResponses,
  validateLiquidCompleteness
} from '../code-extractor';

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

  // Phase 3: Structured CHANGES comment tests
  describe('structured CHANGES comment extraction', () => {
    it('should extract structured CHANGES comment from code', () => {
      const content = `\`\`\`liquid
{% schema %}
{"name": "Hero"}
{% endschema %}
<div>Content</div>
<!-- CHANGES: ["Added hero banner", "Set heading to blue", "Added CTA button"] -->
\`\`\``;

      const result = extractCodeFromResponse(content);

      expect(result.hasCode).toBe(true);
      expect(result.changes).toEqual([
        'Added hero banner',
        'Set heading to blue',
        'Added CTA button'
      ]);
      // CHANGES comment should be stripped from code
      expect(result.code).not.toContain('CHANGES:');
    });

    it('should strip CHANGES comment from extracted code', () => {
      const content = `\`\`\`liquid
{% schema %}{"name": "Test"}{% endschema %}
<div>Test</div>
<!-- CHANGES: ["Updated layout"] -->
\`\`\``;

      const result = extractCodeFromResponse(content);

      expect(result.code).not.toContain('<!-- CHANGES');
      expect(result.code).toContain('{% schema %}');
      expect(result.code).toContain('<div>Test</div>');
    });

    it('should handle malformed JSON in CHANGES gracefully', () => {
      const content = `\`\`\`liquid
{% schema %}{"name": "Test"}{% endschema %}
<div>Test</div>
<!-- CHANGES: [invalid json] -->
\`\`\`

- Fallback bullet point`;

      const result = extractCodeFromResponse(content);

      // Should fallback to bullet extraction
      expect(result.changes).toContain('Fallback bullet point');
    });

    it('should limit changes to 5 items max', () => {
      const content = `\`\`\`liquid
{% schema %}{"name": "Test"}{% endschema %}
<div>Test</div>
<!-- CHANGES: ["One", "Two", "Three", "Four", "Five", "Six", "Seven"] -->
\`\`\``;

      const result = extractCodeFromResponse(content);

      expect(result.changes?.length).toBe(5);
      expect(result.changes).not.toContain('Six');
      expect(result.changes).not.toContain('Seven');
    });

    it('should prefer structured comment over bullet fallback', () => {
      const content = `\`\`\`liquid
{% schema %}{"name": "Test"}{% endschema %}
<div>Test</div>
<!-- CHANGES: ["Structured change"] -->
\`\`\`

- Bullet change that should be ignored`;

      const result = extractCodeFromResponse(content);

      expect(result.changes).toEqual(['Structured change']);
      expect(result.changes).not.toContain('Bullet change that should be ignored');
    });

    it('should handle CHANGES comment with extra whitespace', () => {
      const content = `\`\`\`liquid
{% schema %}{"name": "Test"}{% endschema %}
<div>Test</div>
<!--   CHANGES:   ["Spaced change"]   -->
\`\`\``;

      const result = extractCodeFromResponse(content);

      expect(result.changes).toEqual(['Spaced change']);
    });

    it('should return undefined changes when no changes found', () => {
      const content = `\`\`\`liquid
{% schema %}{"name": "Test"}{% endschema %}
<div>Test</div>
\`\`\``;

      const result = extractCodeFromResponse(content);

      expect(result.changes).toBeUndefined();
    });
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

// Phase 3: Auto-continuation merge tests
describe('findOverlap', () => {
  it('should find exact overlap at boundary', () => {
    const str1 = 'Hello world, this is a test';
    const str2 = 'this is a test for overlap';

    const overlap = findOverlap(str1, str2);

    expect(overlap).toBe(14); // "this is a test"
  });

  it('should return 0 when no overlap exists', () => {
    const str1 = 'First string here';
    const str2 = 'Completely different content';

    const overlap = findOverlap(str1, str2);

    expect(overlap).toBe(0);
  });

  it('should not detect overlap shorter than 10 chars', () => {
    const str1 = 'Hello world';
    const str2 = 'world peace'; // Only 5 char overlap

    const overlap = findOverlap(str1, str2);

    expect(overlap).toBe(0);
  });

  it('should find overlap with Liquid code', () => {
    const str1 = `{% if section.settings.show %}
  <div class="ai-hero">
    <h2>{{ section.settings.heading }}</h2>`;
    const str2 = `{{ section.settings.heading }}</h2>
  </div>
{% endif %}`;

    const overlap = findOverlap(str1, str2);

    expect(overlap).toBeGreaterThanOrEqual(10);
  });

  it('should cap overlap at 200 chars max', () => {
    const sharedContent = 'A'.repeat(250);
    const str1 = 'prefix' + sharedContent;
    const str2 = sharedContent + 'suffix';

    const overlap = findOverlap(str1, str2);

    expect(overlap).toBeLessThanOrEqual(200);
  });
});

describe('mergeResponses', () => {
  it('should merge with overlap detected', () => {
    const original = 'Start of content... this is the ending part';
    const continuation = 'this is the ending part and more content here';

    const merged = mergeResponses(original, continuation);

    expect(merged).toBe('Start of content... this is the ending part and more content here');
    expect(merged).not.toContain('this is the ending part\nthis is the ending part');
  });

  it('should concatenate with newline when no overlap', () => {
    const original = 'First part of the code';
    const continuation = 'Second part continues here';

    const merged = mergeResponses(original, continuation);

    expect(merged).toBe('First part of the code\nSecond part continues here');
  });

  it('should handle Liquid code merge correctly', () => {
    const original = `{% schema %}
{"name": "Hero"}
{% endschema %}

<div class="ai-hero">
  <h2>{{ section.settings`;
    const continuation = `{{ section.settings.heading }}</h2>
</div>`;

    const merged = mergeResponses(original, continuation);

    // Should contain both parts
    expect(merged).toContain('{% schema %}');
    expect(merged).toContain('</div>');
    // Should not have duplicate opening
    expect((merged.match(/\{% schema %\}/g) || []).length).toBe(1);
  });

  it('should preserve schema integrity after merge', () => {
    const original = `{% schema %}
{
  "name": "Test",
  "settings": [`;
    const continuation = `[
    {"type": "text", "id": "heading"}
  ]
}
{% endschema %}
<div>Content</div>`;

    const merged = mergeResponses(original, continuation);

    expect(merged).toContain('{% schema %}');
    expect(merged).toContain('{% endschema %}');
    expect(merged).toContain('<div>Content</div>');
  });
});

// Phase 2/3: Liquid validation tests
describe('validateLiquidCompleteness', () => {
  // Note: Tests require FLAG_VALIDATE_LIQUID=true to run actual validation
  const originalEnv = process.env.FLAG_VALIDATE_LIQUID;

  beforeEach(() => {
    process.env.FLAG_VALIDATE_LIQUID = 'true';
  });

  afterEach(() => {
    process.env.FLAG_VALIDATE_LIQUID = originalEnv;
  });

  it('should return valid for complete section', () => {
    const code = `{% schema %}
{"name": "Complete", "presets": [{"name": "Complete"}]}
{% endschema %}

{% style %}
.ai-section { padding: 20px; }
{% endstyle %}

<div class="ai-section">
  {% if section.settings.show %}
    <h2>{{ section.settings.heading }}</h2>
  {% endif %}
</div>`;

    const result = validateLiquidCompleteness(code);

    expect(result.isComplete).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect unclosed Liquid tags', () => {
    const code = `{% schema %}
{"name": "Test"}
{% endschema %}

<div>
  {% if section.settings.show %}
    <h2>Heading</h2>
</div>`;

    const result = validateLiquidCompleteness(code);

    expect(result.isComplete).toBe(false);
    expect(result.errors.some(e => e.type === 'unclosed_liquid_tag')).toBe(true);
    expect(result.errors.some(e => e.tag === 'if')).toBe(true);
  });

  it('should detect missing endschema', () => {
    const code = `{% schema %}
{"name": "Truncated"

<div>Content</div>`;

    const result = validateLiquidCompleteness(code);

    expect(result.isComplete).toBe(false);
    expect(result.errors.some(e => e.type === 'unclosed_liquid_tag' && e.tag === 'schema')).toBe(true);
  });

  it('should detect invalid schema JSON', () => {
    const code = `{% schema %}
{"name": "Invalid, missing quote}
{% endschema %}

<div>Content</div>`;

    const result = validateLiquidCompleteness(code);

    expect(result.isComplete).toBe(false);
    expect(result.errors.some(e => e.type === 'invalid_schema_json')).toBe(true);
  });

  it('should skip validation when flag disabled', () => {
    process.env.FLAG_VALIDATE_LIQUID = 'false';

    const invalidCode = `{% schema %}
{"broken`;

    const result = validateLiquidCompleteness(invalidCode);

    expect(result.isComplete).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
