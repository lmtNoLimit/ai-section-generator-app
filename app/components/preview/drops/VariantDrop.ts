import { ShopifyDrop } from './base/ShopifyDrop';
import type { MockProductVariant } from '../mockData/types';

/**
 * Drop class for product variant objects
 * Provides Liquid-compatible access to variant properties
 */
export class VariantDrop extends ShopifyDrop {
  private variant: MockProductVariant;

  constructor(variant: MockProductVariant) {
    super();
    this.variant = variant;
  }

  get id(): number {
    return this.variant.id;
  }

  get title(): string {
    return this.variant.title;
  }

  get price(): number {
    return this.variant.price;
  }

  get available(): boolean {
    return this.variant.available;
  }

  get inventory_quantity(): number {
    return this.variant.inventory_quantity;
  }

  get sku(): string {
    return this.variant.sku;
  }

  get option1(): string | null {
    return this.variant.option1;
  }

  get option2(): string | null {
    return this.variant.option2;
  }

  get option3(): string | null {
    return this.variant.option3;
  }

  /**
   * Whether this variant is currently selected
   * In preview, defaults to false
   */
  get selected(): boolean {
    return false;
  }

  /**
   * Formatted options string
   */
  get options(): string[] {
    return [
      this.variant.option1,
      this.variant.option2,
      this.variant.option3
    ].filter((o): o is string => o !== null);
  }

  liquidMethodMissing(key: string): unknown {
    const data = this.variant as unknown as Record<string, unknown>;
    return data[key];
  }
}
