import { RouteLoading } from '../../../../src/components/nav/route-loading'

/** ADR-388. One block's page: a preview, its controls and its source, so two rows of frame. */
export default function Loading() {
  return <RouteLoading rail="block" rows={2} />
}
