import { docs } from './docs'
import { errors } from './errors'
import { gallery } from './gallery'
import { landing } from './landing'
import { nav } from './nav'
import { playground } from './playground'
import { studio } from './studio'

/**
 * The English dictionary, and — through `typeof` — the shape every other locale answers. Split by
 * surface rather than kept in one table, because a surface is what a person translating works on and
 * what a reviewer can read end to end.
 */
export const en = {
  nav,
  errors,
  landing,
  gallery,
  docs,
  studio,
  playground,
}
