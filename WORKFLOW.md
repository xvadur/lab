# Safe Fast Workflow

## Branching
- Keep `main` stable.
- Create experiment branches with `bash scripts/new-exp.sh "topic"`.
- Naming convention: `feature/<topic>-YYYYMMDD-HHMM`.

## Daily flow
1. Start a new experiment branch.
2. Make focused changes.
3. Run checks (`npm run lint`, `npm run test`, `npm run test:e2e` when relevant).
4. Push fast using `bash scripts/push.sh`.
5. Rebase on latest main using `bash scripts/sync.sh`.

## Notes
- `scripts/push.sh` auto-commits only when there are staged changes.
- If you need custom commit messages, commit manually before running push.
