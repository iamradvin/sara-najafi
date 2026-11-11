---
applyTo: "apps/api/prisma/**/*.prisma"
---

# Prisma schema guidance

- Inspect related models, enums, relations, indexes, and existing migrations before changing the schema.
- Create a new migration for every schema change. Never rewrite a migration that may already have been applied.
- Use explicit referential actions and uniqueness constraints where they represent domain invariants.
- Keep PostgreSQL as the source of truth; do not move persistent session or learning data into Redis.
- Update seed data or schema documentation only when the change requires it, and do not put real credentials in either.
