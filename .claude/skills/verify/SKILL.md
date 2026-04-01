---
name: verify
description: Run all verification checks (build, lint, format, headers, theia version) to validate changes before committing
---

Run the full verification suite for this project from the repository root:

```bash
yarn check:all
```

On failure:

1. Report which checks failed and the specific errors
2. Auto-fix by invoking the `/fix` skill
3. Re-run `yarn check:all` to confirm everything passes
