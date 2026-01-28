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
    const body = await c.req.json()
    console.log('Webhook received:', JSON.stringify(body, null, 2))
    
    // Handle the webhook (we'll parse messages here)
    await handleWebhook(body)
    
    return c.text('OK')
  } catch (error) {
    console.error('Webhook error:', error)
    return c.text('Error', 500)
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
  // Log what we receive to understand the structure
  console.log('Processing webhook data...')
  
  // TODO: Parse actual Towns webhook format
  // For now, just log it so we can see what data comes in
}

// API endpoints for testing (you can call these directly)
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
console.log('Available endpoints:')
console.log('  POST /api/game - Create a new game')
console.log('  POST /api/bet - Create a bet')
console.log('  POST /api/bet/:betId/accept - Accept a bet')
console.log('  GET /api/bets/open - View open bets')
console.log('  GET /api/games - View upcoming games')
console.log('  GET /api/user/:userId/bets - View user bets')

serve({
  fetch: app.fetch,
  port,
})
