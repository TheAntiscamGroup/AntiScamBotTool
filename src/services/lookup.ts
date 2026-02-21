import { CommandContext, MessageOptions } from "slash-create/web";
import HelperUtils from "../utils";

export class ScamGuardLookup {
  public static async run(ctx: CommandContext<Cloudflare.Env>, lookupUser: string) {
    const curUser: string = ctx.user.id;
    const env: Env = ctx.serverContext;
    var message: MessageOptions = {
      ephemeral: true
    };

    // check if the given input is a correct number
    if (!HelperUtils.IsAccountValid(env, lookupUser)) {
      console.error(`${curUser} sent an input of ${lookupUser} which is invalid`);
      message.content = "The given input is not a valid Discord account";
      return message;
    }

    // prevent the user from looking up themselves (which would be silly)
    if (lookupUser == curUser) {
      message.content = "You cannot use this command on yourself.";
      return message;
    }

    // we have to defer because we'll need to make some RPC out calls
    await ctx.defer(true);

    // Check if we are blocked from running this command
    const isForbidden = await HelperUtils.IsAccountForbidden(curUser, env);
    if (isForbidden) {
      message.content = HelperUtils.GetSupportLink(env);
      return message;
    }

    // Determine what the status is of the other user, if banned or not
    let banStatus = false;
    let apiResponse;

    // Query to the API service
    try {
      apiResponse = await (env.API_SERVICE as CheckAccountService).checkAccount(lookupUser);
    } catch(err) {
      console.error(`Encountered an error ${err} while checking the API service for ${lookupUser}`);
      message.content = "The API service returned an error while doing an account check";
      return message;
    }

    if (apiResponse.valid) {
      banStatus = apiResponse.banned;
    } else {
      message.content = "ScamGuard encountered an error while trying to determine user status";
      return message;
    }

    // Cool embeds for cool people yeah
    message = {
      ephemeral: true,
      embeds: [{
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
      }]
    };
    // Send the response to the user
    return message;
  }
};