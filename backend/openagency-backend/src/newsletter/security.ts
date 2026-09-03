import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/

export const createOpaqueToken = (): string => randomBytes(32).toString('base64url')

export const hashOpaqueToken = (token: string): string =>
  createHash('sha256').update(token, 'utf8').digest('hex')

export const hashNewsletterRequester = (value: string): string => {
  const secret = process.env.NEWSLETTER_SERVICE_SECRET?.trim()
  if (!secret) throw new Error('NEWSLETTER_SERVICE_SECRET is required to hash newsletter requesters.')
  return createHmac('sha256', secret).update(value, 'utf8').digest('hex')
}

const getTokenEncryptionKey = (): Buffer => {
  const encodedKey = process.env.NEWSLETTER_TOKEN_ENCRYPTION_KEY?.trim()
  const key = encodedKey ? Buffer.from(encodedKey, 'base64url') : Buffer.alloc(0)
  if (!encodedKey || !/^[A-Za-z0-9_-]{43}$/.test(encodedKey) || key.length !== 32) {
    throw new Error('NEWSLETTER_TOKEN_ENCRYPTION_KEY must contain 32 base64url-encoded bytes.')
  }
  return key
}

export const encryptOpaqueToken = (token: string): string => {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', getTokenEncryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()])

  return ['v1', iv.toString('base64url'), encrypted.toString('base64url'), cipher.getAuthTag().toString('base64url')].join('.')
}

export const decryptOpaqueToken = (value: string): string => {
  const [version, encodedIv, encodedCiphertext, encodedTag] = value.split('.')
  if (version !== 'v1' || !encodedIv || !encodedCiphertext || !encodedTag) {
    throw new Error('Invalid newsletter token ciphertext.')
  }

  const decipher = createDecipheriv('aes-256-gcm', getTokenEncryptionKey(), Buffer.from(encodedIv, 'base64url'))
  decipher.setAuthTag(Buffer.from(encodedTag, 'base64url'))
  return Buffer.concat([
    decipher.update(Buffer.from(encodedCiphertext, 'base64url')),
    decipher.final(),
  ]).toString('utf8')
}

export const isOpaqueToken = (token: unknown): token is string =>
  typeof token === 'string' && TOKEN_PATTERN.test(token)

const secretsMatch = (expected: string | undefined, supplied: string | undefined): boolean => {
  const expectedBuffer = Buffer.from(expected?.trim() ?? '', 'utf8')
  const suppliedBuffer = Buffer.from(supplied?.trim() ?? '', 'utf8')
  return (
    expectedBuffer.length > 0 &&
    expectedBuffer.length === suppliedBuffer.length &&
    timingSafeEqual(expectedBuffer, suppliedBuffer)
  )
}

export const isNewsletterServiceRequest = (request: Request): boolean => {
  return secretsMatch(
    process.env.NEWSLETTER_SERVICE_SECRET,
    request.headers.get('x-newsletter-service-secret') ?? undefined,
  )
}

export const isNewsletterMaintenanceRequest = (request: Request): boolean =>
  secretsMatch(process.env.CRON_SECRET, request.headers.get('authorization')?.replace(/^Bearer\s+/i, ''))
