# AntiScamBotTool

An installable Discord interactions tool that allows us to be able to more easily interact with accounts and ScamGuard.

![image](/.github/image.png)

## Features

This Discord interaction contains:

* `/lookup` - for looking up an user via a command in a DM. This command can be disabled via the environment settings.
* `/help` - prints out a very nice help screen
* User Application Interaction - for looking up the user while looking at their profile
* Message Application Interaction - for forwarding/reporting scammers easily as well as looking them up
* Helper functions for managing the tool that can be installed for a guild.

The end goal is to make everything work easier for users.

You can forward messages directly to ScamGuard reporting + look up accounts all within the Discord UI.

## Install

To install the instance ran by TAG, you must:

1. [Join the server](https://scamguard.app/discord).
2. Find the `ScamGuard User Tool` account
3. Open the profile card
4. Click `+ Add App`

While this app is in beta, we're holding back from a general access installation.

## Custom Setup

This requires the following protected secrets to be added to the worker environment.
The easiest way to do so is to copy `.env.example` as `.env` and fill out the various settings flags below

Once set, you can use `npx wrangler secret bulk .env` to bulk upload your secrets to your worker instance.

### Developer Settings

These can all be gotten from your Discord developer application dashboard.

* `DISCORD_APP_ID` - Public Application ID
* `DISCORD_PUBLIC_KEY` - Application Public Key
* `DISCORD_BOT_TOKEN` - Bot Token (gotten from the bot page)

### Application Settings

* `SUPPORT_THREAD` - The discord https link to the support channel of the given Discord server
* `CONTROL_GUILD`- The numeric guild ID for adding the moderation commands to

All other configurations can be handled by the `wrangler.toml` file.

Messaging can be modified by changing the values in the `consts.ts` file.

Once configured, run `npm run sync` to sync the commands with the Discord platform.
