import { SlashCommand, SlashCreator, CommandContext, ApplicationIntegrationType, InteractionContextType, MessageOptions } from "slash-create/web"
import HelperUtils from "../utils";
import { CommandDescription } from "../descriptions";


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

    var message:MessageOptions = {
      ephemeral: shouldStealth,
    };

    // Prevent usage if the user is forbidden.
    if (await HelperUtils.IsAccountForbidden(curUser, env)) {
      message.content = HelperUtils.GetSupportLink();
      return message;
    }

    var responseFields = [{
        name: "",
        value: "",
        inline: false
      },
      {
        name: "Checking Accounts",
        value: `To check on an account:

          1. Click the three dots on an user's profile card (_mobile_) or right click on the user's avatar (_desktop_).\n2. Select \`Apps\`\n3. Choose \`${CommandDescription.Check}\`\n\nIf the user shows up as Banned, then the mutual server is not using ScamGuard.`,
        inline: false,
      },
    ];

    var canReport:boolean = false;

    // Check if the user can report
    if (await HelperUtils.CanAccountReport(curUser, env)) {
      canReport = true;
      responseFields.push({
        name: "",
        value: "",
        inline: false
      }, 
      {
        name: "Reporting Accounts",
        value: `To report an account: 

              1. Right click (_desktop_) or long hold (_mobile_) on any message.\n2. Select \`Apps\`\n3. Choose \`${CommandDescription.Report}\`

              You can use this action _multiple times_.

              Each action will _automatically_ bundle the message into the same report so long as the action is taken within ${env.CHAIN_TTL} minutes of the last one.
              An expiration time will be provided upon each successful send.

              This action can processes message attachments, such as images, and will include them in the report for you.`,
        inline: false,
      });
    }
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

        **REMEMBER**: Do not tell the target you have this tool. This tool will only respond to you in messages that only you can see.`,
      fields: responseFields,
      footer: {
        text: "Any messages sent are subject to ScamGuard's Privacy Policy and Terms of Service"
      }
    }];
    return message;
  }
};