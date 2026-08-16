import type { z } from 'zod'

import type { noiseOverlaySchema } from './noise-overlay.schema'

export type NoiseOverlayProps = z.infer<typeof noiseOverlaySchema>
