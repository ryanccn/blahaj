<h1 align="center">
  <img src="./.github/icon.png" width="128" height="128" style="border-radius: 9999px" /><br />
  Blåhaj
</h1>

A multipurpose, fun Discord bot for Ryanland.

Made with [discord.js](https://discordjs.guide/) and TypeScript.

The bot is hosted on a VPS; the Stable Diffusion API is hosted on [Modal](https://modal.com/).

## Features

- Configurable starboard
- Presence customization
- Trivia games
- GitHub code block link expansion
- Bottom encoding / decoding
- `cat /dev/uwurandom`
- Chatbot powered by OpenAI
- Special friend category handling
- Context menu translation
- Stable Diffusion metadata parsing
- Stable Diffusion generation (powered by [Modal](https://modal.com/))
- System stats command
- Username migration (aka Pomelo) statistics
- Color preview command
- Direct Message logging
- Advanced error handling and logging

## Development

Set environment variables according to the schema defined in `src/env.ts`.

Run `pnpm dev` to start the bot in development mode; run `pnpm start` in production.
