import { SlashCommand, SlashCreator, ApplicationCommandType, ApplicationIntegrationType, CommandContext, InteractionContextType } from "slash-create/web"
import ScamGuardLookup from "../lookup";

export default class ClickLookupCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      contexts: [InteractionContextType.PRIVATE_CHANNEL],
      integrationTypes: [ApplicationIntegrationType.USER_INSTALL],
      type: ApplicationCommandType.USER,
      name: "Check with ScamGuard",
    });
  }
  async run(ctx: CommandContext<Cloudflare.Env>) {
    if (ctx.targetUser === undefined || ctx.targetUser === null)
      return;

    await ScamGuardLookup.run(ctx, ctx.targetUser.id);
  }
};