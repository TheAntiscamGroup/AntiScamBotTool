import { SlashCommand, SlashCreator, ApplicationCommandType, ApplicationIntegrationType, CommandContext, InteractionContextType, User } from "slash-create/web"
import HelperUtils from "../utils";

export default class AddPermissionsHelper extends SlashCommand {
  constructor(creator: SlashCreator, guildID:string = "1155997672667365406") {
    super(creator, {
      contexts: [InteractionContextType.GUILD],
      integrationTypes: [ApplicationIntegrationType.GUILD_INSTALL],
      guildIDs: guildID,
      type: ApplicationCommandType.USER,
      name: "MOD: Add to Tool Reporter",
      forcePermissions: true,
      requiredPermissions: ['VIEW_AUDIT_LOG']
    });
  }
  async run(ctx: CommandContext<Cloudflare.Env>) {
    const env:Env = ctx.serverContext;
    const targetUser:User|null|undefined = ctx.targetUser;
    if (targetUser === undefined || targetUser === null || targetUser.id === ctx.user.id) {
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

    if (await HelperUtils.CanAccountReport(targetUser.id, env)) {
      await ctx.sendFollowUp({
        allowedMentions: {
          repliedUser: true,
          users: [targetUser.id, ctx.user.id]
        },
        content: `User ${targetUser.mention} is already on the allowed reporting list`,
      });
      return;
    }

    try {
      await env.CAN_REPORT.put(targetUser.id, targetUser.username);
      await env.FORBID_LIST.delete(targetUser.id);
      await ctx.sendFollowUp({
        allowedMentions: {
          repliedUser: true,
          users: [targetUser.id, ctx.user.id]
        },
        content: `Added ${targetUser.mention} to allowed reporting list.`,
      });
    } catch(err) {
      console.error(`Failed to add user to allowed list, error was ${err}`);
      await ctx.sendFollowUp(`Encountered an error while trying to add to allow list, please try again`);
    }
  }
};