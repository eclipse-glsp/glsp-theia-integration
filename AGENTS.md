# AGENTS.md

- Use pnpm. Find workspace commands in the root `package.json` and package-specific commands in each package's `package.json`.
- Consult `README.md` for package layout and development setup. The example applications are built with `pnpm browser build` / `pnpm electron build` and started with `pnpm browser start` / `pnpm electron start`.
- The published packages declare `@theia/*` as peer dependencies: keep changes compatible with the minimum supported Theia version recorded in the compatibility table in `README.md`, not just with the version the example apps pin.
- Document public APIs with TSDoc and use `{@link Symbol}` for cross-references. Explain behavior and non-obvious decisions rather than restating signatures.
- After code changes, run the /fix skill. Resolve failures and repeat until build, lint, formatting, and headers pass.
- The e2e suites are not part of /fix because they build and launch a Theia application. Run them with `pnpm test:e2e` when changing anything under `e2e/` or the diagram integration itself.
- `CHANGELOG.md` is generated from the merged PRs before a release. Do not add or bump entries manually.
