/* Account reporting */
declare interface ReportObject {
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

declare interface ReportResponse {
  status: number;
  threadLink: string;
  threadID: string;
  success: boolean;
};

declare type ReportAccount = (report: ReportObject, waitForThread: boolean) => Promise<ReportResponse>;
declare type ReportAccountFollowup = (report: ReportObject, previousThread: string) => Promise<ReportResponse>;

declare interface ReportAccountService extends Service {
  post: ReportAccount;
  postFollowup: ReportAccountFollowup;
}