// Professional betting types and data structures

export type BetType = 'moneyline' | 'spread' | 'over_under' | 'prop'

export interface Game {
  id: string
  sport: string  // "NBA", "NFL", "MLB", etc.
  homeTeam: string
  awayTeam: string
  startTime: Date
  status: 'scheduled' | 'live' | 'final'
  homeScore?: number
  awayScore?: number
}

export interface BetOdds {
  type: BetType
  line?: number  // For spread: -7.5, +7.5 / For over_under: 215.5
  odds: number  // -110, +150, etc. (American odds)
  selection: string  // "Lakers", "Over", "Warriors +7.5", etc.
}

export interface Bet {
  id: string
  gameId: string
  creator: string
  acceptor?: string
  betType: BetType
  odds: BetOdds
  amount: number  // amount in USD/ETH
  status: 'open' | 'accepted' | 'settled' | 'cancelled'
  createdAt: Date
  acceptedAt?: Date
  settledAt?: Date
  winner?: string  // userId of winner
}

// In-memory storage
const games: Map<string, Game> = new Map()
const bets: Map<string, Bet> = new Map()

// ===== GAME MANAGEMENT =====

export function createGame(
  sport: string,
  homeTeam: string,
  awayTeam: string,
  startTime: Date
): Game {
  const game: Game = {
    id: `game_${Date.now()}`,
    sport,
    homeTeam,
    awayTeam,
    startTime,
    status: 'scheduled'
  }
  
  games.set(game.id, game)
  return game
}

export function getGame(gameId: string): Game | undefined {
  return games.get(gameId)
}

export function getUpcomingGames(): Game[] {
  return Array.from(games.values()).filter(game => game.status === 'scheduled')
}

export function updateGameScore(gameId: string, homeScore: number, awayScore: number): Game | null {
  const game = games.get(gameId)
  if (!game) return null
  
  game.homeScore = homeScore
  game.awayScore = awayScore
  game.status = 'final'
  return game
}

// ===== BET MANAGEMENT =====

export function createBet(
  creator: string,
  gameId: string,
  betType: BetType,
  odds: BetOdds,
  amount: number
): Bet | null {
  const game = games.get(gameId)
  if (!game || game.status !== 'scheduled') {
    return null
  }
  
  const bet: Bet = {
    id: `bet_${Date.now()}`,
    gameId,
    creator,
    betType,
    odds,
    amount,
    status: 'open',
    createdAt: new Date()
  }
  
  bets.set(bet.id, bet)
  return bet
}

export function acceptBet(betId: string, acceptor: string): Bet | null {
  const bet = bets.get(betId)
  if (!bet || bet.status !== 'open') {
    return null
  }
  
  bet.acceptor = acceptor
  bet.status = 'accepted'
  bet.acceptedAt = new Date()
  return bet
}

export function getBet(betId: string): Bet | undefined {
  return bets.get(betId)
}

export function getOpenBets(): Bet[] {
  return Array.from(bets.values()).filter(bet => bet.status === 'open')
}

export function getGameBets(gameId: string): Bet[] {
  return Array.from(bets.values()).filter(bet => bet.gameId === gameId)
}

export function getUserBets(userId: string): Bet[] {
  return Array.from(bets.values()).filter(
    bet => bet.creator === userId || bet.acceptor === userId
  )
}

// ===== BET SETTLEMENT =====

export function settleBet(betId: string): Bet | null {
  const bet = bets.get(betId)
  if (!bet || bet.status !== 'accepted') {
    return null
  }
  
  const game = games.get(bet.gameId)
  if (!game || game.status !== 'final') {
    return null
  }
  
  const winner = determineWinner(bet, game)
  
  bet.status = 'settled'
  bet.winner = winner
  bet.settledAt = new Date()
  return bet
}

function determineWinner(bet: Bet, game: Game): string | undefined {
  if (!game.homeScore || !game.awayScore) return undefined
  
  const { homeScore, awayScore } = game
  const { creator, acceptor } = bet
  
  if (!acceptor) return undefined
  
  switch (bet.betType) {
    case 'moneyline': {
      const winningTeam = homeScore > awayScore ? game.homeTeam : game.awayTeam
      return bet.odds.selection === winningTeam ? creator : acceptor
    }
    
    case 'spread': {
      const line = bet.odds.line || 0
      const spreadResult = homeScore + line - awayScore
      
      // Check if creator's selection covers the spread
      const creatorWins = bet.odds.selection.includes(game.homeTeam)
        ? spreadResult > 0
        : spreadResult < 0
      
      return creatorWins ? creator : acceptor
    }
    
    case 'over_under': {
      const total = homeScore + awayScore
      const line = bet.odds.line || 0
      
      const creatorWins = bet.odds.selection === 'Over'
        ? total > line
        : total < line
      
      return creatorWins ? creator : acceptor
    }
    
    default:
      return undefined
  }
}

// ===== HELPER FUNCTIONS =====

export function formatBet(bet: Bet): string {
  const game = games.get(bet.gameId)
  if (!game) return 'Game not found'
  
  let betDescription = ''
  
  switch (bet.betType) {
    case 'moneyline':
      betDescription = `${bet.odds.selection} to win`
      break
    case 'spread':
      betDescription = `${bet.odds.selection}`
      break
    case 'over_under':
      betDescription = `${bet.odds.selection} ${bet.odds.line}`
      break
  }
  
  return `${game.awayTeam} @ ${game.homeTeam} - ${betDescription} - $${bet.amount}`
}
