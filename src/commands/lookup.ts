import { SlashCommand, SlashCreator, CommandContext, CommandOptionType, ApplicationIntegrationType, InteractionContextType, MessageOptions } from "slash-create/web"

export default class LookupCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      dmPermission: true,
      contexts: [InteractionContextType.PRIVATE_CHANNEL],
      integrationTypes: [ApplicationIntegrationType.USER_INSTALL],
      throttling: {
        duration: 5,
        usages: 10,
      },
      name: "lookup",
      description: "looks up the given account with ScamGuard",
      options: [
        {
          type: CommandOptionType.MENTIONABLE,
          name: "account",
          description: "the account to check",
          required: true
        }
      ]
    });
  }

  async run(ctx: CommandContext) {
    const lookupUser = ctx.options["account"];

    if (lookupUser == ctx.user.id) {
      await ctx.send("You cannot send this command on yourself.");
      return;
    }

    // we have to defer because we'll need to make some RPC out calls
    await ctx.defer(true);

    // Determine what the status is of the user being banned
    let banStatus = false;
    const apiResponse = await ctx.serverContext.API_SERVICE.checkAccount(lookupUser);
    if (apiResponse.valid) {
      banStatus = apiResponse.banned;
    } else {
      await ctx.sendFollowUp("ScamGuard encountered an error while trying to determine the user status");
      return;
    }

    // Cool embeds for cool people yeah
    const MessageResponse:MessageOptions = {
      ephemeral: true,
      embeds: [
        {
          author: {
            name: "ScamGuard"
          },
          thumbnail: {
            url: "https://scamguard.app/assets/site-logo.png"
          },
          color: banStatus ? 15409961 : 5761827,
          title: "Lookup Result",
          fields: [
            {
              name: "User ID",
              value: `\`${lookupUser}\``,
              inline: true
            },
            {
              name: "Banned Status",
              value: banStatus.toString(),
              inline: true
            }
          ]
        }
      ]
    };
    await ctx.sendFollowUp(MessageResponse);
  }
};