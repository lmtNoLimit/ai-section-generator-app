# Documentation Index

**Project**: AI Section Generator (Blocksmith)
**Last Updated**: 2025-12-20
**Status**: Phase 3 Complete - All Documentation Current

---

## Quick Navigation

### For New Developers (Start Here)
1. **[README.md](README.md)** (2-3 min) - Overview, features, quick start
2. **[DEVELOPER-QUICK-REFERENCE.md](docs/DEVELOPER-QUICK-REFERENCE.md)** (5 min) - Commands, patterns, file locations
3. **[Code Standards](docs/code-standards.md)** - Before writing code

### For Understanding Architecture
1. **[System Architecture](docs/system-architecture.md)** - Technical design and data flow
2. **[Codebase Summary](docs/codebase-summary.md)** - File structure and components
3. **[Project Overview & PDR](docs/project-overview-pdr.md)** - Requirements and roadmap

### For Specific Tasks
- **Adding a service?** → [Code Standards §Service Layer](docs/code-standards.md#service-layer-standards)
- **Creating a route?** → [Code Standards §React Router](docs/code-standards.md#react--react-router-standards)
- **Adding a component?** → [DEVELOPER-QUICK-REFERENCE §Common Tasks](docs/DEVELOPER-QUICK-REFERENCE.md#common-tasks)
- **Database changes?** → [Code Standards §Prisma](docs/code-standards.md#database--prisma-standards)
- **Writing tests?** → [Code Standards §Testing](docs/code-standards.md#testing-standards-future)
- **Deploying?** → [System Architecture §Deployment](docs/system-architecture.md#deployment)

---

## Core Documentation

| Document | Purpose | Audience | Read Time |
|----------|---------|----------|-----------|
| **[README.md](README.md)** | Project overview, quick start, features | Everyone | 3 min |
| **[Project Overview & PDR](docs/project-overview-pdr.md)** | Requirements, scope, roadmap, success metrics | PMs, Tech Leads | 15 min |
| **[Codebase Summary](docs/codebase-summary.md)** | File structure, components, architecture | Developers | 20 min |
| **[Code Standards](docs/code-standards.md)** | Development guidelines, patterns, conventions | Developers | 30 min |
| **[System Architecture](docs/system-architecture.md)** | Technical design, data flow, integrations | Tech Leads, Architects | 20 min |
| **[DEVELOPER-QUICK-REFERENCE](docs/DEVELOPER-QUICK-REFERENCE.md)** | Commands, patterns, common tasks | New Developers | 10 min |

---

## Common Questions - Where to Find Answers

### Project & Requirements
- "What is this project?" → [README.md](README.md#what-is-this)
- "What are the features?" → [README.md](README.md#core-features)
- "What's the project status?" → [README.md](README.md#project-status)
- "What's in the roadmap?" → [Project Overview & PDR](docs/project-overview-pdr.md#future-enhancements)

### Architecture & Design
- "How is the app structured?" → [System Architecture](docs/system-architecture.md)
- "What services are there?" → [Codebase Summary §Services Layer](docs/codebase-summary.md#services-layer)
- "What are the design patterns?" → [Code Standards §Key Patterns](docs/code-standards.md#design-patterns)
- "How does data flow?" → [System Architecture §Data Flow](docs/system-architecture.md#data-flow)

### Development
- "How do I set up locally?" → [README.md §Quick Start](README.md#quick-start)
- "What commands do I use?" → [DEVELOPER-QUICK-REFERENCE §Quick Commands](docs/DEVELOPER-QUICK-REFERENCE.md#quick-commands)
- "What naming conventions?" → [Code Standards §Naming Conventions](docs/code-standards.md#naming-conventions)
- "How do I write a service?" → [DEVELOPER-QUICK-REFERENCE §Service Layer Pattern](docs/DEVELOPER-QUICK-REFERENCE.md#service-layer-pattern)
- "How do I write a route?" → [DEVELOPER-QUICK-REFERENCE §Common Tasks](docs/DEVELOPER-QUICK-REFERENCE.md#add-a-new-route)
- "How do I test?" → [Code Standards §Testing Standards](docs/code-standards.md#testing-standards-future)

### Deployment & Operations
- "How do I deploy?" → [System Architecture §Deployment](docs/system-architecture.md#deployment)
- "What env vars are needed?" → [README.md §Environment Variables](README.md#environment-variables)
- "How do I troubleshoot?" → [README.md §Troubleshooting](README.md#troubleshooting)
- "What's the tech stack?" → [Codebase Summary §Technology Stack](docs/codebase-summary.md#technology-stack-details)

### Code Quality
- "What are the code standards?" → [Code Standards](docs/code-standards.md)
- "How do I handle errors?" → [Code Standards §Error Handling](docs/code-standards.md#error-handling-standards)
- "How do I secure my code?" → [Code Standards §Security Standards](docs/code-standards.md#security-standards)
- "How do I optimize?" → [Code Standards §Performance Standards](docs/code-standards.md#performance-standards)

---

## Project Statistics

- **Total Files**: 251
- **Total Tokens**: 231,226
- **Routes**: 20+
- **Services**: 16+
- **Components**: 100+
- **Database Models**: 10
- **Feature Domains**: 11
- **Test Files**: 25+

---

## Reports & Archives

### Recent Documentation Updates (2025-12-20)
- [DOCUMENTATION-COMPLETION-SUMMARY.md](plans/reports/DOCUMENTATION-COMPLETION-SUMMARY.md) - Final completion report
- [docs-manager-251220-codebase-scout.md](plans/reports/docs-manager-251220-codebase-scout.md) - Detailed scout findings
- [Codebase Snapshot](repomix-output.xml) - Full codebase archive (942 KB)

### Historical Archives
- Phase 3 completion reports
- Phase 2 documentation updates
- Phase 1 resource context completion

See [plans/reports/README.md](plans/reports/README.md) for full archive.

---

## Technology Stack

### Core
- React 18.3+ | React Router 7.9+ | TypeScript 5.9+
- Node.js >=20.19 or >=22.12
- Vite 6.3+ | Prisma 6.16+ | MongoDB

### Integrations
- Google Gemini 2.5 Flash (AI)
- Shopify Admin API (GraphQL)
- @shopify/shopify-app-react-router

### Tools
- ESLint, Prettier, Jest, Playwright
- Shopify CLI, Docker, GitHub

---

## Feature Domains

1. **Chat** - Interactive AI conversation with streaming
2. **Generate** - Section creation workflow
3. **Preview** - Liquid rendering engine
4. **Editor** - Unified edit interface
5. **Home** - Dashboard and onboarding
6. **Billing** - Subscriptions and usage tracking
7. **Sections** - CRUD management
8. **Templates** - Template library
9. **Settings** - Shop configuration
10. **Auth** - OAuth and sessions
11. **Webhooks** - Event handlers

---

## How to Use This Index

1. **New to the project?** → Start with [README.md](README.md) + [DEVELOPER-QUICK-REFERENCE.md](docs/DEVELOPER-QUICK-REFERENCE.md)
2. **Have a question?** → Look it up in the "Common Questions" section above
3. **Need deep knowledge?** → Read the full documents listed in "Core Documentation"
4. **About to code?** → Review [Code Standards](docs/code-standards.md) first
5. **Need the architecture?** → Read [System Architecture](docs/system-architecture.md)

---

## Contributing & Maintaining Documentation

### When Adding Features
1. Update relevant documentation files
2. Add code examples if introducing new patterns
3. Update [Codebase Summary](docs/codebase-summary.md) if structure changes
4. Ensure [Code Standards](docs/code-standards.md) are followed

### When Reporting Bugs/Issues
- Reference relevant documentation section
- Check if documentation needs update
- Add test cases to cover gaps

### Updating Documentation
- Keep [README.md](README.md) under 300 lines
- Cross-reference between documents
- Provide code examples for patterns
- Keep diagrams and tables updated
- Run `npx repomix` to regenerate codebase snapshot

---

## Support & Help

**Questions?**
1. Check this index and linked documents
2. Review [DEVELOPER-QUICK-REFERENCE.md](docs/DEVELOPER-QUICK-REFERENCE.md)
3. Search codebase for examples
4. Ask in team Slack #development

**Documentation needs update?**
1. Create issue on GitHub
2. Reference the relevant doc
3. Suggest changes with examples

---

**Version**: 1.0 (2025-12-20)
**Maintained By**: Documentation Team
**Next Review**: 2026-01-20
