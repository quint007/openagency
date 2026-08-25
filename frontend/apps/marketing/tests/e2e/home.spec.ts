import { expect, test, type Page } from '@playwright/test'

import { homepageContent } from '../../src/app/homepage-content'

const desktopViewport = { width: 1280, height: 900 }
const tabletViewport = { width: 768, height: 900 }
const mobileViewport = { width: 375, height: 844 }
const compactMobileViewport = { width: 375, height: 812 }
const feedbackViewports = [compactMobileViewport, mobileViewport, tabletViewport, desktopViewport] as const

const expectedSectionOrder = [
  { id: homepageContent.hero.sectionId, name: homepageContent.hero.title },
  { id: 'solutions', name: homepageContent.trustBar.ariaLabel },
  { id: 'latest-guides', name: homepageContent.latestGuides.title },
  { id: 'tools-teaser', name: homepageContent.toolsTeaser.title },
  { id: 'newsletter', name: homepageContent.newsletter.title },
] as const

async function gotoHomepage(page: Page, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport)
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  const essentialOnlyButton = page.getByRole('button', { name: 'Essential only' })
  if (await essentialOnlyButton.isVisible()) {
    await essentialOnlyButton.click()
  }
}

async function expectHomepageSections(page: Page) {
  const main = page.locator('main')

  await expect(main).toBeVisible()
  await expect(
    page.getByRole('heading', {
      name: homepageContent.hero.title,
    }),
  ).toBeVisible()
  await expect(page.getByText(homepageContent.hero.body)).toBeVisible()
  await expect(page.getByText(homepageContent.hero.supportingLine)).toBeVisible()
  await expect(page.getByRole('button', { name: homepageContent.hero.primaryCta.label })).toHaveAttribute(
    'href',
    homepageContent.hero.primaryCta.href,
  )
  await expect(page.getByRole('button', { name: homepageContent.hero.secondaryCta.label })).toHaveAttribute(
    'href',
    homepageContent.hero.secondaryCta.href,
  )

  const renderedSections = await main.locator(':scope > section').evaluateAll((elements) =>
    elements.map((element) => {
      const labelledBy = element.getAttribute('aria-labelledby')
      const labelElement = labelledBy ? document.getElementById(labelledBy) : null

      return {
        id: element.id,
        name: labelElement?.textContent?.trim() ?? element.getAttribute('aria-label') ?? '',
      }
    }),
  )

  expect(renderedSections).toEqual(expectedSectionOrder)

  const trustBarSection = page.getByRole('region', { name: homepageContent.trustBar.ariaLabel })
  const proofPoints = trustBarSection.getByRole('list', { name: homepageContent.trustBar.ariaLabel })
  await expect(trustBarSection).toBeVisible()
  for (const statement of homepageContent.trustBar.statements) {
    await expect(proofPoints.getByText(statement)).toBeVisible()
  }

  const latestGuidesSection = page.getByRole('region', { name: homepageContent.latestGuides.title })
  await expect(latestGuidesSection).toBeVisible()
  await expect(latestGuidesSection.getByText(homepageContent.latestGuides.description)).toBeVisible()
  await expect(
    latestGuidesSection.getByRole('button', { name: homepageContent.latestGuides.cta.label }),
  ).toHaveAttribute('href', homepageContent.latestGuides.cta.href)

  const toolsSection = page.getByRole('region', { name: homepageContent.toolsTeaser.title })
  await expect(toolsSection.getByText(homepageContent.toolsTeaser.description)).toBeVisible()
  await expect(toolsSection.getByRole('listitem')).toHaveCount(homepageContent.toolsTeaser.cards.length)
  for (const card of homepageContent.toolsTeaser.cards) {
    await expect(toolsSection.getByRole('link', { name: card.label })).toHaveAttribute('href', card.href)
    await expect(toolsSection.getByText(card.description)).toBeVisible()
  }

  const newsletterSection = page.getByRole('region', { name: homepageContent.newsletter.title })
  await expect(newsletterSection).toBeVisible()
  await expect(newsletterSection.getByText(homepageContent.newsletter.description)).toBeVisible()
  await expect(
    newsletterSection.getByRole('textbox', { name: homepageContent.newsletter.fieldLabel }),
  ).toBeVisible()
  await expect(newsletterSection.getByText(homepageContent.newsletter.privacyNote)).toBeVisible()
  await expect(
    newsletterSection.getByRole('button', { name: homepageContent.newsletter.submitLabel }),
  ).toBeVisible()
}

