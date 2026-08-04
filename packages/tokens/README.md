# @motion-studio/tokens

The design tokens — colour ramps, spacing, radii, typography, elevation, motion scale — as typed
objects, and the generator that turns them into the `@theme` block and the `--ms-*` CSS variables.

Single source of truth: Tailwind utilities and runtime theming both read from here, so they
cannot drift apart.
