# 41 — Blocks: data and forms

**Milestone** M8 · **Depends on** 40 · **Commit** `feat(blocks): add data and form blocks`

## Read first

- `docs/COMPONENT_LIBRARY.md` — § Catalogue (Data, Forms)
- `docs/ACCESSIBILITY.md` — non-negotiables
- `docs/TECH_STACK.md` — § Validation and data (React Hook Form's actual scope)

## Goal

The last ten blocks: five data displays and five form blocks. Completing the registry at **62 blocks**.

Forms are where accessibility is most often wrong and most consequential, so their requirements are
explicit and tested.

## Deliverables

```
packages/blocks/src/data/
├── table/            TanStack Table headless: sorting, sticky header, zebra, density, empty state
├── stat-grid/        responsive grid of stat blocks with dividers
├── progress-ring/    SVG circular progress, animated, with an accessible value
├── timeline/         vertical or horizontal, with markers, dates, and content slots
├── chart-preview/    lightweight line/bar/area from a numeric array — inline SVG, no library
└── index.ts

packages/blocks/src/forms/
├── input-field/      label + input + hint + error, all wired
├── select-field/     Radix Select with the same wiring
├── checkbox-field/   checkbox/radio group with a fieldset legend
├── contact-form/     name + email + message + submit, full validation
├── waitlist-form/    email + submit, compact, inline success
└── index.ts
```

## Constraints

### Forms — the wiring is the feature

Every field block must produce this structure, and there is a test asserting each part:

```html
<div>
  <label for="f1">Email</label>
  <input id="f1" type="email"
         aria-describedby="f1-hint f1-error"
         aria-invalid="true"
         aria-required="true" />
  <p id="f1-hint">We'll never share it.</p>
  <p id="f1-error" role="alert">Enter a valid email address</p>
</div>
```

- `label` with `htmlFor` — **never** a placeholder standing in for a label
- `aria-describedby` referencing both hint and error, in that order
- `aria-invalid` only when actually invalid
- Error messages in `role="alert"` so they announce on appearance
- Error text says what to do ("Enter a valid email address"), not what went wrong ("Invalid input")
- Required fields marked in the label text *and* with `aria-required` — an asterisk alone is not
  sufficient
- Ids are generated with `useId`, so multiple instances on one page do not collide. Test with two
  instances.

### `contact-form` and `waitlist-form`

- React Hook Form + a Zod resolver — this is the legitimate use of RHF named in `TECH_STACK.md`
- Four states: idle, submitting, success, error
- `onSubmit` is a **prop**, defaulting to a no-op. The export emits a clearly marked comment showing
  where to plug in a real handler. The block must not invent a backend.
- On submit failure, the error is announced and focus moves to the first invalid field
- Success replaces the form with a message that receives focus, so a screen-reader user knows it worked
- Honeypot field for spam, `aria-hidden` and visually hidden with a technique that does not hide it
  from spam bots (an off-screen input, not `display: none`)

### `table`

- TanStack Table headless with our own markup, so the DOM is a real `<table>` with `<thead>`, `<th
  scope="col">`, and a `<caption>` (visually hidden if the user did not provide one — a table with no
  accessible name is a screen-reader dead end)
- Sortable columns: `aria-sort` on the header, and the sort control is the header button itself
- Sticky header with correct `z-index`
- Horizontal overflow inside its own `overflow-x: auto` container with `tabindex="0"` +
  `role="region"` + label
- Columns and rows are `list` props; data is inline, never fetched
- Empty state inside the table body, spanning all columns

### `progress-ring`

SVG with `stroke-dasharray`/`stroke-dashoffset`. `role="progressbar"` with `aria-valuenow`,
`aria-valuemin`, `aria-valuemax`, and `aria-valuetext` ("68 percent complete"). The animated fill
respects reduced motion by showing the final value immediately.

### `chart-preview`

Inline SVG path generation from a numeric array — line, bar, or area. **No chart library**; this is
~60 lines and adding 34 kB for a decorative landing-page chart is not justified.

Accessible: `role="img"` with an `aria-label` summarising the data ("Revenue growth from 12 to 84 over
6 months"), plus an optional visually-hidden data table for the real values. A chart that a screen
reader cannot convey is decoration, and should say so.

`costClass: 'cheap'`.

### `timeline`

Ordered list semantics (`<ol>`), each item with a `<time datetime>` element. Content slots accept `*`.
Vertical by default; horizontal mode scrolls with snap.

## Verify

```bash
pnpm --filter @motion-studio/blocks test
pnpm dev:storybook
```

Tests — the form assertions are the core of this prompt:
- Every field block: label association, `aria-describedby` order, `aria-invalid` only when invalid,
  error in `role="alert"`, `aria-required` present
- Two instances of the same field on one page → distinct ids (the `useId` test)
- `contact-form`: submit with invalid data → focus moves to the first invalid field, error announced
- `contact-form`: success → the message receives focus
- Honeypot is not `display: none`
- `table`: `<caption>` always present, `scope="col"` on headers, `aria-sort` on sortable columns,
  region is keyboard-scrollable
- `progress-ring`: full progressbar ARIA; reduced motion shows the final value
- `chart-preview`: `aria-label` summarises the data; the hidden table matches the values
- `timeline`: `<ol>` with `<time datetime>`

Manual, and report:
- Fill and submit `contact-form` with a keyboard only, including triggering and recovering from an
  error. Report where focus went at each step.
- With a screen reader, submit an invalid form → report what was announced
- `table` with 50 rows: sort, scroll horizontally by keyboard
- All ten blocks at 360, 768, 1440
- Reduced motion across all ten
- Final registry count: **62 blocks**. Report the actual number from `blockRegistry.list().length`.

## Done when

- [ ] Ten blocks, nine files each; registry at 62, count reported
- [ ] Every form field fully wired: label, describedby, invalid, required, alert
- [ ] `useId` prevents id collisions, tested with two instances
- [ ] Invalid submit moves focus to the first invalid field; success message receives focus
- [ ] `table` always has an accessible name and correct sort ARIA
- [ ] `chart-preview` and `progress-ring` fully accessible without a chart library
- [ ] Keyboard-only form submission verified, focus path reported
- [ ] Screen-reader error announcement verified and reported
- [ ] All meta-tests pass over all 62 blocks; zero axe violations registry-wide
- [ ] M8 complete
