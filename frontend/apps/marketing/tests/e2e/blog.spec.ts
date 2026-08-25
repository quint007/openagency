import { expect, test } from '@playwright/test'

test('feedback trigger stays clear of tag filters on mobile', async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 375 })
  await page.goto('/blog?tag=opencode')
  await page.waitForLoadState('networkidle')

  const essentialOnlyButton = page.getByRole('button', { name: 'Essential only' })
  if (await essentialOnlyButton.isVisible()) {
    await essentialOnlyButton.click()
  }

  await expect.poll(async () => page.evaluate(() => {
    const feedbackButton = document.querySelector<HTMLElement>('button[aria-label="Share feedback"]')
    const tagButtons = Array.from(document.querySelectorAll<HTMLElement>('[aria-labelledby="blog-filter-tags"] button'))

    if (!feedbackButton) {
      return ['Missing feedback trigger']
    }

    const feedbackRect = feedbackButton.getBoundingClientRect()

    return tagButtons
      .filter((tagButton) => {
        const tagRect = tagButton.getBoundingClientRect()
        return feedbackRect.left < tagRect.right && feedbackRect.right > tagRect.left &&
          feedbackRect.top < tagRect.bottom && feedbackRect.bottom > tagRect.top
      })
      .map((tagButton) => tagButton.textContent?.trim() ?? 'Unnamed tag')
  })).toEqual([])
})
