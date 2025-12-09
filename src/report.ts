import { CommandContext, MessageOptions } from "slash-create/web";
import HelperUtils from "./utils";

export type ReportObject = {
  reportedID: string;
  reportedUserName: string;
  reportTitle?: string;
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
    var message:MessageOptions = {
      ephemeral: true
    };

    let report:ReportObject = overrideReport != null ? overrideReport : {
      reportedID: "",
      reportedUserName: "",
      source: "User Tool"
    };

    const curUser:string = ctx.user.id;
    // override any passed in values
    report.reporterID = curUser;
    report.reporterName = HelperUtils.EscapeUserName(ctx.user.username);
    report.posterName = "ScamGuard User Tool";
    report.source = "User Tool";

    await ctx.defer(true);
    const canReport = await HelperUtils.CanAccountReport(curUser, env);
    if (!canReport) {
      message.content = "You are not allowed to use this command";
      return message;
    }

    // If this was sent via a right click message report
    const hadMessage = (ctx.targetMessage !== null && ctx.targetMessage !== undefined);
    
    if (hadMessage) {
      const msg = ctx.targetMessage;
      const authorName:string = msg.author.username;
      report.reportedID = msg.author.id;

      // have a little safety from potential mistakes
      if (report.reportedID == curUser) {
        message.content = "You cannot report on yourself";
        return message;
      }

      // check if the given input is a correct number
      if (!HelperUtils.IsAccountValid(report.reportedID)) {
        message.content = "This account cannot be reported";
        return message;
      }

      report.reportedUserName = HelperUtils.EscapeUserName(authorName);
      report.reportTitle = authorName;
      // formatting for the message evidence
      report.messageEvidence = `${authorName}: ${msg.content}`;
      // grab any attachments we might have as well
      if (msg.attachments.length > 0) {
        report.evidence = [];
        msg.attachments.forEach(el => {
          //console.log(`Found file: ${el.url} and proxy ${el.proxy_url}`);
          report.evidence?.push(el.url);
        });
      }
    }

    // Check to see if account is already banned.
    let banStatus = false;
    const apiResponse = await env.API_SERVICE.checkAccount(report.reportedID);
    if (apiResponse.valid) {
      banStatus = apiResponse.banned;
    } else {
      message.content = "ScamGuard encountered an error while deferring user id, please try again";
      return message;
    }

    // get out if they're already banned.
    if (banStatus === true && env.CAN_REPORT_BANNED as string !== 'true') {
      message.content = `The account \`${report.reportedID}\` has already been banned by ScamGuard.`;
      return message;
    }

    // How long we will listen to incoming reports and redirect them
    const chainTTL:number = Number(env.CHAIN_TTL);

    const channelSourceID = ctx.channel.id;
    const prevThreadID = await env.REPORT_THREAD_CHAIN.get(channelSourceID);
    const firstReport = prevThreadID == null || prevThreadID == undefined;
    let response:ReportResponse;
    var reportSuccess:boolean = false;
    try {
      response = (firstReport) ? 
        await env.REPORT.post(report, true) : 
        await env.REPORT.postFollowup(report, prevThreadID);
      reportSuccess = response.success;
    } catch(err) {
      console.error(`Encountered error ${err} on report ${report.reportedID}, was first ${firstReport}`);
      message.content = "Unable to process this action, an error has occurred. Try again later.";
      return message;
    }

    // add to KV, make it die in about 5 minutes, this count refreshes per submission via the message app tool
    if (hadMessage && reportSuccess) {
      try {
        await env.REPORT_THREAD_CHAIN.put(channelSourceID, response.threadID, {
          expirationTtl: chainTTL * 60
        });
      } catch(err) {
        console.error(`Encountered an error trying to update thread KV ${err}`);
      }
    }

    // If this is a first time report, then we show this embed.
    if (firstReport) {
      // If they forwarded a message, then we can tell them they can report more
      if (hadMessage && reportSuccess) {
        message.content = "Any additional messages reported will be automatically attached\n";
        message.content += `to the initial report until ${HelperUtils.GetTimestamp(chainTTL)}\n`;
      }
        
      // Create the embed anyways
      message.embeds = [{
        author: {
          name: "ScamGuard"
        },
        thumbnail: {
          url: "https://scamguard.app/assets/site-logo.png"
        },
        color: !reportSuccess ? 15409961 : 5761827,
        title: "Report",
        fields: [
          {
            name: "User Name",
            value: report.reportedUserName,
            inline: true
          },
          {
            name: "User ID",
            value: `\`${report.reportedID}\``,
            inline: true
          },
          {
            name: "Report Status",
            value: reportSuccess ? response.threadLink : `Failed to report`,
            inline: true
          }
        ]
      }];
    } else if (hadMessage) {
      if (!reportSuccess) {
        message.content = "Could not post to the thread, an error occurred. You may try again.";
        console.warn(`Got error when reporting ${response.status}`);
      } else {
        message.content = "Message forwarded, expiry updated.\n";
        message.content += `You may submit more messages to this report until ${HelperUtils.GetTimestamp(chainTTL)}`;
      }
    }

    return message;
  }
};