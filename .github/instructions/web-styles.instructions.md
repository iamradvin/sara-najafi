---
applyTo: "apps/web/src/**/*.css"
---

# Web styling guidance

- Reuse existing CSS custom properties and established component selectors in `apps/web/src/app/globals.css`; do not introduce a parallel token system.
- Prefer logical properties such as `margin-inline`, `padding-inline`, and `inset-inline` where layout depends on text direction.
- Keep Persian RTL as the default and verify that mixed Persian/Latin content remains readable.
- Add responsive behavior at existing breakpoints where possible. Prevent overflow and preserve touch-sized controls on narrow screens.
- Motion must be purposeful and disabled or reduced when `prefers-reduced-motion: reduce` applies.
- Avoid broad selectors or unrelated global restyling; scope styles to the affected component or page.
