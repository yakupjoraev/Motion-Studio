/**
 * The privacy and terms pages — `prompts/69` § 2.
 *
 * The privacy page is unusually short and the page says so itself: a local-first studio with no
 * account and no backend collects close to nothing, and writing a page that implies otherwise would
 * be its own kind of dishonesty. If analytics are ever added, this file changes first.
 */
export const legal = {
  privacy: {
    metaTitle: 'Privacy · Motion Studio',
    metaDescription: 'What Motion Studio collects, which is close to nothing.',
    heading: 'Privacy',
    updated: 'Last updated 12 September 2026',
    lede: 'Motion Studio runs in your browser. There is no account, no server that stores your work, and no analytics. This page is short because there is little to describe.',
    sections: [
      {
        heading: 'What never leaves your browser',
        body: [
          'The documents you compose are held in your browser’s own storage (IndexedDB) and in the files you export. They are never uploaded, because there is nowhere to upload them to: the studio has no backend and no account system.',
          'Your preferences — panel widths, which inspector sections are open, the colour mode, the chosen language, whether the code panel is open — are kept in `localStorage` on the device you are using. They do not travel between devices, because nothing synchronises them.',
        ],
      },
      {
        heading: 'Cookies',
        body: [
          'One: `ms-locale`, which remembers the language you chose so the site does not guess again on your next visit. It holds a two-letter language code, nothing else, and it is written only when you use the language switch yourself.',
          'There are no advertising cookies, no tracking pixels and no third-party analytics.',
        ],
      },
      {
        heading: 'What the host sees',
        body: [
          'The site is served by Vercel, which keeps ordinary server logs — IP address, user agent, the URL requested, the time. That is the technical minimum any web host records in order to serve a page and defend against abuse. Those logs belong to the hosting platform and are governed by its own privacy policy.',
          'Fonts are served from this deployment rather than from a third-party font service, so loading a page does not announce your visit to anyone else.',
        ],
      },
      {
        heading: 'Your rights, practically',
        body: [
          'Because nothing is collected, there is nothing to request, correct or delete on our side. To remove everything the studio has kept about you, clear this site’s data in your browser: that erases the stored documents and every preference in one step.',
        ],
      },
      {
        heading: 'Contact',
        body: [
          'Questions about this page can go to the repository’s issue tracker, which is public.',
        ],
      },
    ],
  },
  terms: {
    metaTitle: 'Terms · Motion Studio',
    metaDescription: 'The terms of use for the hosted Motion Studio, and who owns what you export.',
    heading: 'Terms of use',
    updated: 'Last updated 12 September 2026',
    lede: 'These terms cover the hosted studio at this address. The short version: use it freely, what you export is yours, and it comes with no warranty.',
    sections: [
      {
        heading: 'What you may do',
        body: [
          'Use the studio to design interfaces, personally or commercially, without asking and without paying. No account is required and no licence key exists.',
        ],
      },
      {
        heading: 'What you export is yours',
        body: [
          'A component, a Next.js project, an HTML document, a `.motion` file or a token set that you export from the studio belongs to you. Modify it, ship it, sell it — with no attribution and no obligation to this project.',
          'This is not a courtesy, it is how the exporter works: exported files import nothing from this project, so there is nothing of ours to follow them out.',
        ],
      },
      {
        heading: 'What the licence does not cover',
        body: [
          'The studio’s own source code is proprietary. The repository is public so that it can be read, and reading it grants no licence to copy, modify, redistribute or resell it. The full terms are in the `LICENSE` file at the root of the repository.',
          'Third-party components vendored into the product keep their own licences, recorded per package alongside the code.',
        ],
      },
      {
        heading: 'No warranty',
        body: [
          'The studio is provided as is. It is a tool for producing code you are expected to read before you ship it — review the output as you would review a colleague’s pull request.',
          'Your documents live in your browser, which means an ordinary browser action — clearing site data, a private window closing, a disk failure — can take them with it. Export anything you would be sorry to lose.',
        ],
      },
      {
        heading: 'Changes and availability',
        body: [
          'This is a hosted deployment of a project under active development. Features may change, and the address may move or stop answering without notice.',
          'If these terms change, the date at the top of this page changes with them.',
        ],
      },
    ],
  },
}
