import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { createHmac } from 'crypto'

const app = new Hono()

function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const hmac = createHmac('sha256', secret)
  hmac.update(body)
  const expectedSignature = hmac.digest('hex')
  return signature === expectedSignature
}

app.get('/health', (c) => {
  return c.json({ status: 'ok', message: 'Bookie bot is running!' })
})

app.all('/webhook', async (c) => {
  try {
    console.log('=== WEBHOOK RECEIVED ===')
    console.log('Method:', c.req.method)
    
    const signature = c.req.header('x-towns-signature')
    console.log('Signature:', signature)
    
    const body = await c.req.text()
    console.log('Body:', body || '(empty)')
    
    // Verify signature if present
    if (signature && process.env.JWT_SECRET && body) {
      const isValid = verifyWebhookSignature(body, signature, process.env.JWT_SECRET)
      console.log('Signature valid:', isValid)
    }
    
    if (body) {
      try {
        const data = JSON.parse(body)
        console.log('Parsed:', JSON.stringify(data, null, 2))
      } catch (e) {
        console.log('Not JSON')
      }
    }
    
    console.log('=== END WEBHOOK ===')
    
    // Try returning a JSON response that might be what Towns expects
    return c.json({ ok: true, status: 'received' })
  } catch (error: any) {
    console.error('Error:', error.message)
    return c.json({ ok: false, error: error.message }, 500)
  }
})

app.get('/.well-known/agent-metadata.json', (c) => {
  return c.json({
    name: 'Bookie',
    description: 'Trustless on-chain sports betting bot',
    version: '1.0.0'
  })
})

const port = parseInt(process.env.PORT || '5123')
console.log('Bookie bot starting on port', port)

serve({
  fetch: app.fetch,
  port,
})
