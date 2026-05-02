import isEmpty from "just-is-empty";
import {
  ApplicationCommandType, ApplicationIntegrationType, CommandContext,
  InteractionContextType, MessageOptions, SlashCommand, SlashCreator
} from "slash-create/web";
import { CommandDescription } from "../consts";
import HelperUtils from "../utils";

export default class ParseIDHelper extends SlashCommand {
  constructor(creator: SlashCreator, guildID: string) {
    super(creator, {
      contexts: [InteractionContextType.GUILD],
      integrationTypes: [ApplicationIntegrationType.GUILD_INSTALL],
      guildIDs: guildID,
      type: ApplicationCommandType.MESSAGE,
      name: CommandDescription.ParseID,
      forcePermissions: true,
      requiredPermissions: ['VIEW_AUDIT_LOG']
    });
  }
  async run(ctx: CommandContext<Cloudflare.Env>) {
    const env: Env = ctx.serverContext;
    var responseMsg: MessageOptions = {
      ephemeral: true,
    };

    // Technically shouldn't be necessary but we'll do it anyways
    if (ctx.guildID !== env.CONTROL_GUILD && !isEmpty(env.CONTROL_GUILD)) {
      responseMsg.content = "This command is not allowed outside of the control guild";
      return responseMsg;
    }

    const msg = ctx.targetMessage;
    if (msg === undefined || msg === null) {
      responseMsg.content = "Could not get the target message, please try again later";
      return responseMsg;
    }
    await ctx.defer();

    let outputText = "Matched IDs:\n";
    // attempt to find discord user ids
    const allIDMatch = msg.content.match(/(\d{17,20})/g);
    if (isEmpty(allIDMatch)) {
      responseMsg.content = "There were no matched ids in the given message";
      return responseMsg;
    }
    allIDMatch!.forEach((match) => {
      // don't log any SG bots in here
      if (!HelperUtils.IsAccountProtected(env, match))
        outputText += `\`\`\`${match}\`\`\`\n`;
    });
    responseMsg.content = outputText;
    return responseMsg;
  }
};