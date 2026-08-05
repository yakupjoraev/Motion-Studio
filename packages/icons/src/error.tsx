import { createIcon } from './create-icon'

export const ErrorIcon = createIcon(
  'ErrorIcon',
  <>
    <circle cx="10" cy="10" r="7" />
    <path d="M7.6 7.6l4.8 4.8M12.4 7.6l-4.8 4.8" />
  </>,
)