async function expectFooterGrouping(page: Page) {
  const footer = page.locator('footer')
  const renderedColumns = await footer.locator(':scope section').evaluateAll((elements) =>
    elements.map((element) => element.querySelector('h2')?.textContent?.trim() ?? ''),
  )

  await expect(footer).toBeVisible()
  await expect(footer.getByText(homepageContent.footer.description)).toBeVisible()
  expect(renderedColumns).toEqual(homepageContent.footer.columns.map((column) => column.title))

  for (const column of homepageContent.footer.columns) {
    await expect(footer.getByRole('heading', { name: column.title })).toBeVisible()

    for (const link of column.links) {
      await expect(footer.getByRole('link', { name: link.label })).toHaveAttribute('href', link.href)
    }
  }

  await expect(footer.getByText(homepageContent.footer.copyright)).toBeVisible()
  await expect(footer.getByRole('button', { name: 'Share feedback' })).toHaveCount(0)
}

async function expectSingleFeedbackTrigger(page: Page) {
  const feedbackButton = page.getByRole('button', { name: 'Share feedback' })

  await expect(feedbackButton).toHaveCount(1)
  await expect(feedbackButton).toBeVisible()
  await feedbackButton.click()
  const feedbackDialog = page.getByRole('dialog', { name: 'What should we improve?' })
  await expect(feedbackDialog).toBeVisible()
  await feedbackDialog.getByRole('button', { name: 'Close feedback form' }).click()
  await expect(page.getByRole('dialog', { name: 'What should we improve?' })).toHaveCount(0)
}

async function getFeedbackGeometry(page: Page) {
  return page.evaluate(() => {
    const feedbackButton = document.querySelector<HTMLElement>('button[aria-label="Share feedback"]')

    if (!feedbackButton) {
      throw new Error('Expected the feedback trigger')
    }

    const viewport = { height: window.innerHeight, width: window.innerWidth }
    const feedbackRect = feedbackButton.getBoundingClientRect()
    const cookieOverlay = document.querySelector<HTMLElement>('[data-cookie-banner], [data-cookie-settings]')
    const intersects = (first: DOMRect, second: DOMRect) =>
      first.left < second.right && first.right > second.left && first.top < second.bottom && first.bottom > second.top
    const isVisible = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect()
      const styles = window.getComputedStyle(element)

      return styles.display !== 'none' && styles.visibility !== 'hidden' && styles.pointerEvents !== 'none' &&
        rect.bottom > 0 && rect.top < viewport.height && rect.right > 0 && rect.left < viewport.width
    }
    const blockers = Array.from(document.querySelectorAll<HTMLElement>(
      'header, #marketing-mobile-menu, [data-cookie-banner], [data-cookie-settings], main a, main button, main h1, main h2, main h3, main li, main p, footer [aria-label="Open Agency"], footer a, footer button, footer h2, footer p',
    ))
      .filter((element) => element !== feedbackButton && isVisible(element))
      .filter((element) => intersects(feedbackRect, element.getBoundingClientRect()))
      .map((element) => {
        const rect = element.getBoundingClientRect()

        return {
          bottom: rect.bottom,
          left: rect.left,
          name: element.getAttribute('aria-label') ?? element.textContent?.trim() ?? element.tagName,
          right: rect.right,
          top: rect.top,
        }
      })
    const hitTarget = document.elementFromPoint(
      feedbackRect.left + feedbackRect.width / 2,
      feedbackRect.top + feedbackRect.height / 2,
    )

    return {
      blockers,
      computedBottom: window.getComputedStyle(feedbackButton).bottom,
      feedbackHeight: feedbackRect.height,
      feedback: {
        bottom: feedbackRect.bottom,
        left: feedbackRect.left,
        right: feedbackRect.right,
        top: feedbackRect.top,
      },
      hitTarget: hitTarget?.getAttribute('aria-label') ?? hitTarget?.textContent?.trim() ?? hitTarget?.tagName ?? null,
      hitTargetIsFeedback: hitTarget === feedbackButton || feedbackButton.contains(hitTarget),
      cookieOverlay: cookieOverlay
        ? (() => {
            const rect = cookieOverlay.getBoundingClientRect()

            return { bottom: rect.bottom, top: rect.top, height: rect.height }
          })()
        : null,
      viewport,
    }
  })
}

