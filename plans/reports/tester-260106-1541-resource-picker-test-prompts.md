# Resource Picker Test Prompts - Comprehensive Validation Suite

**Date**: 2026-01-06
**Purpose**: Validate AI-generated sections with resource pickers have proper preview_settings, conditional wrappers, placeholders, and correct iteration patterns
**Test Focus**: SYSTEM_PROMPT updates (lines 144-172, 174-236, 238-301) + Error #13 validation

---

## Test Strategy

Each prompt designed to:
1. Trigger resource picker usage (product, collection, article, blog, page)
2. Expose AI tendencies to forget conditionals/placeholders
3. Validate preview_settings data in presets
4. Check .ai-resource-placeholder styling
5. Verify limit usage on relationship loops

**Validation Checklist Per Prompt**:
- [ ] preview_settings in preset (not section root)
- [ ] {% if section.settings.resource %} conditional wrapper
- [ ] {% else %} with .ai-resource-placeholder div
- [ ] Correct resource property access
- [ ] Limits on {% for %} loops (relationship patterns)
- [ ] Size checks before iteration: {% if list.size > 0 %}

---

## Category 1: Single Product Sections

### Test 1: Featured Product Showcase
**Category**: Single Product
**Merchant Level**: Beginner (simple featured product)
**Prompt**: "Create a featured product section. I want to showcase one product with a big image, the product title, price, and an 'Add to Cart' button. Make it look premium with a dark background."

**Expected Elements**:
- [ ] preview_settings includes products: [{title, price}]
- [ ] {% if section.settings.product %} wraps entire product display
- [ ] {% else %} shows .ai-resource-placeholder with "Select a product"
- [ ] section.settings.product.featured_image wrapped in {% if %}
- [ ] {{ section.settings.product.price | money }} filter applied
- [ ] No default resource picker value (picker has no default)
- [ ] Clean CSS with no global resets

**Trap**: Merchant might expect default placeholder product without realizing pickers need conditionals

---

### Test 2: Product Spotlight Hero
**Category**: Single Product
**Merchant Level**: Intermediate (wants emphasis)
**Prompt**: "I need a hero-like section that puts one product front and center. Include the product image as a background, with the product name, description, and price overlaid on top. Add some semi-transparent overlay for text readability."

**Expected Elements**:
- [ ] preview_settings includes products: [{title, price}]
- [ ] {% if section.settings.product %} conditional (critical - AI forgets this for backgrounds)
- [ ] {% else %} with .ai-resource-placeholder
- [ ] Background image pattern using CSS background-image (NOT image_tag)
- [ ] Style rule for background positioning/sizing
- [ ] Overlay element with opacity/rgba color
- [ ] {{ section.settings.product.title }} for content text layer
- [ ] No direct <img> tag for background (common mistake)

**Trap**: AI often misuses image_tag for backgrounds. Expect mistakes with pattern differentiation.

---

### Test 3: Product of the Day
**Category**: Single Product
**Merchant Level**: Beginner/Intermediate (daily rotation concept)
**Prompt**: "Create a 'Product of the Day' section that displays one highlighted product. Show the product image, name, regular price with strikethrough, sale price in red, product tags, and availability status."

