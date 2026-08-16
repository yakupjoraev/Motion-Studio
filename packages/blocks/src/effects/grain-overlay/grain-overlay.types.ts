import type { z } from 'zod'

import type { grainOverlaySchema } from './grain-overlay.schema'

export type GrainOverlayProps = z.infer<typeof grainOverlaySchema>
