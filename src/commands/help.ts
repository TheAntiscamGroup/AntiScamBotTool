import {
  ApplicationIntegrationType, CommandContext, EmbedField,
  InteractionContextType, MessageOptions, SlashCommand, SlashCreator
} from "slash-create/web";
import { CommandDescription } from "../descriptions";
import HelperUtils from "../utils";

export default class LookupCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      contexts: [InteractionContextType.PRIVATE_CHANNEL, InteractionContextType.BOT_DM],
      integrationTypes: [ApplicationIntegrationType.USER_INSTALL],
      throttling: {
        duration: 5,
        usages: 2,
      },
      name: "help",
      description: CommandDescription.Help
    });
  }

  async run(ctx: CommandContext<Cloudflare.Env>) {
    const curUser:string = ctx.user.id;
    const env:Env = ctx.serverContext;
    // Since this command can be sent in bot DMs, determine if we should ephemeral it if sent there.
    const shouldStealth:boolean = ctx.context == InteractionContextType.BOT_DM ? false : true;
    await ctx.defer(shouldStealth);
    // An empty embed field that's used as spacing
    const spacingField:EmbedField = {
      name: "",
      value: "",
      inline: false
    }; 

    var message:MessageOptions = {
      ephemeral: shouldStealth,
    };

    // Prevent usage if the user is forbidden.
    if (await HelperUtils.IsAccountForbidden(curUser, env)) {
      message.content = HelperUtils.GetSupportLink();
      return message;
    }

    var responseFields = [spacingField,
      {
        name: "Checking Accounts",
        value: `To check on an account:

          1. Click the three dots on an user's profile card (_mobile_) or right click on the user's avatar (_desktop_).\n2. Select \`Apps\`\n3. Choose \`${CommandDescription.Check}\`\n\nIf the user shows up as **Banned**, then the mutual server is not using ScamGuard.`,
        inline: false,
      }, spacingField
    ];

    var canReport:boolean = false;

    // Check if the user can report
    if (await HelperUtils.CanAccountReport(curUser, env)) {
      const timeoutStr:string = HelperUtils.CheckSetting(env.USE_USER_TO_THREAD, false) ? ` and it is done within \`${env.CHAIN_TTL}\` of the previous action.\nAn expiration time will be provided upon each successful send` : "";
      canReport = true;
      responseFields.push(
      {
        name: "Reporting Accounts",
        value: `To report an account: 

              1. Right click (_desktop_) or long hold (_mobile_) on any message.\n2. Select \`Apps\`\n3. Choose \`${CommandDescription.Report}\`

              You can use this action _multiple times_.

              Each action will _automatically_ bundle the message into the same user report so long as they are not already banned${timeoutStr}.

              This action can processes message attachments, such as images, and will include them in the report for you.`,
        inline: false,
      }, spacingField);
    }
    // Links to our policies
    responseFields.push({
      name: "Note",
      value: "Messages shared are considered \`Scam Report evidence\` and are subject to our [Privacy Policy](https://scamguard.app/privacy).\n\nUsage of this tool means that you agree to our [Terms of Service](https://scamguard.app/terms)",
      inline: false
    })
    const reportAction:string = canReport ? "report and " : "";
    message.embeds = [{
      author: {
        name: "ScamGuard User Tool"
      },
      thumbnail: {
        url: "https://scamguard.app/assets/site-logo.png"
      },
      color: 2303786,
      title: "How to Use",
      description: `The ScamGuard User Tool allows you to ${reportAction}look up accounts via the Discord Application Integration feature with DMs. 

        **REMEMBER**: Do not tell the target you have this tool. This tool will respond to you in messages that only you can see.`,
      fields: responseFields,
      footer: {
        text: "Any messages sent are subject to ScamGuard's Privacy Policy and Terms of Service"
      }
    }];
    return message;
  }
};