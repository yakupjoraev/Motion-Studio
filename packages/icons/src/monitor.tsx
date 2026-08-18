import { createIcon } from './create-icon'

/** The glyph for "whatever the system says", which is why it is a screen and not a third weather symbol. */
export const MonitorIcon = createIcon(
  'MonitorIcon',
  <>
    <path d="M3 4.2h14v9H3z" />
    <path d="M7.4 16.8h5.2M10 13.2v3.6" />
  </>,
)
