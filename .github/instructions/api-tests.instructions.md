---
applyTo: "apps/api/test/**/*"
---

# API integration test guidance

- Integration tests use Node's built-in test runner and start isolated API/worker processes; follow the existing setup and teardown patterns.
- Require a local test database whose name ends in `_test` and a dedicated local Redis database number greater than zero.
- Never run tests against production or an unspecified shared database. Do not weaken isolation checks to make a test pass.
- Cover relevant success, validation, authorization, and cleanup paths. Keep generated data unique and clean up resources in teardown.
- Run `pnpm test:integration` only when the dedicated services are configured and available.
