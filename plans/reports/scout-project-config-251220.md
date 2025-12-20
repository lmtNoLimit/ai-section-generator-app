# Project Configuration & Root-Level Files Analysis
**Date**: 2025-12-20
**Project**: AI Section Generator - Shopify App

## Executive Summary

AI Section Generator is a production-grade Shopify embedded app built with React Router 7, Prisma, and Google Gemini AI. The project uses modern TypeScript tooling with strict type safety, comprehensive linting, and Jest-based testing. The codebase follows Shopify app best practices with proper webhook configuration and session management via Prisma.

---

## Tech Stack

### Core Framework & Build
- **Runtime**: React Router 7.9.3 with Node.js backend
- **Build Tool**: Vite 6.3.6 with React Router plugin
- **Language**: TypeScript 5.9.3 (strict mode enabled)
- **Package Manager**: npm (Node.js >=20.19 <22 || >=22.12)

### Backend & Data
- **ORM**: Prisma 6.16.3 (SQLite by default, configurable)
- **Session Storage**: @shopify/shopify-app-session-storage-prisma
- **API Framework**: React Router server-side rendering

### Frontend
- **UI Framework**: React 18.3.1
- **Shopify UI**: @shopify/app-bridge-react 4.2.4
- **Polaris Components**: Shopify Polaris Web Components (<s-*> elements)
- **Layout**: react-resizable-panels 3.0.6

### AI & External APIs
- **AI Provider**: Google Generative AI (@google/generative-ai 0.24.1)
- **Model**: Gemini 2.5 Flash
- **Template Engine**: liquidjs 10.24.0 (Shopify Liquid)

### Shopify Integration
- **CLI**: shopify app dev for local development
- **API**: Shopify GraphQL Admin API (2026-01 version)
- **Auth**: OAuth via @shopify/shopify-app-react-router 1.0.0
- **Webhooks**: App-specific subscriptions (app/scopes_update, app/uninstalled, app_subscriptions/update)

### Developer Tools
- **Linting**: ESLint 8.57.1 with TypeScript, React, and a11y plugins
- **Testing**: Jest 30.2.0 with ts-jest and jsdom
- **E2E Testing**: Playwright 1.57.0
- **Code Generation**: GraphQL code generator (codegen)
- **Code Formatting**: Prettier 3.6.2

---

## Key Configuration Files

### 1. package.json (v1.0)
**Node Version Requirement**: >=20.19 <22 || >=22.12

**Key Scripts**:
- npm run dev - Shopify app dev with tunnel
- npm run build - React Router production build
- npm run start - Serve built app
- npm run setup - Prisma generate + db push
- npm run lint - ESLint with caching
- npm test - Jest test runner
- npm run test:watch - Jest watch mode
- npm run test:coverage - Coverage report
- npm test:e2e - Playwright E2E tests
- npm run docker-start - Setup + start in container

**Database**: SQLite by default, supports MySQL, PostgreSQL, MongoDB via Prisma.

### 2. tsconfig.json (TypeScript Strict Mode)

**Key Settings**:
- Strict mode: enabled
- Target: ES2022
- Module: ESNext
- JSX: react-jsx (no React import needed)
- Module Resolution: Bundler
- Type Checking: strict null checks, no unused vars

**Include**: .ts, .tsx, .react-router/types/**/*
**Exclude**: test files, node_modules

### 3. vite.config.ts (Build Configuration)

**Port**: 3000 (configurable via PORT env var)

**Key Features**:
- React Router dev plugin for SSR
- TypeScript path resolution
- CORS pre-flight enabled
- HMR (Hot Module Reload):
  - Local: ws://localhost:64999
  - Production: wss://[host]:443
- Asset inline limit: 0
- Optimized deps: @shopify/app-bridge-react

### 4. shopify.app.toml (Shopify Configuration)

