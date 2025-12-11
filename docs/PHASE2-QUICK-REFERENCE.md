# Phase 2 Quick Reference: Liquid Objects & Drops

**Phase**: Phase 2 Missing Objects
**Release Date**: 2025-12-10
**Status**: Available in preview

## Available Liquid Objects

### Global Objects (Always Available)

| Object | Purpose | Key Properties |
|--------|---------|-----------------|
| `shop` | Store information | name, email, domain, url, currency |
| `request` | HTTP context | design_mode, page_type, path, host, origin |
| `routes` | Navigation URLs | cart_url, account_url, search_url, etc. (13 total) |
| `theme` | Theme metadata | id, name, role, settings |
| `customer` | Account data | id, email, first_name, last_name, orders_count, total_spent |

### Optional Objects (Context-Dependent)

| Object | Condition | Key Properties |
|--------|-----------|-----------------|
| `product` | Product page | id, title, price, variants, images, etc. |
| `collection` | Collection page | id, title, products, products_count, url |
| `article` | Article page | id, title, content, author, published_at |
| `cart` | Cart context | item_count, total_price, items[], currency |
| `paginate` | Paginated loops | current_page, page_size, total_items |

### Loop Objects

| Object | Usage | Key Properties |
|--------|-------|-----------------|
| `forloop` | Inside `{% for %}` | index, first, last, rindex, length |

## Quick Code Patterns

### Page Type Conditional
```liquid
{% if request.page_type == 'product' %}
  <h1>{{ product.title }}</h1>
{% elsif request.page_type == 'collection' %}
  <h2>{{ collection.title }}</h2>
{% else %}
  <p>{{ shop.name }}</p>
{% endif %}
```

### Cart Display
```liquid
{% if cart.item_count > 0 %}
  <p>Cart has {{ cart.item_count }} items for ${{ cart.total_price }}</p>
  {% for item in cart.items %}
    <li>{{ item.title }} x {{ item.quantity }} = ${{ item.line_price }}</li>
  {% endfor %}
{% else %}
  <p>Cart is empty</p>
{% endif %}
```

### Customer Greeting
```liquid
{% if customer.id %}
  <p>Welcome back, {{ customer.first_name }}!</p>
  <p>You've made {{ customer.orders_count }} purchases.</p>
{% endif %}
```

### Navigation Links
```liquid
<a href="{{ routes.cart_url }}">View Cart</a>
<a href="{{ routes.account_url }}">My Account</a>
<a href="{{ routes.search_url }}">Search</a>
```

### Loop Iteration Control
```liquid
{% for item in collection.products %}
  {% if forloop.first %}<ul>{% endif %}
  <li>{{ forloop.index }}: {{ item.title }}</li>
  {% if forloop.last %}</ul>{% endif %}
{% endfor %}
```

### Pagination
```liquid
{% paginate collection.products by 12 %}
  <p>Page {{ paginate.current_page }} of {{ paginate.total_items }}</p>
  {% for product in collection.products %}
    <!-- product loop -->
  {% endfor %}
{% endpaginate %}
```

## Drop Property Reference

### shop (ShopDrop)
```
shop.name              → "Demo Store"
shop.email             → "hello@demo-store.com"
shop.domain            → "demo-store.myshopify.com"
shop.url               → "https://demo-store.myshopify.com"
shop.currency          → "USD"
shop.money_format      → "${{amount}}"
shop.description       → "Your store description"
```

### request (RequestDrop)
```
request.design_mode    → true (always in preview)
request.page_type      → "product", "collection", "article", "index"
request.path           → "/" or "/collections/all"
request.host           → "preview.myshopify.com"
request.origin         → "https://preview.myshopify.com"
```

### routes (RoutesDrop)
```
routes.root_url        → "/"
routes.cart_url        → "/cart"
routes.account_url     → "/account"
routes.account_login_url
routes.account_logout_url
routes.account_register_url
routes.account_addresses_url
routes.cart_add_url    → "/cart/add"
routes.cart_change_url → "/cart/change"
routes.cart_clear_url  → "/cart/clear"
routes.cart_update_url → "/cart/update"
routes.collections_url → "/collections"
routes.all_products_collection_url
routes.search_url      → "/search"
routes.predictive_search_url
routes.product_recommendations_url
```

