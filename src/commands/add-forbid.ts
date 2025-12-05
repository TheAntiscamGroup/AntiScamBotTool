import { SlashCommand, SlashCreator, ApplicationCommandType, ApplicationIntegrationType, CommandContext, InteractionContextType, User, CommandOptionType } from "slash-create/web"
import HelperUtils from "../utils";

export default class ForbidAccessHelper extends SlashCommand {
  constructor(creator: SlashCreator, guildID:string = "1155997672667365406") {
    super(creator, {
      contexts: [InteractionContextType.GUILD],
      integrationTypes: [ApplicationIntegrationType.GUILD_INSTALL],
      guildIDs: guildID,
      type: ApplicationCommandType.CHAT_INPUT,
      name: "forbid",
      description: "Forbid an user from using the tool",
      forcePermissions: true,
      requiredPermissions: ['MANAGE_GUILD'],
      options: [
        {
          type: CommandOptionType.USER,
          name: "account",
          description: "the account to forbid",
          required: true
        }
      ]
    });
  }
  async run(ctx: CommandContext<Cloudflare.Env>) {
    const env:Env = ctx.serverContext;
    const targetUser:string|null|undefined = ctx.options["account"];
    if (targetUser === undefined || targetUser === null || !HelperUtils.IsAccountValid(targetUser)) {
      await ctx.send({
        ephemeral: true,
        content: `\`${targetUser}\` is invalid!`
      });
      return;
    }

    // Technically shouldn't be necessary but we'll do it anyways
    if (ctx.guildID !== env.CONTROL_GUILD) {
      await ctx.send({
        ephemeral: true,
        content: "This command is not allowed outside of the control guild"
      });
      return;
    }

    await ctx.defer();
    try {
      await env.FORBID_LIST.put(targetUser, "true");
      await ctx.sendFollowUp({
        allowedMentions: {
          repliedUser: true,
          users: [ctx.user.id]
        },
        content: `Added \`${targetUser}\` to the forbid list by ${ctx.user.mention}.`,
      });
    } catch(err) {
      console.error(`Failed to add user to forbid list, error was ${err}`);
      await ctx.sendFollowUp(`Encountered an error while trying to add to forbid list, please try again`);
    }
  }
};