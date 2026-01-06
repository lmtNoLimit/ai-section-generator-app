import {
  generateSettingsAssigns,
  generateBlocksAssigns,
  rewriteSectionSettings,
  rewriteBlocksIteration,
  stripImageUrlFilters,
} from "../settings-transform.server";

describe("generateSettingsAssigns", () => {
  describe("string settings", () => {
    it("should generate assign for string value", () => {
      const assigns = generateSettingsAssigns({ title: "Hello World" });

      expect(assigns).toContain("{% assign settings_title = 'Hello World' %}");
    });

    it("should use double quotes for strings with single quotes", () => {
      const assigns = generateSettingsAssigns({ text: "It's a test" });

      // New behavior: use double quotes when string contains single quotes
      expect(assigns).toContain('{% assign settings_text = "It\'s a test" %}');
    });

    it("should use single quotes for strings with double quotes", () => {
      const assigns = generateSettingsAssigns({ quote: 'He said "hello"' });

      expect(assigns).toContain("{% assign settings_quote = 'He said \"hello\"' %}");
    });

    it("should use capture block for strings with both quote types", () => {
      const assigns = generateSettingsAssigns({ mixed: "It's \"complex\"" });

      // Capture blocks don't need escaping - content is literal
      expect(assigns).toContain("{% capture settings_mixed %}It's \"complex\"{% endcapture %}");
    });

    it("should preserve backslashes in strings", () => {
      // Backslashes are literal in Liquid strings
      const assigns = generateSettingsAssigns({ path: "C:\\Users\\test" });

      expect(assigns).toContain("{% assign settings_path = 'C:\\Users\\test' %}");
    });

    it("should preserve newlines in strings", () => {
      // Liquid strings can contain literal newlines
      const assigns = generateSettingsAssigns({ multiline: "line1\nline2" });

      expect(assigns).toContain("{% assign settings_multiline = 'line1\nline2' %}");
    });
  });

  describe("number settings", () => {
    it("should generate assign for integer", () => {
      const assigns = generateSettingsAssigns({ columns: 3 });

      expect(assigns).toContain("{% assign settings_columns = 3 %}");
    });

    it("should generate assign for float", () => {
      const assigns = generateSettingsAssigns({ opacity: 0.5 });

      expect(assigns).toContain("{% assign settings_opacity = 0.5 %}");
    });

    it("should generate assign for negative number", () => {
      const assigns = generateSettingsAssigns({ offset: -10 });

      expect(assigns).toContain("{% assign settings_offset = -10 %}");
    });
  });

  describe("boolean settings", () => {
    it("should generate assign for true", () => {
      const assigns = generateSettingsAssigns({ show_title: true });

      expect(assigns).toContain("{% assign settings_show_title = true %}");
    });

    it("should generate assign for false", () => {
      const assigns = generateSettingsAssigns({ hide_footer: false });

      expect(assigns).toContain("{% assign settings_hide_footer = false %}");
    });
  });

  describe("null/undefined/empty settings", () => {
    it("should generate nil for null value", () => {
      const assigns = generateSettingsAssigns({ empty: null as unknown as string });

      expect(assigns).toContain("{% assign settings_empty = nil %}");
    });

    it("should generate nil for undefined value", () => {
      const assigns = generateSettingsAssigns({ missing: undefined as unknown as string });

      expect(assigns).toContain("{% assign settings_missing = nil %}");
    });

    it("should generate nil for empty string value", () => {
      const assigns = generateSettingsAssigns({ image: '' });

      expect(assigns).toContain("{% assign settings_image = nil %}");
    });

    it("should generate nil for empty string (image_picker placeholder test)", () => {
      // Empty image_picker settings should be nil so {% if settings_image %} works
      const assigns = generateSettingsAssigns({ hero_image: '', title: 'Hello' });

      expect(assigns).toContain("{% assign settings_hero_image = nil %}");
      expect(assigns).toContain("{% assign settings_title = 'Hello' %}");
    });
  });

  describe("key sanitization", () => {
    it("should skip keys starting with numbers", () => {
      const assigns = generateSettingsAssigns({
        "123invalid": "value",
        valid_key: "value2",
      });

      expect(assigns.join("\n")).not.toContain("123invalid");
      expect(assigns).toContain("{% assign settings_valid_key = 'value2' %}");
    });

    it("should replace special characters with underscore", () => {
      const assigns = generateSettingsAssigns({ "my-key": "value" });

      expect(assigns).toContain("{% assign settings_my_key = 'value' %}");
    });

    it("should accept underscore-prefixed keys", () => {
      const assigns = generateSettingsAssigns({ _private: "secret" });

      expect(assigns).toContain("{% assign settings__private = 'secret' %}");
    });
  });

  describe("complex types", () => {
    it("should skip array values", () => {
      const assigns = generateSettingsAssigns({
        items: ["a", "b"] as unknown as string,
      });

      expect(assigns.join("\n")).not.toContain("items");
    });

    it("should skip object values", () => {
      const assigns = generateSettingsAssigns({
        nested: { key: "value" } as unknown as string,
      });

      expect(assigns.join("\n")).not.toContain("nested");
    });
  });
});

