import isEmpty from 'just-is-empty';
import parse from 'parse-duration';

export default class HelperUtils {
  public static GetTimestamp(offsetTime: number=0): string {
    const date: Date = new Date();
    if (offsetTime != 0)
      date.setSeconds(date.getSeconds() + offsetTime);

    return this.FormatTime(date);
  }
  public static FormatTime(input: Date): string {
    // It appears that Discord wants the timestamp in seconds, but I'm not sure for certain.
    // Couldn't find any methodology on it.
    // Everyone just kept reporting this as the answer, which would chop off the last 3 ms characters.
    return `<t:${input.getTime().toString().slice(0,-3)}>`;
  }
  // Gets the chain TTL time (in seconds)
  public static GetChainTTLTime(env: Env): number {
    if (env.REPORT_SETTINGS.message_source_lifetime === undefined)
      return 60;

    const TTL: string = env.REPORT_SETTINGS.message_source_lifetime;
    if (isEmpty(TTL) || TTL.length > 100)
      return 60;

    const TTLTime: number = Math.floor(parse(TTL, 's') ?? 60);
    // cf requires the minimum number to be 60
    if (TTLTime < 60)
      return 60;

    return TTLTime;
  }
  public static IsAccountValid(env: Env, account: string): boolean {
    if (account == null || account.length < 17 || account.length > 20)
      return false;

    // check to see account is valid and has values
    if (!isEmpty(env.APP_SETTINGS.accounts)) {
      // prevent the bot accounts from being reported.
      if ((env.APP_SETTINGS as ApplicationSettings).accounts!.includes(account))
        return false;
    }

    // check if it's all numbers
    return /^\d+$/.test(account);
  }
  public static async IsAccountForbidden(account: string, env: Env): Promise<boolean> {
    // Can people be blocked from using this tool?
    // This function checks access.
    if (!env.COMMAND_SETTINGS.use_forbid_list)
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
    if (env.REPORT_SETTINGS.allow_all)
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
  public static async CanAccountLookup(account: string, env: Env): Promise<boolean> {
    if (env.LOOKUP_SETTINGS.allow_all)
      return true;

    try {
      const kvLookup = await env.CAN_REPORT.get(account);
      if (kvLookup != null)
        return true;
    } catch(err) {
      console.error(`Failed to lookup ${account} in CanAccountLookup with err ${err}`);
    }
    return false;
  }
  public static GetSupportLink(env: Env): string {
    return "You are currently forbidden from using this tool. " +
    `Please [Open a Support ticket](${env.SUPPORT_THREAD}) ` +
    "if you believe this is an error.";
  }
};