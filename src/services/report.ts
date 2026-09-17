import isEmpty from "just-is-empty";
import type { CommandContext, Message, MessageOptions } from "slash-create/web";
import { config } from "../config";
import { APP_EMBED_THUMBNAIL, APP_NAME, EmbedColors } from "../consts";
import * as HelperUtils from "../utils";

export async function ScamGuardReport(ctx: CommandContext<Cloudflare.Env>, overrideReport: ReportObject|null=null) {
  const env: Env = ctx.serverContext;
  // if we should thread users based on the reported user id
  const threadsByUser: boolean = config.REPORT_SETTINGS.thread_by_user;
  const message: MessageOptions = {
    ephemeral: true
  };

  const report: ReportObject = overrideReport != null ? overrideReport : {
    reportedID: "",
    reportedUserName: "",
    source: "User Tool"
  };

  const curUser: string = ctx.user.id;
  // override any passed in values
  report.reporterID = curUser;
  report.reporterName = ctx.user.username;
  report.posterName = `${APP_NAME} User Tool`;
  report.source = "User Tool";

  await ctx.defer(true);
  const canReport = await HelperUtils.CanAccountReport(curUser, env);
  if (!canReport) {
    message.content = "You are not allowed to use this command";
    return message;
  }

  // If this was sent via a right click message report
  const hadMessage: boolean = (ctx.targetMessage !== null && ctx.targetMessage !== undefined);

  if (hadMessage) {
    const msg: Message = ctx.targetMessage!;
    const authorName: string = msg.author.username;
    report.reportedID = msg.author.id;

    // have a little safety from potential mistakes
    if (report.reportedID == curUser) {
      message.content = "You cannot send a report on yourself";
      return message;
    }

    // check if the given input is a correct number
    if (!HelperUtils.IsAccountValid(report.reportedID)) {
      message.content = "This account cannot be reported";
      return message;
    }

    report.reportedUserName = authorName;
    report.reportTitle = authorName;
    // formatting for the message evidence
    if (!isEmpty(msg.content))
      report.messageEvidence = `${authorName}: ${msg.content}`;
    else if (!isEmpty(msg.stickerItems)) {
      const firstSticker = msg.stickerItems![0];
      report.messageEvidence = `${authorName}: <sticker "${firstSticker.name}" (${firstSticker.id})>`;
    }
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
  let banStatus: boolean;
  const apiResponse: CheckAccountReturn = await (env.API_SERVICE as CheckAccountService).checkAccount(report.reportedID);
  if (apiResponse.valid) {
    banStatus = apiResponse.banned;
  } else {
    message.content = `${APP_NAME} encountered an error while deferring user id, please try again`;
    return message;
  }

  // get out if they're already banned.
  if (banStatus && !config.REPORT_SETTINGS.report_banned) {
    message.content = `The account \`${report.reportedID}\` has already been banned by ${APP_NAME}.`;
    return message;
  }

  const channelSourceID: string = ctx.channel.id;
  const lookupKey: string = (threadsByUser) ? report.reportedID : channelSourceID;
  const prevThreadID = (await env.REPORT_THREAD_CHAIN.get(lookupKey)) || "";
  const firstReport: boolean = isEmpty(prevThreadID);

  // If the id can no longer be found in the database and the user is banned, then exit out.
  // This can only happen if report_banned is true
  if (firstReport && banStatus) {
    message.content = `**NOTICE**: User has already been banned.`;
    return message;
  }

  let reportResp: ReportResponse;
  try {
    const reporter: ReportAccountService = (env.REPORT as ReportAccountService);
    reportResp = (firstReport) ? await reporter.post(report, true) : await reporter.postFollowup(report, prevThreadID);
  } catch (err: unknown) {
    console.error(`Encountered error ${String(err)} on report ${report.reportedID}, was first ${firstReport}`);
    message.content = "Unable to process this action, an error has occurred. Try again later.";
    return message;
  }

  const reportResponseData: ReportResponseMsgOptions = {
    isBanned: banStatus,
    firstReport: firstReport
  };

  // If this is a first time report, attach the report embed.
  if (firstReport) {
    // Create the embed anyways
    message.embeds = [{
      author: {
        name: APP_NAME
      },
      thumbnail: {
        url: APP_EMBED_THUMBNAIL
      },
      color: reportResp.success ? EmbedColors.green : EmbedColors.orange,
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
          value: reportResp.success ? reportResp.threadLink : `Failed to report`,
          inline: true
        }
      ]
    }];
  }

  // write the content message for the response
  if (!reportResp.success) {
    if (reportResp.status === 400) {
      // Remove the channel source from the KV as an error has occurred.
      // 400 usually means bad request but it's extremely unlikely that we'll hit that because every tool
      // has validated all of it's potential data. So delete the thread KV info instead.
      if (!threadsByUser)
        await env.REPORT_THREAD_CHAIN.delete(channelSourceID);

      message.content = "Post thread could no longer be found, please resubmit again shortly."
    } else if (reportResp.status === 401) // Too long of a post
        message.content = "Post was too long to forward properly";
      else if (reportResp.status === 0) // RPC did not respond
        message.content = `Discord API did not respond. If this occurs again, please [open a support ticket](${env.SUPPORT_THREAD})`;
      else // General error
        message.content = "Could not post to the thread, an error occurred. Please try again.";

  } else if (hadMessage) {
    reportResponseData.threadLink = reportResp.threadLink;
    message.content = writeReportResponseMsg(reportResponseData);

    // How long we will listen to incoming reports and redirect them (this is in seconds)
    const chainTTL: number = HelperUtils.GetChainTTLTime();
    let kvPutOptions: KVNamespacePutOptions|undefined;
    // if we do not group by user reported, then set up the appropriate options
    if (!threadsByUser) {
      reportResponseData.expireTime = chainTTL;
      kvPutOptions = {
        expirationTtl: chainTTL
      };
    }
    // add to KV, make it die at TTL time, this count refreshes per submission via the message app tool
    await env.REPORT_THREAD_CHAIN.put(lookupKey, reportResp.threadID, kvPutOptions);
  }

  return message;
};

function writeReportResponseMsg(options: ReportResponseMsgOptions): string {
  let responseStr: string = "";

  if (options.isBanned) {
    responseStr += "**NOTICE**: User is already banned\n";
  }

  responseStr += (options.firstReport) ? "Report created!" : "Message forwarded!";
  const reportLink = (options.threadLink === undefined) ? `[the report thread](${options.threadLink})` : "the report thread";
  responseStr += ` You can use this command to forward additional messages to ${reportLink}`;
  if (options.expireTime) {
    responseStr += ` until ${HelperUtils.GetTimestamp(options.expireTime)}`;
  }
  return responseStr;
}