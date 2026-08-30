/**
 * The exact size of the stage it stands in, which is what `prompts/52` § Performance asks of a heavy
 * block's placeholder. It fills its parent rather than declaring a height of its own: the stage
 * already has one, and a skeleton that measures itself is a second opinion about the same box.
 */
export function PreviewSkeleton() {
  return <div className="h-full w-full animate-pulse bg-surface-1" data-testid="preview-skeleton" />
}
