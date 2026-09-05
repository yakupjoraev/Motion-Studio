# 69 — Findability, ownership, and where it lives

**Milestone** M15 · **Depends on** 66 · **Commit** `feat(web): make the product findable and its terms explicit`

## Read first

- `docs/DEVOPS.md` — § Deploy, § Repository hygiene. The deployment is `motion-studio-y3dev.vercel.app`
  today, no custom domain.
- `docs/PERFORMANCE.md` — the landing budgets any SEO work has to stay inside
- `README.md` — it says MIT, and so does the landing
- `prompts/66` — the positioning this prompt makes findable

## Goal

The product is finished, deployed, and impossible to find. Four separate questions, decided together
because they contradict each other if decided apart.

## 1. SEO

The landing has metadata and an OG image. What it does not have is anything that makes it rank.

```
sitemap.xml                  every public route, generated rather than written
robots.txt                   and the noindex problem below
JSON-LD                      SoftwareApplication, with the real properties
canonical URLs               one per route, absolute
per-route metadata           /blocks/[slug] is 72 pages with real content and generic titles today
```

**The `vercel.app` problem, first.** The platform serves `X-Robots-Tag: noindex` on `*.vercel.app`, and
`is-crawlable` already fails Lighthouse SEO for that reason — the deploy notes record SEO at 60 rather
than 100 because of it. **No SEO work has any effect until there is a custom domain.** Do that before
the rest of this section, not after.

The 72 block pages are the real asset: each is a live, interactive demo of a named component. Titles
and descriptions written per block are worth more than anything done to the landing.

## 2. The legal pages

```
/privacy      what is collected — and the honest answer is close to nothing
/terms        the terms of use for the hosted studio
```

The privacy page is unusually easy here and that is worth saying plainly on it: the studio is
local-first, documents live in the visitor's own browser, there is no account and no backend. If
analytics are ever added, this page changes first.

Both pages are localised alongside prompt 65.

## 3. Ownership, and what actually secures it

Not legal advice — the shape of the decision, for a conversation with someone who gives it:

- **Copyright exists already.** It attaches on authorship; the git history with real dates and one
  author is good evidence, and `LICENSE` states the terms.
- **The name is the part that is not secured.** "Motion Studio" is descriptive and generic, and a
  descriptive name is hard to register and easy to collide with. If the brand matters, this is the
  question to take to a trademark attorney, and it is worth doing **before** the launch that creates
  the association.
- **The domain is the cheap half of the same problem.** Register it, and the matching handles, before
  announcing anything.
- **The licence is a product decision, not a legal one.** MIT is currently promised on the landing and
  in the README. See § 4 — it is the same decision as the repository's visibility.

## 4. Where it lives, and who can see the source

Three coupled decisions. **Deciding them apart is how a project ends up publicly MIT-licensed with a
private repository that pays for CI.**

**Hosting — Vercel is enough, and a rented host would be a downgrade.** This is a Next.js app; ISR,
image optimisation, the edge network and preview deployments are the platform's own. A VPS means
running and patching all of it by hand for no gain. Buy the domain and point it at Vercel. The only
reason to revisit that is a backend with state — which is the v2 account, not this.

**Making the repository private has a price, and it is already documented.** It was made public
deliberately: GitHub Actions minutes are free for public repositories and billed for private ones, and
the whole pipeline — 15 jobs, nine e2e shards, two Lighthouse runs — stopped for a week when billing
failed. Going private brings that bill back. Measure a month of minutes and price it before switching.

**Private and MIT do not sit together.** MIT is a promise about source that is published; a private
repository publishes none. Either the licence changes with the visibility, or the repository stays
public and the product is protected by the brand and the hosted service rather than by secrecy. Both
are defensible; the incoherent one is claiming MIT on a landing page whose source nobody can read.

Worth weighing honestly: **the repository is currently the portfolio artifact.** `ENGINEERING_CONTRACT`
§ 0 says someone opens the repo and concludes the author can build systems. Closing it trades that for
protection the brand and the service already provide better.

## Deliverables

```
apps/web/app/sitemap.ts, robots.ts     generated from the same route list the app has
apps/web/app/(legal)/privacy, /terms   localised
apps/web/                              JSON-LD, canonicals, per-block metadata
docs/DEVOPS.md                         § Domain: what was registered and how it is pointed
docs/DECISIONS.md                      the licence-and-visibility decision, whichever way it goes
```

## Verification

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

- [ ] Lighthouse SEO 100 on the custom domain — it cannot pass on `vercel.app`, so test there
- [ ] `sitemap.xml` lists every public route and no private one
- [ ] Three block pages checked by hand for a real title and description
- [ ] The privacy page describes what the product actually does with data
- [ ] The licence, the README, the landing and the repository visibility all say the same thing
