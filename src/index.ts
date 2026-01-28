import { serve } from '@hono/node-server'
import { Hono } from 'hono'

const app = new Hono()

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok', message: 'Bookie bot is running!' })
})

// Webhook endpoint - receives messages from Towns
app.post('/webhook', async (c) => {
  try {
    const body = await c.req.text()
    console.log('=== WEBHOOK RECEIVED ===')
    console.log('Raw body:', body)
    console.log('Headers:', JSON.stringify(Object.fromEntries(c.req.header()), null, 2))
    
    // Try to parse as JSON
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

// Bot discovery endpoint
app.get('/.well-known/agent-metadata.json', (c) => {
  return c.json({
    name: 'Bookie',
    description: 'Trustless on-chain sports betting bot',
    version: '1.0.0'
  })
})

// Start the server
const port = parseInt(process.env.PORT || '5123')
console.log('=========================')
console.log('Bookie bot starting on port', port)
console.log('=========================')

serve({
  fetch: app.fetch,
  port,
})
