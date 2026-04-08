import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})

vi.mock('next/image', () => ({
  default: (props: {
    alt?: string
    src?: string | { src?: string }
    [key: string]: unknown
  }) => {
    const { alt, src, ...rest } = props
    const resolvedSrc = typeof src === 'string' ? src : src?.src ?? ''

    return {
      $$typeof: Symbol.for('react.element'),
      type: 'img',
      key: null,
      ref: null,
      props: { alt, src: resolvedSrc, ...rest },
      _owner: null,
    }
  },
}))

vi.mock('next/font/google', () => ({
  Geist: () => ({ variable: '--font-geist-sans' }),
  Geist_Mono: () => ({ variable: '--font-geist-mono' }),
}))
