import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import TownsBot from '@towns-protocol/sdk'

const app = new Hono()

// Initialize bot with credentials from environment variables
const bot = new TownsBot({
  appPrivateData: process.env.APP_PRIVATE_DATA!,
  jwtSecret: process.env.JWT_SECRET!,
})

// Webhook endpoint - receives messages from Towns
app.post('/webhook', async (c) => {
  const signature = c.req.header('x-towns-signature')
  if (!signature) {
    return c.text('Unauthorized', 401)
  }

  const body = await c.req.text()
  
  // Verify the webhook signature
  const isValid = await bot.verifyWebhook(body, signature)
  if (!isValid) {
    return c.text('Invalid signature', 401)
  }

  // Parse and handle the event
  const event = JSON.parse(body)
  await handleEvent(event)
  
  return c.text('OK')
})

// Bot discovery endpoint (required for bot directories)
app.get('/.well-known/agent-metadata.json', async (c) => {
  return c.json(await bot.getIdentityMetadata())
})

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok' })
})

// Event handler
async function handleEvent(event: any) {
  console.log('Received event:', event.type)
  
  switch (event.type) {
    case 'message':
      await handleMessage(event)
      break
    case 'slash_command':
      await handleSlashCommand(ev
git add src/index.ts
git commit -m "Fix SDK import"
git push origin main
cat > src/index.ts << 'EOF'
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
console.log(`🤖 Bookie bot starting on port ${port}`)

serve({
  fetch: app.fetch,
  port,
})
