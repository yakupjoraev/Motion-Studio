import { type TemplateSpec, band, builder, place, templateDocument } from './builder'

/**
 * The eight starter templates — FILE_FORMAT.md § Templates. Each one is a page somebody could ship,
 * not a tour of the registry: the blocks are the ones that page would use, in the order it would use
 * them, and the copy is written for the page rather than left at the catalogue's defaults wherever
 * those defaults are about Motion Studio itself.
 */
export const TEMPLATES: readonly TemplateSpec[] = [
  {
    slug: 'saas-landing',
    name: 'SaaS landing',
    description: 'Hero, proof, features, pricing and an answer to the four questions people ask.',
    build() {
      const page = builder()
      const root = place(page, 'container', null, 'root')

      place(page, 'navbar', root, 'children')
      place(page, 'hero-aurora', root, 'children')
      place(page, 'logo-cloud', root, 'children')
      place(page, 'feature-grid', root, 'children')
      place(page, 'bento-grid', root, 'children')
      place(page, 'testimonial-marquee', root, 'children')
      place(page, 'pricing-table', root, 'children')
      place(page, 'faq-accordion', root, 'children')
      place(page, 'cta-split', root, 'children')
      place(page, 'footer', root, 'children')

      return templateDocument('SaaS landing', 'saas-landing', page.nodes)
    },
  },
  {
    slug: 'portfolio',
    name: 'Portfolio',
    description:
      'A quiet index of work: one statement, selected projects, and a way to make contact.',
    build() {
      const page = builder()
      const root = place(page, 'container', null, 'root')

      place(page, 'navbar-floating', root, 'children', {
        brandLabel: 'Ada Fournier',
        links: [
          { label: 'Work', href: '#work' },
          { label: 'About', href: '#about' },
          { label: 'Writing', href: '#writing' },
        ],
        actions: [{ label: 'Get in touch', href: '#contact', variant: 'primary' }],
      })
      place(page, 'hero-centered', root, 'children', {
        eyebrow: 'Interface design and front-end',
        headline: 'I design the parts of a product people touch',
        subtitle:
          'Twelve years of interface work for teams who care what it feels like to use the thing. Selected projects below.',
        actions: [
          { label: 'See selected work', href: '#work', variant: 'primary' },
          { label: 'Read the notes', href: '#writing', variant: 'secondary' },
        ],
        trust: [{ label: 'Available from March' }, { label: 'Remote, CET' }],
      })
      place(page, 'feature-split', root, 'children', {
        eyebrow: 'Selected work',
        heading: 'Three projects worth the room',
        rows: [
          {
            eyebrow: 'Kestrel',
            title: 'A trading desk that stops shouting',
            body: 'Six panels of live data reduced to one hierarchy. Alert volume fell by two thirds, and the desk stopped muting them.',
            media: {
              src: '',
              alt: '',
              width: 1600,
              height: 1000,
              sizes: '(min-width: 1024px) 50vw, 100vw',
            },
            reversed: false,
          },
          {
            eyebrow: 'Vellum',
            title: 'An editor people stopped fighting',
            body: 'Rewrote the document model around blocks, then the interface around the model. Time to first draft halved.',
            media: {
              src: '',
              alt: '',
              width: 1600,
              height: 1000,
              sizes: '(min-width: 1024px) 50vw, 100vw',
            },
            reversed: true,
          },
        ],
      })

      const notes = band(page, root)

      place(page, 'heading', notes, 'children', { text: 'How I work', level: 2, size: 'lg' })
      place(page, 'text', notes, 'children', {
        text: 'I start with the flow that is failing, not the screen that looks tired. Most redesigns I have been handed were a structure problem wearing a visual one, and repainting them costs a quarter and fixes nothing.',
      })
      place(page, 'quote', root, 'children', {
        quote:
          'She rewrote the information architecture in a week, and the support queue told us before the analytics did.',
        author: 'Tomas Lind',
        role: 'Head of product, Kestrel',
      })
      place(page, 'timeline', root, 'children', {
        items: [
          {
            date: '2014',
            dateLabel: '2014',
            title: 'Started in front-end',
            body: 'Agency work, mostly marketing sites, mostly learning what not to do.',
            icon: 'code',
          },
          {
            date: '2018',
            dateLabel: '2018',
            title: 'Moved to product',
            body: 'Design systems at Vellum: tokens, components, and the argument for both.',
            icon: 'layout-grid',
          },
          {
            date: '2022',
            dateLabel: '2022',
            title: 'Independent',
            body: 'Interface work for teams who have the engineers and need the shape.',
            icon: 'zap',
          },
        ],
      })
      place(page, 'cta-banner', root, 'children', {
        heading: 'Have something that needs rethinking?',
        description: 'Tell me what is not working. I answer every message within a day.',
        actions: [
          { label: 'Send an email', href: '#contact', variant: 'primary' },
          { label: 'See the CV', href: '#cv', variant: 'secondary' },
        ],
      })
      place(page, 'footer', root, 'children', {
        brandLabel: 'Ada Fournier',
        tagline: 'Interface design and front-end, for teams that already have engineers.',
        showNewsletter: false,
        columns: [
          {
            title: 'Work',
            links: [
              { label: 'Kestrel', href: '#kestrel' },
              { label: 'Vellum', href: '#vellum' },
            ],
          },
          {
            title: 'Elsewhere',
            links: [
              { label: 'GitHub', href: '#github' },
              { label: 'Read.cv', href: '#cv' },
            ],
          },
        ],
        copyright: 'Ada Fournier',
      })

      return templateDocument('Portfolio', 'portfolio', page.nodes)
    },
  },
  {
    slug: 'product-launch',
    name: 'Product launch',
    description: 'One announcement, the numbers behind it, and the shortest path to trying it.',
    build() {
      const page = builder()
      const root = place(page, 'container', null, 'root')

      place(page, 'navbar', root, 'children', {
        links: [
          { label: 'What is new', href: '#new', children: [] },
          { label: 'Docs', href: '#docs', children: [] },
          { label: 'Pricing', href: '#pricing', children: [] },
        ],
      })
      place(page, 'hero-app-preview', root, 'children', {
        eyebrow: 'Version 2.0',
        headline: 'The rewrite you asked for, and the three things it fixes',
        subtitle:
          'Faster on large documents, honest about offline, and it finally exports the theme with the components.',
        actions: [
          { label: 'Try 2.0', href: '#try', variant: 'primary' },
          { label: 'Read the release notes', href: '#notes', variant: 'secondary' },
        ],
      })
      place(page, 'stat-grid', root, 'children', {
        items: [
          {
            value: '3.4x',
            label: 'Faster on 200-node documents',
            delta: '',
            deltaDirection: 'neutral',
            deltaRose: false,
          },
          {
            value: '184 kB',
            label: 'First load, down from 260',
            delta: '29%',
            deltaDirection: 'down-is-good',
            deltaRose: false,
          },
          {
            value: '100%',
            label: 'Offline after the first open',
            delta: '',
            deltaDirection: 'neutral',
            deltaRose: false,
          },
          {
            value: '0',
            label: 'Migrations you have to run',
            delta: '',
            deltaDirection: 'neutral',
            deltaRose: false,
          },
        ],
      })
      place(page, 'feature-grid', root, 'children', {
        eyebrow: 'What changed',
        heading: 'Three things, done properly',
        description: 'The list is short on purpose. Each one was a year of complaints.',
        columns: 3,
        items: [
          {
            icon: 'zap',
            title: 'A new document model',
            body: 'Normalised, patched and indexed. A 200-node page now edits at the speed a 20-node one used to.',
          },
          {
            icon: 'export',
            title: 'The theme exports with it',
            body: 'Tokens leave as CSS variables, Tailwind config or JSON, and the components read them wherever they land.',
          },
          {
            icon: 'success',
            title: 'Offline that means offline',
            body: 'Everything is local first. Close the tab mid-sentence and the work is there when you come back.',
          },
        ],
      })
      place(page, 'testimonial-marquee', root, 'children', {
        heading: 'From the beta',
        rows: 1,
      })
      place(page, 'cta-banner', root, 'children', {
        heading: 'Upgrading takes one command',
        description:
          'Your documents open unchanged. There is no migration to run and no account to make.',
        actions: [
          { label: 'Try 2.0', href: '#try', variant: 'primary' },
          { label: 'Read the release notes', href: '#notes', variant: 'secondary' },
        ],
      })
      place(page, 'footer', root, 'children')

      return templateDocument('Product launch', 'product-launch', page.nodes)
    },
  },
  {
    slug: 'docs-home',
    name: 'Docs home',
    description:
      'The front door of a documentation site: install, orient, and the common questions.',
    build() {
      const page = builder()
      const root = place(page, 'container', null, 'root')

      place(page, 'navbar', root, 'children', {
        links: [
          { label: 'Docs', href: '#docs', children: [] },
          { label: 'Reference', href: '#reference', children: [] },
          { label: 'Examples', href: '#examples', children: [] },
          { label: 'Changelog', href: '#changelog', children: [] },
        ],
        actions: [{ label: 'GitHub', href: '#github', variant: 'ghost' }],
      })
      place(page, 'hero-terminal', root, 'children', {
        eyebrow: 'Documentation',
        headline: 'Everything runs from one command',
        subtitle:
          'Install it, point it at a document, and read the diff. The rest of these pages are detail.',
      })

      const intro = band(page, root)

      place(page, 'heading', intro, 'children', { text: 'Start here', level: 2, size: 'lg' })
      place(page, 'text', intro, 'children', {
        text: 'Three pages cover the whole surface. Read them in order the first time and use the reference after that — nothing below repeats what they say.',
      })
      place(page, 'code-block', intro, 'children', {
        code: 'npm install motion-studio\nnpx motion-studio init\nnpx motion-studio export --target next',
        language: 'bash',
        filename: 'terminal',
        showLineNumbers: false,
      })
      place(page, 'feature-grid', root, 'children', {
        eyebrow: 'The map',
        heading: 'Six sections, and what each one is for',
        description: '',
        columns: 3,
        treatment: 'card',
        items: [
          {
            icon: 'file',
            title: 'Getting started',
            body: 'Install, open a document, place a block, export it. Twenty minutes end to end.',
          },
          {
            icon: 'grid',
            title: 'Blocks',
            body: 'Every block in the registry with its props, its slots and its accessibility notes.',
          },
          {
            icon: 'zap',
            title: 'Motion',
            body: 'The channels, the presets, the springs, and how reduced motion is honoured.',
          },
          {
            icon: 'palette',
            title: 'Theming',
            body: 'Tokens, palettes and the runtime engine that swaps them without a reload.',
          },
          {
            icon: 'export',
            title: 'Export',
            body: 'What React, Next and HTML each emit, and how to check the output compiles.',
          },
          {
            icon: 'code',
            title: 'Reference',
            body: 'The file format, the CLI flags and the schema, generated from the source.',
          },
        ],
      })
      place(page, 'faq-accordion', root, 'children', { heading: 'Before you open an issue' })
      place(page, 'footer', root, 'children', { showNewsletter: false })

      return templateDocument('Docs home', 'docs-home', page.nodes)
    },
  },
  {
    slug: 'pricing-page',
    name: 'Pricing page',
    description: 'Plans, a comparison people can scan, and the objections answered underneath.',
    build() {
      const page = builder()
      const root = place(page, 'container', null, 'root')

      place(page, 'navbar', root, 'children', { activeHref: '#pricing' })

      /*
       * `padding: 'sm'`, not the `xl` this band would take by eye. Two stacked sections add their
       * paddings, and at `xl` that put 400 px of nothing between the promise and the plans —
       * measured on the canvas at 1280 px. The pricing table below brings its own `lg`.
       */
      const intro = band(page, root, { padding: 'sm', align: 'center' })

      place(page, 'heading', intro, 'children', {
        text: 'Priced so the free plan is actually useful',
        level: 1,
        size: '2xl',
        align: 'center',
      })
      place(page, 'text', intro, 'children', {
        text: 'No seat minimum, no sales call, and no feature held back to force an upgrade. Change plans or leave whenever you like.',
        align: 'center',
        measure: 'narrow',
      })
      place(page, 'pricing-table', root, 'children', {
        eyebrow: '',
        heading: 'Every plan, side by side',
        description: 'Yearly is two months off.',
      })
      place(page, 'comparison-table', root, 'children', {
        heading: 'What each plan includes',
        columns: [
          { label: 'Free', highlighted: false },
          { label: 'Studio', highlighted: true },
          { label: 'Team', highlighted: false },
        ],
        rows: [
          { label: 'Documents', values: ['3', 'Unlimited', 'Unlimited'] },
          { label: 'The full block registry', values: ['yes', 'yes', 'yes'] },
          { label: 'React and HTML export', values: ['yes', 'yes', 'yes'] },
          { label: 'Next.js export', values: ['no', 'yes', 'yes'] },
          { label: 'Custom themes', values: ['no', 'yes', 'yes'] },
          { label: 'Shared libraries', values: ['no', 'no', 'yes'] },
        ],
        regionLabel: 'Plan comparison',
      })
      place(page, 'faq-accordion', root, 'children', {
        heading: 'Questions about billing',
        items: [
          {
            question: 'What happens when I hit the free limit?',
            answer:
              'Nothing is deleted. You can still open, edit and export every document you have — you cannot create a fourth until you archive one or upgrade.',
          },
          {
            question: 'Can I change plans mid-month?',
            answer:
              'Yes, and the difference is prorated to the day. Downgrading takes effect at the end of the period you have already paid for.',
          },
          {
            question: 'Do you offer a discount?',
            answer:
              'Yearly billing is two months off, and there is a free Studio plan for students, non-profits and anyone maintaining an open-source project.',
          },
          {
            question: 'What if I cancel?',
            answer:
              'Your documents stay yours. Export them as .motion files or as code at any point, including after the subscription ends.',
          },
        ],
      })
      place(page, 'cta-banner', root, 'children', {
        heading: 'Still deciding?',
        description: 'The free plan needs no card and has every export target that matters.',
        actions: [
          { label: 'Start free', href: '#start', variant: 'primary' },
          { label: 'Talk to us', href: '#contact', variant: 'secondary' },
        ],
      })
      place(page, 'footer', root, 'children')

      return templateDocument('Pricing page', 'pricing-page', page.nodes)
    },
  },
  {
    slug: 'blog-index',
    name: 'Blog index',
    description: 'A list of posts that reads like a contents page rather than a feed.',
    build() {
      const page = builder()
      const root = place(page, 'container', null, 'root')

      place(page, 'navbar', root, 'children', { activeHref: '#writing' })

      const intro = band(page, root, { padding: 'xl' })

      place(page, 'heading', intro, 'children', {
        text: 'Notes on building the thing',
        level: 1,
        size: '2xl',
      })
      place(page, 'text', intro, 'children', {
        text: 'Long-form writing about the document model, the export engine and the arguments we lost along the way. Roughly one a month, and never a release note in disguise.',
      })
      place(page, 'divider', intro, 'children')
      place(page, 'feature-grid', root, 'children', {
        eyebrow: 'Latest',
        heading: 'Recent posts',
        description: '',
        columns: 2,
        treatment: 'card',
        showIcons: false,
        items: [
          {
            icon: 'file',
            title: 'Why the document is a flat map',
            body: 'A nested tree reads better and edits worse. What changed when we normalised it, and the two bugs that disappeared.',
          },
          {
            icon: 'file',
            title: 'Patches are cheaper than snapshots',
            body: 'Two hundred undo steps in kilobytes rather than megabytes, and why the inverse patch is the one you keep.',
          },
          {
            icon: 'file',
            title: 'The export has to compile',
            body: 'Golden files, a type-check in CI, and what we learned from the six months it did not.',
          },
          {
            icon: 'file',
            title: 'Reduced motion is not a toggle',
            body: 'Every preset has a reduced form. Building them was less work than the exceptions we kept writing.',
          },
          {
            icon: 'file',
            title: 'Six breakpoints, one cascade',
            body: 'How an override shows where its value came from, and why that mattered more than the breakpoints did.',
          },
          {
            icon: 'file',
            title: 'A registry is a contract',
            body: 'Every block carries a schema, controls and a codegen descriptor — and a list of what a block is not allowed to do.',
          },
        ],
      })
      place(page, 'newsletter-form', root, 'children', {
        heading: 'One post a month, by email',
        description: 'The long ones, when they are finished. No digest, no drip, no product news.',
      })
      place(page, 'footer', root, 'children', { showNewsletter: false })

      return templateDocument('Blog index', 'blog-index', page.nodes)
    },
  },
  {
    slug: 'waitlist',
    name: 'Waitlist',
    description: 'One screen, one form, and just enough proof to make signing up feel reasonable.',
    build() {
      const page = builder()
      const root = place(page, 'container', null, 'root')

      place(page, 'navbar-floating', root, 'children', {
        links: [{ label: 'What it is', href: '#about' }],
        actions: [{ label: 'Join the waitlist', href: '#join', variant: 'primary' }],
      })
      place(page, 'hero-centered', root, 'children', {
        eyebrow: 'Opening in spring',
        headline: 'Something better than a spreadsheet is coming',
        subtitle:
          'We are building the planning tool the four of us kept rebuilding by hand. Leave an address and we will write once, when there is something to try.',
        actions: [],
        trust: [{ label: 'One email, ever' }, { label: 'No account needed' }],
        minHeight: 'half',
      })

      const form = band(page, root, { padding: 'md', align: 'center' })

      place(page, 'waitlist-form', form, 'children')
      place(page, 'logo-cloud', root, 'children', {
        heading: 'Being built with feedback from',
        eyebrow: '',
        columns: 6,
      })

      const closing = band(page, root)

      place(page, 'heading', closing, 'children', {
        text: 'What you are joining',
        level: 2,
        size: 'lg',
        align: 'center',
      })
      place(page, 'text', closing, 'children', {
        text: 'A closed beta of about two hundred people, opening in batches. You will get one email with a link, and nothing else until you use it.',
        align: 'center',
        measure: 'narrow',
      })
      place(page, 'footer', root, 'children', {
        showNewsletter: false,
        tagline: 'A planning tool for small teams. In private beta.',
        columns: [
          {
            title: 'Company',
            links: [
              { label: 'About', href: '#about' },
              { label: 'Contact', href: '#contact' },
            ],
          },
        ],
      })

      return templateDocument('Waitlist', 'waitlist', page.nodes)
    },
  },
  {
    slug: 'changelog',
    name: 'Changelog',
    description: 'Releases in reverse order, written for people deciding whether to upgrade.',
    build() {
      const page = builder()
      const root = place(page, 'container', null, 'root')

      place(page, 'navbar', root, 'children', { activeHref: '#changelog' })

      const intro = band(page, root, { padding: 'xl' })

      place(page, 'heading', intro, 'children', { text: 'Changelog', level: 1, size: '2xl' })
      place(page, 'text', intro, 'children', {
        text: 'Every release, what it breaks, and whether you have to do anything about it. Breaking changes are called breaking changes.',
      })
      place(page, 'badge', intro, 'children', {
        label: 'Latest — 2.4.0',
        variant: 'accent',
        dot: true,
      })
      place(page, 'timeline', root, 'children', {
        items: [
          {
            date: '2026-08',
            dateLabel: '2.4.0 · August',
            title: 'Version history and autosave',
            body: 'Ten snapshots per document, an import report that lists every repair, and eight starter templates. Nothing to migrate.',
            icon: 'file',
          },
          {
            date: '2026-06',
            dateLabel: '2.3.0 · June',
            title: 'The live CSS playground',
            body: 'Eight property sandboxes, a clip-path editor and a bezier editor, all of which send their value to the selection.',
            icon: 'zap',
          },
          {
            date: '2026-04',
            dateLabel: '2.2.0 · April',
            title: 'Export verification',
            body: 'Every target now type-checks in CI against golden files. Breaking: the HTML printer no longer emits inline scripts.',
            icon: 'export',
          },
          {
            date: '2026-02',
            dateLabel: '2.1.0 · February',
            title: 'The responsive engine',
            body: 'Six breakpoints, overrides that show their source, and a canvas that can show three frames at once.',
            icon: 'layout-grid',
          },
        ],
        orientation: 'vertical',
        marker: 'dot',
        regionLabel: 'Release history',
      })
      place(page, 'newsletter-form', root, 'children', {
        heading: 'Get the releases by email',
        description: 'One message per minor version, with the breaking changes at the top.',
      })
      place(page, 'footer', root, 'children', { showNewsletter: false })

      return templateDocument('Changelog', 'changelog', page.nodes)
    },
  },
]
