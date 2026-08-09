import type { StorybookConfig } from '@storybook/react-vite'

/**
 * The stories glob reaches into the packages rather than copying stories here: a story lives beside the
 * component it documents — `ENGINEERING_CONTRACT.md` § 3 — and this app is only the host.
 *
 * The paths are relative to this directory, and written with forward slashes because they are glob
 * patterns rather than paths: `node:path` on Windows produces `\`, which a glob reads as an escape and
 * silently matches nothing.
 *
 * `blocks` is in the list before it has any stories in it. The alternative is remembering to add it in
 * prompt 13, which is exactly the kind of thing nobody remembers.
 */
const config: StorybookConfig = {
  stories: [
    '../src/docs/**/*.mdx',
    // The thumbnail surface is the host's own: it renders *any* block from the registry, so it
    // belongs to neither package. `scripts/generate-thumbnails.mjs` is its only reader.
    '../src/thumbnail/*.stories.@(ts|tsx)',
    '../../../packages/ui/src/**/*.stories.@(ts|tsx)',
    '../../../packages/blocks/src/**/*.stories.@(ts|tsx)',
  ],

  // `addon-viewport` is not listed: it ships inside `addon-essentials`, and registering it twice makes
  // Storybook warn about a duplicate at every boot.
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-interactions',
    '@storybook/addon-themes',
  ],

  framework: { name: '@storybook/react-vite', options: {} },

  /**
   * `"use client"` marks a React Server Components boundary. This bundle is a browser bundle with no
   * server half, so Rollup is right that the directive does nothing here and wrong that it is worth
   * saying — once per module, across `motion` and `packages/theme`, it buries everything else in the
   * build output.
   */
  viteFinal: (vite) => ({
    ...vite,
    build: {
      ...vite.build,
      rollupOptions: {
        ...vite.build?.rollupOptions,
        onwarn: (warning, warn) => {
          if (warning.code !== 'MODULE_LEVEL_DIRECTIVE') {
            warn(warning)
          }
        },
      },
    },
  }),

  core: { disableTelemetry: true },

  docs: { defaultName: 'Docs' },

  typescript: {
    // The prop tables are built from the TypeScript types, which is what makes § Constraints'
    // "controls derived from the props type" true without an `argTypes` block per story.
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      propFilter: (prop) => !(prop.parent?.fileName ?? '').includes('node_modules'),
    },
  },
}

export default config
