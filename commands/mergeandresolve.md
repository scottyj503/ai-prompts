Merge Master and resolve conflicts.
- If the repo is Java: Be sure that build, spotless and tests pass before pushing.
- If the repo is Node: Be sure that build, linting, formating and testing pass before pushing
  - Use "PNPM" instead of "NPM" for scripts
  - Check the package.json for scripts
  - most likely:
    - "pnpm run build"
    - "pnpm run format:all"
    - "pnpm run test"

Verify we didn't lose any functionality as a result of the merge
