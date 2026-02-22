/* Account reporting */
declare type ReportObject = {
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

declare type ReportResponse = {
  status: number,
  threadLink: string,
  threadID: string,
  success: boolean
};

declare type ReportAccount = (report: ReportObject, waitForThread: boolean) => Promise<ReportResponse>;
declare type ReportAccountFollowup = (report: ReportObject, previousThread: string) => Promise<ReportResponse>;

declare interface ReportAccountService extends Service {
  post: ReportAccount;
  postFollowup: ReportAccountFollowup;
}