import { CommandContext, MessageOptions } from "slash-create/web";
import HelperUtils from "./utils";
import { CheckAccountService, ReportAccountService, ReportObject, ReportResponse } from "./services";

const EmptyReportResponse:ReportResponse = {
  status: 0,
  threadLink: "",
  threadID: "",
  success: false
};

export class ScamGuardReport {
  public static async run(ctx: CommandContext<Cloudflare.Env>, overrideReport:ReportObject|null=null) {
    const env:Env = ctx.serverContext;
    const usesUserThread:boolean = HelperUtils.CheckSetting(env.USE_USER_TO_THREAD, true);
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

      report.reportedUserName = authorName;
      report.reportTitle = HelperUtils.EscapeUserName(authorName);
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
    const apiResponse = await (env.API_SERVICE as CheckAccountService).checkAccount(report.reportedID);
    if (apiResponse.valid) {
      banStatus = apiResponse.banned;
    } else {
      message.content = "ScamGuard encountered an error while deferring user id, please try again";
      return message;
    }

    // get out if they're already banned.
    if (banStatus === true && HelperUtils.CheckSetting(env.CAN_REPORT_BANNED, false)) {
      message.content = `The account \`${report.reportedID}\` has already been banned by ScamGuard.`;
      return message;
    }

    const channelSourceID = ctx.channel.id;
    const lookupKey:string = (usesUserThread) ? report.reportedID : channelSourceID;
    const prevThreadID = await env.REPORT_THREAD_CHAIN.get(lookupKey);
    const firstReport = prevThreadID == null || prevThreadID == undefined;
    let response:ReportResponse = EmptyReportResponse;
    var reportSuccess:boolean = false;
    try {
      const reporter:ReportAccountService = (env.REPORT as ReportAccountService);
      response = (firstReport) ? await reporter.post(report, true) : await reporter.postFollowup(report, prevThreadID);
      reportSuccess = response.success;
    } catch(err) {
      console.error(`Encountered error ${err} on report ${report.reportedID}, was first ${firstReport}`);
      message.content = "Unable to process this action, an error has occurred. Try again later.";
      return message;
    }

    // How long we will listen to incoming reports and redirect them (this is in seconds)
    const chainTTL:number = HelperUtils.GetChainTTLTime(env);

    // add to KV, make it die at TTL time, this count refreshes per submission via the message app tool
    if (hadMessage && reportSuccess) {
      try {
        let options:any = {};
        if (!usesUserThread) {
          options = {
            expirationTtl: chainTTL
          };
        }
        await env.REPORT_THREAD_CHAIN.put(lookupKey, response.threadID, options);
      } catch(err) {
        console.error(`Encountered an error trying to update thread KV ${err}`);
      }
    }

    // If this is a first time report, then we show this embed.
    if (firstReport) {
      // If they forwarded a message, then we can tell them they can report more
      if (hadMessage && reportSuccess) {
        message.content = "Any additional messages reported will be automatically attached to the initial report";
        if (!usesUserThread)
          message.content += ` until ${HelperUtils.GetTimestamp(chainTTL)}\n`;
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
        console.warn(`Got error when follow up reporting ${response.status}`);
        if (response.status === 400) {
          // Remove the channel source from the KV as an error has occurred.
          // 400 usually means bad request but it's extremely unlikely that we'll hit that because every tool
          // has validated all of it's potential data. So delete the thread KV info instead.
          if (!usesUserThread)
            await env.REPORT_THREAD_CHAIN.delete(channelSourceID);

          message.content = "Post thread could no longer be found, please resubmit again shortly."
        } else if (response.status === 401) {
          // Too long of a post
          message.content = "Post was too long to forward properly";
        } else if (response.status === 0) {
          // RPC did not respond
          message.content = `Discord API did not respond. If this occurs again, please [open a support ticket](${env.SUPPORT_THREAD})`;
        } else {
          // General error
          message.content = "Could not post to the thread, an error occurred. Please try again.";
        }
      } else {
        const expireUpdate:string = (!usesUserThread) ? ", expiry updated" : "";
        message.content = `Message forwarded${expireUpdate}.\nYou may submit more messages to this report`;
        if (!usesUserThread)
          message.content += ` until ${HelperUtils.GetTimestamp(chainTTL)}`;
      }
    }

    return message;
  }
};