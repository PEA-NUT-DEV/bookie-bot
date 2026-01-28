import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import {
  createGame,
  createBet,
  acceptBet,
  getOpenBets,
  getUserBets,
  getUpcomingGames,
  formatBet,
  type BetType
} from './bets'

const app = new Hono()

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok', message: 'Bookie bot is running!' })
})

// Webhook endpoint - receives messages from Towns
app.post('/webhook', async (c) => {
  try {
    // Get the raw body first
    const body = await c.req.text()
    console.log('Raw webhook body:', body)
    console.log('Headers:', JSON.stringify(c.req.header(), null, 2))
    
    // Try to parse as JSON
    let data
    try {
      data = JSON.parse(body)
      console.log('Parsed webhook data:', JSON.stringify(data, null, 2))
    } catch (e) {
      console.log('Not JSON, raw text:', body)
      return c.text('OK')
    }
    
    // Handle the webhook
    await handleWebhook(data)
    
    return c.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return c.json({ error: 'Internal error' }, 500)
  }
})

// Bot discovery endpoint
app.get('/.well-known/agent-metadata.json', async (c) => {
  return c.json({
    name: 'Bookie',
    description: 'Trustless on-chain sports betting bot',
    version: '1.0.0'
  })
})

// Webhook handler
async function handleWebhook(data: any) {
  console.log('Processing webhook...')
  
  // Log the structure so we can see what Towns sends
  console.log('Event type:', data.type)
  console.log('Event data:', JSON.stringify(data.data, null, 2))
}

// API endpoints for testing
app.post('/api/game', async (c) => {
  const { sport, homeTeam, awayTeam, startTime } = await c.req.json()
  const game = createGame(sport, homeTeam, awayTeam, new Date(startTime))
  return c.json(game)
})

app.post('/api/bet', async (c) => {
  const { creator, gameId, betType, odds, amount } = await c.req.json()
  const bet = createBet(creator, gameId, betType as BetType, odds, amount)
  
  if (!bet) {
    return c.json({ error: 'Could not create bet' }, 400)
  }
  
  return c.json(bet)
})

app.post('/api/bet/:betId/accept', async (c) => {
  const betId = c.req.param('betId')
  const { acceptor } = await c.req.json()
  const bet = acceptBet(betId, acceptor)
  
  if (!bet) {
    return c.json({ error: 'Could not accept bet' }, 400)
  }
  
  return c.json(bet)
})

app.get('/api/bets/open', (c) => {
  return c.json(getOpenBets())
})

app.get('/api/games', (c) => {
  return c.json(getUpcomingGames())
})

app.get('/api/user/:userId/bets', (c) => {
  const userId = c.req.param('userId')
  return c.json(getUserBets(userId))
})

// Start the server
const port = parseInt(process.env.PORT || '5123')
console.log('Bookie bot starting on port ' + port)

serve({
  fetch: app.fetch,
  port,
})
