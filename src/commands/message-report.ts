import {
  ApplicationCommandType, ApplicationIntegrationType, CommandContext,
  InteractionContextType, MessageOptions, SlashCommand, SlashCreator
} from "slash-create/web";
import { CommandDescription } from "../consts";
import { ScamGuardReport } from "../services/report";
import HelperUtils from "../utils";

export default class MessageReport extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      contexts: [InteractionContextType.PRIVATE_CHANNEL],
      integrationTypes: [ApplicationIntegrationType.USER_INSTALL],
      type: ApplicationCommandType.MESSAGE,
      name: CommandDescription.Report,
      deferEphemeral: true
    });
  }
  async run(ctx: CommandContext<Cloudflare.Env>) {
    const msg = ctx.targetMessage;
    const env: Env = ctx.serverContext;
    var errMsg: MessageOptions = {
      ephemeral: true
    };

    if (msg === undefined || msg === null) {
      errMsg.content = "Could not get the target message, please try again later";
      return errMsg;
    }

    if (await HelperUtils.IsAccountForbidden(ctx.user.id, env)) {
      errMsg.content = HelperUtils.GetSupportLink(env);
      return errMsg;
    }

    return await ScamGuardReport.run(ctx);
  }
};