describe("generateBlocksAssigns", () => {
  describe("empty blocks", () => {
    it("should return blocks_count = 0 for empty array", () => {
      const assigns = generateBlocksAssigns([]);

      expect(assigns).toEqual(["{% assign blocks_count = 0 %}"]);
    });
  });

  describe("single block", () => {
    it("should generate block metadata", () => {
      const assigns = generateBlocksAssigns([
        { id: "block-1", type: "heading", settings: {} },
      ]);

      expect(assigns).toContain("{% assign block_0_id = 'block-1' %}");
      expect(assigns).toContain("{% assign block_0_type = 'heading' %}");
      expect(assigns).toContain("{% assign blocks_count = 1 %}");
    });

    it("should generate block settings", () => {
      const assigns = generateBlocksAssigns([
        { id: "b1", type: "text", settings: { title: "Hello", visible: true } },
      ]);

      expect(assigns).toContain("{% assign block_0_title = 'Hello' %}");
      expect(assigns).toContain("{% assign block_0_visible = true %}");
    });
  });

  describe("multiple blocks", () => {
    it("should generate numbered assigns for each block", () => {
      const assigns = generateBlocksAssigns([
        { id: "b1", type: "heading", settings: { text: "Title" } },
        { id: "b2", type: "paragraph", settings: { text: "Body" } },
        { id: "b3", type: "button", settings: { label: "Click" } },
      ]);

      expect(assigns).toContain("{% assign block_0_type = 'heading' %}");
      expect(assigns).toContain("{% assign block_0_text = 'Title' %}");
      expect(assigns).toContain("{% assign block_1_type = 'paragraph' %}");
      expect(assigns).toContain("{% assign block_1_text = 'Body' %}");
      expect(assigns).toContain("{% assign block_2_type = 'button' %}");
      expect(assigns).toContain("{% assign block_2_label = 'Click' %}");
      expect(assigns).toContain("{% assign blocks_count = 3 %}");
    });
  });

  describe("block empty string settings", () => {
    it("should generate nil for empty string in block settings", () => {
      const assigns = generateBlocksAssigns([
        { id: "b1", type: "image", settings: { image_url: '', alt_text: 'My Image' } },
      ]);

      expect(assigns).toContain("{% assign block_0_image_url = nil %}");
      expect(assigns).toContain("{% assign block_0_alt_text = 'My Image' %}");
    });
  });

  describe("block value escaping", () => {
    it("should use double quotes for block id with apostrophes", () => {
      const assigns = generateBlocksAssigns([
        { id: "block's-id", type: "text", settings: {} },
      ]);

      // New behavior: use double quotes when string contains single quotes
      expect(assigns).toContain('{% assign block_0_id = "block\'s-id" %}');
    });

    it("should use double quotes for block settings with apostrophes", () => {
      const assigns = generateBlocksAssigns([
        { id: "b1", type: "text", settings: { quote: "He said 'hello'" } },
      ]);

      expect(assigns).toContain('{% assign block_0_quote = "He said \'hello\'" %}');
    });

    it("should use capture block for both quote types", () => {
      const assigns = generateBlocksAssigns([
        { id: "b1", type: "text", settings: { mixed: "It's \"tricky\"" } },
      ]);

      expect(assigns).toContain("{% capture block_0_mixed %}It's \"tricky\"{% endcapture %}");
    });
  });
});

