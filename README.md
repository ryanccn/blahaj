<h1 align="center">
  <img src="./.github/icon.png" width="128" height="128" style="border-radius: 9999px" /><br />
  Blåhaj
</h1>

A multipurpose, fun Discord bot for Ryanland and the [Moddermore](https://moddermore.net/?ref=blahaj-readme) Discord.

Made with [discord.js](https://discordjs.guide/) and TypeScript. Hosted on [Railway](https://railway.app/?referralCode=kmjX82).

## Features

- Presence customization
- Stable Diffusion metadata parsing
- Ban syncing
- Starboard (but catstare)

## Development

Set the environment variables `DISCORD_APP` and `DISCORD_TOKEN`. Also set `DISCORD_GUILDS` as a list of allowed guild snowflakes. This will enforce ban sync between the guilds and also restrict certain features for the first (primary) guild, such as Stable Diffusion metadata parsing.

Run `yarn dev` to start the bot in development mode; run `yarn start` in production.
