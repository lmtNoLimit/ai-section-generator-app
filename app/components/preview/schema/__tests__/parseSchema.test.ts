import { resolveTranslationKey, extractSettings, extractBlocks, buildInitialState } from '../parseSchema';
import type { SchemaDefinition, SchemaSetting } from '../SchemaTypes';

describe('resolveTranslationKey', () => {
  it('resolves translation key with label suffix', () => {
    const result = resolveTranslationKey('t:sections.hero.settings.background_image.label');
    expect(result).toBe('Background Image');
  });

  it('resolves translation key with options and label suffix', () => {
    const result = resolveTranslationKey('t:sections.hero.settings.text_alignment.options__2.label');
    expect(result).toBe('Text Alignment');
  });

  it('leaves plain text unchanged', () => {
    const result = resolveTranslationKey('Background Color');
    expect(result).toBe('Background Color');
  });

  it('handles empty string', () => {
    const result = resolveTranslationKey('');
    expect(result).toBe('');
  });

  it('handles undefined', () => {
    const result = resolveTranslationKey(undefined);
    expect(result).toBe('');
  });

  it('converts snake_case to Title Case', () => {
    const result = resolveTranslationKey('t:sections.hero.settings.button_text.label');
    expect(result).toBe('Button Text');
  });

  it('handles translation key with info suffix', () => {
    const result = resolveTranslationKey('t:sections.hero.settings.heading.info');
    expect(result).toBe('Heading');
  });

  it('handles translation key with placeholder suffix', () => {
    const result = resolveTranslationKey('t:sections.hero.settings.email.placeholder');
    expect(result).toBe('Email');
  });

  it('skips common prefixes and suffixes', () => {
    const result = resolveTranslationKey('t:sections.blocks.settings.call_to_action.label');
    expect(result).toBe('Call To Action');
  });

  it('handles numbered options patterns', () => {
    const result = resolveTranslationKey('t:sections.hero.settings.alignment.options__1.label');
    expect(result).toBe('Alignment');
  });

  it('fallback returns key without t: prefix', () => {
    const result = resolveTranslationKey('t:label');
    expect(result).toBe('label');
  });
});

describe('extractSettings', () => {
  it('resolves translation keys in setting labels', () => {
    const schema: SchemaDefinition = {
      name: 'Test Section',
      settings: [
        {
          type: 'text',
          id: 'heading',
          label: 't:sections.hero.settings.heading.label',
        },
      ],
    };

    const settings = extractSettings(schema);
    expect(settings).toHaveLength(1);
    expect(settings[0].label).toBe('Heading');
  });

  it('resolves translation keys in select option labels', () => {
    const schema: SchemaDefinition = {
      name: 'Test Section',
      settings: [
        {
          type: 'select',
          id: 'alignment',
          label: 't:sections.hero.settings.alignment.label',
          options: [
            { value: 'left', label: 't:sections.hero.settings.alignment.options__1.label' },
            { value: 'center', label: 't:sections.hero.settings.alignment.options__2.label' },
          ],
        },
      ],
    };

    const settings = extractSettings(schema);
    expect(settings).toHaveLength(1);
    expect(settings[0].label).toBe('Alignment');
    expect(settings[0].options?.[0].label).toBe('Alignment');
    expect(settings[0].options?.[1].label).toBe('Alignment');
  });

  it('resolves translation keys in info and placeholder', () => {
    const schema: SchemaDefinition = {
      name: 'Test Section',
      settings: [
        {
          type: 'text',
          id: 'email',
          label: 't:sections.contact.settings.email.label',
          info: 't:sections.contact.settings.email.info',
          placeholder: 't:sections.contact.settings.email.placeholder',
        },
      ],
    };

    const settings = extractSettings(schema);
    expect(settings).toHaveLength(1);
    expect(settings[0].label).toBe('Email');
    expect(settings[0].info).toBe('Email');
    expect(settings[0].placeholder).toBe('Email');
  });

  it('leaves plain text labels unchanged', () => {
    const schema: SchemaDefinition = {
      name: 'Test Section',
      settings: [
        {
          type: 'text',
          id: 'title',
          label: 'Section Title',
        },
      ],
    };

    const settings = extractSettings(schema);
    expect(settings).toHaveLength(1);
    expect(settings[0].label).toBe('Section Title');
  });
});

describe('extractBlocks', () => {
  it('resolves translation keys in block names', () => {
    const schema: SchemaDefinition = {
      name: 'Test Section',
      blocks: [
        {
          type: 'testimonial',
          name: 't:sections.testimonials.blocks.testimonial.name',
          settings: [
            {
              type: 'text',
              id: 'author',
              label: 't:sections.testimonials.blocks.testimonial.settings.author.label',
            },
          ],
        },
      ],
    };

    const blocks = extractBlocks(schema);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].name).toBe('Testimonial');
    expect(blocks[0].settings?.[0].label).toBe('Author');
  });

  it('resolves translation keys in block setting options', () => {
    const schema: SchemaDefinition = {
      name: 'Test Section',
      blocks: [
        {
          type: 'button',
          name: 't:sections.cta.blocks.button.name',
          settings: [
            {
              type: 'select',
              id: 'style',
              label: 't:sections.cta.blocks.button.settings.style.label',
              options: [
                { value: 'primary', label: 't:sections.cta.blocks.button.settings.style.options__1.label' },
                { value: 'secondary', label: 't:sections.cta.blocks.button.settings.style.options__2.label' },
              ],
            },
          ],
        },
      ],
    };

    const blocks = extractBlocks(schema);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].name).toBe('Button');
    expect(blocks[0].settings?.[0].label).toBe('Style');
    expect(blocks[0].settings?.[0].options?.[0].label).toBe('Style');
    expect(blocks[0].settings?.[0].options?.[1].label).toBe('Style');
  });
});

