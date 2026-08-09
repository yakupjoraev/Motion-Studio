import { cva } from 'class-variance-authority'

/**
 * Every class is a literal, so Tailwind can see it and the exported project compiles — ADR-106. The
 * variant keys are the schema's enums; a value the schema allows and this map does not is a
 * `cva` fallback to the default, which the meta-test would not catch, so the two are edited together.
 */
export const sectionStyles = cva('flex w-full flex-col', {
  variants: {
    padding: {
      none: 'p-0',
      xs: 'p-2',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-10 md:p-16',
      xl: 'p-14 md:p-24',
    },
    background: {
      transparent: 'bg-transparent',
      'surface-0': 'bg-surface-0',
      'surface-1': 'bg-surface-1',
      'surface-2': 'bg-surface-2',
    },
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
    },
    minHeight: {
      auto: '',
      half: 'min-h-[50svh]',
      'three-quarters': 'min-h-[75svh]',
      screen: 'min-h-svh',
    },
  },
})

/** The inner measure. A section is full-width; what it holds is not. */
export const sectionInnerStyles = cva('flex w-full flex-col', {
  variants: {
    maxWidth: {
      sm: 'max-w-screen-sm',
      md: 'max-w-screen-md',
      lg: 'max-w-screen-lg',
      xl: 'max-w-screen-xl',
      full: 'max-w-none',
    },
    align: {
      start: 'mr-auto items-start',
      center: 'mx-auto items-center',
      end: 'ml-auto items-end',
    },
  },
})
