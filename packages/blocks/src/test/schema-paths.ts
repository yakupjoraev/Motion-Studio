import {
  ZodArray,
  ZodDefault,
  ZodEffects,
  ZodNullable,
  ZodObject,
  ZodOptional,
  type ZodType,
} from 'zod'

/**
 * ADR-103's second half: the compiler checks a control path down to three levels of objects, and this
 * checks every path there is, including the ones with an index in them. It walks the schema rather
 * than a parsed value, so an optional branch nobody filled in is still a real path.
 */
const unwrap = (schema: ZodType): ZodType => {
  let current: ZodType = schema

  for (;;) {
    if (current instanceof ZodDefault) {
      current = current.removeDefault() as ZodType

      continue
    }

    if (current instanceof ZodOptional || current instanceof ZodNullable) {
      current = current.unwrap() as ZodType

      continue
    }

    if (current instanceof ZodEffects) {
      current = current.innerType() as ZodType

      continue
    }

    return current
  }
}

const SEGMENT = /^([A-Za-z0-9_$]+)((?:\[\d+\])*)$/

export function schemaHasPath(schema: ZodType, path: string): boolean {
  let current = unwrap(schema)

  for (const segment of path.split('.')) {
    const match = SEGMENT.exec(segment)

    if (match === null) {
      return false
    }

    const [, key = '', indices = ''] = match

    if (!(current instanceof ZodObject)) {
      return false
    }

    const next = (current.shape as Record<string, ZodType | undefined>)[key]

    if (next === undefined) {
      return false
    }

    current = unwrap(next)

    for (let index = 0; index < indices.split('[').length - 1; index += 1) {
      if (!(current instanceof ZodArray)) {
        return false
      }

      current = unwrap(current.element as ZodType)
    }
  }

  return true
}
