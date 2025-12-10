import { SlashCommand, SlashCreator, ApplicationCommandType, ApplicationIntegrationType, CommandContext, InteractionContextType } from "slash-create/web"
import { CommandDescription } from "../descriptions";
import { ScamGuardLookup } from "../lookup";

export default class MessageLookupCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      contexts: [InteractionContextType.PRIVATE_CHANNEL],
      integrationTypes: [ApplicationIntegrationType.USER_INSTALL],
      type: ApplicationCommandType.MESSAGE,
      name: CommandDescription.Check,
      deferEphemeral: true
    });
  }
  async run(ctx: CommandContext<Cloudflare.Env>) {
    if (ctx.targetMessage === undefined || ctx.targetMessage === null) {
      return {
        ephemeral: true,
        content: "Could not decipher the target user, please try again."
      };
    }

    return await ScamGuardLookup.run(ctx, ctx.targetMessage.author.id);
  }
};