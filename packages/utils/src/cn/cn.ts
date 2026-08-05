import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Conditional classes plus Tailwind conflict resolution, in that order: `clsx` flattens the
 * arguments, `twMerge` then drops earlier utilities that the later ones override. Without the second
 * step `cn('p-2', 'p-4')` would emit both and the winner would depend on stylesheet order.
 *
 * `CODE_STANDARDS.md` § Tailwind requires this instead of template-string concatenation.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