async function expectActionableFeedbackGeometry(page: Page) {
  await expect.poll(
    async () => {
      const geometry = await getFeedbackGeometry(page)

      return geometry.feedback.left > 0 && geometry.feedback.top > 0 &&
        geometry.feedback.right < geometry.viewport.width && geometry.feedback.bottom < geometry.viewport.height &&
        geometry.blockers.length === 0 && geometry.hitTargetIsFeedback
    },
    { timeout: 5000 },
  ).toBe(true)

  const geometry = await getFeedbackGeometry(page)

  expect(geometry.feedback.left).toBeGreaterThan(0)
  expect(geometry.feedback.top).toBeGreaterThan(0)
  expect(geometry.feedback.right).toBeLessThan(geometry.viewport.width)
  expect(geometry.feedback.bottom).toBeLessThan(geometry.viewport.height)
  expect(geometry.blockers, JSON.stringify(geometry)).toEqual([])
  expect(geometry.hitTargetIsFeedback, JSON.stringify(geometry)).toBe(true)
}

async function scrollAndSettle(page: Page, position: number) {
  await page.evaluate((scrollTop) => {
    window.scrollTo(0, scrollTop)
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })
  }, position)
}

test('marketing homepage covers full desktop layout and primary navigation', async ({ page }) => {
  await gotoHomepage(page, desktopViewport)

  await expect(page.getByRole('banner')).toBeVisible()
  await expectHomepageSections(page)
  await expectFooterGrouping(page)
  await expectSingleFeedbackTrigger(page)

  const desktopNav = page.getByRole('navigation', {
    name: homepageContent.header.navigationLabel,
  })
  const desktopHeaderCta = page.locator('header').getByRole('button', {
    name: homepageContent.header.primaryCta.label,
  }).first()
  const mobileMenuToggle = page.getByRole('button', { name: homepageContent.header.menuLabel })

  await expect(desktopNav).toBeVisible()
  await expect(desktopNav.getByRole('link')).toHaveCount(homepageContent.header.links.length)
  for (const item of homepageContent.header.links) {
    await expect(desktopNav.getByRole('link', { name: item.label })).toHaveAttribute('href', item.href)
  }
  await expect(desktopHeaderCta).toBeVisible()
  await expect(desktopHeaderCta).toHaveAttribute('href', homepageContent.header.primaryCta.href)
  await desktopHeaderCta.focus()
  await expect(desktopHeaderCta).toBeFocused()
  await expect(mobileMenuToggle).not.toBeVisible()
})

test('first visit keeps the mobile hero usable while consent is open', async ({ page }) => {
  await page.setViewportSize(mobileViewport)
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  const consentBanner = page.locator('[data-cookie-banner]')
  const heroHeading = page.locator('#homepage-hero-title')
  const feedbackButton = page.locator('button[aria-label="Share feedback"]')

  await expect(consentBanner).toBeVisible()
  await expect(page.getByRole('button', { name: 'Accept all' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Essential only' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Manage preferences' })).toBeVisible()
  await expect(feedbackButton).toBeHidden()

  const [banner, heading, viewport] = await Promise.all([
    consentBanner.evaluate((element) => {
      const rect = element.getBoundingClientRect()
      return {
        bottom: rect.bottom,
        height: rect.height,
        left: rect.left,
        right: rect.right,
        top: rect.top,
      }
    }),
    heroHeading.evaluate((element) => {
      const rect = element.getBoundingClientRect()
      return {
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        top: rect.top,
      }
    }),
    page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      height: window.innerHeight,
      width: window.innerWidth,
    })),
  ])

  expect(viewport.documentWidth).toBeLessThanOrEqual(viewport.width)
  expect(banner.height).toBeLessThan(viewport.height * 0.5)
  expect(banner.left).toBeGreaterThanOrEqual(0)
  expect(banner.right).toBeLessThanOrEqual(viewport.width)
  expect(banner.bottom).toBeLessThanOrEqual(viewport.height)
  expect(heading.top).toBeGreaterThanOrEqual(0)
  expect(heading.bottom).toBeLessThanOrEqual(viewport.height)
  expect(heading.bottom).toBeLessThanOrEqual(banner.top)
})

