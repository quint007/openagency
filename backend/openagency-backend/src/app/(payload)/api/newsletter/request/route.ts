import { authorizeNewsletterRequest, readJsonObject } from '@/newsletter/http'
import { isNewsletterEnabled } from '@/newsletter/constants'
import { consumeNewsletterRequestLimit, requestNewsletterSubscription } from '@/newsletter/service'

export const dynamic = 'force-dynamic'

export async function POST(request: Request): Promise<Response> {
  const payload = await authorizeNewsletterRequest(request)
  if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isNewsletterEnabled()) return Response.json({ error: 'Newsletter unavailable' }, { status: 503 })

  const body = await readJsonObject(request)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const requester = typeof body?.requester === 'string' ? body.requester : 'unknown'
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 320) {
    return Response.json({ error: 'Invalid email' }, { status: 400 })
  }

  if (!(await consumeNewsletterRequestLimit(payload, requester))) {
    return Response.json({ status: 'accepted' })
  }

  return Response.json(await requestNewsletterSubscription(payload, email))
}
