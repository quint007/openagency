import { render, screen, within } from '@testing-library/react'
import { CircleAlertIcon } from 'lucide-react'
import { expect, test } from 'vitest'

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  Separator,
  alertVariants,
  badgeVariants,
  buttonVariants,
  navigationMenuTriggerStyle,
} from '../src'

test('Button renders accessible native and anchor-backed button contracts', () => {
  const { rerender } = render(
    <Button disabled className="qa-button">
      Book a demo
    </Button>,
  )

  const nativeButton = screen.getByRole('button', { name: 'Book a demo' })

  expect(nativeButton.tagName).toBe('BUTTON')
  expect(nativeButton.getAttribute('data-slot')).toBe('button')
  expect(nativeButton.hasAttribute('disabled')).toBe(true)
  expect(nativeButton.className).toContain('qa-button')

  rerender(
    <Button render={<a href="#contact" />} nativeButton={false} variant="outline">
      See platform
    </Button>,
  )

  const linkButton = screen.getByRole('button', { name: 'See platform' })

  expect(linkButton.tagName).toBe('A')
  expect(linkButton.getAttribute('href')).toBe('#contact')
  expect(linkButton.getAttribute('data-slot')).toBe('button')
  expect(linkButton.getAttribute('role')).toBe('button')
  expect(linkButton.className).toContain('bg-transparent')
  expect(buttonVariants({ variant: 'outline' })).toContain('bg-transparent')
})

test('NavigationMenu renders labeled navigation with links', () => {
  render(
    <NavigationMenu aria-label="Primary">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink render={<a href="#platform" />}>Platform</NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink render={<a href="#solutions" />}>Solutions</NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>,
  )

  const navigation = screen.getByRole('navigation', { name: 'Primary' })
  const links = within(navigation).getAllByRole('link')

  expect(navigation.getAttribute('data-slot')).toBe('navigation-menu')
  expect(links).toHaveLength(2)
  expect(within(navigation).getByRole('link', { name: 'Platform' }).getAttribute('href')).toBe(
    '#platform',
  )
  expect(within(navigation).getByRole('link', { name: 'Solutions' }).getAttribute('href')).toBe(
    '#solutions',
  )
  expect(within(navigation).getByRole('list').getAttribute('data-slot')).toBe(
    'navigation-menu-list',
  )
  expect(navigationMenuTriggerStyle()).toContain('text-on-surface-variant')
})

test('Card renders composed slots inside a labeled region', () => {
  render(
    <Card role="region" aria-labelledby="homepage-foundation-title" size="sm">
      <CardHeader>
        <CardTitle id="homepage-foundation-title">Homepage foundation</CardTitle>
        <CardDescription>Shared primitives for marketing and courses.</CardDescription>
        <CardAction>Foundation ready</CardAction>
      </CardHeader>
      <CardContent>Reusable sections can compose this surface later.</CardContent>
      <CardFooter>
        <Button size="xs">Review</Button>
      </CardFooter>
    </Card>,
  )

  const card = screen.getByRole('region', { name: 'Homepage foundation' })

  expect(card.getAttribute('data-slot')).toBe('card')
  expect(card.getAttribute('data-size')).toBe('sm')
  expect(within(card).getByText('Homepage foundation').getAttribute('data-slot')).toBe('card-title')
  expect(
    within(card).getByText('Shared primitives for marketing and courses.').getAttribute('data-slot'),
  ).toBe('card-description')
  expect(within(card).getByText('Foundation ready').getAttribute('data-slot')).toBe('card-action')
  expect(
    within(card).getByText('Reusable sections can compose this surface later.').getAttribute('data-slot'),
  ).toBe('card-content')
  expect(within(card).getByRole('button', { name: 'Review' }).getAttribute('data-slot')).toBe(
    'button',
  )
})

test('Badge renders span and link-backed contracts', () => {
  const { rerender } = render(
    <Badge className="qa-badge">
      Beta
    </Badge>,
  )

  const badge = screen.getByText('Beta')

  expect(badge.tagName).toBe('SPAN')
  expect(badge.getAttribute('data-slot')).toBe('badge')
  expect(badge.className).toContain('qa-badge')
  expect(badge.className).toContain('bg-brand-primary/10')

  rerender(
    <Badge render={<a href="#docs" />} variant="link">
      Docs
    </Badge>,
  )

  const linkBadge = screen.getByRole('link', { name: 'Docs' })

  expect(linkBadge.getAttribute('href')).toBe('#docs')
  expect(linkBadge.getAttribute('data-slot')).toBe('badge')
  expect(linkBadge.className).toContain('underline-offset-6')
  expect(badgeVariants({ variant: 'link' })).toContain('underline-offset-6')
})

test('Input and Separator render accessible form and divider contracts', () => {
  render(
    <div>
      <label htmlFor="homepage-email">Email</label>
      <Input
        id="homepage-email"
        aria-invalid="true"
        disabled
        placeholder="name@example.com"
        className="qa-input"
      />
      <Separator orientation="vertical" className="qa-separator" />
    </div>,
  )

  const input = screen.getByRole('textbox', { name: 'Email' })
  const separator = screen.getByRole('separator')

  expect(input.getAttribute('data-slot')).toBe('input')
  expect(input.getAttribute('placeholder')).toBe('name@example.com')
  expect(input.getAttribute('aria-invalid')).toBe('true')
  expect(input.hasAttribute('disabled')).toBe(true)
  expect(input.className).toContain('qa-input')
  expect(separator.getAttribute('data-slot')).toBe('separator')
  expect(separator.getAttribute('aria-orientation')).toBe('vertical')
  expect(separator.className).toContain('qa-separator')
})

test('Alert renders destructive messaging with title, description, and action', () => {
  render(
    <Alert variant="destructive">
      <CircleAlertIcon aria-hidden="true" />
      <AlertTitle>Payment failed</AlertTitle>
      <AlertDescription>
        Your payment could not be processed. Please verify the billing details.
      </AlertDescription>
      <AlertAction>
        <Button size="xs">Retry</Button>
      </AlertAction>
    </Alert>,
  )

  const alert = screen.getByRole('alert')

  expect(alert.getAttribute('data-slot')).toBe('alert')
  expect(alert.getAttribute('data-variant')).toBe('destructive')
  expect(alert.className).toContain('text-destructive')
  expect(within(alert).getByText('Payment failed').getAttribute('data-slot')).toBe('alert-title')
  expect(
    within(alert)
      .getByText('Your payment could not be processed. Please verify the billing details.')
      .getAttribute('data-slot'),
  ).toBe('alert-description')
  expect(within(alert).getByRole('button', { name: 'Retry' }).getAttribute('data-slot')).toBe(
    'button',
  )
  expect(alertVariants({ variant: 'destructive' })).toContain('var(--brand-danger)')
})
