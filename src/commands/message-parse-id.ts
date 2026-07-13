import isEmpty from "just-is-empty";
import unique from "just-unique";
import {
  ApplicationCommandType, ApplicationIntegrationType,
  CommandContext,
  InteractionContextType, MessageOptions, SlashCommand, SlashCreator
} from "slash-create/web";
import { config } from "../config";
import { CommandDescription } from "../consts";
import HelperUtils from "../utils";

export default class ParseIDHelperCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    if (!HelperUtils.CanUseModCommand())
      throw new Error("Command Disabled");

    super(creator, {
      contexts: [InteractionContextType.GUILD],
      integrationTypes: [ApplicationIntegrationType.GUILD_INSTALL],
      guildIDs: config.CONTROL_GUILD!,
      type: ApplicationCommandType.MESSAGE,
      name: CommandDescription.ParseID,
      forcePermissions: true,
      deferEphemeral: true,
      requiredPermissions: ['VIEW_AUDIT_LOG']
    });
  }
  async run(ctx: CommandContext<Cloudflare.Env>) {
    var responseMsg: MessageOptions = {
      ephemeral: true,
    };

    if (!HelperUtils.CanUseModCommand()) {
      responseMsg.content = "This command is not enabled.";
      return responseMsg;
    }

    // Technically shouldn't be necessary but we'll do it anyways
    if (ctx.guildID !== config.CONTROL_GUILD && !isEmpty(config.CONTROL_GUILD)) {
      responseMsg.content = "This command is not allowed outside of the control guild";
      return responseMsg;
    }

    const msg = ctx.targetMessage;
    if (msg === undefined || msg === null) {
      responseMsg.content = "Could not get the target message, please try again later.";
      return responseMsg;
    }

    // ScamGuard apps already format usernames properly.
    if (HelperUtils.IsAccountProtected(msg.author.id)) {
      responseMsg.content = "This command cannot be used on this sender";
      return responseMsg;
    }

    await ctx.defer(true);

    const discordIDRegex = /(\d{17,20})/g;
    // attempt to find discord user ids
    const contentIDs: string[] = msg.content.match(discordIDRegex) || [];
    const titleIDs: string[] = ctx.channel.name?.match(discordIDRegex) || [];
    const checkIDs: string[] = unique(titleIDs.concat(contentIDs), false, true);
    if (isEmpty(checkIDs)) {
      responseMsg.content = "There were no ids in the given message...";
      return responseMsg;
    }

    // format all of our findings
    let outputText = "Matched IDs:\n";
    checkIDs!.forEach((match) => {
      // don't log any SG bots in here
      if (!HelperUtils.IsAccountProtected(match))
        outputText += `* \`${match}\`\n`;
    });
    responseMsg.content = outputText;
    return responseMsg;
  }
};