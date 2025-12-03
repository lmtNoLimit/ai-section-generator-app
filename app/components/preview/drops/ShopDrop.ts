import { ShopifyDrop } from './base/ShopifyDrop';
import type { MockShop } from '../mockData/types';

/**
 * Drop class for shop objects
 * Provides Liquid-compatible access to shop properties
 */
export class ShopDrop extends ShopifyDrop {
  private shop: MockShop;

  constructor(shop: MockShop) {
    super();
    this.shop = shop;
  }

  get name(): string {
    return this.shop.name;
  }

  get email(): string {
    return this.shop.email;
  }

  get domain(): string {
    return this.shop.domain;
  }

  get url(): string {
    return this.shop.url;
  }

  get secure_url(): string {
    return this.shop.url.startsWith('https://') ? this.shop.url : `https://${this.shop.url}`;
  }

  get currency(): string {
    return this.shop.currency;
  }

  get money_format(): string {
    return this.shop.money_format;
  }

  get money_with_currency_format(): string {
    return `${this.shop.money_format} ${this.shop.currency}`;
  }

  get description(): string {
    return this.shop.description;
  }

  /**
   * Whether prices include taxes
   */
  get taxes_included(): boolean {
    return false;
  }

  /**
   * Whether customer accounts are enabled
   */
  get customer_accounts_enabled(): boolean {
    return true;
  }

  /**
   * Whether customer accounts are optional
   */
  get customer_accounts_optional(): boolean {
    return true;
  }

  /**
   * Shop address (placeholder)
   */
  get address(): {
    address1: string;
    address2: string;
    city: string;
    province: string;
    country: string;
    zip: string;
  } {
    return {
      address1: '',
      address2: '',
      city: '',
      province: '',
      country: '',
      zip: ''
    };
  }

  /**
   * Shop phone (placeholder)
   */
  get phone(): string {
    return '';
  }

  /**
   * Enabled payment types (placeholder)
   */
  get enabled_payment_types(): string[] {
    return ['visa', 'mastercard', 'american_express', 'paypal'];
  }

  /**
   * Shop locale
   */
  get locale(): string {
    return 'en';
  }

  liquidMethodMissing(key: string): unknown {
    const data = this.shop as unknown as Record<string, unknown>;
    return data[key];
  }
}