describe('buildInitialState - expanded defaults', () => {
  it('sets font_picker default to system-ui', () => {
    const settings: SchemaSetting[] = [{ type: 'font_picker', id: 'font', label: 'Font' }];
    const state = buildInitialState(settings);
    expect(state.font).toBe('system-ui');
  });

  it('sets text_alignment default to left', () => {
    const settings: SchemaSetting[] = [{ type: 'text_alignment', id: 'align', label: 'Align' }];
    const state = buildInitialState(settings);
    expect(state.align).toBe('left');
  });

  it('sets radio default to first option', () => {
    const settings: SchemaSetting[] = [{
      type: 'radio',
      id: 'layout',
      label: 'Layout',
      options: [{ value: 'grid', label: 'Grid' }, { value: 'list', label: 'List' }]
    }];
    const state = buildInitialState(settings);
    expect(state.layout).toBe('grid');
  });

  it('sets collection_list default to empty JSON array', () => {
    const settings: SchemaSetting[] = [{ type: 'collection_list', id: 'collections', label: 'Collections' }];
    const state = buildInitialState(settings);
    expect(state.collections).toBe('[]');
  });

  it('sets product_list default to empty JSON array', () => {
    const settings: SchemaSetting[] = [{ type: 'product_list', id: 'products', label: 'Products' }];
    const state = buildInitialState(settings);
    expect(state.products).toBe('[]');
  });

  it('sets url default to #', () => {
    const settings: SchemaSetting[] = [{ type: 'url', id: 'link', label: 'Link' }];
    const state = buildInitialState(settings);
    expect(state.link).toBe('#');
  });

  it('uses explicit default over type default', () => {
    const settings: SchemaSetting[] = [{ type: 'url', id: 'link', label: 'Link', default: '/products' }];
    const state = buildInitialState(settings);
    expect(state.link).toBe('/products');
  });

  it('sets image_picker default to empty string (Shopify nil behavior)', () => {
    const settings: SchemaSetting[] = [{ type: 'image_picker', id: 'image', label: 'Image' }];
    const state = buildInitialState(settings);
    expect(state.image).toBe('');
  });

  it('sets checkbox default to false', () => {
    const settings: SchemaSetting[] = [{ type: 'checkbox', id: 'enabled', label: 'Enabled' }];
    const state = buildInitialState(settings);
    expect(state.enabled).toBe(false);
  });

  it('sets color default to #000000', () => {
    const settings: SchemaSetting[] = [{ type: 'color', id: 'text_color', label: 'Text Color' }];
    const state = buildInitialState(settings);
    expect(state.text_color).toBe('#000000');
  });

  it('sets number default to min value or 0', () => {
    const settings: SchemaSetting[] = [
      { type: 'number', id: 'count', label: 'Count' },
      { type: 'range', id: 'opacity', label: 'Opacity', min: 0.5, max: 1 }
    ];
    const state = buildInitialState(settings);
    expect(state.count).toBe(0);
    expect(state.opacity).toBe(0.5);
  });

  it('sets select default to first option value', () => {
    const settings: SchemaSetting[] = [{
      type: 'select',
      id: 'size',
      label: 'Size',
      options: [{ value: 'small', label: 'Small' }, { value: 'large', label: 'Large' }]
    }];
    const state = buildInitialState(settings);
    expect(state.size).toBe('small');
  });

  it('sets resource types to empty string', () => {
    const settings: SchemaSetting[] = [
      { type: 'product', id: 'featured_product', label: 'Product' },
      { type: 'collection', id: 'featured_collection', label: 'Collection' },
      { type: 'article', id: 'featured_article', label: 'Article' },
      { type: 'blog', id: 'featured_blog', label: 'Blog' },
      { type: 'page', id: 'featured_page', label: 'Page' },
      { type: 'link_list', id: 'menu', label: 'Menu' }
    ];
    const state = buildInitialState(settings);
    expect(state.featured_product).toBe('');
    expect(state.featured_collection).toBe('');
    expect(state.featured_article).toBe('');
    expect(state.featured_blog).toBe('');
    expect(state.featured_page).toBe('');
    expect(state.menu).toBe('');
  });

  it('skips header and paragraph display-only types', () => {
    const settings: SchemaSetting[] = [
      { type: 'header', id: 'header1', label: 'Section Header' },
      { type: 'paragraph', id: 'para1', label: 'Info text' },
      { type: 'text', id: 'title', label: 'Title' }
    ];
    const state = buildInitialState(settings);
    expect(state.header1).toBeUndefined();
    expect(state.para1).toBeUndefined();
    expect(state.title).toBe('');
  });
});
