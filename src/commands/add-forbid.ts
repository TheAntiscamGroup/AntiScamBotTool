import isEmpty from "just-is-empty";
import {
  ApplicationCommandType, ApplicationIntegrationType, CommandContext, CommandOptionType,
  InteractionContextType, MessageOptions, SlashCommand, SlashCreator
} from "slash-create/web";
import { CommandDescription } from "../consts";
import HelperUtils from "../utils";
import { config } from "../config";

export default class ForbidAccessHelperCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    if (!HelperUtils.CanUseModCommand())
      throw new Error("Command Disabled");

    super(creator, {
      contexts: [InteractionContextType.GUILD],
      integrationTypes: [ApplicationIntegrationType.GUILD_INSTALL],
      guildIDs: config.CONTROL_GUILD!,
      type: ApplicationCommandType.CHAT_INPUT,
      name: "forbid",
      description: CommandDescription.Forbid,
      forcePermissions: true,
      requiredPermissions: ['MANAGE_GUILD'],
      options: [
        {
          type: CommandOptionType.USER,
          name: "account",
          description: "the account to forbid",
          required: true
        }
      ]
    });
  }
  async run(ctx: CommandContext<Cloudflare.Env>) {
    const env: Env = ctx.serverContext;
    const targetUser: string|null|undefined = ctx.options["account"];
    var message: MessageOptions = {
      ephemeral: true,
    };

    if (!HelperUtils.CanUseModCommand()) {
      message.content = "This command is not enabled.";
      return message;
    }

    if (targetUser === undefined || targetUser === null || !HelperUtils.IsAccountValid(targetUser)) {
      message.content = `\`${targetUser}\` is invalid!`;
      return message;
    }

    // Technically shouldn't be necessary but we'll do it anyways
    if (ctx.guildID !== config.CONTROL_GUILD && !isEmpty(config.CONTROL_GUILD)) {
      message.content = "This command is not allowed outside of the control guild";
      return message;
    }

    await ctx.defer();

    // Check to see if they're already on the forbidden list
    if (await HelperUtils.IsAccountForbidden(targetUser, env)) {
      message.content = `\`${targetUser}\` is already on the forbidden list`;
      return message;
    }

    try {
      await env.FORBID_LIST.put(targetUser, "true");
      message.allowedMentions = {
        repliedUser: true,
        users: [ctx.user.id]
      };
      message.ephemeral = false;
      message.content = `Added \`${targetUser}\` to the forbid list by ${ctx.user.mention}.`
    } catch(err) {
      console.error(`Failed to add user to forbid list, error was ${err}`);
      message.content = "Encountered an error while trying to add to forbid list, please try again";
      message.ephemeral = true;
    }
    return message;
  }
};