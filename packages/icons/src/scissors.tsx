import { createIcon } from './create-icon'

export const ScissorsIcon = createIcon(
  'ScissorsIcon',
  <>
    <circle cx="6" cy="15" r="2.3" />
    <circle cx="14" cy="15" r="2.3" />
    <path d="M7.6 13.4 15 3M12.4 13.4 5 3" />
  </>,
)