describe("rewriteSectionSettings", () => {
  it("should rewrite section.settings.X to settings_X in output tags", () => {
    const code = "{{ section.settings.title }}";
    const result = rewriteSectionSettings(code);

    expect(result).toBe("{{ settings_title }}");
  });

  it("should rewrite section.settings in if tags", () => {
    const code = "{% if section.settings.show %}visible{% endif %}";
    const result = rewriteSectionSettings(code);

    expect(result).toBe("{% if settings_show %}visible{% endif %}");
  });

  it("should rewrite multiple occurrences", () => {
    const code = `
{{ section.settings.title }}
{% if section.settings.show_vendor %}
  {{ section.settings.vendor_text }}
{% endif %}
`;
    const result = rewriteSectionSettings(code);

    expect(result).toContain("{{ settings_title }}");
    expect(result).toContain("{% if settings_show_vendor %}");
    expect(result).toContain("{{ settings_vendor_text }}");
  });

  it("should not rewrite non-matching patterns", () => {
    const code = "{{ product.title }} {{ collection.settings }}";
    const result = rewriteSectionSettings(code);

    expect(result).toBe(code);
  });

  it("should handle underscore in setting names", () => {
    const code = "{{ section.settings.show_add_to_cart }}";
    const result = rewriteSectionSettings(code);

    expect(result).toBe("{{ settings_show_add_to_cart }}");
  });

  it("should rewrite bracket notation with single quotes", () => {
    const code = "{{ section.settings['title'] }}";
    const result = rewriteSectionSettings(code);

    expect(result).toBe("{{ settings_title }}");
  });

  it("should rewrite bracket notation with double quotes", () => {
    const code = '{% if section.settings["show"] %}';
    const result = rewriteSectionSettings(code);

    expect(result).toBe("{% if settings_show %}");
  });

  it("should preserve filter chains after rewrite", () => {
    const code = "{{ section.settings.title | upcase | truncate: 20 }}";
    const result = rewriteSectionSettings(code);

    expect(result).toBe("{{ settings_title | upcase | truncate: 20 }}");
  });

  // Legacy ID-based resource picker detection (backward compatibility)
  it("should preserve resource picker with exact ID 'collection'", () => {
    const code = "{% if section.settings.collection %}{{ section.settings.collection.title }}{% endif %}";
    const result = rewriteSectionSettings(code);

    expect(result).toBe("{% if collection %}{{ collection.title }}{% endif %}");
  });

  it("should preserve resource picker with exact ID 'product'", () => {
    const code = "{{ section.settings.product.title }}";
    const result = rewriteSectionSettings(code);

    expect(result).toBe("{{ product.title }}");
  });

  // Schema-aware resource picker detection (new feature)
  describe("schema-aware resource picker detection", () => {
    it("should map custom collection ID to 'collection' when schema provided", () => {
      const code = "{% if section.settings.selected_collection %}{{ section.settings.selected_collection.products }}{% endif %}";
      const schema = {
        name: "Product Grid",
        settings: [
          { type: "collection" as const, id: "selected_collection", label: "Collection" },
        ],
      };
      const result = rewriteSectionSettings(code, schema);

      expect(result).toBe("{% if collection %}{{ collection.products }}{% endif %}");
    });

    it("should map custom product ID to 'product' when schema provided", () => {
      const code = "{{ section.settings.featured_product.title }}";
      const schema = {
        name: "Featured Product",
        settings: [
          { type: "product" as const, id: "featured_product", label: "Product" },
        ],
      };
      const result = rewriteSectionSettings(code, schema);

      expect(result).toBe("{{ product.title }}");
    });

    it("should handle multiple custom resource IDs in same schema", () => {
      const code = `{% if section.settings.main_collection %}
  {% for product in section.settings.main_collection.products %}
    {{ product.title }}
  {% endfor %}
{% endif %}
{% if section.settings.hero_product %}
  {{ section.settings.hero_product.price | money }}
{% endif %}`;

      const schema = {
        name: "Multi Resource",
        settings: [
          { type: "collection" as const, id: "main_collection", label: "Main Collection" },
          { type: "product" as const, id: "hero_product", label: "Hero Product" },
        ],
      };
      const result = rewriteSectionSettings(code, schema);

      expect(result).toContain("{% if collection %}");
      expect(result).toContain("{% for product in collection.products %}");
      expect(result).toContain("{% if product %}");
      expect(result).toContain("{{ product.price | money }}");
    });

    it("should handle article, blog, page pickers with custom IDs", () => {
      const code = "{{ section.settings.featured_article.title }} {{ section.settings.source_blog.title }} {{ section.settings.about_page.content }}";
      const schema = {
        name: "Content Section",
        settings: [
          { type: "article" as const, id: "featured_article", label: "Article" },
          { type: "blog" as const, id: "source_blog", label: "Blog" },
          { type: "page" as const, id: "about_page", label: "Page" },
        ],
      };
      const result = rewriteSectionSettings(code, schema);

      expect(result).toBe("{{ article.title }} {{ blog.title }} {{ page.content }}");
    });

    it("should fallback to legacy detection when schema not provided", () => {
      const code = "{{ section.settings.selected_collection.title }}";
      // No schema provided - custom ID doesn't match legacy list
      const result = rewriteSectionSettings(code);

      // Falls back to settings_X format (legacy behavior)
      expect(result).toBe("{{ settings_selected_collection.title }}");
    });

    it("should not affect non-resource settings when schema provided", () => {
      const code = "{{ section.settings.heading }} {{ section.settings.columns }}";
      const schema = {
        name: "Grid",
        settings: [
          { type: "text" as const, id: "heading", label: "Heading" },
          { type: "number" as const, id: "columns", label: "Columns" },
          { type: "collection" as const, id: "source", label: "Collection" },
        ],
      };
      const result = rewriteSectionSettings(code, schema);

      expect(result).toBe("{{ settings_heading }} {{ settings_columns }}");
    });
  });
});

