# Agent Guidelines for hey-babe-triplit

## Commands

- **Build**: `bun run build` - Build production app
- **Dev**: `bun run dev` - Start dev server on port 3000
- **Test**: `bun run test` - Run all Vitest tests
- **Lint**: `bun run lint` - ESLint check
- **Format**: `bun run format` - Prettier check
- **Check**: `bun run check` - Format + lint fix
- **Type Check**: `bun run ts:check` - TypeScript check

## Code Style

- Use **double quotes** for strings (no semicolons)
- Trailing commas everywhere
- React function components with default export
- Import ordering: external libs, then relative imports with empty line between
- Use TypeScript with strict mode + noUncheckedIndexedAccess
- Use Effect library for config management and async operations
- TanStack Router for routing, TanStack Query for data fetching
- Use `~/*` path alias for src imports
- JSX with react-jsx transform

## Key Conventions

- Components in PascalCase with default export
- Use interfaces for object types, especially router context
- Prefer named exports for utilities, default for components
- Use git worktrees when implementing new code. Avoid making changes on `main` unless explicitly allowed.
