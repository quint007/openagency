import { authorizeNewsletterRequest, readJsonObject } from '@/newsletter/http'
import { unsubscribeNewsletterSubscription } from '@/newsletter/service'

export const dynamic = 'force-dynamic'

export async function POST(request: Request): Promise<Response> {
  const payload = await authorizeNewsletterRequest(request)
  if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await readJsonObject(request)
  const token = typeof body?.token === 'string' ? body.token : ''
  const result = await unsubscribeNewsletterSubscription(payload, token)
  return result
    ? Response.json(result)
    : Response.json({ error: 'Invalid unsubscribe token' }, { status: 400 })
}
