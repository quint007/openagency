import { authorizeNewsletterRequest, readJsonObject } from '@/newsletter/http'
import { isNewsletterEnabled } from '@/newsletter/constants'
import { confirmNewsletterSubscription } from '@/newsletter/service'

export const dynamic = 'force-dynamic'

export async function POST(request: Request): Promise<Response> {
  const payload = await authorizeNewsletterRequest(request)
  if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isNewsletterEnabled()) return Response.json({ error: 'Newsletter unavailable' }, { status: 503 })

  const body = await readJsonObject(request)
  const token = typeof body?.token === 'string' ? body.token : ''
  const result = await confirmNewsletterSubscription(payload, token)
  return result
    ? Response.json(result)
    : Response.json({ error: 'Invalid confirmation' }, { status: 400 })
}