**App Metadata**:
- **Name**: Blocksmith
- **Handle**: blocksmith-ai
- **Client ID**: 7ecb57c3cbe103bb659936a2841c60b4
- **URL**: https://blocksmith.m8lab.co
- **Embedded**: Yes

**Access Scopes**:
- write_products
- write_themes
- write_files

**Webhook Subscriptions** (API v2026-01):
1. app/scopes_update → /webhooks/app/scopes_update
2. app/uninstalled → /webhooks/app/uninstalled
3. app_subscriptions/update → /webhooks/app/subscriptions_update

**Auto-Update URLs**: Enabled

### 5. .eslintrc.cjs (Linting Rules)

**Configuration**:
- **Base**: ESLint recommended
- **React**: react/recommended + react/jsx-runtime + react-hooks/recommended
- **A11y**: jsx-a11y/recommended
- **TypeScript**: typescript-eslint/recommended + import rules

**Key Rules**:
- react/no-unknown-property: ignore "variant" prop
- typescript-eslint/no-unused-vars: allow underscore prefix

**Targets**: .js, .jsx, .ts, .tsx files (with overlays for React, TypeScript, Node)

### 6. jest.config.cjs (Testing Framework)

**Setup**:
- **Preset**: ts-jest
- **Environment**: jsdom
- **Root**: app/ directory
- **Test Match**: **/__tests__/**/*.test.ts?(x)
- **Module Mapping**: ~/ → <rootDir>/app/

**Coverage Exclusions**:
- Service files (AI, theme, billing, history, settings, template, usage-tracking)
- DB operation files
- Entry/root components
- Adapters and feature flags

**Coverage Thresholds**: 0
### 4. shopify.app.toml (Shopify Configuration)

**App Metadata**:
- **Name**: Blocksmith
- **Handle**: blocksmith-ai
- **Client ID**: 7ecb57c3cbe103bb659936a2841c60b4
- **URL**: https://blocksmith.m8lab.co
- **Embedded**: Yes

**Access Scopes**:
- write_products
- write_themes
- write_files

**Webhook Subscriptions** (API v2026-01):
1. app/scopes_update → /webhooks/app/scopes_update
2. app/uninstalled → /webhooks/app/uninstalled
3. app_subscriptions/update → /webhooks/app/subscriptions_update

**Auto-Update URLs**: Enabled

### 5. .eslintrc.cjs (Linting Rules)

**Configuration**:
- **Base**: ESLint recommended
- **React**: react/recommended + react/jsx-runtime + react-hooks/recommended
- **A11y**: jsx-a11y/recommended
- **TypeScript**: @typescript-eslint/recommended + import rules

**Key Rules**:
- react/no-unknown-property: ignore variant prop
- @typescript-eslint/no-unused-vars: allow underscore prefix

**Targets**: .js, .jsx, .ts, .tsx files (with overlays for React, TypeScript, Node)

### 6. jest.config.cjs (Testing Framework)

**Setup**:
- **Preset**: ts-jest
- **Environment**: jsdom
- **Root**: app/ directory
- **Test Match**: **/__tests__/**/*.test.ts?(x)
- **Module Mapping**: ~/ → <rootDir>/app/

**Coverage Exclusions**:
- Service files (AI, theme, billing, history, settings, template, usage-tracking)
- DB operation files
- Entry/root components
- Adapters and feature flags

**Coverage Thresholds**: 0% (early-stage, TODO: increase)


---

## Development Commands

### Local Development
```
npm run dev              - Start dev server with tunnel
shopify app dev -r      - Reset tunnel
```

### Build & Test
```
npm run build            - Production build
npm run lint             - Check code
npm run typecheck        - Type generation + tsc
npm test                 - Run tests
npm run test:watch      - Watch mode
npm run test:coverage   - Coverage report
npm test:e2e            - E2E tests
```

### Database
```
npm run setup            - Prisma setup
prisma migrate dev       - New migration
prisma studio          - UI for database
```

