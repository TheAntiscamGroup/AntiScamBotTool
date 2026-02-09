import isEmpty from 'just-is-empty';
import parse from 'parse-duration';

// List of all the public ScamGuard account ids
const ScamGuardAccounts = ["1152057650226401320", "1176299970568147057", "1226254289161158776", "1443130827662823557"];

export default class HelperUtils {
  public static CheckSetting(setting: any, value: boolean): boolean {
    const checkAgainst:string = value ? "true" : "false";
    return (setting as string) == checkAgainst;
  }
  public static GetTimestamp(offsetTime: number|null=null): string {
    const date = new Date();
    if (offsetTime !== null)
      date.setSeconds(date.getSeconds() + offsetTime);

    // It appears that Discord wants the timestamp in seconds, but I'm not sure for certain. 
    // Couldn't find any methodology on it.
    // Everyone just kept reporting this as the answer, which would chop off the last 3 ms characters.
    return `<t:${date.getTime().toString().slice(0,-3)}>`;
  }
  // Gets the chain TTL time (in seconds)
  public static GetChainTTLTime(env: Env): number {
    const TTL:string = env.CHAIN_TTL;
    if (isEmpty(TTL) || TTL.length > 100)
      return 60;

    const TTLTime:number = Math.floor(parse(TTL, 's') ?? 60);
    // cf requires the minimum number to be 60
    if (TTLTime < 60)
      return 60;

    return TTLTime;
  }
  public static EscapeUserName(username: string): string {
    return username.replace(/[\_]/g, '\_');
  }
  public static IsAccountValid(account: string): boolean {
    if (account == null || account.length < 17 || account.length > 20)
      return false;

    // prevent the bot accounts from being reported.
    if (ScamGuardAccounts.includes(account))
      return false;

    // check if it's all numbers
    return /^\d+$/.test(account);
  }
  public static async IsAccountForbidden(account: string, env: Env): Promise<boolean> {
    // Can people be blocked from using this tool? 
    // This function checks access.
    if (HelperUtils.CheckSetting(env.USES_BLOCKLIST, false))
      return false;

    try {
      const kvLookup = await env.FORBID_LIST.get(account);
      if (kvLookup == null)
        return false;
    } catch(err) {
      console.error(`Failed to lookup ${account} in IsAccountForbidden with err ${err}`);
    }
    return true;
  }
  public static async CanAccountReport(account: string, env: Env): Promise<boolean> {
    if (HelperUtils.CheckSetting(env.ALL_CAN_REPORT, true))
      return true;

    try {
      const kvLookup = await env.CAN_REPORT.get(account);
      if (kvLookup != null)
        return true;
    } catch(err) {
      console.error(`Failed to lookup ${account} in CanAccountReport with err ${err}`);
    }
    return false;
  }
  public static GetSupportLink(): string {
    return "You are currently forbidden from using this tool. " +
    "Please [Open a Support ticket](https://discord.com/channels/1155997672667365406/1281338895430320218) " +
    "on the TAG Server if you think this is an error.";
  }
};