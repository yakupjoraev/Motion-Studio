<div align="center">

# Motion Studio

**A visual editor for modern React interfaces.**
Infinite canvas · production-grade block registry · live motion engine · real code export.

[![CI](https://img.shields.io/badge/CI-passing-1f2937?style=flat-square)](.github/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square)](tsconfig.json)
[![Lighthouse](https://img.shields.io/badge/Lighthouse-95%2B-0cce6b?style=flat-square)](docs/PERFORMANCE.md)
[![License](https://img.shields.io/badge/license-MIT-8b5cf6?style=flat-square)](LICENSE)

</div>

---

## What it is

Open the studio. Drag a `Hero` onto the canvas. Change the gradient. Add glass. Pick a motion
preset — `reveal`, `magnetic`, `aurora`. Watch it animate at 60 fps. Open the inspector, scrub a
spring curve, live-edit a `clip-path`. Hit **Copy React** and paste a component that actually
compiles.

That is the whole product. No lock-in, no runtime, no account. The output is code you own.

## Why it exists

Every UI-effect library shows you a static grid of cards. You cannot feel a spring from a
screenshot, and you cannot tell whether an effect survives contact with a real layout. Motion
Studio makes effects **manipulable**: parameters on the right, live result in the middle,
generated source one keystroke away.

Read the long version in [`docs/VISION.md`](docs/VISION.md).

## Features

| | |
| --- | --- |
| **Infinite canvas** | Zoom, pan, snap grid, alignment guides, rulers, multi-select, marquee |
| **Block registry** | 60+ typed, responsive, accessible blocks — Hero, Pricing, Bento, Dock, FAQ, Marquee… |
| **Motion engine** | 30+ presets over a shared easing/spring vocabulary; scroll, hover, cursor and entrance channels |
| **Inspector** | Typed controls generated from each block's Zod schema — colour, gradient, blur, shadow, radius, spacing, grid |
| **Playground** | Live CSS editor for `background`, `box-shadow`, `mask`, `clip-path`, `backdrop-filter`, `filter` |
| **Theme engine** | Token-driven runtime theming; light/dark/system; palette, radius, elevation, motion scale |
| **Responsive engine** | Per-breakpoint prop overrides with visual breakpoint switching |
| **Export** | React (TSX), Next.js App Router, standalone HTML + CSS, or portable `.motion` JSON |
| **Undo/redo** | Patch-based history with coalescing — a slider drag is one undo step, not four hundred |
| **Keyboard-first** | Command palette (`⌘K`) and a full Figma-class shortcut map |
| **A11y** | Keyboard-operable canvas, ARIA-correct chrome, reduced-motion support, contrast-checked tokens |

## Quick start

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

```bash
pnpm dev:storybook  # http://localhost:6006
pnpm test           # unit (Vitest)
pnpm test:e2e       # end-to-end (Playwright)
pnpm lint           # Biome
pnpm typecheck      # tsc --noEmit, all packages
pnpm build          # Turborepo pipeline
```

Docker:

```bash
docker compose up --build   # http://localhost:3000
```

Requires Node 20+ and pnpm 9+.

## Architecture

```
┌───────────────────────────────────────────────────────────────────────────┐
│  apps/web  ·  Next.js 15 App Router                                       │
│  /  landing      /studio  editor      /playground      /docs              │
└───────────────┬───────────────────────────────────────────────────────────┘
                │
   ┌────────────┴────────────┬──────────────────┬─────────────────┐
   │                         │                  │                 │
┌──▼──────────┐   ┌──────────▼────────┐  ┌──────▼───────┐  ┌──────▼───────┐
│  editor     │   │  canvas           │  │  dnd         │  │  codegen     │
│  document   │   │  viewport         │  │  dnd-kit     │  │  IR →        │
│  commands   │   │  zoom · pan       │  │  drop rules  │  │  printers    │
│  history    │   │  snap · guides    │  │  reorder     │  │  formatter   │
│  selection  │   │  rulers           │  │  keyboard dnd│  │              │
└──┬──────────┘   └──────────┬────────┘  └──────┬───────┘  └──────┬───────┘
   │                         │                  │                 │
   └────────────┬────────────┴──────────────────┴─────────────────┘
                │
        ┌───────▼────────┐   ┌──────────────┐   ┌───────────────┐
        │  schema        │   │  blocks      │   │  motion       │
        │  zod · .motion │   │  registry    │   │  presets      │
        │  migrations    │   │  60+ blocks  │   │  springs      │
        └───────┬────────┘   └──────┬───────┘   └───────┬───────┘
                │                   │                   │
                └───────────┬───────┴───────────────────┘
                            │
              ┌─────────────▼─────────────┐   ┌──────────────┐
              │  ui · theme · tokens      │   │ hooks utils  │
              │  chrome · CSS variables   │   │ icons config │
              └───────────────────────────┘   └──────────────┘
```

Full breakdown: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Documentation

The project is specified before it is built. Every subsystem has a document.

**Product** — [VISION](docs/VISION.md) · [PRODUCT](docs/PRODUCT.md) · [ROADMAP](docs/ROADMAP.md) · [GLOSSARY](docs/GLOSSARY.md)

**Engineering** — [ENGINEERING_CONTRACT](docs/ENGINEERING_CONTRACT.md) · [ARCHITECTURE](docs/ARCHITECTURE.md) · [TECH_STACK](docs/TECH_STACK.md) · [CODE_STANDARDS](docs/CODE_STANDARDS.md) · [STATE_MANAGEMENT](docs/STATE_MANAGEMENT.md)

**Design** — [DESIGN_SYSTEM](docs/DESIGN_SYSTEM.md) · [UI_GUIDELINES](docs/UI_GUIDELINES.md) · [THEME_ENGINE](docs/THEME_ENGINE.md) · [ANIMATION_SYSTEM](docs/ANIMATION_SYSTEM.md)

**Subsystems** — [EDITOR_ENGINE](docs/EDITOR_ENGINE.md) · [CANVAS](docs/CANVAS.md) · [DRAG_AND_DROP](docs/DRAG_AND_DROP.md) · [COMPONENT_LIBRARY](docs/COMPONENT_LIBRARY.md) · [RESPONSIVE_ENGINE](docs/RESPONSIVE_ENGINE.md) · [EXPORT_ENGINE](docs/EXPORT_ENGINE.md) · [FILE_FORMAT](docs/FILE_FORMAT.md) · [PLAYGROUND](docs/PLAYGROUND.md) · [SHORTCUTS](docs/SHORTCUTS.md)

**Quality** — [PERFORMANCE](docs/PERFORMANCE.md) · [ACCESSIBILITY](docs/ACCESSIBILITY.md) · [TESTING](docs/TESTING.md) · [DEVOPS](docs/DEVOPS.md)

## Tech stack

Next.js 15 · React 19 · TypeScript 5.6 (strict) · Tailwind CSS v4 · Zustand + Immer ·
Motion (Framer Motion) · GSAP · dnd-kit · Radix + React Aria · shadcn/ui · Zod ·
TanStack Query/Table · Storybook 8 · Vitest · Playwright · Biome · Turborepo · pnpm.

Rationale per choice: [`docs/TECH_STACK.md`](docs/TECH_STACK.md).

## Design references

The visual bar for this project is set by [impeccable.style](https://impeccable.style), with
secondary influence from [Aceternity UI](https://ui.aceternity.com),
[Magic UI](https://magicui.design), and [React Bits](https://reactbits.dev). The chrome's density and
restraint follow Linear and Figma.

Effects here are implemented independently against this project's schema, tokens, motion model and
reduced-motion policy — the techniques are studied, not the source copied. Each block's doc comment
names its influence and explains its technique; verified licences are recorded in
`packages/blocks/LICENSES.md`. The full workflow is in
[`docs/DESIGN_REFERENCES.md`](docs/DESIGN_REFERENCES.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Conventional Commits, strict types, tests with
behaviour, and CI green before review.

## License

MIT — see [LICENSE](LICENSE).