describe("rewriteBlocksIteration", () => {
  describe("simple for loops", () => {
    it("should unroll simple for block loop", () => {
      const code = `{% for block in section.blocks %}
  <div>{{ block.settings.title }}</div>
{% endfor %}`;
      const result = rewriteBlocksIteration(code, 3);

      expect(result).toContain("{% if blocks_count > 0 %}");
      expect(result).toContain("{{ block_0_title }}");
      expect(result).toContain("{% if blocks_count > 1 %}");
      expect(result).toContain("{{ block_1_title }}");
      expect(result).toContain("{% if blocks_count > 2 %}");
      expect(result).toContain("{{ block_2_title }}");
    });

    it("should handle whitespace control syntax", () => {
      const code = `{%- for block in section.blocks -%}
  <div>{{ block.settings.text }}</div>
{%- endfor -%}`;
      const result = rewriteBlocksIteration(code, 2);

      expect(result).toContain("{% if blocks_count > 0 %}");
      expect(result).toContain("{{ block_0_text }}");
      expect(result).toContain("{% if blocks_count > 1 %}");
      expect(result).toContain("{{ block_1_text }}");
    });

    it("should preserve content outside for loops", () => {
      const code = `<div class="header">Title</div>
{% for block in section.blocks %}
  <div>{{ block.settings.content }}</div>
{% endfor %}
<div class="footer">Footer</div>`;
      const result = rewriteBlocksIteration(code, 2);

      expect(result).toContain('<div class="header">Title</div>');
      expect(result).toContain('<div class="footer">Footer</div>');
    });
  });

  describe("block.settings transformation", () => {
    it("should transform block.settings.property to block_N_property", () => {
      const code = `{% for block in section.blocks %}
  {{ block.settings.heading }}
  {{ block.settings.description }}
{% endfor %}`;
      const result = rewriteBlocksIteration(code, 2);

      expect(result).toContain("{{ block_0_heading }}");
      expect(result).toContain("{{ block_0_description }}");
      expect(result).toContain("{{ block_1_heading }}");
      expect(result).toContain("{{ block_1_description }}");
    });

    it("should transform bracket notation with single quotes", () => {
      const code = `{% for block in section.blocks %}
  {{ block.settings['title'] }}
{% endfor %}`;
      const result = rewriteBlocksIteration(code, 2);

      expect(result).toContain("{{ block_0_title }}");
      expect(result).toContain("{{ block_1_title }}");
    });

    it("should transform bracket notation with double quotes", () => {
      const code = `{% for block in section.blocks %}
  {{ block.settings["title"] }}
{% endfor %}`;
      const result = rewriteBlocksIteration(code, 2);

      expect(result).toContain("{{ block_0_title }}");
      expect(result).toContain("{{ block_1_title }}");
    });
  });

  describe("block.type and block.id transformation", () => {
    it("should transform block.type to block_N_type", () => {
      const code = `{% for block in section.blocks %}
  {% if block.type == 'heading' %}
    <h2>{{ block.settings.text }}</h2>
  {% endif %}
{% endfor %}`;
      const result = rewriteBlocksIteration(code, 2);

      expect(result).toContain("{% if block_0_type == 'heading' %}");
      expect(result).toContain("{% if block_1_type == 'heading' %}");
    });

    it("should transform block.id to block_N_id", () => {
      const code = `{% for block in section.blocks %}
  <div id="{{ block.id }}">{{ block.settings.title }}</div>
{% endfor %}`;
      const result = rewriteBlocksIteration(code, 2);

      expect(result).toContain('id="{{ block_0_id }}"');
      expect(result).toContain('id="{{ block_1_id }}"');
    });
  });

  describe("custom block variable names", () => {
    it("should handle custom variable name like b", () => {
      const code = `{% for b in section.blocks %}
  {{ b.settings.title }}
  {{ b.type }}
{% endfor %}`;
      const result = rewriteBlocksIteration(code, 2);

      expect(result).toContain("{{ block_0_title }}");
      expect(result).toContain("{{ block_0_type }}");
      expect(result).toContain("{{ block_1_title }}");
      expect(result).toContain("{{ block_1_type }}");
    });

    it("should handle custom variable name like item", () => {
      const code = `{% for item in section.blocks %}
  {{ item.settings.text }}
{% endfor %}`;
      const result = rewriteBlocksIteration(code, 2);

      expect(result).toContain("{{ block_0_text }}");
      expect(result).toContain("{{ block_1_text }}");
    });
  });

  describe("edge cases", () => {
    it("should return unchanged code if no for block loop", () => {
      const code = "{{ section.settings.title }}";
      const result = rewriteBlocksIteration(code);

      expect(result).toBe(code);
    });

    it("should handle multiple for loops", () => {
      const code = `{% for block in section.blocks %}
  {{ block.settings.title }}
{% endfor %}
<hr>
{% for block in section.blocks %}
  {{ block.settings.description }}
{% endfor %}`;
      const result = rewriteBlocksIteration(code, 2);

      // Both loops should be unrolled
      const occurrences = (result.match(/blocks_count > 0/g) || []).length;
      expect(occurrences).toBe(2);
    });

    it("should handle loop with filters", () => {
      const code = `{% for block in section.blocks %}
  {{ block.settings.title | upcase }}
{% endfor %}`;
      const result = rewriteBlocksIteration(code, 2);

      expect(result).toContain("{{ block_0_title | upcase }}");
      expect(result).toContain("{{ block_1_title | upcase }}");
    });

    it("should default to 10 max blocks", () => {
      const code = `{% for block in section.blocks %}
  {{ block.settings.x }}
{% endfor %}`;
      const result = rewriteBlocksIteration(code);

      expect(result).toContain("{% if blocks_count > 9 %}");
      expect(result).not.toContain("{% if blocks_count > 10 %}");
    });

    it("should handle empty loop body", () => {
      const code = `{% for block in section.blocks %}{% endfor %}`;
      const result = rewriteBlocksIteration(code, 2);

      expect(result).toContain("{% if blocks_count > 0 %}");
      expect(result).toContain("{% endif %}");
    });

    it("should skip transformation for nested for loops", () => {
      const code = `{% for block in section.blocks %}
  {% for item in collection.products %}
    {{ block.settings.title }}
  {% endfor %}
{% endfor %}`;
      const result = rewriteBlocksIteration(code, 2);

      // Should return original code unchanged due to nested loop
      expect(result).toBe(code);
    });

    it("should skip transformation for nested section.blocks loops", () => {
      const code = `{% for block in section.blocks %}
  {% for inner in section.blocks %}
    {{ block.settings.title }}
  {% endfor %}
{% endfor %}`;
      const result = rewriteBlocksIteration(code, 2);

      // Should return original code unchanged due to nested loop
      expect(result).toBe(code);
    });
  });
});

