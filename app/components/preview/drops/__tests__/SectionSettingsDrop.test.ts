import { SectionSettingsDrop } from '../SectionSettingsDrop';
import { ProductDrop } from '../ProductDrop';
import { CollectionDrop } from '../CollectionDrop';
import { FontDrop } from '../FontDrop';
import type { MockProduct, MockCollection, MockImage } from '../../mockData/types';

// Minimal mock image for testing
const mockImage: MockImage = {
  src: 'https://example.com/image.jpg',
  alt: 'Test Image',
  width: 800,
  height: 600
};

// Minimal mock product for testing
const createMockProduct = (overrides: Partial<MockProduct> = {}): MockProduct => ({
  id: 1,
  title: 'Test Product',
  handle: 'test-product',
  description: 'A test product description',
  vendor: 'Test Vendor',
  type: 'Test Type',
  price: 1999,
  price_min: 1999,
  price_max: 2999,
  compare_at_price: 2499,
  available: true,
  inventory_quantity: 10,
  featured_image: mockImage,
  images: [mockImage],
  tags: ['tag1', 'tag2'],
  options: ['Size'],
  variants: [{
    id: 101,
    title: 'Default Title',
    price: 1999,
    available: true,
    inventory_quantity: 10,
    sku: 'TEST-001',
    option1: 'Medium',
    option2: null,
    option3: null
  }],
  url: '/products/test-product',
  ...overrides
});

// Minimal mock collection for testing
const createMockCollection = (overrides: Partial<MockCollection> = {}): MockCollection => ({
  id: 100,
  title: 'Test Collection',
  handle: 'test-collection',
  description: 'A test collection',
  image: mockImage,
  products: [createMockProduct()],
  products_count: 1,
  url: '/collections/test-collection',
  ...overrides
});

