# Tool Switch Wishlist

Pain points with current stack and possible alternatives to explore.

## Current Pain Points

### Express
- **Type safety**: No compile-time guarantees about route params, request context, middleware chain
- **Context passing**: `req.user?`, `req.groupMembership?` with global namespace pollution
- **Middleware typing**: Can't track what middleware has run or what's available in context

### Prisma
- **`.update()` restrictions**: Can't add non-unique filters to where clause even though it's still max 1 row
  ```typescript
  // ❌ Not allowed (but logically sound)
  where: { id: memberId, groupId: groupId }
  ```
- **`.updateMany()` limitations**: Doesn't return updated records (have to re-query)
- **Opinionated constraints**: Feels like fighting the ORM instead of writing SQL

## Alternatives to Explore

### Backend Framework
- **Hono** - Type-first, context properly typed based on middleware chain
- **Elysia** - Bun-native, similar type safety to Hono

### ORM/Query Builder
- **Drizzle** - Query builder, closer to SQL, `.returning()` works everywhere
- **Kysely** - Type-safe SQL query builder, very flexible

## Non-Committal Notes

Just tracking frustrations for future reference. Current stack works fine for MVP. Consider trying on next project


Should remove vite, bun website says it replaces vite!