**Expected Elements**:
- [ ] preview_settings includes products: [{title, price, compare_at_price, available, tags}]
- [ ] {% if section.settings.product %} wraps display (Error #13 check)
- [ ] {% else %} shows placeholder
- [ ] {{ section.settings.product.compare_at_price | money }} formatted
- [ ] Sale price styling/visibility logic
- [ ] {{ section.settings.product.tags }} iteration or join filter
- [ ] Availability check: {% if section.settings.product.available %}
- [ ] Image conditional: {% if section.settings.product.featured_image %}
- [ ] Classes prefixed with ai-*

**Trap**: Multiple properties need conditionals. AI may forget one.

---

## Category 2: Collection-Based Grids

### Test 4: Product Grid from Collection
**Category**: Collection/Relationship
**Merchant Level**: Intermediate (common use case)
**Prompt**: "Build a product grid that pulls items from a specific collection. Display 12 products max in a 4-column layout on desktop, 2 columns on mobile. Each product card shows image, name, and price."

**Expected Elements**:
- [ ] preview_settings includes collections: [{title, products_count}]
- [ ] {% if section.settings.collection %} wrapper (Error #13)
- [ ] {% else %} with .ai-resource-placeholder
- [ ] {% for product in section.settings.collection.products limit: 12 %} (REQUIRED LIMIT)
- [ ] {% endfor %} closing tag
- [ ] Responsive grid: 4 cols desktop, 2 cols mobile
- [ ] product.featured_image conditional inside loop
- [ ] {{ product.price | money }} in each card
- [ ] Size > 0 check NOT needed (collection.products is a direct relationship)
- [ ] Aspect ratio on image containers

**Trap**: AI may forget limit filter, causing performance issues. May miss mobile layout.

---

### Test 5: Featured Collection Products
**Category**: Collection/Relationship
**Merchant Level**: Intermediate (merchandising focus)
**Prompt**: "I want a section to showcase the best products from one collection. Show them in a 3-column carousel that scrolles horizontally on mobile. Include product image, name, price, and a 'View Details' link for each product."

**Expected Elements**:
- [ ] preview_settings includes collections: [{title}]
- [ ] {% if section.settings.collection %} wrapper
- [ ] {% else %} placeholder
- [ ] {% for product in section.settings.collection.products limit: 12 %} with limit
- [ ] Carousel/scroll layout CSS (flexbox overflow-x)
- [ ] product.url in href for detail links
- [ ] Mobile-first responsive (scroll on mobile, 3-col on desktop)
- [ ] No hardcoded max-width on carousel (responsive)

**Trap**: Carousel implementation may lack mobile scroll. May forget product.url property.

---

### Test 6: Best Sellers Carousel
**Category**: Collection/Relationship
**Merchant Level**: Advanced (merchandising + product metadata)
**Prompt**: "Create a 'Best Sellers' carousel that shows products from a curated collection. Display 5 products per view, with a prev/next button carousel. Each card shows image, name, price, and a star rating display if the product has 4+ stars."

**Expected Elements**:
- [ ] preview_settings includes collections: [{title, products_count}]
- [ ] {% if section.settings.collection %} wrapper
- [ ] {% else %} placeholder
- [ ] {% for product in section.settings.collection.products limit: 10 %} with limit
- [ ] Carousel markup (could use <div> with scroll or slider)
- [ ] Rating display: {% if product.rating >= 4 %} (if available in context)
- [ ] CSS classes: ai-carousel, ai-product-card, etc.
- [ ] No hardcoded item count

**Trap**: AI may use JavaScript-dependent slider without Liquid fallback. May assume rating exists without property check.

---

## Category 3: Blog/Article Sections

### Test 7: Blog Article Feed
**Category**: Blog/Relationship
**Merchant Level**: Intermediate (content marketing)
**Prompt**: "Create a blog feed section that shows the latest articles from a selected blog. Display 6 articles max in a 2-column grid on desktop, single column on mobile. Each article shows the featured image, title, excerpt, author, and publish date."

**Expected Elements**:
- [ ] preview_settings includes blogs: [{title, articles_count}]
- [ ] {% if section.settings.blog %} wrapper (Error #13)
- [ ] {% else %} with .ai-resource-placeholder
- [ ] {% for article in section.settings.blog.articles limit: 6 %} (REQUIRED LIMIT)
- [ ] article.published_at formatted with date filter
- [ ] article.image conditional: {% if article.image %}
- [ ] {{ article.excerpt }} displayed
- [ ] {{ article.author }} property access
- [ ] Responsive grid: 2 cols desktop, 1 col mobile
- [ ] Links to article.url

**Trap**: AI may forget limit, causing performance hit. May not know correct limit value for blogs.

---

### Test 8: Featured Article Highlight
**Category**: Blog/Single Article
**Merchant Level**: Intermediate (editorial focus)
**Prompt**: "I want a large featured article section that highlights one important blog post. Show the article image as a background with an overlay, article title, excerpt, and publish date on top. Add a 'Read More' button that links to the full article."

**Expected Elements**:
- [ ] preview_settings includes articles: [{title, excerpt, published_at}]
- [ ] {% if section.settings.article %} wrapper (article picker)
- [ ] {% else %} placeholder
- [ ] Background image pattern: CSS background-image (NOT image_tag)
- [ ] article.image with background-image style
- [ ] Overlay element for text contrast
- [ ] {{ article.title }} in content layer
- [ ] {{ article.excerpt }} in content layer
- [ ] article.url in button href
- [ ] Date formatted: {{ article.published_at | date: "%B %d, %Y" }}
- [ ] No <img> tag for background

**Trap**: AI may confuse single article picker with background image pattern. May use wrong pattern.

---

### Test 9: Latest News Section
**Category**: Blog/Relationship
**Merchant Level**: Beginner (simple news feed)
**Prompt**: "Build a 'Latest News' section that displays articles from our company blog. Show 4 articles in a single row with small thumbnails and titles. Make it compact so it fits in a sidebar."

**Expected Elements**:
- [ ] preview_settings includes blogs: [{title}]
- [ ] {% if section.settings.blog %} wrapper
- [ ] {% else %} placeholder
- [ ] {% for article in section.settings.blog.articles limit: 4 %}
- [ ] Compact card layout (flex or small grid)
- [ ] Article image as small thumbnail with aspect ratio
- [ ] Minimal text: title + optional date
- [ ] Links to article.url
- [ ] No overflow issues in sidebar width

**Trap**: May not set max-width or aspect ratio correctly. May forget limit entirely.

---

## Category 4: Multi-Resource Sections

### Test 10: Category Showcase (Collection List)
**Category**: Collection List
**Merchant Level**: Intermediate (category landing)
**Prompt**: "Create a section that shows multiple product categories as cards. I need to select 3-5 collections and display each as a card with the collection image, title, product count, and a 'Shop Collection' link."

**Expected Elements**:
- [ ] preview_settings includes collections: [{title, products_count, image}]
- [ ] Schema has collection_list setting (not collection)
- [ ] {% if section.settings.collection_list.size > 0 %} (SIZE CHECK REQUIRED)
- [ ] {% else %} with placeholder
- [ ] {% for collection in section.settings.collection_list %} (NO LIMIT on direct list, but may cap to 5)
- [ ] NO limit filter needed (collection_list is already limited by picker)
- [ ] collection.image conditional: {% if collection.image %}
- [ ] {{ collection.title }}
- [ ] {{ collection.products_count }}
- [ ] {{ collection.url }} in href
- [ ] Card styling with ai-collection-card class

**Trap**: AI may add limit to collection_list iteration when not needed. May forget size check before loop.

---

### Test 11: Curated Product Selection (Product List)
**Category**: Product List
**Merchant Level**: Advanced (manual curation)
**Prompt**: "I want a 'Staff Picks' section where we can manually select 5-8 products to feature. Display each product with a large image, name, price, and a 'Quick Add' button. Also show a small badge that says 'Staff Pick' on each one."

**Expected Elements**:
- [ ] preview_settings includes products: [{title, price}]
- [ ] Schema has product_list setting
- [ ] {% if section.settings.product_list.size > 0 %} (SIZE CHECK REQUIRED)
- [ ] {% else %} with "No products selected" placeholder
- [ ] {% for product in section.settings.product_list %} (NO LIMIT, list is capped by max_blocks or picker)
- [ ] product.featured_image conditional in loop
- [ ] {{ product.price | money }}
- [ ] Badge element (span/div with ai-badge class)
- [ ] Button with add-to-cart concept
- [ ] No unnecessary loops

**Trap**: Product_list has max 50 items. AI may add limit filter when not needed. May miss size check.

---

## Category 5: Edge Cases

### Test 12: Complex Multi-Resource Section
**Category**: Complex/Mixed
**Merchant Level**: Advanced (wants everything)
**Prompt**: "Create a 'Seasonal Shop' section with multiple parts: top featured product, a product grid from a selected collection (8 items), and at the bottom a list of related blog articles (3 articles) from our news blog. All three should be independently selectable. Show the featured product with description, the collection items in a grid, and articles as a simple list."

**Expected Elements**:
- [ ] preview_settings includes products, collections, blogs (all three)
- [ ] FIRST: {% if section.settings.product %} wrapper for featured product
- [ ] Product display with image conditional
- [ ] SECOND: {% if section.settings.collection %} wrapper for grid
- [ ] {% for product in section.settings.collection.products limit: 8 %}
- [ ] THIRD: {% if section.settings.blog %} wrapper for articles
- [ ] {% for article in section.settings.blog.articles limit: 3 %}
- [ ] Three separate placeholders if any resource missing
- [ ] No cross-contamination of conditionals
- [ ] All resource access inside correct {% if %} block
- [ ] CSS organizing three distinct sections

**Trap**: Most complex case. AI likely forgets one conditional. May nest conditionals incorrectly. May reuse limit values incorrectly.

---

### Test 13: Page Content Embed (Single Page)
**Category**: Page Picker (Edge Case)
**Merchant Level**: Intermediate (support/info section)
**Prompt**: "Build a flexible 'Support Info' section where we can select a page and display its content. Show the page title as a heading, then the full page content below it. Add a 'Learn More' button linking to the full page if someone wants more details."

**Expected Elements**:
- [ ] preview_settings includes pages: [{title, content}]
- [ ] {% if section.settings.page %} wrapper (page picker)
- [ ] {% else %} with .ai-resource-placeholder
- [ ] {{ section.settings.page.title }}
- [ ] {{ section.settings.page.content }} (raw HTML from page)
- [ ] {{ section.settings.page.url }} in button
- [ ] Proper styling to contain/sanitize page content
- [ ] No content overflow issues
- [ ] Semantic HTML (page content renders as-is)

**Trap**: Page content is raw HTML. AI may have issues with escaping/sanitizing. May forget the picker conditional.

---

### Test 14: Resource Picker in Blocks (Multi-Product Cards)
**Category**: Block-Level Resource (Advanced Pattern)
**Merchant Level**: Advanced (block repeating)
**Prompt**: "Create a testimonials section with reusable blocks. Each block should let us select a product, and display the product image, title, and a customer review text. We want to add multiple testimonials that each reference different products. Make the blocks draggable in the editor."

**Expected Elements**:
- [ ] Schema has blocks array with limit (e.g., limit: 5)
- [ ] Each block has a product picker setting
- [ ] preview_settings includes products: [{title}]
- [ ] {% for block in section.blocks %} iteration
- [ ] Inside block loop: {% if block.settings.product %}
- [ ] {{ block.settings.product.title }}
- [ ] {{ block.settings.product.featured_image | image_url: width: 300 | image_tag }}
- [ ] Block placeholder text input for review
- [ ] No preview_settings for blocks (only for section-level resources)
- [ ] Block naming uses heading/title/text precedence

**Trap**: Block-level pickers need conditional inside {% for block %} loop. Easy to forget. May confuse block preview_settings (not valid).

---

### Test 15: Empty State Consistency
**Category**: Error Handling
**Merchant Level**: UX Focus
**Prompt**: "I want a clean section design where if the merchant hasn't selected a resource yet, they see a helpful placeholder. Make the placeholder match our brand colors and have instructional text like 'Select a product to display'. The placeholder should take up the same space as the actual content would, so the layout doesn't jump around."

**Expected Elements**:
- [ ] All resource pickers wrapped in conditionals (Error #13)
- [ ] All placeholders use .ai-resource-placeholder class
- [ ] Consistent placeholder styling across section
- [ ] Placeholder has fixed/min height matching content height
- [ ] Placeholder background color matches brand (CSS variable or hex)
- [ ] Clear CTA text: "Select a product to display"
- [ ] No layout shift when resource loaded
- [ ] CSS: aspect-ratio or min-height set on placeholders
- [ ] Padding/border consistent with real content

**Trap**: Layout shift is common bug. Test if placeholder size matches content size. Test if CSS is scoped properly.

---

## Validation Checklist Template

Use this for each test prompt execution:

```
Test [#]: [Name]
Category: [category]

PRESET VALIDATION:
- [ ] presets array exists
- [ ] preset has "name" matching schema.name
- [ ] preview_settings in preset (not at root)
- [ ] preview_settings has correct resource types
- [ ] preview_settings data is minimal but complete

CONDITIONAL VALIDATION:
- [ ] {% if section.settings.resource %} exists
- [ ] Covers entire resource display
- [ ] {% else %} block present
- [ ] Placeholder has class="ai-resource-placeholder"
- [ ] {% endif %} properly closes

PROPERTY VALIDATION:
- [ ] Correct resource property names used
- [ ] All property accesses inside conditional
- [ ] Filters applied correctly (money, date, etc.)
- [ ] Image conditionals for featured_image
- [ ] Required properties documented in SYSTEM_PROMPT

ITERATION VALIDATION (if applicable):
- [ ] {% if list.size > 0 %} before iteration (list pickers)
- [ ] {% for item in collection %} has limit: N (relationship loops)
- [ ] No limit on direct list pickers (collection_list, product_list)
- [ ] {% endfor %} properly closes loop
- [ ] Item properties accessed correctly inside loop

STYLING VALIDATION:
- [ ] CSS in {% style %}...{% endstyle %} block
- [ ] Root selector uses #shopify-section-{{ section.id }}
- [ ] Custom classes prefixed with ai-
- [ ] Placeholder styling complete
- [ ] No global CSS resets
- [ ] Responsive design mobile-first

COMMON ERRORS (should NOT appear):
- [ ] No unscoped conditionals
- [ ] No hardcoded values
- [ ] No image_tag used for background images
- [ ] No missing limits on relationship loops
- [ ] No resource access outside conditional
- [ ] No size check skipped on list iterations
```

---

## Summary

**Total Prompts**: 15
**Categories Covered**:
- Single Product Sections: 3 prompts
- Collection-Based Grids: 3 prompts
- Blog/Article Sections: 3 prompts
- Multi-Resource Sections: 2 prompts
- Edge Cases: 4 prompts

**Primary Focus Areas**:
1. **Error #13**: All resource pickers wrapped in conditionals ✓
2. **preview_settings**: Minimal but complete data in presets ✓
3. **Placeholders**: .ai-resource-placeholder class consistency ✓
4. **Limits**: Correct limit usage on relationship loops ✓
5. **Size Checks**: {% if list.size > 0 %} before list iterations ✓
6. **Property Access**: Correct resource properties with filters ✓
7. **Image Patterns**: Distinction between content and background images ✓

**Expected Failure Modes** (traps designed to catch AI mistakes):
- Forgetting conditionals on resource access
- Missing limit filters on relationship loops
- Confusing preview_settings placement
- Using image_tag for background images
- Missing size checks before list iteration
- Incorrect property names or access patterns
- Layout shift due to inadequate placeholder sizing
- Cross-contamination of multiple resource conditionals

---

## Next Steps

1. Execute each prompt against current AI service
2. Log failures per prompt with error classification
3. Update SYSTEM_PROMPT if patterns emerge
4. Add regression tests for caught issues
5. Monitor resource picker pattern compliance
