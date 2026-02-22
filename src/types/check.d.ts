/* API definitions */
declare type APICheckReturn = {
  valid: boolean;
};
declare type CheckAccountReturn = APICheckReturn & {
  banned: boolean;
};
declare type BanDetailsReturn = CheckAccountReturn & {
  banned_on?: string;
  banned_by: string;
  evidence_thread?: string;
};
declare type StatsDetailsReturn = APICheckReturn & {
  count: number;
};

declare type CheckAccount = (userID: string) => Promise<CheckAccountReturn>;
declare type BanDetails = (userID: string) => Promise<BanDetailsReturn>;
declare type ServiceStats = () => Promise<StatsDetailsReturn>;

declare interface CheckAccountService extends Service {
  checkAccount: CheckAccount;
  getBanDetails: BanDetails;
  getBanStats: ServiceStats;
};