import { SlashCommand, SlashCreator, CommandContext, CommandOptionType, ApplicationIntegrationType, InteractionContextType } from "slash-create/web"
import { ScamGuardLookup } from "../lookup";
import { CommandDescription } from "../descriptions";

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