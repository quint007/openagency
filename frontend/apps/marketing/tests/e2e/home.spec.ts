import { expect, test, type Page } from '@playwright/test'

import { homepageContent } from '../../src/app/homepage-content'

const desktopViewport = { width: 1280, height: 900 }
const mobileViewport = { width: 390, height: 844 }

const expectedSectionOrder = [
  { id: homepageContent.hero.sectionId, name: homepageContent.hero.title },
  { id: 'solutions', name: homepageContent.trustBar.ariaLabel },
  { id: 'start-here', name: homepageContent.startHere.title },
  { id: 'latest-guides', name: homepageContent.latestGuides.title },
  { id: 'awesome-lists', name: homepageContent.awesomeLists.title },
  { id: 'tools-teaser', name: homepageContent.toolsTeaser.title },
  { id: 'newsletter', name: homepageContent.newsletter.title },
] as const

async function gotoHomepage(page: Page, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport)
  await page.goto('/')
  await page.waitForLoadState('networkidle')
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

  const startHereSection = page.getByRole('region', { name: homepageContent.startHere.title })
  const startHereCards = startHereSection.getByRole('listitem')
  await expect(startHereSection.getByText(homepageContent.startHere.description)).toBeVisible()
  await expect(startHereCards).toHaveCount(homepageContent.startHere.cards.length)
  for (const [index, card] of homepageContent.startHere.cards.entries()) {
    const renderedCard = startHereCards.nth(index)

    await expect(renderedCard.getByText(card.label, { exact: true })).toBeVisible()
    await expect(renderedCard.getByRole('heading', { name: card.title, level: 3 })).toBeVisible()
    await expect(renderedCard.getByText(card.body)).toBeVisible()
    await expect(renderedCard.getByRole('button', { name: card.cta.label })).toHaveAttribute(
      'href',
      card.cta.href,
    )
  }

  const latestGuidesSection = page.getByRole('region', { name: homepageContent.latestGuides.title })
  await expect(latestGuidesSection).toBeVisible()
  await expect(latestGuidesSection.getByText(homepageContent.latestGuides.description)).toBeVisible()
  await expect(
    latestGuidesSection.getByRole('button', { name: homepageContent.latestGuides.cta.label }),
  ).toHaveAttribute('href', homepageContent.latestGuides.cta.href)

  // Latest-guides empty/error fallbacks stay in Vitest because the homepage does not expose a
  // stable browser-level mock/test hook for forcing those server-rendered branches deterministically.
  const awesomeListsSection = page.getByRole('region', { name: homepageContent.awesomeLists.title })
  await expect(awesomeListsSection.getByText(homepageContent.awesomeLists.description)).toBeVisible()
  await expect(awesomeListsSection.getByRole('listitem')).toHaveCount(
    homepageContent.awesomeLists.previews.length,
  )
  for (const preview of homepageContent.awesomeLists.previews) {
    await expect(awesomeListsSection.getByRole('link', { name: preview.label })).toHaveAttribute(
      'href',
      preview.href,
    )
    await expect(awesomeListsSection.getByText(preview.description)).toBeVisible()
  }

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
}

test('marketing homepage covers full desktop layout and primary navigation', async ({ page }) => {
  await gotoHomepage(page, desktopViewport)

  await expect(page.getByRole('banner')).toBeVisible()
  await expectHomepageSections(page)
  await expectFooterGrouping(page)

  const desktopNav = page.getByRole('navigation', {
    name: homepageContent.header.navigationLabel,
  })
  const desktopHeaderCta = page.locator('header').getByRole('button', {
    name: homepageContent.header.primaryCta.label,
  }).first()
  const mobileMenuToggle = page.locator('summary', { hasText: homepageContent.header.menuLabel })

  await expect(desktopNav).toBeVisible()
  for (const item of homepageContent.header.links) {
    await expect(desktopNav.getByRole('link', { name: item.label })).toHaveAttribute('href', item.href)
  }
  await expect(desktopHeaderCta).toBeVisible()
  await expect(desktopHeaderCta).toHaveAttribute('href', homepageContent.header.primaryCta.href)
  await expect(mobileMenuToggle).not.toBeVisible()
})

test('marketing homepage covers mobile layout and menu navigation', async ({ page }) => {
  await gotoHomepage(page, mobileViewport)

  await expect(page.getByRole('banner')).toBeVisible()
  await expectHomepageSections(page)
  await expectFooterGrouping(page)

  const desktopNav = page.getByRole('navigation', {
    name: homepageContent.header.navigationLabel,
  })
  const mobileMenu = page.locator('details').filter({ has: page.locator('summary') })
  const mobileMenuToggle = page.locator('summary', { hasText: homepageContent.header.menuLabel })
  const mobileNav = page.getByRole('navigation', {
    name: homepageContent.header.mobileNavigationLabel,
  })

  await expect(desktopNav).not.toBeVisible()
  await expect(mobileMenuToggle).toBeVisible()
  await expect(mobileMenu).not.toHaveAttribute('open', '')

  await mobileMenuToggle.click()

  await expect(mobileMenu).toHaveAttribute('open', '')
  await expect(mobileNav).toBeVisible()
  for (const item of homepageContent.header.links) {
    await expect(mobileNav.getByRole('link', { name: item.label })).toHaveAttribute('href', item.href)
  }
  await expect(mobileNav.getByRole('button', { name: homepageContent.header.primaryCta.label })).toHaveAttribute(
    'href',
    homepageContent.header.primaryCta.href,
  )
})

test('newsletter shows inline validation errors before a deterministic local success state', async ({ page }) => {
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
  await expect(newsletterSection.getByRole('alert')).toHaveCount(0)

  await emailField.fill('hello@example.com')
  await submitButton.click()

  await expect(newsletterSection.getByText(homepageContent.newsletter.success.title)).toBeVisible()
  await expect(newsletterSection.getByText(homepageContent.newsletter.success.description)).toBeVisible()
  await expect(
    newsletterSection.getByRole('textbox', { name: homepageContent.newsletter.fieldLabel }),
  ).toHaveCount(0)
})
