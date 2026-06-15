---
name: fix
description: Run the fix-and-verify suite for the workspace (build, auto-fix lint/format/headers). IMPORTANT - Proactively invoke this skill after completing any code changes (new features, bug fixes, refactors) before reporting completion.
---

Run the auto-fix and validation suite for the GLSP Theia Integration monorepo from the repository root.

1. Build first (installs deps + compiles TypeScript). This is a hard gate: if the build fails, stop immediately, report the build errors, and do not run any of the following steps.
   The build must pass before anything else runs.

```bash
pnpm compile
```

2. Auto-fix lint, formatting, and copyright headers. Run all three even if an earlier one reports remaining problems (they are independent):

```bash
pnpm lint:fix
pnpm format
pnpm headers:fix
```

Then:

- If `pnpm compile` failed, fix the build errors and re-run this skill.
- If `pnpm lint:fix` reported lint errors it could not fix, fix them manually and re-run this skill.
- Otherwise if everything is clean (compile succeeds, formatting and headers are corrected in place, lint has no remaining errors) — report completion.
