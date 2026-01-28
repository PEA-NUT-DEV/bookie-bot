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

app.post('/webhook', async (c) => {
  try {
    const signature = c.req.header('x-towns-signature')
    const body = await c.req.text()
    
    console.log('=== WEBHOOK RECEIVED ===')
    console.log('Signature:', signature)
    console.log('Raw body:', body)
    
    // Verify signature if present
    if (signature && process.env.JWT_SECRET) {
      const isValid = verifyWebhookSignature(body, signature, process.env.JWT_SECRET)
      console.log('Signature valid:', isValid)
      
      if (!isValid) {
        console.log('Invalid signature!')
        return new Response(null, { status: 401 })
      }
    }
    
    let data
    try {
      data = JSON.parse(body)
      console.log('Parsed data:', JSON.stringify(data, null, 2))
    } catch (e) {
      console.log('Body is not JSON')
    }
    
    console.log('=== END WEBHOOK ===')
    
    return new Response(null, { status: 200 })
  } catch (error: any) {
    console.error('Webhook error:', error.message)
    return new Response(null, { status: 500 })
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
console.log('=========================')
console.log('Bookie bot starting on port', port)
console.log('=========================')

serve({
  fetch: app.fetch,
  port,
})
