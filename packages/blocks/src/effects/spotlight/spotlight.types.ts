import type { z } from 'zod'

import type { spotlightSchema } from './spotlight.schema'

export type SpotlightProps = z.infer<typeof spotlightSchema>
