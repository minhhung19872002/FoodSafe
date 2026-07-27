# Frontend Architecture — FoodSafe

## Decision

The React 19 SPA uses strict TypeScript, feature folders, TanStack Query for server state, Zustand only for small client/session context, React Hook Form plus Zod, React Router, and a shared Ant Design-based enterprise design system.

```text
src/app        composition, providers, router, protected/permission routes
src/features   independent business features
src/components shared design-system and domain-neutral compound components
src/hooks      shared interaction/session/scope hooks
src/lib        typed transport, query client, telemetry
src/utils      pure formatting and validation helpers
```

## Rules

- Presenters never fetch, navigate, or authorize; containers coordinate hooks and routes.
- A feature cannot import another feature. Shared behavior moves to a neutral shared layer.
- Only a feature's `api/` layer calls the HTTP client.
- Raw transport DTOs are adapted to view models at the API boundary.
- No undocumented `any`; strict compiler and lint checks are gates.
- Query keys include all server-state filters and scope context.
- List filters, sort, and page are represented in the URL where useful.
- Pages explicitly render loading, error, empty, unauthorized, and success states.

## Authorization and session

Protected routes verify authenticated server state, not merely persisted client flags. Navigation and actions are permission-aware for usability, while the API remains authoritative. Organization and administrative-area context is visible. Tokens are not stored persistently in JavaScript-readable storage.

## Shared UI

The shared system provides application shell, navigation, breadcrumbs, data table, filters, forms, confirmation, modal/drawer, status badge, toast, file uploader, skeleton, empty/error states, error boundary, unauthorized and not-found pages. Status always has a text label; focus remains visible; dialogs restore focus; forms connect labels, help, and errors semantically.

## Testing

Vitest and Testing Library cover components, validation, permission rendering and page integrations. MSW provides contract-level API behavior. Playwright covers critical authenticated workflows, data-scope boundaries, file access, public portal, keyboard flow and key accessibility checks.

