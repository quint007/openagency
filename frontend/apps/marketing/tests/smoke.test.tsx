import { render, screen, within } from '@testing-library/react'
import { expect, test, vi } from 'vitest'

import { homepageContent } from '../src/app/homepage-content'
import Home from '../src/app/page'

const { getBlogPostsMock } = vi.hoisted(() => ({
  getBlogPostsMock: vi.fn(),
}))

vi.mock('@open-agency/cms-client', () => ({
  getBlogPosts: getBlogPostsMock,
}))

test('marketing homepage renders the approved homepage sections and footer contracts', async () => {
  getBlogPostsMock.mockResolvedValue([
    {
      excerpt: 'A practical structure for approvals, revisions, and sign-off when AI is part of your content operation.',
      id: 101,
      publishedAt: '2026-04-01T12:00:00.000Z',
      slug: 'human-review-loops',
      title: 'Human review loops that keep AI output calm and accountable',
    },
  ])

  render(await Home())

  const main = screen.getByRole('main')
  const footer = screen.getByRole('contentinfo')
  const desktopNav = screen.getByRole('navigation', {
    name: homepageContent.header.navigationLabel,
  })
  const header = desktopNav.closest('header')

  expect(header).toBeTruthy()

  if (!header) {
    throw new Error('Expected desktop navigation to be wrapped by the homepage header')
  }

  for (const item of homepageContent.header.links) {
    expect(within(desktopNav).getByRole('link', { name: item.label }).getAttribute('href')).toBe(
      item.href,
    )
  }

  const menuToggle = within(header).getByRole('button', { name: homepageContent.header.menuLabel })
  expect(menuToggle.getAttribute('aria-expanded')).toBe('false')

  const headerCta = within(header).getByRole('button', {
    name: homepageContent.header.primaryCta.label,
  })
  expect(headerCta.tagName).toBe('A')
  expect(headerCta.getAttribute('href')).toBe(homepageContent.header.primaryCta.href)

  const heroPrimaryCta = screen.getByRole('button', { name: homepageContent.hero.primaryCta.label })
  expect(heroPrimaryCta.tagName).toBe('A')
  expect(heroPrimaryCta.getAttribute('href')).toBe(homepageContent.hero.primaryCta.href)

  const heroSecondaryCta = screen.getByRole('button', { name: homepageContent.hero.secondaryCta.label })
  expect(heroSecondaryCta.tagName).toBe('A')
  expect(heroSecondaryCta.getAttribute('href')).toBe(homepageContent.hero.secondaryCta.href)

  if (homepageContent.hero.eyebrow) {
    expect(screen.getByText(homepageContent.hero.eyebrow)).toBeTruthy()
  }

  expect(screen.getByText('Work')).toBeTruthy()
  expect(screen.getByRole('heading', { name: 'with AI — not harder with hype.' })).toBeTruthy()
  expect(screen.getByText(homepageContent.hero.body)).toBeTruthy()
  expect(screen.getByText(homepageContent.hero.supportingLine)).toBeTruthy()
  expect(screen.getByText('Open source systems')).toBeTruthy()

  const proofRow = screen.getByRole('list', { name: homepageContent.trustBar.ariaLabel })
  const proofSection = within(main).getByRole('region', { name: homepageContent.trustBar.ariaLabel })

  expect(proofSection.getAttribute('id')).toBe('solutions')

  for (const statement of homepageContent.trustBar.statements) {
    expect(within(proofRow).getByText(statement)).toBeTruthy()
  }

  const startHereSection = within(main).getByRole('region', {
    name: homepageContent.startHere.title,
  })
  const startHereCards = within(startHereSection).getAllByRole('listitem')

  expect(startHereCards).toHaveLength(homepageContent.startHere.cards.length)

  homepageContent.startHere.cards.forEach((card, index) => {
    const renderedCard = startHereCards[index]

    expect(within(renderedCard).getByText(card.label)).toBeTruthy()
    expect(within(renderedCard).getByRole('heading', { name: card.title, level: 3 })).toBeTruthy()
    expect(within(renderedCard).getByText(card.body)).toBeTruthy()
    expect(within(renderedCard).getByRole('button', { name: card.cta.label }).getAttribute('href')).toBe(
      card.cta.href,
    )
  })

  expect(within(startHereSection).getByText(homepageContent.startHere.description)).toBeTruthy()

  const awesomeListsSection = within(main).getByRole('region', {
    name: homepageContent.awesomeLists.title,
  })
  const awesomeListCards = within(awesomeListsSection).getAllByRole('listitem')

  expect(awesomeListCards).toHaveLength(homepageContent.awesomeLists.previews.length)

  for (const preview of homepageContent.awesomeLists.previews) {
    expect(
      within(awesomeListsSection).getByRole('link', { name: preview.label }).getAttribute('href'),
    ).toBe(preview.href)
    expect(within(awesomeListsSection).getByText(preview.description)).toBeTruthy()
  }

  const latestGuidesSection = within(main).getByRole('region', {
    name: homepageContent.latestGuides.title,
  })

  expect(within(latestGuidesSection).getByText(homepageContent.latestGuides.description)).toBeTruthy()
  expect(
    within(latestGuidesSection)
      .getByRole('button', { name: homepageContent.latestGuides.cta.label })
      .getAttribute('href'),
  ).toBe(homepageContent.latestGuides.cta.href)
  expect(
    within(latestGuidesSection).getByRole('heading', {
      name: 'Human review loops that keep AI output calm and accountable',
      level: 3,
    }),
  ).toBeTruthy()
  expect(within(latestGuidesSection).getByRole('button', { name: 'Previous post' })).toBeTruthy()
  expect(within(latestGuidesSection).getByRole('button', { name: 'Next post' })).toBeTruthy()

  const toolsSection = within(main).getByRole('region', {
    name: homepageContent.toolsTeaser.title,
  })
  const toolCards = within(toolsSection).getAllByRole('listitem')

  expect(toolCards).toHaveLength(homepageContent.toolsTeaser.cards.length)

  for (const card of homepageContent.toolsTeaser.cards) {
    expect(within(toolsSection).getByRole('link', { name: card.label }).getAttribute('href')).toBe(
      card.href,
    )
    expect(within(toolsSection).getByText(card.description)).toBeTruthy()
  }

  const newsletterSection = within(main).getByRole('region', {
    name: homepageContent.newsletter.title,
  })

  expect(within(newsletterSection).getByText(homepageContent.newsletter.description)).toBeTruthy()
  expect(
    within(newsletterSection).getByRole('textbox', { name: homepageContent.newsletter.fieldLabel }),
  ).toBeTruthy()
  expect(within(newsletterSection).getByText(homepageContent.newsletter.privacyNote)).toBeTruthy()
  expect(
    within(newsletterSection).getByRole('button', { name: homepageContent.newsletter.submitLabel }),
  ).toBeTruthy()

  expect(within(footer).getByText(homepageContent.footer.description)).toBeTruthy()
  expect(homepageContent.footer.columns.map((column) => column.title)).toEqual([
    'Navigation',
    'Open source',
    'Legal',
  ])

  for (const column of homepageContent.footer.columns) {
    expect(within(footer).getByRole('heading', { name: column.title })).toBeTruthy()

    for (const link of column.links) {
      expect(within(footer).getByRole('link', { name: link.label }).getAttribute('href')).toBe(
        link.href,
      )
    }
  }

  expect(within(footer).getByText(homepageContent.footer.copyright)).toBeTruthy()
}, 10000)