test('marketing homepage covers mobile layout and menu navigation', async ({ page }) => {
  await gotoHomepage(page, mobileViewport)

  await expect(page.getByRole('banner')).toBeVisible()
  await expectHomepageSections(page)
  await expectFooterGrouping(page)
  await page.evaluate(() => window.scrollTo(0, 0))

  const desktopNav = page.getByRole('navigation', {
    name: homepageContent.header.navigationLabel,
  })
  const mobileMenuToggle = page.getByRole('button', { name: homepageContent.header.menuLabel })
  const mobileNav = page.getByRole('navigation', {
    name: homepageContent.header.mobileNavigationLabel,
  })

  await expect(desktopNav).not.toBeVisible()
  await expect(mobileMenuToggle).toBeVisible()
  await expect(mobileMenuToggle).toHaveAttribute('aria-expanded', 'false')
  await mobileMenuToggle.focus()
  await expect(mobileMenuToggle).toBeFocused()
  await page.evaluate(() => window.scrollTo(0, 0))

  await mobileMenuToggle.click()

  await expect(page.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator('body')).toHaveAttribute('data-mobile-menu-open', 'true')
  await expect(mobileNav).toBeVisible()
  for (const item of homepageContent.header.links) {
    await expect(mobileNav.getByRole('link', { name: item.label })).toHaveAttribute('href', item.href)
  }
  await expect(page.locator('header').getByRole('button', { name: homepageContent.header.primaryCta.label })).toHaveAttribute(
    'href',
    homepageContent.header.primaryCta.href,
  )
  const mobileHeaderCta = page.locator('header').getByRole('button', {
    name: homepageContent.header.primaryCta.label,
  })
  await mobileHeaderCta.focus()
  await expect(mobileHeaderCta).toBeFocused()
  await page.getByRole('button', { name: 'Close menu' }).focus()
  await expect(page.getByRole('button', { name: 'Close menu' })).toBeFocused()

  const cookieSettings = page.locator('[data-cookie-settings]')
  await expect(cookieSettings).toBeHidden()
  await page.getByRole('button', { name: 'Close menu' }).click()
  await expect(page.locator('body')).not.toHaveAttribute('data-mobile-menu-open')
  await expect(cookieSettings).toBeVisible()
  await page.evaluate(() => window.scrollTo(0, 0))
  await expectSingleFeedbackTrigger(page)

  const actionIntersections = await page.evaluate(() => {
    const cookieSettingsElement = document.querySelector<HTMLElement>('[data-cookie-settings]')
    if (!cookieSettingsElement) {
      throw new Error('Expected cookie settings trigger')
    }

    const cookieRect = cookieSettingsElement.getBoundingClientRect()
    const viewport = { height: window.innerHeight, width: window.innerWidth }
    const intersects = (first: DOMRect, second: DOMRect) =>
      first.left < second.right && first.right > second.left && first.top < second.bottom && first.bottom > second.top

    const actions = Array.from(document.querySelectorAll<HTMLElement>('a, button'))
      .filter((element) => element !== cookieSettingsElement)
      .map((element) => ({
        element,
        name: element.getAttribute('aria-label') ?? element.textContent?.trim() ?? '',
        rect: element.getBoundingClientRect(),
      }))
      .filter(({ element, rect }) => {
        const styles = window.getComputedStyle(element)
        return styles.visibility !== 'hidden' && styles.display !== 'none' && rect.bottom > 0 && rect.top < viewport.height
      })
      .filter(({ rect }) => intersects(cookieRect, rect))
      .map(({ name, rect }) => ({
        bottom: rect.bottom,
        left: rect.left,
        name,
        right: rect.right,
        top: rect.top,
      }))

    return {
      cookieSettings: {
        bottom: cookieRect.bottom,
        left: cookieRect.left,
        right: cookieRect.right,
        top: cookieRect.top,
      },
      intersections: actions,
    }
  })

  expect(actionIntersections.intersections).toEqual([])
  await cookieSettings.click()
  await expect(page.getByRole('dialog', { name: 'Manage your preferences' })).toBeVisible()
  await page.getByRole('button', { name: 'Cancel' }).click()

  await expect(page.getByRole('button', { name: homepageContent.header.menuLabel })).toHaveAttribute(
    'aria-expanded',
    'false',
  )
})

