import type { z } from 'zod'

import type { meshGradientSchema } from './mesh-gradient.schema'

export type MeshGradientProps = z.infer<typeof meshGradientSchema>
