import { ShopifyDrop } from './base/ShopifyDrop';
import { ImageDrop } from './ImageDrop';
import type { MockArticle } from '../mockData/types';

/**
 * Drop class for article objects
 * Provides Liquid-compatible access to article properties
 */
export class ArticleDrop extends ShopifyDrop {
  private article: MockArticle;

  constructor(article: MockArticle) {
    super();
    this.article = article;
  }

  get id(): number {
    return this.article.id;
  }

  get title(): string {
    return this.article.title;
  }

  get handle(): string {
    return this.article.handle;
  }

  get content(): string {
    return this.article.content;
  }

  get excerpt(): string {
    return this.article.excerpt;
  }

  get excerpt_or_content(): string {
    return this.article.excerpt || this.article.content;
  }

  get author(): string {
    return this.article.author;
  }

  get published_at(): string {
    return this.article.published_at;
  }

  get created_at(): string {
    return this.article.published_at;
  }

  get url(): string {
    return this.article.url;
  }

  get tags(): string[] {
    return this.article.tags;
  }

  get image(): ImageDrop | null {
    return this.article.image
      ? new ImageDrop(this.article.image)
      : null;
  }

  /**
   * Check if article has a specific tag
   */
  has_tag(tag: string): boolean {
    return this.article.tags.includes(tag);
  }

  /**
   * Comments count (placeholder, comments not implemented)
   */
  get comments_count(): number {
    return 0;
  }

  /**
   * Whether comments are enabled
   */
  get comments_enabled(): boolean {
    return false;
  }

  /**
   * User object (simplified)
   */
  get user(): { first_name: string; last_name: string; bio: string } {
    const nameParts = this.article.author.split(' ');
    return {
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' ') || '',
      bio: ''
    };
  }

  liquidMethodMissing(key: string): unknown {
    const data = this.article as unknown as Record<string, unknown>;
    return data[key];
  }
}
