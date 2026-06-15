# CLAUDE.md

## Project Overview

Eclipse GLSP Theia Integration — provides the glue code for integrating GLSP diagram editors into Theia IDE applications. Uses pnpm workspaces.

## Build & Development

- **Package manager**: pnpm — do not use yarn or npm

## Validation

- After completing any code changes, always run the `/fix` skill before reporting completion. It builds first (hard gate) and then auto-fixes lint/format/header issues; manually resolve anything it could not auto-fix (build errors, remaining lint errors) and re-run it.

### Example Apps

- **Browser app**: `pnpm browser build` then `pnpm browser start`
- **Electron app**: `pnpm electron build` then `pnpm electron start`
