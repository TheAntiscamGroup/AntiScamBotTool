import { CommandContext } from "slash-create/web";
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
    
    if (ctx.targetMessage !== null && ctx.targetMessage !== undefined) {
      const msg = ctx.targetMessage;
      report.reportedID = msg.author.id;
      report.reportedUserName = msg.author.username;
      report.messageEvidence = msg.content;
      // grab any attachments we might have as well
      if (msg.attachments.length > 0) {
        report.evidence = [];
        msg.attachments.forEach(el => {
          console.log(`Found file: ${el.url} and proxy ${el.proxy_url}`);
          report.evidence?.push(el.url);
        });
      }
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