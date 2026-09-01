import AxeBuilder from '@axe-core/playwright'
import { type Page, expect, test } from '@playwright/test'

/**
 * ACCESSIBILITY.md § Testing asks for a registry-wide scan: "every block — zero violations, all 62".
 * The component tests cover four categories block by block (156 assertions); this is the other side of
 * it — every block in the registry, rendered the way a visitor sees it, on its own detail page.
 *
 * Through the gallery rather than through a test renderer: `renderRegistry` types its components as
 * `ComponentType<never>`, so a sweep in Vitest needs a cast per block and ENGINEERING_CONTRACT.md § 1
 * has no room for one. The detail page renders the real block with its real defaults and a real
 * theme, which is a stronger subject anyway.
 *
 * Chrome only, and one pass: seventy-odd page loads with an axe run each is the longest test in the
 * suite, and a violation in a block is not an engine difference.
 */
test.describe('every block in the registry', () => {
  // `browserName`, not the project name: the project is called `chrome` and the engine is `chromium`.
  test.skip(({ browserName }) => browserName !== 'chromium', 'one engine is enough for a sweep')

  test('renders with no axe violations on its own page', async ({ page }, info) => {
    test.setTimeout(600_000)

    await page.goto('/blocks')
    await page.getByRole('heading', { level: 1 }).first().waitFor()

    const slugs = await page.evaluate(() =>
      [...document.querySelectorAll('[data-block-card]')]
        .map((card) => card.getAttribute('data-block-card'))
        .filter((slug): slug is string => slug !== null),
    )

    expect(slugs.length).toBeGreaterThanOrEqual(62)

    const scan = async (target: Page) =>
      new AxeBuilder({ page: target })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()

    const broken: string[] = []

    for (const slug of slugs) {
      await page.goto(`/blocks/${slug}`)
      await page.getByTestId('block-controls').waitFor()
      await page.waitForTimeout(250)

      const { violations } = await scan(page)

      if (violations.length > 0) {
        broken.push(
          `${slug}: ${violations.map((violation) => `${violation.id} (${violation.nodes.length})`).join(', ')}`,
        )
      }
    }

    const line = `${slugs.length} blocks scanned, ${broken.length} with violations`

    info.annotations.push({ type: 'measurement', description: line })
    console.log(`  ${line}`)

    expect(broken, broken.join('\n')).toEqual([])
  })
})
