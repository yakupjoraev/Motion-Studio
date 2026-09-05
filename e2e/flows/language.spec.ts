import { expect, test } from '@playwright/test'

/**
 * The four behaviours prompt 65 records verbatim from the owner, as four tests:
 *
 * 1. a first-time visitor gets the language their region suggests,
 * 2. an explicit choice always wins,
 * 3. the choice survives a return visit — the guess must not undo it,
 * 4. the switch is in the header, visible, not in a menu.
 *
 * `resolve-request-locale.test.ts` proves the decision as a pure function. This file proves the
 * product: a real request, a real cookie, a real click, and the language the page is painted in.
 *
 * The geo header is the one Vercel sets (ADR-363). Locally there is nothing to set it, which is why
 * the region cases send it themselves — that is exactly what the deployment does.
 */
const RUSSIAN_HEADLINE = 'Перетащите. Настройте. Заберите код.'
const ENGLISH_HEADLINE = 'Drag it. Tune it. Take the code.'

test.describe('language', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies()
  })

  test('a first visit from a Russian-speaking region lands in Russian', async ({ browser }) => {
    const context = await browser.newContext({
      extraHTTPHeaders: { 'x-vercel-ip-country': 'RU' },
      locale: 'en-GB',
    })
    const page = await context.newPage()

    await page.goto('/')

    // A redirect, not a swap: the URL says which language this is, and the first paint is already it.
    await expect(page).toHaveURL(/\/ru$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'ru')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(RUSSIAN_HEADLINE)

    await context.close()
  })

  test('a first visit from a Russian browser lands in Russian without a geo header', async ({
    browser,
  }) => {
    const context = await browser.newContext({ locale: 'ru-RU' })
    const page = await context.newPage()

    await page.goto('/blocks')

    await expect(page).toHaveURL(/\/ru\/blocks$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'ru')

    await context.close()
  })

  test('an English visitor stays on the unprefixed URL', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'en-US' })
    const page = await context.newPage()

    await page.goto('/')

    await expect(page).toHaveURL(/localhost:\d+\/$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(ENGLISH_HEADLINE)

    await context.close()
  })

  test('the switch is in the header, and choosing a language changes the page', async ({
    browser,
  }) => {
    const context = await browser.newContext({ locale: 'en-US' })
    const page = await context.newPage()

    await page.goto('/')

    // Visible in the header itself — the fourth thing the owner specified.
    const header = page.getByRole('banner')

    await expect(header.getByTestId('locale-switch-ru')).toBeVisible()

    await header.getByTestId('locale-switch-ru').click()

    await expect(page).toHaveURL(/\/ru$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(RUSSIAN_HEADLINE)

    await context.close()
  })

  test('the choice survives a return visit, and the guess does not undo it', async ({
    browser,
  }) => {
    /*
     * The visitor the guess would fight: a Russian region *and* a Russian browser, who chose
     * English anyway. Point 3 of the specification is that the next visit still gets English.
     */
    const context = await browser.newContext({
      extraHTTPHeaders: { 'x-vercel-ip-country': 'RU' },
      locale: 'ru-RU',
    })
    const page = await context.newPage()

    await page.goto('/')
    await expect(page).toHaveURL(/\/ru$/)

    await page.getByRole('banner').getByTestId('locale-switch-en').click()
    await expect(page).toHaveURL(/localhost:\d+\/$/)

    const cookies = await context.cookies()

    expect(cookies.find((cookie) => cookie.name === 'ms-locale')?.value).toBe('en')

    // The return visit: same context, same cookie jar, same signals — a fresh navigation.
    await page.goto('/blocks')

    await expect(page).toHaveURL(/localhost:\d+\/blocks$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')

    await context.close()
  })

  /**
   * ADR-364, in the product: a block inserted in a Russian session lands with Russian text, and the
   * document holds those strings rather than a language. This is the half of the prompt that a
   * dictionary cannot cover — the copy is content, and it is written once, at insert time.
   */
  test('a block inserted in Russian lands with Russian text', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'ru-RU' })
    const page = await context.newPage()

    await page.goto('/ru/studio')
    await page.waitForSelector('[data-testid="canvas-root"]')

    await page.getByRole('tab', { name: 'Блоки' }).click()
    await page.getByRole('searchbox', { name: 'Поиск блоков' }).fill('цитата')

    const card = page.locator('[data-block-card="quote"]')

    await card.waitFor()
    await card.dblclick()

    // The block's own default copy, not the chrome around it.
    await expect(page.getByTestId('canvas-root')).toContainText('единственная проверка')

    await context.close()
  })

  test('the studio is translated, not only the marketing pages', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'ru-RU' })
    const page = await context.newPage()

    await page.goto('/ru/studio')

    await expect(page.getByRole('button', { name: 'Файл' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Правка' })).toBeVisible()
    await expect(page.getByTestId('status-selection')).toHaveText('Ничего не выделено')

    await context.close()
  })
})
