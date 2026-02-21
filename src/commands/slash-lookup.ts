import {
  ApplicationIntegrationType, CommandContext, CommandOptionType,
  InteractionContextType, SlashCommand, SlashCreator
} from "slash-create/web";
import { CommandDescription } from "../descriptions";
import { ScamGuardLookup } from "../services/lookup";

export default class SlashLookupCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      contexts: [InteractionContextType.PRIVATE_CHANNEL],
      integrationTypes: [ApplicationIntegrationType.USER_INSTALL],
      throttling: {
        duration: 5,
        usages: 3,
      },
      name: "lookup",
      deferEphemeral: true,
      description: CommandDescription.SlashCheck,
      options: [
        {
          type: CommandOptionType.MENTIONABLE,
          name: "account",
          description: "the account to check",
          required: true
        }
      ]
    });
  }

  async run(ctx: CommandContext<Cloudflare.Env>) {
    return await ScamGuardLookup.run(ctx, ctx.options["account"]);
  }
};