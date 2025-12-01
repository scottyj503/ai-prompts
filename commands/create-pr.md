---
description: Add, commit, push and create a pull request
allowed-tools: Bash(git status:*), Bash(git add:*), Bash(git diff:*), Bash(git commit:*), Bash(git push:*), Bash(git log:*), Bash(git branch:*), Bash(gh pr create:*)
---

Add all changes, commit with a descriptive message, push to remote, and create a pull request using GitHub CLI (gh).

Follow these steps:
1. Run git status to see changes
2. Run git diff to review changes
3. Run git log to see recent commit style
4. Add relevant files to staging
5. Create commit with descriptive message
6. Push to remote with -u flag if needed
7. Create PR using gh pr create