### cart (CartDrop)
```
cart.item_count        → 3
cart.total_price       → 29.97
cart.currency          → "USD"
cart.items             → [CartItem, CartItem, ...]

cart.items[0].id       → 1
cart.items[0].title    → "T-Shirt"
cart.items[0].quantity → 2
cart.items[0].price    → 15.00
cart.items[0].line_price → 30.00
cart.items[0].image    → {src, alt, width, height}
cart.items[0].url      → "/products/t-shirt"
```

### customer (CustomerDrop)
```
customer.id            → 12345
customer.email         → "user@example.com"
customer.first_name    → "John"
customer.last_name     → "Doe"
customer.name          → "John Doe"
customer.orders_count  → 5
customer.total_spent   → 299.99
```

### theme (ThemeDrop)
```
theme.id               → 98765
theme.name             → "Dawn"
theme.role             → "main"
theme.settings         → SettingsDrop (for custom settings)
```

### forloop (ForloopDrop)
```
forloop.index          → 1 (current iteration, 1-based)
forloop.index0         → 0 (current iteration, 0-based)
forloop.rindex         → 5 (reverse index, 1-based)
forloop.rindex0        → 4 (reverse index, 0-based)
forloop.first          → true (if first iteration)
forloop.last           → false (unless last iteration)
forloop.length         → 5 (total items)
```

### paginate (PaginateDrop)
```
paginate.current_page  → 2
paginate.page_size     → 12
paginate.total_items   → 47
```

## Filters with New Objects

### Cart Filtering Examples
```liquid
{{ cart.total_price | money }}           → "$29.97"
{{ cart.total_price | divided_by: 100 | round: 2 }}
{% for item in cart.items | sort: 'title' %}
  {{ item.title }}
{% endfor %}
```

### Customer Filtering Examples
```liquid
{{ customer.email | downcase | truncate: 20 }}
{{ customer.total_spent | money }}
{{ customer.name | capitalize }}
```

### Route URL Encoding
```liquid
{{ routes.search_url | append: '?q=shoes' }}
```

### Loop Iteration Classes
```liquid
{% for product in collection.products %}
  <div class="product {% if forloop.first %}first{% endif %} {% if forloop.last %}last{% endif %}">
    {{ product.title }}
  </div>
{% endfor %}
```

## Design Mode Detection

In preview (always true), use design_mode to show/hide elements:

```liquid
{% if request.design_mode %}
  <!-- This shows in preview -->
  <div class="preview-notice">
    Editing Section: "Featured Products"
  </div>
{% else %}
  <!-- This shows on live storefront -->
  <!-- normal section content -->
{% endif %}
```

## Related Documentation

- **Full Documentation**: See `docs/codebase-summary.md` (Phase 2 section)
- **System Architecture**: See `docs/system-architecture.md`
- **Code Standards**: See `docs/code-standards.md`
- **Implementation Details**: See `app/components/preview/drops/`

## When to Use Each Object

| Use Case | Object | Example |
|----------|--------|---------|
| Show store name | `shop` | `Welcome to {{ shop.name }}` |
| Detect page type | `request` | `{% if request.page_type == 'product' %}` |
| Navigation links | `routes` | `<a href="{{ routes.account_url }}">` |
| Show cart summary | `cart` | `Cart: {{ cart.item_count }} items` |
| Personalize for user | `customer` | `Hello {{ customer.first_name }}` |
| Theme branding | `theme` | Theme: `{{ theme.name }}` |
| Loop logic | `forloop` | `{% if forloop.first %}` |
| Pagination UI | `paginate` | Page: `{{ paginate.current_page }}` |

---

**Last Updated**: 2025-12-10
**Phase**: Phase 2 (Phase 7 Documentation)
**Quick Reference Version**: 1.0
