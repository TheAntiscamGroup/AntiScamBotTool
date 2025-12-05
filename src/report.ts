import { CommandContext, MessageOptions } from "slash-create/web";
import HelperUtils from "./utils";

export type ReportObject = {
  reportedID: string;
  reportedUserName: string;
  reporterName?: string;
  reporterID?: string;
  comments?: string;
  messageEvidence?: string;
  posterName?: string;
  evidence?: string[];
  source: string;
};

type ReportResponse = {
  status: number,
  threadLink: string,
  threadID: string,
  success: boolean
};

export class ScamGuardReport {
  public static async run(ctx: CommandContext<Cloudflare.Env>, overrideReport:ReportObject|null=null) {
    const env:Env = ctx.serverContext;

    let report:ReportObject = overrideReport != null ? overrideReport : {
      reportedID: "",
      reportedUserName: "",
      source: "User Tool"
    };

    const curUser:string = ctx.user.id;
    // override any passed in values
    report.reporterID = curUser;
    report.reporterName = ctx.user.username;
    report.posterName = "ScamGuard User Tool";
    report.source = "User Tool";

    await ctx.defer(true);
    const canReport = await HelperUtils.CanAccountReport(curUser, env);
    if (!canReport) {
      ctx.sendFollowUp({
        content: "You are not allowed to use this command",
        ephemeral: true
      });
      return;
    }

    // If this was sent via a right click message report
    const hadMessage = (ctx.targetMessage !== null && ctx.targetMessage !== undefined);
    
    if (hadMessage) {
      const msg = ctx.targetMessage;
      report.reportedID = msg.author.id;
      report.reportedUserName = msg.author.username;
      report.messageEvidence = `${report.reportedUserName}: ${msg.content}`;
      // grab any attachments we might have as well
      if (msg.attachments.length > 0) {
        report.evidence = [];
        msg.attachments.forEach(el => {
          console.log(`Found file: ${el.url} and proxy ${el.proxy_url}`);
          report.evidence?.push(el.url);
        });
      }
    }
    // How long we will listen to incoming reports and redirect them
    const chainTTL:number = Number(env.CHAIN_TTL);

    const channelSourceID = ctx.channel.id;
    const prevThreadID = await env.REPORT_THREAD_CHAIN.get(channelSourceID);
    const firstReport = prevThreadID == null || prevThreadID == undefined;
    const response:ReportResponse = (firstReport) ? await env.REPORT.post(report, true) : await env.REPORT.postFollowup(report, prevThreadID);
    const success:boolean = response.success;

    // Create the basis for the message to be sent over Discord.
    var responseMessage:MessageOptions = {
      ephemeral: true,
    };

    // add to KV, make it die in about 5 minutes, this count refreshes per submission via the message app tool
    if (hadMessage && success) {
      await env.REPORT_THREAD_CHAIN.put(channelSourceID, response.threadID, {
        expirationTtl: chainTTL * 60
      });
    }
    // If this is a first time report, then we show this embed.
    if (firstReport) {
      // If they forwarded a message, then we can tell them they can report more
      if (hadMessage && success) {
        responseMessage.content = `You can report more messages using the tool on from this DM channel to ScamGuard for ${chainTTL} more minutes`;
      }
        
      // Create the embed anyways
      responseMessage.embeds = [{
        author: {
          name: "ScamGuard"
        },
        thumbnail: {
          url: "https://scamguard.app/assets/site-logo.png"
        },
        color: !success ? 15409961 : 5761827,
        title: "Report",
        fields: [
          {
            name: "User ID",
            value: `\`${report.reportedID}\``,
            inline: true
          },
          {
            name: "Report Status",
            value: success ? response.threadLink : `Failed to report with code ${response.status}`,
            inline: true
          }
        ]
      }];
    } else if (hadMessage) {
      if (!success) {
        responseMessage.content = "Could not post to the thread, an error occurred. You may try again.";
      } else {
        responseMessage.content = `Message forwarded, you may submit more messages for ${chainTTL} more minutes`;
      }
    }

    await ctx.sendFollowUp(responseMessage);
  }
};