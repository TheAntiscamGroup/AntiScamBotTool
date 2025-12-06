import { SlashCommand, SlashCreator, ApplicationCommandType, ApplicationIntegrationType, CommandContext, InteractionContextType, User, MessageOptions } from "slash-create/web"
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
    var responseMsg:MessageOptions = {
      ephemeral: true
    };

    if (targetUser === undefined || targetUser === null || targetUser.id === ctx.user.id) {
      responseMsg.content = `\`${targetUser}\` is invalid!`;
      return responseMsg;
    }

    // Technically shouldn't be necessary but we'll do it anyways
    if (ctx.guildID !== env.CONTROL_GUILD) {
      responseMsg.content = "This command is not allowed outside of the control guild";
      return responseMsg;
    }

    // Defer to think.
    await ctx.defer();

    // Update the allowed mentions list.
    responseMsg.allowedMentions = {
      repliedUser: true,
      users: [targetUser.id, ctx.user.id]
    };

    // Check if the user can report already.
    if (await HelperUtils.CanAccountReport(targetUser.id, env)) {
      responseMsg.content = `User ${targetUser.mention} is already on the allowed reporting list`;
      return responseMsg;
    }

    try {
      await env.CAN_REPORT.put(targetUser.id, targetUser.username);
      await env.FORBID_LIST.delete(targetUser.id);
      responseMsg.ephemeral = false;
      responseMsg.content = `Added ${targetUser.mention} to allowed reporting list.`;
    } catch(err) {
      console.error(`Failed to add user to allowed list, error was ${err}`);
      responseMsg.ephemeral = true;
      responseMsg.content = `Encountered an error while trying to add ${targetUser.mention} to allow list, please try again`;
    }
    return responseMsg;
  }
};