describe('SectionSettingsDrop', () => {
  describe('primitive settings', () => {
    it('returns primitive settings via liquidMethodMissing', () => {
      const drop = new SectionSettingsDrop(
        { heading: 'Hello World', color: '#ff0000', count: 5 },
        {}
      );

      expect(drop.liquidMethodMissing('heading')).toBe('Hello World');
      expect(drop.liquidMethodMissing('color')).toBe('#ff0000');
      expect(drop.liquidMethodMissing('count')).toBe(5);
    });

    it('returns undefined for non-existent settings', () => {
      const drop = new SectionSettingsDrop({ heading: 'Hello' }, {});
      expect(drop.liquidMethodMissing('nonexistent')).toBeUndefined();
    });

    it('handles boolean settings', () => {
      const drop = new SectionSettingsDrop(
        { show_title: true, enable_animation: false },
        {}
      );

      expect(drop.liquidMethodMissing('show_title')).toBe(true);
      expect(drop.liquidMethodMissing('enable_animation')).toBe(false);
    });
  });

  describe('resource drops', () => {
    it('returns ProductDrop for product resource settings', () => {
      const mockProduct = createMockProduct({ title: 'Featured Product' });
      const productDrop = new ProductDrop(mockProduct);

      const drop = new SectionSettingsDrop(
        { heading: 'Shop Now' },
        { featured_product: productDrop }
      );

      const result = drop.liquidMethodMissing('featured_product');
      expect(result).toBeInstanceOf(ProductDrop);
      expect((result as ProductDrop).title).toBe('Featured Product');
    });

    it('returns CollectionDrop for collection resource settings', () => {
      const mockCollection = createMockCollection({ title: 'Summer Sale' });
      const collectionDrop = new CollectionDrop(mockCollection);

      const drop = new SectionSettingsDrop(
        { heading: 'Browse Collection' },
        { featured_collection: collectionDrop }
      );

      const result = drop.liquidMethodMissing('featured_collection');
      expect(result).toBeInstanceOf(CollectionDrop);
      expect((result as CollectionDrop).title).toBe('Summer Sale');
    });

    it('enables property chaining on resource drops', () => {
      const mockProduct = createMockProduct({
        title: 'Chained Product',
        handle: 'chained-product',
        price: 2500
      });
      const productDrop = new ProductDrop(mockProduct);

      const drop = new SectionSettingsDrop({}, { product: productDrop });

      const product = drop.liquidMethodMissing('product') as ProductDrop;
      expect(product.title).toBe('Chained Product');
      expect(product.handle).toBe('chained-product');
      expect(product.price).toBe(2500);
    });
  });

  describe('precedence', () => {
    it('resource drops take precedence over primitives with same key', () => {
      const mockProduct = createMockProduct({ title: 'Real Product' });
      const productDrop = new ProductDrop(mockProduct);

      // Primitive has same key as resource drop
      const drop = new SectionSettingsDrop(
        { featured_product: 'gid://product/123' },
        { featured_product: productDrop }
      );

      const result = drop.liquidMethodMissing('featured_product');
      expect(result).toBeInstanceOf(ProductDrop);
      expect((result as ProductDrop).title).toBe('Real Product');
    });
  });

  describe('iteration', () => {
    it('yields primitive settings first', () => {
      const drop = new SectionSettingsDrop(
        { heading: 'Test', color: '#000' },
        {}
      );

      const entries = [...drop];
      expect(entries).toContainEqual(['heading', 'Test']);
      expect(entries).toContainEqual(['color', '#000']);
    });

    it('yields resource drops not in primitives', () => {
      const productDrop = new ProductDrop(createMockProduct());

      const drop = new SectionSettingsDrop(
        { heading: 'Test' },
        { featured_product: productDrop }
      );

      const entries = [...drop];
      const productEntry = entries.find(([key]) => key === 'featured_product');
      expect(productEntry).toBeDefined();
      expect(productEntry?.[1]).toBeInstanceOf(ProductDrop);
    });

    it('resolves resource drop for primitive keys with same name', () => {
      const productDrop = new ProductDrop(createMockProduct());

      const drop = new SectionSettingsDrop(
        { featured_product: 'gid://product/1' },
        { featured_product: productDrop }
      );

      const entries = [...drop];
      // Should have only one entry for featured_product, resolved to Drop
      const productEntries = entries.filter(([key]) => key === 'featured_product');
      expect(productEntries.length).toBe(1);
      expect(productEntries[0][1]).toBeInstanceOf(ProductDrop);
    });
  });

  describe('empty states', () => {
    it('handles empty settings', () => {
      const drop = new SectionSettingsDrop({}, {});
      expect(drop.liquidMethodMissing('anything')).toBeUndefined();
    });

    it('handles empty resource drops', () => {
      const drop = new SectionSettingsDrop({ heading: 'Test' }, {});
      expect(drop.liquidMethodMissing('heading')).toBe('Test');
      expect(drop.liquidMethodMissing('product')).toBeUndefined();
    });
  });

  describe('multiple resources', () => {
    it('supports multiple product and collection resources', () => {
      const product1 = new ProductDrop(createMockProduct({ title: 'Product 1' }));
      const product2 = new ProductDrop(createMockProduct({ title: 'Product 2' }));
      const collection = new CollectionDrop(createMockCollection({ title: 'Collection 1' }));

      const drop = new SectionSettingsDrop(
        { heading: 'Multi Resource Section' },
        {
          featured_product: product1,
          secondary_product: product2,
          featured_collection: collection
        }
      );

      expect((drop.liquidMethodMissing('featured_product') as ProductDrop).title).toBe('Product 1');
      expect((drop.liquidMethodMissing('secondary_product') as ProductDrop).title).toBe('Product 2');
      expect((drop.liquidMethodMissing('featured_collection') as CollectionDrop).title).toBe('Collection 1');
      expect(drop.liquidMethodMissing('heading')).toBe('Multi Resource Section');
    });
  });

  describe('font settings', () => {
    it('wraps font identifier in FontDrop', () => {
      const drop = new SectionSettingsDrop(
        { heading_font: 'georgia', body_font: 'arial' },
        {}
      );

      const headingFont = drop.liquidMethodMissing('heading_font');
      expect(headingFont).toBeInstanceOf(FontDrop);
      expect((headingFont as FontDrop).family).toBe('Georgia');
      expect((headingFont as FontDrop).stack).toBe('Georgia, serif');

      const bodyFont = drop.liquidMethodMissing('body_font');
      expect(bodyFont).toBeInstanceOf(FontDrop);
      expect((bodyFont as FontDrop).family).toBe('Arial');
    });

    it('returns FontDrop toString for CSS usage', () => {
      const drop = new SectionSettingsDrop({ heading_font: 'georgia' }, {});
      const font = drop.liquidMethodMissing('heading_font') as FontDrop;
      expect(font.toString()).toBe('Georgia, serif');
    });

    it('caches FontDrop instances', () => {
      const drop = new SectionSettingsDrop({ heading_font: 'georgia' }, {});

      const first = drop.liquidMethodMissing('heading_font');
      const second = drop.liquidMethodMissing('heading_font');

      expect(first).toBe(second); // Same instance
    });

    it('returns non-font strings as primitives', () => {
      const drop = new SectionSettingsDrop(
        { heading: 'Hello World', custom_font: 'not-a-font' },
        {}
      );

      expect(drop.liquidMethodMissing('heading')).toBe('Hello World');
      // Non-registered font identifier returns as-is (not FontDrop)
      // Actually isFontIdentifier('not-a-font') returns false, so it stays primitive
      expect(drop.liquidMethodMissing('custom_font')).toBe('not-a-font');
    });

    it('allows FontDrop property access (family, weight, stack)', () => {
      const drop = new SectionSettingsDrop({ heading_font: 'times' }, {});
      const font = drop.liquidMethodMissing('heading_font') as FontDrop;

      expect(font.liquidMethodMissing('family')).toBe('Times New Roman');
      expect(font.liquidMethodMissing('weight')).toBe(400);
      expect(font.liquidMethodMissing('stack')).toBe('"Times New Roman", Times, serif');
    });
  });
});
