---
group: Subsystems
order: 10
summary: Locales, URL shape, the stored choice, dictionaries, and what stays English
---

# LOCALISATION

The product speaks **English and Russian**. This document owns how a language is chosen, where the
strings live, and what is deliberately not translated.

The decisions behind every rule here are ADR-360 … ADR-366 in [DECISIONS.md](DECISIONS.md).

## 1. The two locales

`en` and `ru`. The list is `apps/web/src/lib/i18n/locales.ts` and it is the source of truth for the
routing, the dictionaries and the switch — nothing else may enumerate locales.

English is the **default**: it is the language the definitions, the documents and the code comments
are written in, so it is also the language a missing translation falls back to.

## 2. The URL

`/` is English. `/ru/...` is Russian. There is no `/en/...`.

On disk every route lives once, under `app/[locale]/`, and both locales are generated statically.
Middleware is what makes the English URL unprefixed:

| Request | What middleware does |
| --- | --- |
| `/ru/blocks` | Serves it |
| `/blocks`, no stored choice, English signals | **Rewrites** to `/en/blocks` — the URL does not change |
| `/blocks`, stored choice `ru`, or Russian signals | **Redirects** to `/ru/blocks` |
| `/en/blocks` | **Redirects** to `/blocks` — one page, one address |

An internal link is built with `localeHref(locale, path)` and nothing else. `path` is always the
unprefixed route (`/studio`, `/blocks/hero-split`, `/`).

## 3. Choosing the language

Two signals and one memory, in this order:

1. **The stored choice.** A cookie, `ms-locale`, `SameSite=Lax`, one year. Written **only** by an
   explicit choice — the switch in the header. Middleware reads it and never writes it.
2. **The region.** `x-vercel-ip-country` in `RU BY KZ KG TJ TM UZ AM MD`.
3. **The browser.** The first tag of `Accept-Language` beginning `ru`.

With no stored choice, either signal pointing at Russian is enough. With a stored choice, neither
signal is consulted — that is the whole of the owner's third requirement, and
`resolve-request-locale.test.ts` and `e2e/flows/language.spec.ts` both hold it.

The decision itself is a pure function, `resolveRequestLocale`; `middleware.ts` is only the seam onto
Next's request and response.

## 4. Where the strings live

| Strings | Where | Why there |
| --- | --- | --- |
| App surfaces — nav, landing, gallery, docs shell, studio | `apps/web/src/lib/i18n/dictionaries/<locale>/` | They belong to the app |
| Block names, descriptions, control labels, hints, categories | `packages/blocks/src/i18n/` | They belong to the registry, not to a page that lists it |
| A block's default copy | The block's own Zod schema, in English | It is content, not interface — see § 6 |

The English dictionary **is the type**: `Dictionary = typeof en`, and `ru` is annotated with it, so a
missing key does not compile. `dictionary-parity.test.ts` covers what the type cannot — a dropped
placeholder, a missing Russian plural form, a string nobody translated.

The registry's tables are keyed by the **English string** (ADR-365), and
`packages/blocks/src/i18n/registry-copy.test.ts` walks the registry in both directions: a new block
cannot ship an untranslated inspector, and a renamed control cannot leave a dead entry behind.

## 5. How the strings reach a component

- A **Server Component** in a route calls `getDictionary(locale)`. Nested ones call
  `getRequestDictionary()`, which reads the request-scoped locale a page set with
  `setRequestLocale`. Every page calls it — a layout is not enough, because Next renders a layout and
  its page in the same pass.
- A **Client Component** reads its surface's context: `useNav`, `useLanding`, `useGallery`,
  `useDocs`, `useStudio`, and `useRegistryCopy` for the registry's table. The route provides the
  slice it needs and no other.

**Dictionaries are props, never imports, on the client.** A client component that imports a
dictionary puts every string in the product into that route's JavaScript — measured at 1.9 kB over
the studio's budget when one seam did it by accident. Reading a string outside its provider throws:
a silent English fallback is how a missing provider reaches production looking like a translation
gap.

Counted strings use `formatPlural(locale, count, forms)`. English has two forms and Russian has
three; the difference lives in that one helper.

## 6. What is not translated, and why

- **The document bodies at `/docs`** — ADR-366, the owner's decision, revisited after production.
  The shell around them is translated and a Russian session says so above the index.
- **A block's default copy.** Inserting a block writes its text into the document, so it is the
  user's content from that moment. Switching the interface language does not rewrite a page somebody
  already composed (ADR-364).
- **Enumeration values** — `text-wide`, `md`, `soft-light`. They are identifiers: the same strings
  appear in the code the exporter emits, and a translated value would not round-trip.
- **Package names, library names, file paths, ARIA tokens.** `editor` is what the directory is
  called in both languages.

## 7. Adding a string

1. Add the key to the English surface file. That is the type.
2. Add the Russian. The compiler names the file if you forget.
3. If it carries a number, give it plural forms and read it with `formatPlural`.
4. If it carries a value, use `{placeholder}` — never string concatenation. Russian puts the parts
   in a different order.

## 8. Adding a locale

`LOCALES`, a dictionary directory, and — for the registry — a table in `packages/blocks/src/i18n/`.
Everything else reads the list. The one thing that is not mechanical is the URL shape: ADR-361 gives
Russian a prefix and English the root, so a third locale needs a decision about which of those two
shapes it takes.
