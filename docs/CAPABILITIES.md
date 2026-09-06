---
group: Product
order: 6
summary: The owner's list of capabilities to add, what each is, and what already exists
---

# CAPABILITIES

The one door a new capability comes through. A request is written here first — what it is, why, and
which category it lands in — and only then does a session pick it up and run
[COMPONENT_LIBRARY.md](COMPONENT_LIBRARY.md) § Adding a block, which is the checklist for taking it
everywhere the product mentions blocks.

Three things this document is for, in order of how much time each saves:

1. **Not building what exists.** The first request on this page was for tabs, accordions, modals,
   tooltips and sliders — all five were already in the registry. That is a discovery problem, and
   answering it here costs a minute instead of a session.
2. **Deciding shape before code.** A capability is a block, a control kind, a motion preset, an
   export target or a studio surface, and those cost very different amounts. Naming which one it is
   is most of the estimate.
3. **Keeping the record.** [ENGINEERING_CONTRACT.md](ENGINEERING_CONTRACT.md) § 9 — a request
   accepted or declined with no reason cannot be checked later by anyone, including the person who
   decided it.

## Already in the product

Checked against the registry on 2026-09-06. Ask here before requesting; the answer is often "open
the palette".

| Asked for | It exists as | Where |
| --- | --- | --- |
| Tabs | `tabs` | Interactive — Radix Tabs, keyboard model included |
| Accordion | `accordion` | Interactive — Radix Accordion |
| Modal | `modal-trigger` | Interactive — a trigger plus a Radix Dialog, because a block cannot install a provider |
| Tooltip | `tooltip-target` | Interactive — the exception ADR-190 and ADR-202 explain: the description sits on the element that takes focus |
| Slider / carousel | `carousel` | Interactive — CSS `scroll-snap`, not a carousel library; autoplay off by default and absent under reduced motion |
| A row of cards on a phone | The `narrow` prop — `slider` or `stack`, the user picks | Every block that needs it (ADR-357), with six recorded exclusions (ADR-358) |

The full list is § Catalogue in [COMPONENT_LIBRARY.md](COMPONENT_LIBRARY.md): **72 blocks in nine
categories**, plus **51 motion presets in six channels** in
[ANIMATION_SYSTEM.md](ANIMATION_SYSTEM.md).

## How to request one

Add a row to the table below. Four fields, and the third is the one that decides everything:

- **What** — the capability in one line, in the words a user would use.
- **Why** — the thing a person cannot do today. "It would be nice" is not a why; "you cannot show
  a comparison table on a phone" is.
- **Shape** — block / control kind / motion preset / export target / studio surface. If it is not
  one of those five, it is a bigger change than a row here can carry, and it needs a prompt in
  `prompts/`.
- **Category** — for a block, one of the nine. A capability that fits none of them is a request to
  add a tenth category, which is a separate decision (ADR-176 fixed the nine).

## Requested

Nothing is in flight. The next session that picks one up starts with § Adding a block.

| What | Why | Shape | Category | State |
| --- | --- | --- | --- | --- |
| _(empty — add rows here)_ | | | | |

## Declined, with the reason

Kept because a request declined without a record gets asked again every few months.

| What | Why not |
| --- | --- |
| Custom user-authored blocks | [VISION.md](VISION.md) § Anti-goals for v1. It turns a curated registry into a plugin platform, and the curation is the product |
| A CSS-Modules or styled-components export option | [EXPORT_ENGINE.md](EXPORT_ENGINE.md) § There is no styling option. Tailwind is the model the generator is built on, not a formatting choice made at print time |
| A carousel library | `carousel` is `scroll-snap` on purpose: touch, trackpad, keyboard and screen readers work without us, and the exported code carries no dependency |
