import { createIcon } from './create-icon'

export const BlurIcon = createIcon(
  'BlurIcon',
  <>
    <circle cx="10" cy="10" r="7" />
    <path d="M10 3a7 7 0 0 0 0 14" strokeDasharray="1.5 2.2" />
  </>,
)
