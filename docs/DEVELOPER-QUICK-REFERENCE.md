# Developer Quick Reference

**Last Updated**: 2025-12-20
**For**: Getting oriented in the codebase quickly

## Where to Start

### First Time Setup
1. Read [README.md](../README.md) - 2 min overview
2. Run `npm install && npm run dev` - Setup takes ~5 min
3. Open Shopify CLI tunnel URL in partner account
4. Check [CLAUDE.md](../CLAUDE.md) for workflow documentation

### Before Writing Code
1. Review [Code Standards](code-standards.md) - Patterns, naming, style
2. Understand [System Architecture](system-architecture.md) - Data flow, layers
3. Check [Codebase Summary](codebase-summary.md) - Find what exists

### When Adding Features
1. Follow [development-rules.md](../.claude/workflows/development-rules.md)
2. Use adapter pattern for services (see Code Standards §Service Layer)
3. Add types in `app/types/`
4. Write tests alongside code (see Code Standards §Testing)
5. Update relevant documentation

---

## File Organization

### Where to Find Things

**Need a service?**
→ `app/services/*.server.ts`

**Need a component?**
→ `app/components/{feature}/*.tsx`

**Need types?**
→ `app/types/*.types.ts`

**Need utilities?**
→ `app/utils/*.ts`

**Need a route?**
→ `app/routes/app.*.tsx` (or `webhooks.*.tsx`, `auth.*.tsx`)

**Need to modify database?**
→ `prisma/schema.prisma`

**Need to write tests?**
→ Colocate with source file: `Component.test.tsx` or `__tests__/`

---

## Quick Commands

```bash
# Development
npm run dev              # Start dev server (CTRL+C to stop)
npm run build            # Compile for production
npm test                 # Run all tests
npm run lint             # Check code quality

# Database
npm run setup            # Create database
npx prisma migrate dev   # Apply migrations
npx prisma studio       # Open database UI

# Deployment
npm run deploy           # Deploy to Shopify
npm run deploy:test      # Test deploy (dry-run)

# Debugging
npm run dev -- --debug   # Start with Node debugger
```

---

## Architecture Overview

### Request Flow

```
User Action (UI)
    ↓
React Component
    ↓
useSubmit() → POST route action
    ↓
Route action calls service
    ↓
Service (with error handling)
    ↓
External API (Shopify/Gemini) or Database
    ↓
Return result to action
    ↓
Redirect or return data
    ↓
Component updates
```

### Service Layer Pattern

```typescript
// Service interface (what it does)
class MyService {
  async doSomething(input: InputType): Promise<OutputType> {
    try {
      // Main logic
      return result;
    } catch (error) {
      console.error("Error:", error);
      return this.fallback();
    }
  }

  private fallback(): OutputType {
    // Safe default behavior
  }
}

export const myService = new MyService();
```

### Component Structure

```typescript
import { useActionData, useLoaderData, useNavigation } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  // Load data server-side
  const data = await service.getData(request);
  return { data };
}

export async function action({ request }: ActionFunctionArgs) {
  // Handle form submissions
  const formData = await request.formData();
  // Process and return
}

export default function Component() {
  const { data } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  // Use data and handle navigation state
}
```

---

## Common Tasks

### Add a New Route

1. Create `app/routes/app.newfeature.tsx`
2. Add `loader` function (server-side data loading)
3. Add `action` function (handle form submissions)
4. Export default component
5. Add navigation link in `app/routes/app.tsx`

### Add a Service

1. Create `app/services/feature.server.ts`
2. Implement class with methods
3. Handle errors with try-catch
4. Provide fallback/mock behavior
5. Export singleton instance
6. Add types to `app/types/feature.types.ts`

### Add a Component

1. Create `app/components/{feature}/MyComponent.tsx`
2. Use TypeScript with explicit types
3. Colocate tests: `MyComponent.test.tsx`
4. Export from `app/components/{feature}/index.ts`
5. Import in routes or other components

### Update Database

1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name description`
3. Review generated migration
4. Update services to use new fields
5. Update types if needed

---

## Key Patterns

### Adapter Pattern (Feature Flags)
Services can switch between mock and real implementations:

```typescript
// Feature flags determine behavior
const useRealAI = !process.env.FLAG_USE_MOCK_AI;

// Service selection
const aiService = useRealAI ? new AIService() : new MockAIService();
```

### Singleton Pattern (Database)
Reuse single database connection across requests:

```typescript
// db.server.ts
declare global {
  var prismaGlobal: PrismaClient;
}

const prisma = global.prismaGlobal ?? new PrismaClient();
export default prisma;
```

### Error Handling
Graceful degradation with fallbacks:

```typescript
try {
  return await externalAPI.call();
} catch (error) {
  console.error("API error:", error);
  return this.getMockData(); // Fallback
}
```

---

## Testing Basics

### Unit Test (Service)
```typescript
import { describe, it, expect } from "@jest/globals";
import { myService } from "./myservice.server";

describe("MyService", () => {
  it("should handle valid input", async () => {
    const result = await myService.doSomething(validInput);
    expect(result).toEqual(expectedOutput);
  });
});
```

### Component Test
```typescript
import { render, screen } from "@testing-library/react";
import MyComponent from "./MyComponent";

describe("MyComponent", () => {
  it("should render", () => {
    render(<MyComponent />);
    expect(screen.getByText(/expected/)).toBeInTheDocument();
  });
});
```

---

## TypeScript Best Practices

### ✅ DO
```typescript
// Explicit types
async function process(input: string): Promise<Result> {}

// Type imports
import type { Props } from "./types";

// Interfaces for objects
interface User {
  id: string;
  name: string;
}

// Avoid any
function handle(e: React.ChangeEvent<HTMLInputElement>) {}
```

### ❌ DON'T
```typescript
// No implicit any
async function process(input) {}

// No type unknowns
const result: any = await api.call();

// No loose typing
const user = { id: "1", name: "John" };
```

---

## Documentation Files

- **[README.md](../README.md)** - Start here, 140 lines
- **[Project Overview PDR](project-overview-pdr.md)** - Requirements and roadmap
- **[Codebase Summary](codebase-summary.md)** - File structure and components
- **[Code Standards](code-standards.md)** - Development guidelines
- **[System Architecture](system-architecture.md)** - Technical design

---

## Helpful Links

**Shopify**
- [Admin API](https://shopify.dev/docs/api/admin)
- [Polaris Web Components](https://shopify.dev/docs/api/app-home/polaris-web-components)
- [App Bridge](https://shopify.dev/docs/api/app-bridge-library)

**React Router**
- [Loader/Action Docs](https://reactrouter.com/start/thinking-in-web-standards)
- [API Reference](https://reactrouter.com/api)

**Shopify CLI**
- [Getting Started](https://shopify.dev/docs/apps/tools/cli)
- [Commands](https://shopify.dev/docs/apps/tools/cli/commands)

**Google Gemini**
- [API Docs](https://ai.google.dev/)
- [API Reference](https://ai.google.dev/api/python)

---

## Need Help?

1. **Code question?** → Check [Code Standards](code-standards.md)
2. **Architecture question?** → Check [System Architecture](system-architecture.md)
3. **Looking for something?** → Check [Codebase Summary](codebase-summary.md)
4. **How do I...?** → Check [CLAUDE.md](../CLAUDE.md) workflows
5. **Stuck?** → Post in team Slack #development

---

**Keep this handy.** Updated 2025-12-20.
