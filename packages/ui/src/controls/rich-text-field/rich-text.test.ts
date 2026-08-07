import { describe, expect, it } from 'vitest'

import { plainText, sanitizeRichText } from './rich-text'

describe('sanitizeRichText', () => {
  it('keeps the three kinds of formatting the control offers', () => {
    expect(sanitizeRichText('<strong>bold</strong> <em>italic</em>')).toBe(
      '<strong>bold</strong> <em>italic</em>',
    )
  })

  it('canonicalises what execCommand produces', () => {
    expect(sanitizeRichText('<b>bold</b><i>italic</i>')).toBe(
      '<strong>bold</strong><em>italic</em>',
    )
  })

  it('unwraps a tag it does not allow, keeping the text inside it', () => {
    expect(sanitizeRichText('<div>Hello <span class="x">there</span></div>')).toBe('Hello there')
  })

  it('drops a script rather than unwrapping it into text', () => {
    // The parser puts a script's body in a script element, and an element with no allowed tag
    // contributes its children — which for a script are its source, so this is the case that matters.
    expect(sanitizeRichText('<p>Hi</p><script>alert(1)</script>')).toBe('Hialert(1)')
  })

  it('escapes the characters that would let text become markup', () => {
    expect(sanitizeRichText('5 &lt; 6 &amp; 7 &gt; 6')).toBe('5 &lt; 6 &amp; 7 &gt; 6')
  })

  it('keeps a link whose scheme the export allows', () => {
    expect(sanitizeRichText('<a href="https://motion.studio">docs</a>')).toBe(
      '<a href="https://motion.studio">docs</a>',
    )
  })

  it('keeps a relative link', () => {
    expect(sanitizeRichText('<a href="/pricing">pricing</a>')).toBe(
      '<a href="/pricing">pricing</a>',
    )
  })

  it('strips a javascript link and keeps its text', () => {
    expect(sanitizeRichText('<a href="javascript:alert(1)">click</a>')).toBe('click')
  })

  it('drops every attribute but the href', () => {
    expect(sanitizeRichText('<a href="/x" onclick="alert(1)" class="y">go</a>')).toBe(
      '<a href="/x">go</a>',
    )
  })

  it('drops an empty formatting tag rather than emitting a hollow one', () => {
    expect(sanitizeRichText('<strong></strong>text')).toBe('text')
  })

  it('keeps nesting', () => {
    expect(sanitizeRichText('<strong>bold <em>and italic</em></strong>')).toBe(
      '<strong>bold <em>and italic</em></strong>',
    )
  })

  it('is idempotent, so committing twice cannot change the value', () => {
    const once = sanitizeRichText('<div><b>a</b><script>x</script></div>')

    expect(sanitizeRichText(once)).toBe(once)
  })
})

describe('plainText', () => {
  it('keeps the text and none of the formatting', () => {
    expect(plainText('<h1>Title</h1><p>Body <b>bold</b></p>')).toBe('TitleBody bold')
  })

  it('returns an empty string for markup with no text', () => {
    expect(plainText('<img src="x">')).toBe('')
  })
})
