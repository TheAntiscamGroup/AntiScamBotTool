import { SlashCommand, SlashCreator, CommandContext, CommandOptionType, ApplicationIntegrationType, InteractionContextType, MessageOptions } from "slash-create/web"
import ScamGuardLookup from "../lookup";

export default class LookupCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      dmPermission: true,
      contexts: [InteractionContextType.PRIVATE_CHANNEL],
      integrationTypes: [ApplicationIntegrationType.USER_INSTALL],
      throttling: {
        duration: 5,
        usages: 10,
      },
      name: "lookup",
      description: "looks up the given account with ScamGuard",
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
    const lookupUser:string = ctx.options["account"];
    await ScamGuardLookup.run(ctx, lookupUser);
  }
};