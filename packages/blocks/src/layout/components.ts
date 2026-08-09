import { Columns } from './columns/columns'
import { Container } from './container/container'
import { Divider } from './divider/divider'
import { Grid } from './grid/grid'
import { Section } from './section/section'
import { Spacer } from './spacer/spacer'
import { Stack } from './stack/stack'

export const components = {
  section: Section,
  container: Container,
  stack: Stack,
  grid: Grid,
  columns: Columns,
  spacer: Spacer,
  divider: Divider,
} as const
