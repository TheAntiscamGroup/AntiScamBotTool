import { ApplicationCommandType, ApplicationIntegrationType, CommandContext, InteractionContextType, MessageOptions, SlashCommand, SlashCreator } from "slash-create/web";
import { ScamGuardReport } from "../report";
import HelperUtils from "../utils";

export default class MessageReport extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      dmPermission: true,
      contexts: [InteractionContextType.PRIVATE_CHANNEL],
      integrationTypes: [ApplicationIntegrationType.USER_INSTALL],
      type: ApplicationCommandType.MESSAGE,
      name: "Report Message to ScamGuard",
      deferEphemeral: true
    });
  }
  async run(ctx: CommandContext<Cloudflare.Env>) {
    const msg = ctx.targetMessage;
    const env:Env = ctx.serverContext;
    if (msg === undefined || msg === null)
      return;

    if (await HelperUtils.IsAccountForbidden(ctx.user.id, env)) {
      await ctx.send({
        content: HelperUtils.GetSupportLink(),
        ephemeral: true
      });
      return;
    }
    await ScamGuardReport.run(ctx);
  }
};