### Shopify
```
npm run deploy           - Deploy app
npm run config:link     - Link to app
npm run env             - Check variables
```

---

## Environment Variables

### Required
- **GEMINI_API_KEY**: Google AI Studio API key

### Optional
- **FLAG_VERBOSE_LOGGING**: Enable service logging (default: enabled in dev)

### Auto-Set by CLI
- SHOPIFY_API_KEY
- SHOPIFY_API_SECRET
- SHOPIFY_APP_URL
- SCOPES
- DATABASE_URL (if using external DB)

---

## Important Patterns

### Navigation (Embedded Apps)
✓ Use Link from react-router or Shopify/polaris  
✗ Dont use native <a> tags  
✓ Use redirect from authenticate.admin  
✗ Dont use redirect from react-router

### Database
- SQLite: suitable for single-instance production
- Scaled deployments: PostgreSQL, MySQL, MongoDB
- Providers: Digital Ocean, Planet Scale, Amazon Aurora, Google Cloud SQL

### Webhooks
- Use app-specific subscriptions in shopify.app.toml (auto-synced)
- Admin-created webhooks require HMAC validation
- CLI triggers use non-existent shops (admin undefined)

### Troubleshooting
- Clock sync: Enable "Set time and date automatically" in system settings
- Database tables missing: Run npm run setup
- Navigation breaks embedded app: Follow navigation patterns above

---

## Project Architecture

### Directory Structure
- `/app/routes/` - React Router file-based routing
- `/app/components/` - Reusable React components
- `/app/services/` - Business logic (AI, theme, billing, etc.)
- `/app/__tests__/` - Unit & integration tests
- `/prisma/` - ORM schema and migrations
- `/extensions/` - Shopify extensions (workspaces)
- `/public/` - Static assets

### Compilation Process
1. React Router generates SSR + client bundles
2. Vite optimizes to ES2022 target
3. Output: ./dir/server/index.js + static assets

### Container Support
Available via npm run docker-start (Setup + start)

### Hosting Options
- **Recommended**: Google Cloud Run (detailed in Shopify docs)
- **Alternatives**: Fly.io, Render, or manual deployment

### Production Checklist
- Node.js >=20.19
- NODE_ENV=production
- External database (PostgreSQL/MySQL recommended)
- GEMINI_API_KEY + Shopify credentials

---

## Testing Infrastructure

**Status**: Early-stage (0% thresholds)

**Test Types**:
- Unit: Jest with ts-jest and jsdom
- Integration: Service testing with mocks
- E2E: Playwright (configured, minimal examples)

**Test Patterns**:
- Module paths: ~/ → app/
- Setup file: jest.setup.cjs
- File location: __tests__/**/*.test.ts?(x)

---

## Type Safety

### TypeScript Configuration
- Strict mode enabled
- React JSX runtime (no import needed)
- Shopify API types included

### Code Generation
- npm run typecheck - React Router gen + tsc
- npm run graphql-codegen - GraphQL types

---

## Summary

| Item | Value |
|------|-------|
| Framework | React Router 7 + Vite 6 |
| Language | TypeScript 5.9 (strict) |
| Database | Prisma 6.16 (SQLite default) |
| AI | Gemini 2.5 Flash |
| Testing | Jest 30 + Playwright |
| Linting | ESLint 8 + Prettier 3 |
| Node | >=20.19 <22 OR >=22.12 |
| Shopify API | v2026-01 GraphQL |
| Status | Phase 3 (96% complete) |

---

## Getting Started

1. Install Node.js >=20.19 <22 || >=22.12
2. Get GEMINI_API_KEY from Google AI Studio
3. Create Shopify partner account + test store
4. Run: npm install && npm run setup
5. Start: npm run dev
6. Review: CLAUDE.md workflows for dev rules

---

## Unresolved Questions

None. Configuration is comprehensive and well-documented.
