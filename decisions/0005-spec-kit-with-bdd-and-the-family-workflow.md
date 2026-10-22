# 0005: Spec-kit with the bdd extension and the family's feature workflow; first feature `001-earth`

*2026-10-22.* Accepted.

## Decision
Features are specified and built with spec-kit 0.14.1 and the `bdd` extension v0.2.0: living
Gherkin features under `features/`, one sense of every word in `GLOSSARY.md`, the checker as
`just check`. The family's feature workflow applies: specify and clarify stop for Trevor's
answers; plan, tasks and analyze run through; implement is a fresh session on Opus in the same
worktree; a draft PR until CI is green; Trevor merges. The first feature is `001-earth`, the
brief's section 8.

## Why
It is how every repository in the family works, so people and agents move between them. The
brief's acceptance criteria are already scenario-shaped; the features make them checkable before
code and keep them true after.

## Consequences
The brief's section 8 is the input to `/speckit-specify`, not a spec. Its open questions (section
13) become the clarifications. `docs/` are the contracts the plan is checked against in place of
the unfilled constitution template.
