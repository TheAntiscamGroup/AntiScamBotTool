import {
  ApplicationIntegrationType, CommandContext, CommandOptionType,
  InteractionContextType, SlashCommand, SlashCreator
} from "slash-create/web";
import { config } from "../config";
import { CommandDescription } from "../consts";
import { ScamGuardLookup } from "../services/lookup";

export default class SlashLookupCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    if (!config.LOOKUP_SETTINGS.slash_enabled)
      throw new Error("Command Disabled");

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
    // TODO: probably disable the return if slash_enabled is false
    return await ScamGuardLookup.run(ctx, ctx.options["account"]);
  }
};