/* Check account */
export type CheckAccountReturn = {
  valid: boolean;
  banned: boolean;
};
export type CheckAccount = (userID: string) => Promise<CheckAccountReturn>;
export interface CheckAccountService extends Service {
  checkAccount: CheckAccount;
}

/* Account reporting */
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

export type ReportResponse = {
  status: number,
  threadLink: string,
  threadID: string,
  success: boolean
};

export type ReportAccount = (report: ReportObject, waitForThread: boolean) => Promise<ReportResponse>;
export type ReportAccountFollowup = (report: ReportObject, previousThread: string) => Promise<ReportResponse>;

export interface ReportAccountService extends Service {
  post: ReportAccount;
  postFollowup: ReportAccountFollowup;
}