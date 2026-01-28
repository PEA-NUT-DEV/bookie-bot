import { makeTownsBot } from '@towns-protocol/bot'
import { Hono } from 'hono'
import commands from './commands'

const bot = await makeTownsBot(process.env.APP_PRIVATE_DATA!, process.env.JWT_SECRET!, {
    commands,
})

bot.onSlashCommand('help', async (handler, { channelId }) => {
    await handler.sendMessage(
        channelId,
        '**Bookie Bot Commands:**\n\n' +
            '• `/help` - Show this help message\n' +
            '• `/odds` - Check current odds\n\n' +
            '**Message Triggers:**\n\n' +
            '• Say "bet" - Get betting info\n',
    )
})

bot.onSlashCommand('odds', async (handler, { channelId }) => {
    await handler.sendMessage(channelId, '📊 Odds feature coming soon!')
})

bot.onMessage(async (handler, { message, channelId, isMentioned }) => {
    if (isMentioned) {
        await handler.sendMessage(channelId, "Hey! I'm Bookie, your sports betting bot. Type `/help` to see what I can do!")
        return
    }
    if (message.toLowerCase().includes('bet')) {
        await handler.sendMessage(channelId, '🎲 Ready to place a bet? Use `/odds` to check the latest lines!')
        return
    }
})

// Create webhook handler separate from bot auth
const webhookApp = new Hono()
webhookApp.all('/webhook', async (c) => {
    console.log('Webhook hit')
    return c.json({ success: true }, 200)
})

// Combine webhook app with bot app
const botApp = bot.start()
const app = new Hono()
app.route('/', webhookApp)
app.route('/', botApp)

export default app
