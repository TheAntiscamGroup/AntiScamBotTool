import { CommandContext, EmbedField, MessageOptions } from "slash-create/web";
import { APP_EMBED_THUMBNAIL, APP_NAME } from "../consts";
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

    const canLookup = await HelperUtils.CanAccountLookup(curUser, env);
    if (!canLookup) {
      message.content = "You are not allowed to use this command";
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
      apiResponse = await (env.API_SERVICE as CheckAccountService).getBanDetails(lookupUser);
    } catch(err) {
      console.error(`Encountered an error ${err} while checking the API service for ${lookupUser}`);
      message.content = "The API service returned an error while doing an account check";
      return message;
    }

    // Default fields for lookup embed
    const fields: EmbedField[] = [
      {
        name: "User ID",
        value: `\`${lookupUser}\``,
        inline: true
      },
      {
        name: "Banned Status",
        value: banStatus.toString(),
        inline: true
      },
    ];

    let reportThreadName: string = "";
    let reportThreadLink: string|null = null;

    // response from the API service
    if (apiResponse.valid) {
      banStatus = apiResponse.banned;
      // Push ban timestamp too
      if (banStatus && apiResponse.banned_on !== undefined) {
        // push the time the user was banned since we know it
        fields.push({
          inline: false,
          name: "Banned At",
          value: apiResponse.banned_on!
        });
      }
      if (apiResponse.evidence_thread !== undefined) {
        reportThreadName = "Evidence Thread";
        reportThreadLink = apiResponse.evidence_thread;
      }
    } else {
      message.content = `${APP_NAME} encountered an error while trying to determine user status`;
      return message;
    }

    // Check if we have a reported thread on them
    if (reportThreadLink === null && env.REPORT_SETTINGS.thread_by_user) {
      const reportThreadId: string|null = await env.REPORT_THREAD_CHAIN.get(lookupUser);
      if (reportThreadId !== null) {
        reportThreadName = "Current Report Thread";
        reportThreadLink = `https://discord.com/channels/${env.CONTROL_GUILD}/${reportThreadId}`;
      }
    }

    // Add the report thread if we have the data for it
    if (reportThreadLink != null) {
      fields.push({
        name: reportThreadName,
        value: reportThreadLink,
        inline: false
      });
    }

    // Cool embeds for cool people yeah
    message = {
      ephemeral: true,
      embeds: [{
        author: {
          name: APP_NAME
        },
        thumbnail: {
          url: APP_EMBED_THUMBNAIL
        },
        color: banStatus ? 15409961 : 5761827,
        title: "Lookup Result",
        fields: fields
      }]
    };
    // Send the response to the user
    return message;
  }
};