test('feedback trigger stays actionable across consent, menu, and viewport states', async ({ page }) => {
  for (const viewport of feedbackViewports) {
    await page.setViewportSize(viewport)
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForLoadState('networkidle')

    const feedbackButton = page.getByRole('button', { name: 'Share feedback' })
    const isMobile = viewport.width < 640

    if (isMobile) {
      await expect(feedbackButton).toBeHidden()
    } else {
      await expect(feedbackButton).toBeVisible()
      await expectActionableFeedbackGeometry(page)
    }

    await page.getByRole('button', { name: 'Essential only' }).click()
    await expect(feedbackButton).toBeVisible()
    await expectActionableFeedbackGeometry(page)

    await feedbackButton.focus()
    await expect(feedbackButton).toBeFocused()
    await feedbackButton.press('Enter')
    const feedbackDialog = page.getByRole('dialog', { name: 'What should we improve?' })
    await expect(feedbackDialog).toBeVisible()
    await expect(feedbackDialog.getByRole('combobox', { name: 'Category' })).toBeFocused()
    await feedbackDialog.getByRole('button', { name: 'Close feedback form' }).click()
    await expect(feedbackDialog).toHaveCount(0)
    await expect(feedbackButton).toBeFocused()

    await feedbackButton.press('Space')
    await expect(feedbackDialog).toBeVisible()
    await feedbackDialog.getByRole('button', { name: 'Close feedback form' }).click()
    await expect(feedbackDialog).toHaveCount(0)

    if (viewport.width < 1024) {
      const menuToggle = page.getByRole('button', { name: homepageContent.header.menuLabel })
      await menuToggle.click()
      await expect(page.locator('#marketing-mobile-menu')).toBeVisible()
      await expect(feedbackButton).toBeHidden()
      await page.getByRole('button', { name: 'Close menu' }).click()
      await expect(page.locator('#marketing-mobile-menu')).toHaveCount(0)
      await expect(feedbackButton).toBeVisible()
      await expectActionableFeedbackGeometry(page)
    }
  }
})

test('feedback trigger stays actionable while scrolling the full homepage', async ({ page }) => {
  for (const viewport of feedbackViewports) {
    await page.setViewportSize(viewport)
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Essential only' }).click()

    const scrollPositions = await page.evaluate(() => {
      const maximumScroll = document.documentElement.scrollHeight - window.innerHeight

      return [0, 500, Math.round(maximumScroll / 2), maximumScroll]
        .filter((position, index, positions) => position >= 0 && positions.indexOf(position) === index)
    })

    for (const scrollPosition of scrollPositions) {
      await scrollAndSettle(page, scrollPosition)
      await expectActionableFeedbackGeometry(page)
    }
  }
})

test('feedback trigger stays clear of footer copy on mobile unsubscribe errors', async ({ page }) => {
  await page.setViewportSize(mobileViewport)
  await page.goto('/newsletter/unsubscribe?token=bad')
  await page.waitForLoadState('networkidle')

  const essentialOnlyButton = page.getByRole('button', { name: 'Essential only' })
  if (await essentialOnlyButton.isVisible()) {
    await essentialOnlyButton.click()
  }

  await expect(page.getByRole('heading', { name: 'We could not verify this link.' })).toBeVisible()
  await expectActionableFeedbackGeometry(page)
})

