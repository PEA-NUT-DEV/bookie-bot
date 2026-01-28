import { serve } from '@hono/node-server'
import { Hono } from 'hono'

const app = new Hono()

app.get('/health', (c) => {
  return c.json({ status: 'ok', message: 'Bookie bot is running!' })
})

app.post('/webhook', async (c) => {
  try {
    const body = await c.req.text()
    console.log('=== WEBHOOK RECEIVED ===')
    console.log('Raw body:', body)
    
    const headers: Record<string, string> = {}
    c.req.raw.headers.forEach((value, key) => {
      headers[key] = value
    })
    console.log('Headers:', JSON.stringify(headers, null, 2))
    
    try {
      const data = JSON.parse(body)
      console.log('Parsed data:', JSON.stringify(data, null, 2))
    } catch (e) {
      console.log('Body is not JSON, raw text:', body)
    }
    
    console.log('=== END WEBHOOK ===')
    
    return c.json({ success: true })
  } catch (error: any) {
    console.error('Webhook error:', error.message)
    return c.json({ error: error.message }, 500)
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
