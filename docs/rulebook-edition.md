# Rulebook edition (parity anchor)

This repository treats **rules fidelity** as a product goal: behavior should be traceable to an identifiable edition of *Robo Rally*, not to informal memory.

## Pinned edition

**Primary reference:** *Robo Rally*, Avalon Hill **2016** reprint (Hasbro/Avalon Hill).

When the implemented rules intentionally diverge from that edition (house rule, simplification, or bugfix), document the divergence in [`parity-checklist.md`](parity-checklist.md) with the PC-id row and a pointer to tests or golden traces.

## Citation policy

When arguing about a rule in issues or PRs, use this order:

1. **Cited edition** — page/section where possible (2016 rulebook PDF or physical book).
2. **Written calls** — maintainer-written interpretation in docs or checklist rows when the book is ambiguous.
3. **Tests / golden traces** — executable evidence in `src/engine/__tests__/` or checked-in traces under `src/engine/__fixtures__/`.
4. **Observed table play** — lowest authority; feeds new checklist rows and tests, not silent behavior changes.

## Related docs

- [`parity-checklist.md`](parity-checklist.md) — rule rows and implementation status.
- [`golden-trace-v0.md`](golden-trace-v0.md) — normalized event traces for regression.
