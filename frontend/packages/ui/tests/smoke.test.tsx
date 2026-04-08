import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'

import {
  Button,
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
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
  expect(linkButton.className).toContain('bg-surface-container-low')
  expect(buttonVariants({ variant: 'outline' })).toContain('bg-surface-container-low')
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
