import config from '@payload-config'
import { getPayload } from 'payload'

import { isNewsletterMaintenanceRequest } from '@/newsletter/security'
import { runNewsletterMaintenance } from '@/newsletter/service'

export const dynamic = 'force-dynamic'

export async function POST(request: Request): Promise<Response> {
  if (!isNewsletterMaintenanceRequest(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config })
  const result = await runNewsletterMaintenance(payload)
  const healthy = result.failedDeliveries === 0 && result.remainingDue === 0
  return Response.json(result, { status: healthy ? 200 : 503 })
}
