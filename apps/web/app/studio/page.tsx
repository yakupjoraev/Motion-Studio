import { StudioClient } from './studio-client'

/**
 * A Server Component: the chrome is in the HTML the server sends, so the first paint is layout rather
 * than a spinner — UI_GUIDELINES.md § Loading and empty states.
 */
export default function StudioPage() {
  return <StudioClient />
}
