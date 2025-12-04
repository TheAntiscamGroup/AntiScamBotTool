// little helper that returns
export default class HelperUtils {
  public static IsAccountValid(account: string): boolean {
    if (account == null || account.length < 17 || account.length > 20)
      return false;

    // check if it's all numbers
    return /^\d+$/.test(account);
  };
  public static async IsAccountForbidden(account: string, env: Env): Promise<boolean> {
    const kvLookup = await env.FORBID_LIST.get(account);
    if (kvLookup)
      return true;
    return false;
  }
  public static async CanAccountReport(account: string, env: Env): Promise<boolean> {
    const kvLookup = await env.CAN_REPORT.get(account);
    if (kvLookup)
      return true;
    return false;
  }
  public static GetSupportLink(): string {
    return "You are currently forbidden from using this tool. " +
    "Please [Open a Support ticket](https://discord.com/channels/1155997672667365406/1281338895430320218) " +
    "on the TAG Server if you think this is an error.";
  }
};