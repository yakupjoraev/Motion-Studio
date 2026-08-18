import { createIcon } from './create-icon'

/** One closed path, so the crescent reads as a shape at 16 px rather than as two arcs that nearly meet. */
export const MoonIcon = createIcon(
  'MoonIcon',
  <path d="M15.6 12.2A6.7 6.7 0 0 1 7.8 4.4 6.9 6.9 0 1 0 15.6 12.2z" />,
)
