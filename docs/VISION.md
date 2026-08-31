---
group: Product
order: 1
summary: Why the product exists, who it is for, what it refuses to be
---

# VISION

## The one-sentence version

Motion Studio is where a developer *feels* a modern UI effect, tunes it, and walks away with
the source — instead of scrolling a gallery of screenshots.

## The problem

There is a gap between two kinds of tools, and nothing lives in it.

**Design tools** (Figma, Framer, Webflow) let you manipulate an interface directly. You drag,
you tune, you see. But what comes out is either a picture or a hosted page — not code you own,
and never idiomatic React.

**Component libraries** (shadcn/ui, Aceternity, Magic UI, React Bits, Impeccable) give you real
code. But the discovery experience is a static grid. You get one hard-coded demo per effect.
You cannot change the blur radius, cannot see how a spring behaves at 0.4 damping, cannot check
whether the aurora background survives a dark theme or a 12-column grid. So you copy it in,
find out it does not fit, and delete it.

The missing tool is the middle: **direct manipulation over real components, with code as the
output format.**

## The product

```
┌──────────────┬─────────────────────────────────┬──────────────────┐
│  Blocks      │           Canvas                │   Inspector      │
│  Motion      │                                 │                  │
│  Backgrounds │      live · zoomable            │   Layout         │
│  Effects     │      snapped · animated         │   Style          │
│  Layers      │      selectable                 │   Motion         │
│              │                                 │   Effects        │
│              │                                 │   Responsive     │
│              │                                 │   Code           │
└──────────────┴─────────────────────────────────┴──────────────────┘
```

Three panes, Figma-familiar. What is different: the canvas renders **real React components from
a real registry**, the inspector is **generated from each component's schema**, and the export
button emits **the component you were just looking at**.

## Who it is for

**The primary user is a working frontend developer** who wants a specific effect, wants it
tuned to their design, and wants the code. They will spend four minutes in the app and leave
with a `.tsx` file. The product must be worth those four minutes with zero onboarding.

**The secondary user is a designer-developer hybrid** composing a full landing page. They will
spend an hour, build eight sections, and export a Next.js page.

**The third audience is a hiring engineer** reading the repository. They are not a user — but
they are a stakeholder, and the codebase is the artifact they judge. This is why documentation,
test coverage, and architectural discipline are product requirements, not chores.

## What it refuses to be

| Not | Because |
| --- | --- |
| A hosted website builder | No accounts, no backend, no lock-in. Local-first, file-based. |
| A Figma competitor | No vector editing, no boolean ops, no plugin platform. Components, not shapes. |
| A general-purpose page builder | Curated blocks that look designed by default. Not infinite freedom to build something ugly. |
| A WYSIWYG that emits soup | Generated code must be reviewable and idiomatic, or the export is worthless. |
| A component marketplace | No submissions, no ratings, no economy. One curated registry. |

## Design principles

**1. Direct manipulation over configuration.**
If a value can be dragged, it is dragged. Numbers are scrubbable, colours are pickable,
gradients are editable on a track, springs are drawn as curves you can grab.

**2. Beautiful by default, not beautiful if configured.**
A block dropped with zero edits must look intentional. Defaults are design decisions, and every
default is reviewed as one.

**3. The code is the product.**
Exported output is judged as if a senior engineer will review it — because one will. Correct
imports, real types, no dead props, no wrapper soup, formatted.

**4. Every millisecond is visible.**
This is a tool about motion. A dropped frame is a bug in the domain, not a performance nit.
Interaction state never round-trips through React re-renders.

**5. Keyboard-first, mouse-friendly.**
Everything reachable by keyboard, discoverable through `⌘K`. Power users never touch a menu.

**6. Reduced motion is a first-class mode, not a fallback.**
A motion tool that hurts vestibular users is a broken motion tool. Every preset ships a
reduced variant, and the studio has a global toggle to preview it.

**7. Nothing hidden behind a spinner.**
No loading state a user can notice. Heavy work is chunked, deferred, or moved off the main
thread — never awaited in front of the user.

## Success criteria

The project is a success when all of the following are true:

- A developer can go from cold open to copied component in **under 60 seconds**.
- A full landing page can be composed and exported in **under 20 minutes**.
- Exported code compiles with **zero edits** in a fresh Next.js 15 app.
- The canvas holds **60 fps with 200 nodes** on a mid-range laptop.
- Lighthouse **≥ 95** on all four categories for the public pages.
- The whole app is operable **with a keyboard and a screen reader**.
- A reader can understand the architecture from `docs/` **without reading the code**.

## Anti-goals for v1

Explicitly out of scope, so they do not creep in:

- Multiplayer / real-time collaboration
- Cloud persistence, auth, teams
- Custom code blocks / user-authored components
- Plugin API
- Vector drawing tools
- CMS or data binding
- Publishing / hosting
- Mobile authoring (the studio is desktop; the *output* is fully responsive)

Some of these are interesting. None of them make the four-minute path better, which is the only
path that matters first.
