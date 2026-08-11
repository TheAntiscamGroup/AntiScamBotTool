import type { CommandContext, MessageOptions, SlashCreator } from "slash-create/web";
import {
  ApplicationIntegrationType, CommandOptionType,
  InteractionContextType, SlashCommand
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
    if (!config.LOOKUP_SETTINGS.slash_enabled) {
      const message: MessageOptions = {
        ephemeral: true,
        content: "This command is disabled."
      };
      return message;
    }
    return await ScamGuardLookup(ctx, ctx.options["account"] as string);
  }
};