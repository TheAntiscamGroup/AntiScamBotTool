import {
  ApplicationCommandType, ApplicationIntegrationType, CommandContext,
  InteractionContextType, MessageOptions, SlashCommand, SlashCreator
} from "slash-create/web";
import { CommandDescription } from "../consts";
import { ScamGuardReport } from "../services/report";
import HelperUtils from "../utils";
import { config } from "../config";

export default class MessageReportCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    // Dynamically allow commands to be used based on settings
    let allowedContexts: InteractionContextType[] = [InteractionContextType.PRIVATE_CHANNEL];
    if (config.REPORT_SETTINGS.can_report_in_servers && config.CONTROL_GUILD !== undefined)
      allowedContexts.push(InteractionContextType.GUILD);

    super(creator, {
      contexts: allowedContexts,
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

    if (config.REPORT_SETTINGS.can_report_in_servers) {
      // is this guild not allowed to be reported?
      if (ctx.guildID === config.CONTROL_GUILD) {
        errMsg.content = "This command is not allowed to be ran in this server.";
        return errMsg;
      }
    } else if (ctx.guildID !== undefined) {
      errMsg.content = "This command cannot be ran in servers";
      return errMsg;
    }

    return await ScamGuardReport.run(ctx);
  }
};