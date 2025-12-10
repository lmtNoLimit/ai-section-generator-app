# Shopify Liquid Objects Research Report

**Date:** 2025-12-10
**Focus:** Core Liquid objects for section/block preview in Shopify apps

## Executive Summary

Shopify Liquid uses **objects** (`{{ }}` delimiters) to represent variables accessible in theme templates. Objects accessed via dot notation: `{{ object.property }}`. Three access patterns: globally available, template-specific, or through parent objects.

## Core Global Objects

### 1. PRODUCT (HIGH PRIORITY)
**Usage:** Sections, product templates, search results, collections
**Key Properties:**
- Pricing: `price`, `price_min`, `price_max`, `compare_at_price`, `price_varies`
- Status: `available`, `gift_card?`, `published_at`, `created_at`
- Details: `title`, `description`, `vendor`, `type`, `handle`, `tags`
- Media: `featured_image`, `featured_media`, `images`, `media[]`
- Variants: `variants[]`, `selected_variant`, `first_available_variant`, `options[]`
- Advanced: `metafields`, `selling_plan_groups`, `quantity_price_breaks_configured?`

### 2. SHOP (HIGH PRIORITY)
**Usage:** Globally available, store configuration
**Key Properties:**
- Identity: `name`, `domain`, `permanent_domain`, `email`, `phone`, `address`
- Catalog: `products_count`, `collections_count`, `types[]`, `vendors[]`
- Config: `currency`, `enabled_currencies[]`, `enabled_payment_types[]`, `customer_accounts_enabled`, `customer_accounts_optional`
- Policies: `refund_policy`, `privacy_policy`, `shipping_policy`, `terms_of_service`, `subscription_policy`
- Brand: `brand`, `published_locales[]`
- Store description & meta info

### 3. COLLECTION (HIGH PRIORITY)
**Usage:** Collection templates, product filters, navigation sections
**Expected Properties:** Assumed similar to product catalog structure with filtering

### 4. CART (HIGH PRIORITY)
**Usage:** Cart sections, checkout flows
**Expected Properties:** Items array, totals, discounts, customer info

### 5. CUSTOMER (HIGH PRIORITY)
**Usage:** Customer account sections, personalization
**Expected Properties:** Name, email, orders history, addresses, preferences

### 6. BLOG & ARTICLE (MEDIUM PRIORITY)
**Usage:** Blog sections, article templates
**Structure:** `article` objects accessible through `blog.articles[]` or directly in article templates

### 7. PAGES & SEARCH (MEDIUM PRIORITY)
**Usage:** General content pages, search functionality
**Components:** `paginate`, `search` functional elements

## Object Access Patterns

| Pattern | Context | Example |
|---------|---------|---------|
| Global | All Liquid files (except checkout) | `{{ shop.name }}`, `{{ product.title }}` |
| Template-Specific | Certain template types | `product` in product.liquid, `collection` in collection.liquid |
| Parent Object | Via parent properties | `{{ article }}` via `{{ blog.articles }}` |

## Common Nested Structures

- **product.variants[]** → Contains variant-specific data (price, availability, options)
- **product.images[]** / **product.media[]** → Media collection with alt text, dimensions
- **shop.policies[]** → Policy objects with title/body
- **blog.articles[]** → Article collection with publication data
- **cart.items[]** → Line item collection with quantities, prices, properties

## Liquid Syntax Essentials

- **Output:** `{{ object.property }}` with filters: `{{ product.title | upcase }}`
- **Tags:** Logic control via `{% %}` (if, for, assign, capture)
- **Filters:** Data transformation (capitalize, remove, replace, etc.)
- **Scope:** Global objects accessible in all theme files (theme/templates/*, theme/sections/*, theme/snippets/*)

## Implementation Priority Ranking

1. **CRITICAL (Phase 1):** `product`, `shop` - Foundation for most sections
2. **HIGH (Phase 2):** `collection`, `cart`, `customer` - Standard section types
3. **MEDIUM (Phase 3):** `blog`, `article`, `pages` - Content sections
4. **LOW (Phase 4):** `search`, `paginate`, specialized objects - Advanced features

## Key Considerations for liquidjs

- Support dot notation property access patterns
- Handle nested object/array structures (variants[], images[], etc.)
- Implement filter pipeline (`|` operator)
- Scope management for global vs. template-specific objects
- Handle missing/null property gracefully
- Support metafield custom data (arbitrary key-value pairs)
- Enable section preview context injection (simulated product/cart data)

## Data Type Requirements

- **Strings:** Titles, descriptions, handles, URLs
- **Numbers:** Prices (integer subunits), counts, dimensions
- **Booleans:** Availability flags, conditional properties (available?, gift_card?)
- **Arrays:** variants, images, media, collections, policies, locales
- **Objects:** Nested properties (featured_image, selected_variant, address, brand)
- **Timestamps:** published_at, created_at (ISO 8601 format)

## Notes on Shopify Liquid Variants

Shopify uses different Liquid implementations for:
- Email notifications (different variables)
- Flow automation (workflow context)
- Order printing/packing slips (specialized variables)

**Theme focus only** for section preview context.

---

**Unresolved Questions:**
- Complete `collection` object property structure
- Complete `cart` and `cart.items` nested structure
- Pagination object behavior in sections
- Custom metafield type handling (JSON, ratings, file references)
- Global availability of all documented objects in sections
