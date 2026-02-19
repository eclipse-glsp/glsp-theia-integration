# Repository Guidelines

## Project Structure & Module Organization

This repository is a Yarn workspace monorepo.

- `packages/theia-integration/`: main published package (`@eclipse-glsp/theia-integration`), with source in `src/browser`, `src/node`, and `src/common`, plus styles in `css/`.
- `examples/`: runnable Theia example apps (`browser-app`, `electron-app`) and the workflow integration package (`workflow-theia`).
- `configs/`: repo maintenance scripts (e.g., Theia version update/linking helpers).
- Root config files (`tsconfig.json`, `eslint.config.mjs`, `.prettierrc`) define shared tooling behavior.

## Build, Test, and Development Commands

Use Node `>=20` and Yarn Classic (`>=1.7.0 <2`).

- `yarn install`: install workspace dependencies.
- `yarn compile`: TypeScript project build (`tsc -b`) across workspaces.
- `yarn build`: install + compile.
- `yarn lint` / `yarn lint:fix`: run/fix ESLint issues.
- `yarn format` / `yarn format:check`: apply/check Prettier formatting.
- `yarn check:all`: full validation (lint, format check, header checks).
- `yarn browser build && yarn browser start`: build/run browser example.
- `yarn electron build && yarn electron start`: build/run electron example.

## Coding Style & Naming Conventions

TypeScript is the primary language. Follow ESLint (`@eclipse-glsp` config) and Prettier (`@eclipse-glsp/prettier-config`) as source of truth.

- Use 4-space indentation and existing import ordering.
- Keep module boundaries clear: browser code in `src/browser`, backend integration in `src/node`, shared contracts/utilities in `src/common`.
- Prefer descriptive file names aligned to feature or contribution type (e.g., `*-contribution.ts`, `*-module.ts`).

## Testing Guidelines

There is no dedicated unit test suite in this repository currently.

- Treat `yarn check:all` as the required quality gate.
- Smoke-test relevant example app flows (browser/electron) when changing integration behavior.
- For bug fixes, include a reproducible scenario in the PR description (workspace file, startup mode, expected behavior).

## Commit & Pull Request Guidelines

Contributions follow Eclipse GLSP conventions:

- Create/open an umbrella issue first: <https://github.com/eclipse-glsp/glsp/issues>.
- Branch naming: `issues/{issue_number}` (example: `issues/241`).
- Reference the issue in commit messages using the full URL (not just `#241`).
- Keep commits focused and imperative; repository history commonly uses issue prefixes (e.g., `GLSP-1617: ...`) and PR references.
- PRs should include: clear summary, linked issue, validation steps run (`yarn check:all`, example smoke checks), and screenshots/GIFs for UI-visible changes.
- Ensure Eclipse Contributor Agreement (ECA) requirements are satisfied before review.
