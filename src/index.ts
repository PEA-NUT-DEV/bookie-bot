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

// Log ALL requests to webhook endpoint
app.all('/webhook', async (c) => {
  try {
    console.log('=== WEBHOOK RECEIVED ===')
    console.log('Method:', c.req.method)
    console.log('URL:', c.req.url)
    
    const signature = c.req.header('x-towns-signature')
    console.log('Signature header:', signature)
    
    // Log ALL headers
    const allHeaders: Record<string, string> = {}
    c.req.raw.headers.forEach((value, key) => {
      allHeaders[key] = value
    })
    console.log('All headers:', JSON.stringify(allHeaders, null, 2))
    
    const body = await c.req.text()
    console.log('Raw body length:', body.length)
    console.log('Raw body:', body || '(empty)')
    
    // Verify signature if present
    if (signature && process.env.JWT_SECRET && body) {
      const isValid = verifyWebhookSignature(body, signature, process.env.JWT_SECRET)
      console.log('Signature valid:', isValid)
      
      if (!isValid) {
        console.log('Invalid signature!')
        return new Response(null, { status: 401 })
      }
    }
    
    if (body) {
      try {
        const data = JSON.parse(body)
        console.log('Parsed data:', JSON.stringify(data, null, 2))
      } catch (e) {
        console.log('Body is not JSON')
      }
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
