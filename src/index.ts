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

const app = new Hono()

app.all('/webhook', async (c) => {
    const url = new URL(c.req.url)
    const body = await c.req.text()

    if (!body || body.length === 0) {
        console.log('Empty body - verification ping')
        return c.json({ status: 'ok' }, 200)
    }

    console.log('Webhook received:', body)
    try {
        const data = JSON.parse(body)
        console.log('Parsed data:', data)
    } catch (e) {
        console.log('Could not parse JSON')
    }

    return c.json({ success: true })
})

const botApp = bot.start()
app.route('/', botApp)
export default app
