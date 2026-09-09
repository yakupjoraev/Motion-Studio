import { RouteLoading } from '../../../src/components/nav/route-loading'

/** ADR-388: every public route answers the press. The rail label is the surface's own coordinate. */
export default function Loading() {
  return <RouteLoading rail="playground" />
}
