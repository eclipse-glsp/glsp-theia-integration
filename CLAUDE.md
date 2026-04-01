# CLAUDE.md

## Project Overview

Eclipse GLSP Theia Integration — provides the glue code for integrating GLSP diagram editors into Theia IDE applications.

## Build & Development

- **Package manager**: Yarn 1.x (classic) — do not use Yarn 2+/Berry or npm
- **Install & build**: `yarn build` (installs deps + compiles TypeScript)

## Validation

- After completing any code changes, always run the `/verify` skill before reporting completion
- If verification fails, run the `/fix` skill to auto-fix issues, then re-run `/verify`

### Example Apps

- **Browser app**: `yarn browser build` then `yarn browser start`
- **Electron app**: `yarn electron build` then `yarn electron start`
