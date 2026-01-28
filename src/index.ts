import { serve } from '@hono/node-server'
import { Hono } from 'hono'

const app = new Hono()

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok', message: 'Bookie bot is running!' })
})

// Webhook endpoint placeholder
app.post('/webhook', async (c) => {
  console.log('Webhook received')
  return c.text('OK')
})

// Bot discovery endpoint placeholder
app.get('/.well-known/agent-metadata.json', async (c) => {
  return c.json({
    name: 'Bookie',
    description: 'Trustless sports betting bot'
  })
})

// Start the server
const port = parseInt(process.env.PORT || '5123')
console.log('Bookie bot starting on port ' + port)

serve({
  fetch: app.fetch,
  port,
})