test('homepage content contract keeps the latest guides section copy stable', () => {
  expect(homepageContent.latestGuides.title).toBe('Latest guides')
  expect(homepageContent.latestGuides.cta).toEqual({
    label: 'See all guides',
    href: '/blog',
  })
  expect(homepageContent.latestGuides.description).toBe('Fresh operating notes from the Open Agency guides library.')
})

test('homepage content contract keeps the approved hero and start-here copy', () => {
  expect(homepageContent.hero.title).toBe('Work smarter with AI — not harder with hype.')
  expect(homepageContent.startHere.title).toBe('The fastest way to level up your AI workflow')
  expect(homepageContent.hero.supportingLine).toBe(
    'Everything free. No paywall. No account required to get started.',
  )
  expect(homepageContent.startHere.cards.map((card) => card.cta.href)).toEqual([
    '/blog/opencode-starter',
    '/awesome',
    '/blog?category=writing',
    '/blog?category=automation',
  ])
})

test('homepage content contract keeps the approved teaser copy and footer href contracts', () => {
  expect(homepageContent.awesomeLists.title).toBe('The open-agency awesome lists')
  expect(homepageContent.toolsTeaser.title).toBe('Free tools. No account needed.')
  expect(homepageContent.newsletter.fieldLabel).toBe('Your email address')
  expect(homepageContent.newsletter.submitLabel).toBe("Subscribe — it's free")
  expect(homepageContent.newsletter.privacyNote).toBe(
    'No spam. No selling your email. Unsubscribe any time.',
  )
  expect(homepageContent.footer.description).toBe('open-agency — practical AI for people who build things.')
  expect(homepageContent.footer.columns).toEqual([
    {
      title: 'Navigation',
      links: [
        { label: 'Guides', href: '/guides' },
        { label: 'Awesome lists', href: '/awesome' },
        { label: 'Tools', href: '/tools' },
      ],
    },
    {
      title: 'Open source',
      links: [{ label: 'GitHub', href: 'https://github.com/open-agency' }],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy', href: '/privacy' },
        { label: 'Terms', href: '/terms' },
      ],
    },
  ])
})
