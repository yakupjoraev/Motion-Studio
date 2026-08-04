# Motion Studio — Production Bible

This directory is the specification. It is written before the code and it stays true to the
code. If an implementation diverges from a document, one of the two is a bug.

## How to use it

- Working on a subsystem? Read that subsystem's document **before** writing code.
- Adding something not covered? Add the section, then build it.
- Found a contradiction? Fix the document first, in its own commit.

Documents are deliberately narrow. Each one owns exactly one subject and links out instead of
repeating. That is what keeps a session's context small.

## Index

### Product
| Document | Owns |
| --- | --- |
| [VISION.md](VISION.md) | Why the product exists, who it is for, what it refuses to be |
| [PRODUCT.md](PRODUCT.md) | Feature specification, surfaces, user flows, acceptance criteria |
| [ROADMAP.md](ROADMAP.md) | Build order, milestones, definition of done per milestone |
| [GLOSSARY.md](GLOSSARY.md) | Exact meaning of every domain term used in code and docs |

### Engineering foundations
| Document | Owns |
| --- | --- |
| [ENGINEERING_CONTRACT.md](ENGINEERING_CONTRACT.md) | **Start here.** The rules every change obeys. Overrides every other document |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Monorepo topology, package boundaries, dependency rules, data flow |
| [TECH_STACK.md](TECH_STACK.md) | Every dependency, its version, and the reason it was chosen |
| [CODE_STANDARDS.md](CODE_STANDARDS.md) | Types, naming, file layout, patterns, banned patterns |
| [STATE_MANAGEMENT.md](STATE_MANAGEMENT.md) | Store shape, slices, selectors, commands, transient state |

### Design
| Document | Owns |
| --- | --- |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | Tokens: colour, type, space, radius, elevation, blur, glass, noise |
| [UI_GUIDELINES.md](UI_GUIDELINES.md) | Studio layout, chrome, density, interaction feel, copy tone |
| [THEME_ENGINE.md](THEME_ENGINE.md) | Runtime theming, palette generation, CSS-variable strategy |
| [ANIMATION_SYSTEM.md](ANIMATION_SYSTEM.md) | Easings, springs, channels, preset catalogue, reduced motion |
| [DESIGN_REFERENCES.md](DESIGN_REFERENCES.md) | Which references set the visual bar, how to use them, licence rules |

### Subsystems
| Document | Owns |
| --- | --- |
| [EDITOR_ENGINE.md](EDITOR_ENGINE.md) | Document model, commands, history, selection, clipboard |
| [CANVAS.md](CANVAS.md) | Viewport maths, zoom, pan, snapping, guides, rulers, hit testing |
| [DRAG_AND_DROP.md](DRAG_AND_DROP.md) | Drag sources, drop targets, insertion semantics, keyboard DnD |
| [COMPONENT_LIBRARY.md](COMPONENT_LIBRARY.md) | Registry contract, block anatomy, full block catalogue |
| [RESPONSIVE_ENGINE.md](RESPONSIVE_ENGINE.md) | Breakpoints, prop overrides, resolution, preview device frames |
| [EXPORT_ENGINE.md](EXPORT_ENGINE.md) | IR, printers, formatting, dependency collection, export targets |
| [FILE_FORMAT.md](FILE_FORMAT.md) | `.motion` schema, versioning, migrations, import/export safety |
| [PLAYGROUND.md](PLAYGROUND.md) | Live CSS editor, property sandboxes, parsing and safety |
| [SHORTCUTS.md](SHORTCUTS.md) | Keyboard map, chords, command palette, conflict rules |

### Quality
| Document | Owns |
| --- | --- |
| [PERFORMANCE.md](PERFORMANCE.md) | Budgets, measurement, render strategy, virtualization, bundle policy |
| [ACCESSIBILITY.md](ACCESSIBILITY.md) | Per-surface requirements, focus model, ARIA contracts, testing |
| [TESTING.md](TESTING.md) | What to test, where, with what, and the coverage contract |
| [DEVOPS.md](DEVOPS.md) | CI pipeline, Docker, releases, deploy, quality gates |

## Reading paths

**New to the project** → ENGINEERING_CONTRACT → VISION → PRODUCT → ARCHITECTURE → ROADMAP

**Building the editor** → EDITOR_ENGINE → STATE_MANAGEMENT → CANVAS → DRAG_AND_DROP

**Building blocks** → COMPONENT_LIBRARY → DESIGN_SYSTEM → ANIMATION_SYSTEM → RESPONSIVE_ENGINE

**Building effects** → DESIGN_REFERENCES → COMPONENT_LIBRARY (§ Effects) → ANIMATION_SYSTEM → PERFORMANCE

**Building export** → FILE_FORMAT → EXPORT_ENGINE → COMPONENT_LIBRARY

**Hardening** → PERFORMANCE → ACCESSIBILITY → TESTING → DEVOPS
