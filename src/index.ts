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
  const url = new URL(c.req.url);
  console.log('Full URL:', c.req.url);
  console.log('Query params:', url.searchParams.toString());
  
  const body = await c.req.text();
  
  // If body is empty, this is a verification ping
  if (!body || body.length === 0) {
    console.log('Empty body - verification ping');
    return new Response('', { 
      status: 200,
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
  }
  
  // Handle actual webhook with data
  console.log('Body:', body);
  try {
    const data = JSON.parse(body);
    console.log('Parsed data:', data);
    // Process webhook here
  } catch (e) {
    console.log('Could not parse JSON');
  }

  return new Response('', { 
    status: 200,
    headers: {
      'ngrok-skip-browser-warning': 'true'
    }
  });
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
