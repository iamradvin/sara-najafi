---
applyTo: "apps/web/src/**/*.tsx"
---

# Web component guidance

- Keep server/client component boundaries intentional; add `"use client"` only when browser state or event handling requires it.
- Reuse existing components and `apps/web/src/lib` API helpers. Do not duplicate API contracts that belong in `packages/`.
- Keep Persian copy natural, set or preserve the correct direction, and use logical CSS properties for direction-sensitive spacing and alignment.
- Use the bundled Peyda font, current CSS variables, and existing interaction patterns. Do not add inline style systems or UI dependencies for isolated changes.
- Interactive elements must be semantic, keyboard-operable, and expose an accessible name and state. Preserve loading, empty, and error states.
- For visual changes, inspect the rendered page at desktop and mobile widths; honor `prefers-reduced-motion`.
- Validate with `pnpm --filter @attractory/web lint`, `pnpm --filter @attractory/web typecheck`, and/or `pnpm --filter @attractory/web build` as appropriate.
