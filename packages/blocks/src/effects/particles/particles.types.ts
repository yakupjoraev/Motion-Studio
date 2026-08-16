import type { z } from 'zod'

import type { particlesSchema } from './particles.schema'

export type ParticlesProps = z.infer<typeof particlesSchema>
