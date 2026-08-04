# DECISIONS

Every decision not already answered by another document lives here, with the evidence that produced
it. Append-only.

Its purpose is narrow and specific: to make it impossible for *"I thought this was better"* to pass
as engineering. A decision either has a criterion and a measurement, or it was the owner's call, or
it does not belong in the codebase yet.

## Rules

1. **Written before the code that depends on it.** An entry added afterwards is a rationalisation,
   and it reads like one.
2. **Append-only.** To change a decision, add a new entry that supersedes the old one and mark the
   old one `Superseded by ADR-NNN`. Never edit history — the reasoning that was wrong is the most
   useful thing in the file.
3. **Evidence, not preference.** A `Criterion` and a `Measurement` are mandatory for technical
   decisions. "Cleaner", "simpler", and "felt better" are not measurements.
4. **Consequences are stated honestly**, including the ones you dislike. An entry with no downside
   listed has not been thought through.
5. **One decision per entry.** Bundled decisions cannot be superseded individually.
6. **Numbered sequentially.** Never reuse a number.

## Entry format

```markdown
## ADR-014 — Export generation runs on the main thread

**Date** 2026-04-02 · **Prompt** 45 · **Status** Accepted

### Question
Should codegen run in a Web Worker or on the main thread?

### Criterion (set before measuring)
Worker if generation exceeds 100 ms on the 60-node fixture; main thread otherwise.
100 ms is the point at which a user perceives the export dialog as blocked.

### Measurement
buildIR 18 ms · print 24 ms · format 39 ms · total 81 ms (median of 9 runs,
M2 Air, no throttling). Under 4× CPU throttle: 310 ms.

### Decision
Main thread, wrapped in `startTransition`. The dialog opens before generation
starts, so the 81 ms is not on the interaction path.

### Consequences
- Accepted: on very slow devices generation approaches 300 ms. Mitigated by the
  dialog opening first and streaming files in.
- Accepted: a much larger document (200+ nodes) may cross the threshold. Revisit
  with a measurement, not a guess — ADR supersedes, not code comment.
- Avoided: worker serialisation cost, a second build target, and debugging
  across the boundary.

### Alternatives rejected
- Worker: 81 ms does not justify the complexity; measured serialisation of the
  IR alone was 12 ms round-trip.
- Incremental generation: no measured need; would add cache-invalidation surface.
```

For an owner decision, replace `Criterion`/`Measurement` with:

```markdown
### Escalated
Options presented, recommendation given, owner decided on <date>.
Owner's stated reason: <verbatim, not paraphrased>.
```

## When an entry is required

| Situation | Entry required? |
| --- | --- |
| The answer is in `docs/` | No — follow the document |
| A threshold was measured against | **Yes** |
| Two viable approaches, one picked | **Yes** — with the criterion that picked it |
| A dependency was added | **Yes** — with the six answers from `TECH_STACK.md` § Adding a dependency |
| A documented budget was missed and accepted | **Yes** — and it must be an owner decision |
| A `docs/` document was changed | **Yes** — reference the commit |
| A feature was cut or deferred | **Yes** — owner decision only, never the implementer's |
| A licence was verified | **Yes** — see `DESIGN_REFERENCES.md` |
| Naming, formatting, file placement already covered by conventions | No |

## Decisions already made

These are recorded in the documents that own them, not here. They are listed so nobody re-opens
them without reading the reasoning first:

| Decision | Owner document |
| --- | --- |
| Monorepo with enforced package boundaries | `ARCHITECTURE.md` § Monorepo topology |
| `editor` never imports `blocks`; registry interface as the seam | `ARCHITECTURE.md` § The registry seam |
| Normalized document, not a nested tree | `EDITOR_ENGINE.md` § Why normalized |
| Immer patches as the undo unit, not snapshots | `STATE_MANAGEMENT.md` § history |
| 400 ms coalesce window | `EDITOR_ENGINE.md` § Coalescing |
| History capped at 200 entries | `EDITOR_ENGINE.md` § Limits |
| Transient gesture state never in React | `PERFORMANCE.md` § The core rule |
| Overlays outside the scene transform | `CANVAS.md` § DOM structure |
| CSS variables for theming, not class swapping | `THEME_ENGINE.md` § Why it works that way |
| Tailwind as the styling and export target | `TECH_STACK.md` § Tailwind CSS v4 |
| Zustand + Immer over Redux / Jotai / Valtio | `TECH_STACK.md` § Deliberately not used |
| dnd-kit over HTML5 drag and React DnD | `DRAG_AND_DROP.md` § Why dnd-kit |
| CodeMirror over Monaco | `TECH_STACK.md` § Deliberately not used |
| IR between document and printers | `EXPORT_ENGINE.md` § Pipeline |
| Mobile-first cascading breakpoint resolution | `RESPONSIVE_ENGINE.md` § Resolution |
| Local-first persistence, no backend | `VISION.md` § What it refuses to be |
| Reduced motion as a parallel design, not a fallback | `ANIMATION_SYSTEM.md` § Reduced motion |
| One shared scheduler for observers and listeners | `ANIMATION_SYSTEM.md` § The scheduler |
| Studio requires ≥ 1024 px | `ACCESSIBILITY.md` § Known limitations |
| Golden files plus `tsc` as the export contract | `EXPORT_ENGINE.md` § Testing |
| impeccable.style as the primary design reference | `DESIGN_REFERENCES.md` |
| Chrome takes craft, not loudness, from the reference | `DESIGN_REFERENCES.md` § Why the chrome is the exception |
| Per-package coverage floors, no global number | `TESTING.md` § Coverage contract |
| Render-count assertions over timing assertions | `PERFORMANCE.md` § Measurement |

If you believe one of these is wrong: read its document, then open an entry here proposing the
change with your reasoning. Do not work around it in code.

---

## ADR-001 — Documentation precedes implementation

**Date** 2026-08-04 · **Prompt** — · **Status** Accepted

### Question
Specify the product in full before writing code, or specify incrementally alongside it?

### Escalated
Owner decision at project start.

Owner's stated reason: a previous large project accumulated extensive documentation with no
implementation plan attached, and separately, long single-session builds produced subsystems that
contradicted each other. The requirement was a specification detailed enough that any individual
work session can be scoped, verified, and checked against it without holding the whole system in
context.

### Decision
27 documents specifying every subsystem, plus 62 build prompts in dependency order. Each prompt
names the documents to read, its deliverables, its constraints, its verification commands, and a
done-when checklist. One prompt per session.

### Consequences
- Accepted: the specification will diverge from the implementation in places. Prompt 61 audits for
  this, and the doc-consistency checks become tests so divergence fails CI afterwards.
- Accepted: significant work before the first line of code runs.
- Avoided: contradictory subsystems, context exhaustion mid-feature, and re-deciding settled
  questions in every session.

### Alternatives rejected
- One large prompt: exceeds usable context; produces invention where detail runs out.
- Documentation alongside code: the boundaries between packages are the hardest part and are
  cheapest to get right before anything depends on them.
