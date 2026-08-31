import type { Token, Tokens } from 'marked'

/**
 * `marked`'s `Token` union ends in `Tokens.Generic`, which declares `[index: string]: any` — so
 * `token.type === 'heading'` narrows nothing on its own and `in` does not either. These guards check
 * the field that makes each token what it is, which is a check rather than a cast.
 */
export const isHeading = (token: Token): token is Tokens.Heading =>
  token.type === 'heading' && typeof Reflect.get(token, 'depth') === 'number'

export const isTable = (token: Token): token is Tokens.Table =>
  token.type === 'table' && Array.isArray(Reflect.get(token, 'rows'))

export const isList = (token: Token): token is Tokens.List =>
  token.type === 'list' && Array.isArray(Reflect.get(token, 'items'))

export const isCode = (token: Token): token is Tokens.Code =>
  token.type === 'code' && typeof Reflect.get(token, 'text') === 'string'
