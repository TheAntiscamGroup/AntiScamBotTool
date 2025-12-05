// little helper that returns
export default class HelperUtils {
  public static IsAccountValid(account: string): boolean {
    if (account == null || account.length < 17 || account.length > 20)
      return false;

    // check if it's all numbers
    return /^\d+$/.test(account);
  };
  public static async IsAccountForbidden(account: string, env: Env): Promise<boolean> {
    // Can people be blocked from using this tool? 
    // This function checks access.
    if (env.USES_BLOCKLIST === "false")
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
    if (env.ALL_CAN_REPORT === "true")
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