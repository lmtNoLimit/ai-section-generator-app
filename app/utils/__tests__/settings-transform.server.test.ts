import {
  generateSettingsAssigns,
  generateBlocksAssigns,
  rewriteSectionSettings,
} from "../settings-transform.server";

describe("generateSettingsAssigns", () => {
  describe("string settings", () => {
    it("should generate assign for string value", () => {
      const assigns = generateSettingsAssigns({ title: "Hello World" });

      expect(assigns).toContain("{% assign settings_title = 'Hello World' %}");
    });

    it("should escape single quotes in strings", () => {
      const assigns = generateSettingsAssigns({ text: "It's a test" });

      expect(assigns).toContain("{% assign settings_text = 'It\\'s a test' %}");
    });

    it("should escape backslashes in strings", () => {
      const assigns = generateSettingsAssigns({ path: "C:\\Users\\test" });

      expect(assigns).toContain("{% assign settings_path = 'C:\\\\Users\\\\test' %}");
    });

    it("should escape newlines in strings", () => {
      const assigns = generateSettingsAssigns({ multiline: "line1\nline2" });

      expect(assigns).toContain("{% assign settings_multiline = 'line1\\nline2' %}");
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

  describe("null/undefined settings", () => {
    it("should generate nil for null value", () => {
      const assigns = generateSettingsAssigns({ empty: null as unknown as string });

      expect(assigns).toContain("{% assign settings_empty = nil %}");
    });

    it("should generate nil for undefined value", () => {
      const assigns = generateSettingsAssigns({ missing: undefined as unknown as string });

      expect(assigns).toContain("{% assign settings_missing = nil %}");
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

  describe("block value escaping", () => {
    it("should escape block id with special chars", () => {
      const assigns = generateBlocksAssigns([
        { id: "block's-id", type: "text", settings: {} },
      ]);

      expect(assigns).toContain("{% assign block_0_id = 'block\\'s-id' %}");
    });

    it("should escape block setting strings", () => {
      const assigns = generateBlocksAssigns([
        { id: "b1", type: "text", settings: { quote: "He said 'hello'" } },
      ]);

      expect(assigns).toContain("{% assign block_0_quote = 'He said \\'hello\\'' %}");
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
});
