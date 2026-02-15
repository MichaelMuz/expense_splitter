# Frontend Patterns

Conventions we follow in the frontend code.

## React Query

- `mutation.isPending` and `mutation.error` for loading/error states — no manual `isLoading` useState
- `mutate` with `onSuccess` callback over `mutateAsync` with try/catch
- `enabled` option in `useQuery` to prevent queries from running without required params
- `initialData: null` in auth query for cleaner types
- `queryClient.invalidateQueries` in mutation `onSuccess` to refetch stale data

## Hooks

- All hooks use the shared `api` axios instance (not raw fetch) — auth headers handled automatically
- Pattern: `api.get/post/patch/delete` + zod schema `.parse()` in queryFn/mutationFn
- Each hook maps to a backend endpoint — keep them thin

## Routing

- `<Navigate>` for condition-based redirects (e.g. auth guard, missing params)
- `navigate()` for event handlers (e.g. after form submit)
- Guard clauses for required URL params at top of page components

## React

- Derived state: compute during render, don't store in useState
- Never call hooks conditionally (Rules of Hooks)
- Prefer structural nesting over explicit attributes when HTML provides the association
  - `<label>Name: <input ... /></label>` — one element, done
  - NOT `<div><label htmlFor="name">Name</label><input id="name" ... /></div>` — three elements, two attributes, all unnecessary

## Validation

- Shared Zod schemas in `src/shared/schemas/` are the single source of truth
- Backend validates via middleware, frontend will use `@hookform/resolvers/zod` (planned)

## Structure

- Pages use `<Layout>` wrapper for consistent header/nav
- shadcn `ui/` components available for styling when ready
