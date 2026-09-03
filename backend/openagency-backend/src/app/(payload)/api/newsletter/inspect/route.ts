import { authorizeNewsletterRequest, readJsonObject } from '@/newsletter/http'
import { isNewsletterEnabled } from '@/newsletter/constants'
import { inspectNewsletterConfirmation, inspectNewsletterUnsubscribe } from '@/newsletter/service'

export const dynamic = 'force-dynamic'

export async function POST(request: Request): Promise<Response> {
  const payload = await authorizeNewsletterRequest(request)
  if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await readJsonObject(request)
  const token = typeof body?.token === 'string' ? body.token : ''
  const type = body?.type
  if (type === 'confirmation') {
    if (!isNewsletterEnabled()) return Response.json({ valid: false })
    return Response.json(await inspectNewsletterConfirmation(payload, token))
  }
  if (type === 'unsubscribe') {
    return Response.json(await inspectNewsletterUnsubscribe(payload, token))
  }

  return Response.json({ error: 'Invalid request' }, { status: 400 })
}
