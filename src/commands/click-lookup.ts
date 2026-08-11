import type { CommandContext, SlashCreator } from "slash-create/web";
import {
  ApplicationCommandType, ApplicationIntegrationType,
  InteractionContextType, SlashCommand
} from "slash-create/web";
import { CommandDescription } from "../consts";
import { ScamGuardLookup } from "../services/lookup";

export default class ClickLookupCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      contexts: [InteractionContextType.PRIVATE_CHANNEL],
      integrationTypes: [ApplicationIntegrationType.USER_INSTALL],
      type: ApplicationCommandType.USER,
      name: CommandDescription.Check,
      deferEphemeral: true
    });
  }
  async run(ctx: CommandContext<Cloudflare.Env>) {
    if (ctx.targetUser === undefined || ctx.targetUser === null) {
      return {
        ephemeral: true,
        content: "Could not decipher the target user, please try again."
      };
    }

    return await ScamGuardLookup(ctx, ctx.targetUser.id);
  }
};