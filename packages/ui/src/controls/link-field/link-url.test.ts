import { describe, expect, it } from 'vitest'

import { hrefIssue, relIssue } from './link-url'

describe('hrefIssue', () => {
  it.each([
    'https://motion.studio',
    'http://localhost:3000/path?query=1#anchor',
    'mailto:hello@motion.studio',
    'tel:+441234567890',
    '/pricing',
    '#features',
    '?page=2',
    './relative',
  ])('accepts %s', (href) => {
    expect(hrefIssue(href)).toBeNull()
  })

  it('tolerates the whitespace a paste brings', () => {
    expect(hrefIssue('  https://motion.studio  ')).toBeNull()
  })

  it('asks for a URL when there is none', () => {
    expect(hrefIssue('')).toBe('Enter a URL.')
    expect(hrefIssue('   ')).toBe('Enter a URL.')
  })

  it.each([
    'javascript:alert(1)',
    'data:text/html,<script>',
    'blob:https://x',
    'file:///etc/passwd',
  ])('refuses %s', (href) => {
    expect(hrefIssue(href)).toMatch(/not allowed/)
  })

  it('is not fooled by the case of a refused scheme', () => {
    expect(hrefIssue('JavaScript:alert(1)')).toMatch(/not allowed/)
  })

  it('names a scheme it simply does not export', () => {
    expect(hrefIssue('ftp://files.example.com')).toBe('ftp: is not a scheme this exports.')
  })

  it('asks for a scheme when a bare host was typed', () => {
    expect(hrefIssue('motion.studio')).toMatch(/Add a scheme/)
  })

  it('asks for a host when only the scheme was typed', () => {
    expect(hrefIssue('https://')).toBe('Add a host after the scheme.')
  })
})

describe('relIssue', () => {
  it('asks for noopener on a link that opens a new tab', () => {
    expect(relIssue('_blank', [])).toMatch(/noopener/)
  })

  it('is satisfied once noopener is there', () => {
    expect(relIssue('_blank', ['noopener'])).toBeNull()
  })

  it('asks nothing of a link that stays in the tab', () => {
    expect(relIssue('_self', [])).toBeNull()
  })
})
