import { SlashCommand, SlashCreator, CommandContext, CommandOptionType, ApplicationIntegrationType, InteractionContextType, MessageOptions } from "slash-create/web"
import HelperUtils from "../utils";

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

  async run(ctx: CommandContext<Cloudflare.Env>) {
    const lookupUser:string = ctx.options["account"];
    const curUser:string = ctx.user.id;
    const env:Env = ctx.serverContext;

    // check if the given input is a correct number
    if (!HelperUtils.IsAccountValid(lookupUser)) {
      console.error(`${curUser} sent an input of ${lookupUser} which is invalid`);
      await ctx.send("The given input is not a valid account");
      return;
    }

    // prevent the user from looking up themselves (which would be silly)
    if (lookupUser == curUser) {
      await ctx.send("You cannot send this command on yourself.");
      return;
    }

    // we have to defer because we'll need to make some RPC out calls
    await ctx.defer(true);

    // Check if we are blocked from running this command
    const isForbidden = await HelperUtils.IsAccountForbidden(curUser, env);
    if (isForbidden) {
      await ctx.sendFollowUp(HelperUtils.GetSupportLink());
      return;
    }

    // Determine what the status is of the other user, if banned or not
    let banStatus = false;
    const apiResponse = await env.API_SERVICE.checkAccount(lookupUser);
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
    // Send the response to the user
    await ctx.sendFollowUp(MessageResponse);
  }
};