describe("stripImageUrlFilters", () => {
  describe("image_url filter removal", () => {
    it("should strip image_url with width parameter from settings", () => {
      const code = "{{ settings_background_image | image_url: width: 1920 }}";
      const result = stripImageUrlFilters(code);

      expect(result).toContain("settings_background_image");
      expect(result).not.toContain("image_url");
    });

    it("should strip image_url with size string from settings", () => {
      const code = "{{ settings_image | image_url: 'large' }}";
      const result = stripImageUrlFilters(code);

      expect(result).toContain("settings_image");
      expect(result).not.toContain("image_url");
    });

    it("should strip image_url without parameters", () => {
      const code = "{{ settings_hero_image | image_url }}";
      const result = stripImageUrlFilters(code);

      expect(result).toContain("settings_hero_image");
      expect(result).not.toContain("image_url");
    });

    it("should strip img_url filter", () => {
      const code = "{{ settings_product_image | img_url: 'medium' }}";
      const result = stripImageUrlFilters(code);

      expect(result).toContain("settings_product_image");
      expect(result).not.toContain("img_url");
    });

    it("should strip image_url with multiple parameters", () => {
      const code = "{{ settings_bg | image_url: width: 1920, height: 1080 }}";
      const result = stripImageUrlFilters(code);

      expect(result).toContain("settings_bg");
      expect(result).not.toContain("image_url");
    });
  });

  describe("block settings image_url removal", () => {
    it("should strip image_url from block settings", () => {
      const code = "{{ block_0_image | image_url: width: 800 }}";
      const result = stripImageUrlFilters(code);

      expect(result).toContain("block_0_image");
      expect(result).not.toContain("image_url");
    });

    it("should strip image_url from multiple block indices", () => {
      const code = `
        {{ block_0_icon | image_url: 'small' }}
        {{ block_1_background | image_url: width: 1200 }}
        {{ block_2_thumb | img_url }}
      `;
      const result = stripImageUrlFilters(code);

      expect(result).toContain("block_0_icon");
      expect(result).toContain("block_1_background");
      expect(result).toContain("block_2_thumb");
      expect(result).not.toContain("image_url");
      expect(result).not.toContain("img_url");
    });
  });

  describe("image_tag filter chain generates img element", () => {
    it("should convert image_url | image_tag to img element", () => {
      const code = "{{ settings_image | image_url: width: 1200 | image_tag }}";
      const result = stripImageUrlFilters(code);

      expect(result).toBe('<img src="{{ settings_image }}" alt="" loading="lazy">');
    });

    it("should convert image_url | image_tag with args to img element", () => {
      const code = "{{ settings_hero | image_url | image_tag: class: 'hero-image', loading: 'lazy' }}";
      const result = stripImageUrlFilters(code);

      expect(result).toBe('<img src="{{ settings_hero }}" alt="" loading="lazy">');
    });

    it("should convert full chain with both filter args to img element", () => {
      const code = "{{ settings_bg | image_url: width: 1920, height: 1080 | image_tag: alt: 'Background' }}";
      const result = stripImageUrlFilters(code);

      expect(result).toBe('<img src="{{ settings_bg }}" alt="" loading="lazy">');
    });

    it("should convert img_url | image_tag chain from blocks to img element", () => {
      const code = "{{ block_0_banner | img_url: 'large' | image_tag }}";
      const result = stripImageUrlFilters(code);

      expect(result).toBe('<img src="{{ block_0_banner }}" alt="" loading="lazy">');
    });
  });

  describe("preserves other filters", () => {
    it("should not affect non-image_url filters", () => {
      const code = "{{ settings_title | upcase | truncate: 20 }}";
      const result = stripImageUrlFilters(code);

      expect(result).toBe(code);
    });

    it("should not affect product.image usage", () => {
      const code = "{{ product.featured_image | image_url: width: 400 }}";
      const result = stripImageUrlFilters(code);

      expect(result).toBe(code);
    });

    it("should not affect collection.image usage", () => {
      const code = "{{ collection.image | img_url: 'medium' }}";
      const result = stripImageUrlFilters(code);

      expect(result).toBe(code);
    });
  });

  describe("integration with rewriteSectionSettings", () => {
    it("should strip image_url after settings transformation", () => {
      const code = "{{ section.settings.background_image | image_url: width: 1920 }}";
      const result = rewriteSectionSettings(code);

      // After rewrite: settings_background_image, then image_url is stripped
      // Note: Trailing space before }} may not be preserved (cosmetic only)
      expect(result).toContain("settings_background_image");
      expect(result).not.toContain("image_url");
    });

    it("should handle full template with image_url", () => {
      const code = `
{% if section.settings.background_image %}
  <section style="background-image: url('{{ section.settings.background_image | image_url: width: 1920 }}');">
{% else %}
  <section class="placeholder">
{% endif %}`;
      const result = rewriteSectionSettings(code);

      expect(result).toContain("{% if settings_background_image %}");
      expect(result).toContain("settings_background_image}}')");
      expect(result).not.toContain("image_url");
    });

    it("should convert image_url | image_tag chain to img element after settings transformation", () => {
      const code = "{{ section.settings.image | image_url: width: 1200 | image_tag }}";
      const result = rewriteSectionSettings(code);

      expect(result).toBe('<img src="{{ settings_image }}" alt="" loading="lazy">');
    });

    it("should handle full template with image_url | image_tag chain", () => {
      const code = `
{% if section.settings.image %}
  {{ section.settings.image | image_url: width: 1200 | image_tag }}
{% else %}
  {{ 'image' | placeholder_svg_tag: 'ai-placeholder-image' }}
{% endif %}`;
      const result = rewriteSectionSettings(code);

      expect(result).toContain("{% if settings_image %}");
      expect(result).toContain('<img src="{{ settings_image }}" alt="" loading="lazy">');
      expect(result).not.toContain("image_url");
      // Placeholder should remain unchanged
      expect(result).toContain("placeholder_svg_tag");
    });
  });
});
