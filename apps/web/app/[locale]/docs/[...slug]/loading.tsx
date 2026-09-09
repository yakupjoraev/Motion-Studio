import { RouteLoading } from '../../../../src/components/nav/route-loading'

/** ADR-388. A document is one column of prose, so one row of frame under the heading. */
export default function Loading() {
  return <RouteLoading rail="docs" rows={1} />
}
