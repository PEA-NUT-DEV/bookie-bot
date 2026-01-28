import type { BotCommand } from '@towns-protocol/bot'

const commands = [
    {
        name: 'help',
        description: 'Get help with Bookie bot commands',
    },
    {
        name: 'odds',
        description: 'Check current betting odds',
    },
] as const satisfies BotCommand[]

export default commands
