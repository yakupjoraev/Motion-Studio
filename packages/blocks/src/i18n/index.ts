import type { RegistryCopy } from './registry-copy.types'
import { ruRegistryCopy } from './ru'

export type { BlockCopy, RegistryCopy } from './registry-copy.types'
export {
  blockDescription,
  blockName,
  categoryName,
  controlHint,
  controlLabel,
} from './translate'

/**
 * The registry's strings in another language, or `undefined` for the language the definitions are
 * already written in. `undefined` rather than an identity table is the point: English costs nothing
 * and cannot drift from the definitions, because it *is* the definitions.
 *
 * **Server side.** A client component takes the table as a prop and reads it with `./translate`.
 */
export function registryCopy(locale: string): RegistryCopy | undefined {
  return locale === 'ru' ? ruRegistryCopy : undefined
}
