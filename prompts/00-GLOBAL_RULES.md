# 00 — Global rules

The preamble every numbered prompt assumes. [`../docs/ENGINEERING_CONTRACT.md`](../docs/ENGINEERING_CONTRACT.md)
is the standing contract; this file is the working method that goes with it.

## Before writing any code

1. **Read the documents the prompt names.** Not skim — read. They contain decisions already made.
   Re-deriving them wastes a session and produces a subsystem that contradicts its neighbours.
2. **State your plan in ≤ 5 bullets.** If the plan diverges from the prompt's deliverables, say so
   and why before starting.
3. **State any assumption** the prompt left open. Then proceed on it — do not stop to ask unless
   proceeding either way would waste the work.

## The design bar

**[impeccable.style](https://impeccable.style) is this product's primary design reference, and it
applies to every prompt that produces something visible.** Read
[`../docs/DESIGN_REFERENCES.md`](../docs/DESIGN_REFERENCES.md) once, before the first visual prompt.

Three rules follow from it:

1. **Look at the reference before you build, and look at your result afterwards.** Open
   impeccable.style in a browser. Study the specific surface you are about to build — the value
   relationships, the depth, the timing, the finish. Then build. Then compare side by side.

2. **Loudness varies by surface; standard of finish does not.** Content surfaces (landing, gallery,
   blocks, heroes, effects) apply it at full strength. The studio chrome applies it as craft only —
   surface precision, glass on floating panels, micro-interaction feel — never as animated gradients
   or decorative glow. `DESIGN_REFERENCES.md` § Applying it per surface has the table.

3. **"Merely competent" is not done.** When a prompt asks you to judge whether output is shippable,
   the bar is the reference, not the absence of bugs. If your version is only as good as a generic
   implementation, say so and iterate rather than ticking the box.

Never paste code from a reference. Understand the technique, then implement it against our schema,
tokens, motion model, and reduced-motion policy — and run the licence check in
`DESIGN_REFERENCES.md` § The licence check before adapting anything.

## While writing code

- **The documents are the specification.** If one is wrong, say so, propose the edit, and change
  the document in its own commit *before* writing code that contradicts it. Never silently
  diverge.
- **TypeScript strict, zero `any`.** No `@ts-ignore`, no unchecked casts. If types fight you, the
  model is wrong.
- **No file over 300 lines.** Split by responsibility.
- **Barrel exports only.** No deep cross-package imports.
- **Tests with behaviour.** Anything with a branch gets a test. Write it first where it describes a
  contract.
- **Reduced motion for anything animated.** No exceptions.
- **Keyboard path and accessible name for anything interactive.** No exceptions.
- **Prefer editing an existing file** over creating a new one. Never rename or move files unless
  the prompt says to.

## Do not

- Do not install a dependency not named in `docs/TECH_STACK.md` without stating the justification
  first.
- Do not scaffold beyond the deliverables. No speculative abstraction, no "flexibility" nobody
  asked for, no config options with one caller.
- Do not add `TODO` comments. Either build it or list it as out of scope in your report.
- Do not write placeholder implementations that throw or return `null` and call the prompt done.
  If something is genuinely blocked, finish everything else and say precisely what is left.
- Do not mock our own modules in tests. Use the real thing or the injected fake.
- Do not mention tooling or assistant involvement in commit messages, comments, docs, or PR
  bodies. The history reads as the author's work.

## Verification

Run these, read the output, and do not claim success from intent:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Plus whatever the prompt's **Verify** section adds.

If something fails: fix it and re-run. "I've fixed it" without a re-run is not evidence.

## Reporting back

End every session with:

```
## Done
- what was built, one line each

## Verified
- pnpm lint      → clean
- pnpm typecheck → clean
- pnpm test      → 47 passed
- pnpm build     → clean
- <prompt-specific check> → result

## Not done
- anything skipped, and why

## Notes
- decisions made, assumptions taken, doc edits proposed
```

Honest reporting is worth more than a clean-looking report. A known gap is manageable; a hidden one
is a bug someone finds three sessions later.

## Commit

One commit per prompt, using the message the prompt gives. Conventional Commits, imperative,
English, no trailing period.

Before committing, check the diff for: `.env` content, keys, absolute local paths, and anything
mentioning tooling or assistants.

## The bar

Every session's output should be something you would put in a pull request at a company you
respect. Not "works on my machine" — reviewable, tested, typed, documented, and consistent with
what came before.

If output does not meet that bar, the correct move is to say so and fix it, not to move on.
