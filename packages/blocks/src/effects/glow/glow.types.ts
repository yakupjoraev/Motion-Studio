import type { z } from 'zod'

import type { glowSchema } from './glow.schema'

export type GlowProps = z.infer<typeof glowSchema>
