# 65 — English and Russian, everywhere

**Milestone** M15 · **Depends on** 64 · **Commit** `feat(web): ship the product in English and Russian`

## Read first

- `docs/UI_GUIDELINES.md` — § Copy tone
- `docs/ACCESSIBILITY.md` — § Landing, gallery, docs
- `docs/PERFORMANCE.md` — the landing budgets a second locale must not break
- `apps/web/app/layout.tsx` — `lang="en"`, hard-coded today

## Goal

The product speaks English and Russian. Every surface: the studio chrome, the landing, the gallery, the
docs, and the default copy inside the blocks themselves.

The repository has no i18n dependency and no locale anywhere. This is the whole subsystem, not a
translation pass.

## The behaviour the owner specified, exactly

1. **A first-time visitor gets the language their region suggests.** Region, not only `Accept-Language`.
2. **An explicit choice always wins.** Once a person picks a language, that is the language.
3. **The choice survives a return visit.** Coming back must not re-run the guess and override them.
4. **A language switch is in the header**, visible, not buried in a menu.

> Смотри с какой локации заходит юзер и автоматом выбери сам. Но это не означает, что если юзер
> выберет другой язык, при повторном входе ты ДОЛЖЕН обратно менять. Храни выборы юзеров!

Point 3 is the one that is easy to get wrong: a geo-guess that runs on every request will silently
undo the choice on the next visit. The guess runs **only when there is no stored choice**.

## Decisions to make before writing code — record each in `DECISIONS.md`

- **Which library, or none.** A locale is two dictionaries and a switch; `next-intl` is a dependency
  with routing opinions. § 1.10 of the contract wants a one-line justification either way.
- **URL shape.** `/ru/...` prefixes, or one URL with a cookie? Prefixes are shareable and indexable;
  a cookie is invisible to a link. This decides the routing and the SEO story, so decide it first.
- **Where the choice lives.** A cookie is readable by the server on the first paint; `localStorage` is
  not, and a locale read after hydration flashes the wrong language.
- **What "region" means.** Vercel's geo header on the deployment, `Accept-Language` locally, and what
  happens when they disagree.
- **The blocks' default copy.** A block's defaults are content in a schema. Either the schema carries
  both languages, or the defaults are looked up at insert time — this changes `.motion` and may need a
  migration (`FILE_FORMAT.md`).

## Deliverables

```
apps/web/                     locale routing, the switch in the header, the dictionaries
packages/blocks/              default copy per locale, however the decision above shapes it
docs/                         a section on the locale model; the ADRs above
e2e/                          the four behaviours, as four tests
```

## Verification

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm --filter web size-limit
```

- [ ] First visit from a Russian region lands in Russian, without a flash of English
- [ ] Switching to English and returning tomorrow still gives English
- [ ] Every string in the studio chrome is translated — no English left in a Russian session
- [ ] `<html lang>` matches the rendered language on every route
- [ ] Cyrillic does not break the studio's dense layout: check the inspector's 88 px label column and
      the panel tabs, which are already tight in English
- [ ] Landing Lighthouse budgets still met in both locales

Report the string count per surface and anything that had to change because Russian is longer.
