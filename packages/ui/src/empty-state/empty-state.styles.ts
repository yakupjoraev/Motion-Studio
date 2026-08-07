import { cva } from 'class-variance-authority'

export const emptyStateStyles = cva([
  'flex flex-col items-center justify-center gap-3 px-4 py-8 text-center',
])

export const emptyStateMessageStyles = cva(['text-balance text-foreground-muted text-xs'])

export const emptyStateActionsStyles = cva(['flex items-center gap-2'])
