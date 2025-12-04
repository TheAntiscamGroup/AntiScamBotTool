import { ApplicationCommandType, ApplicationIntegrationType, CommandContext, InteractionContextType, MessageOptions, SlashCommand, SlashCreator } from "slash-create/web";

export default class MessageReport extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      dmPermission: true,
      contexts: [InteractionContextType.PRIVATE_CHANNEL],
      integrationTypes: [ApplicationIntegrationType.USER_INSTALL],
      type: ApplicationCommandType.MESSAGE,
      name: "Report Message to ScamGuard",
      deferEphemeral: true
    });
  }
  async run(ctx: CommandContext<Cloudflare.Env>) {
    const msg = ctx.targetMessage;
    if (msg === undefined || msg === null)
      return;

    const response: MessageOptions = {
      content: `Sender: ${msg.author.id} - Message: ${msg.content}`,
      ephemeral: true
    };
    ctx.send(response);
  }
};