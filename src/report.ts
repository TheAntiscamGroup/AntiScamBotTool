import { CommandContext } from "slash-create/web";
import HelperUtils from "./utils";

type ReportObject = {
  reportedID: string;
  reportedUserName: string;
  reporterName?: string;
  reporterID?: string;
  comments?: string;
  messageEvidence?: string;
  posterName?: string;
  evidence?: string[];
};

type ReportResponse = {
  status: number,
  threadLink: string,
  success: boolean
};

export default class ScamGuardReport {
  public static async run(ctx: CommandContext<Cloudflare.Env>) {
    const env:Env = ctx.serverContext;

    const curUser:string = ctx.user.id;
    let report:ReportObject = {
      reporterID: curUser,
      reportedID: "",
      reportedUserName: "",
      reporterName: ctx.user.username,
      posterName: "ScamGuard User Tool",
    };

    if (!HelperUtils.CanAccountReport(curUser, env)) {
      ctx.send({
        content: "You are not allowed to use this command",
        ephemeral: true
      });
      return;
    }

    await ctx.defer(true);
    
    if (ctx.targetMessage !== null && ctx.targetMessage !== undefined) {
      report.reportedID = ctx.targetMessage.author.id;
      report.reportedUserName = ctx.targetMessage.author.username;
      report.messageEvidence = ctx.targetMessage.content;
      // TODO: Grab files/embeds if forwarded?
    }

    const response:ReportResponse = await env.REPORT.post(report, true);
    const success:boolean = response.success;
    await ctx.sendFollowUp({
      ephemeral: true,
        embeds: [
        {
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
        }
      ]
    });
  }
};