test('feedback trigger stays clear of footer headings on tablet unsubscribe errors', async ({ page }) => {
  await page.setViewportSize(tabletViewport)
  await page.goto('/newsletter/unsubscribe?token=bad')
  await page.waitForLoadState('networkidle')

  const essentialOnlyButton = page.getByRole('button', { name: 'Essential only' })
  if (await essentialOnlyButton.isVisible()) {
    await essentialOnlyButton.click()
  }

  await expect(page.getByRole('heading', { name: 'We could not verify this link.' })).toBeVisible()
  await expectActionableFeedbackGeometry(page)
})

test('newsletter repeats an identical error after editing and resubmitting', async ({ page }) => {
  await gotoHomepage(page, desktopViewport)

  const newsletterSection = page.getByRole('region', { name: homepageContent.newsletter.title })
  const emailField = newsletterSection.getByRole('textbox', { name: homepageContent.newsletter.fieldLabel })
  const submitButton = newsletterSection.getByRole('button', { name: homepageContent.newsletter.submitLabel })

  await emailField.fill('first@example')
  await submitButton.click()
  await expect(newsletterSection.getByRole('alert')).toContainText(homepageContent.newsletter.errors.invalid.title)

  await emailField.fill('second@example')
  await expect(newsletterSection.getByRole('alert')).toHaveCount(0)
  await submitButton.click()
  await expect(newsletterSection.getByRole('alert')).toContainText(homepageContent.newsletter.errors.invalid.title)
})

test('homepage internal links stay on healthy live journeys', async ({ page }) => {
  await gotoHomepage(page, desktopViewport)

  const internalHrefs = await page.locator('header a[href^="/"], main a[href^="/"], footer a[href^="/"]').evaluateAll((links) =>
    Array.from(new Set(links.map((link) => link.getAttribute('href')).filter((href): href is string => Boolean(href)))),
  )

  expect(internalHrefs.length).toBeGreaterThan(0)

  for (const href of internalHrefs) {
    const response = await page.request.get(new URL(href, page.url()).toString())
    expect(response.status(), `${href} returned HTTP ${response.status()}`).toBeLessThan(400)

    const body = await response.text()
    expect(body, `${href} exposes a retired placeholder`).not.toMatch(/coming soon/i)
    expect(body, `${href} exposes an empty published-post state`).not.toMatch(/0 published posts/i)
  }
})

test('newsletter shows inline validation errors before its configured outcome', async ({ page }) => {
  await gotoHomepage(page, desktopViewport)

  const newsletterSection = page.getByRole('region', { name: homepageContent.newsletter.title })

  await expect(newsletterSection).toHaveAttribute('data-newsletter-ready', 'true')

  const emailField = newsletterSection.getByRole('textbox', {
    name: homepageContent.newsletter.fieldLabel,
  })
  const submitButton = newsletterSection.getByRole('button', {
    name: homepageContent.newsletter.submitLabel,
  })

  await emailField.fill('not-an-email')
  await submitButton.click()

  await expect(newsletterSection.getByRole('alert')).toContainText(homepageContent.newsletter.errors.invalid.title)
  await expect(newsletterSection.getByRole('alert')).toContainText(
    homepageContent.newsletter.errors.invalid.description,
  )
  await expect(emailField).toHaveAttribute('aria-invalid', 'true')

  await newsletterSection.getByRole('button', { name: homepageContent.newsletter.retryLabel }).click()
  await emailField.fill('hello@example.com')
  await expect(newsletterSection.getByRole('alert')).toHaveCount(0)
  await submitButton.click()

  await expect(newsletterSection.getByText(homepageContent.newsletter.success.title)).toBeVisible()
  await expect(newsletterSection.getByText(homepageContent.newsletter.success.description)).toBeVisible()
  await expect(
    newsletterSection.getByRole('textbox', { name: homepageContent.newsletter.fieldLabel }),
  ).toHaveCount(0)
})
