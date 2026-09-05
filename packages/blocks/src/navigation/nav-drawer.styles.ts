/**
 * The drawer's surface. Two blocks open it — the bar and the floating pill — so it is the category's
 * rather than either block's.
 */
export const NAV_DRAWER_TRIGGER = '@min-[768px]/frame:hidden'

export const NAV_DRAWER_OVERLAY = 'fixed inset-0 z-50 bg-surface-0/70 backdrop-blur-sm'

/**
 * A right-hand sheet rather than a full-screen takeover: the reader keeps a sliver of the page they came
 * from, which is what says this is a menu and not a navigation away.
 */
export const NAV_DRAWER = [
  'fixed inset-y-0 right-0 z-50 flex w-[min(20rem,85vw)] flex-col gap-4 overflow-y-auto',
  'border-border border-l bg-surface-1 p-4 shadow-lg',
].join(' ')

export const NAV_DRAWER_HEADER = 'flex items-center justify-between gap-4'

export const NAV_DRAWER_TITLE = 'm-0 font-semibold text-foreground text-md tracking-tight'

export const NAV_DRAWER_LIST = 'm-0 flex list-none flex-col gap-0.5 p-0'

/** A dropdown's children are indented rather than hidden: § Universal forbids hover-only disclosure. */
export const NAV_DRAWER_SUBLIST =
  'm-0 flex list-none flex-col gap-0.5 border-border border-l p-0 pl-3'

export const NAV_DRAWER_ACTIONS = 'mt-auto flex flex-col gap-2'
