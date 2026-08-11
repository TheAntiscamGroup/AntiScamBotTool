import isEmpty from 'just-is-empty';
import parse from 'parse-duration';
import { config } from './config';

export function GetTimestamp(offsetTime: number=0): string {
  const date: Date = new Date();
  if (offsetTime != 0)
    date.setSeconds(date.getSeconds() + offsetTime);
  return FormatTime(date);
}

export function CanUseModCommand(): boolean {
  return config.CONTROL_GUILD !== undefined && config.COMMAND_SETTINGS.install_mod_commands;
}

export function FormatTime(input: Date): string {
  // It appears that Discord wants the timestamp in seconds, but I'm not sure for certain.
  // Couldn't find any methodology on it.
  // Everyone just kept reporting this as the answer, which would chop off the last 3 ms characters.
  return `<t:${input.getTime().toString().slice(0,-3)}>`;
}

// Gets the chain TTL time (in seconds)
export function GetChainTTLTime(): number {
  const TTL: string|undefined = config.REPORT_SETTINGS.message_source_lifetime;
  if (isEmpty(TTL) || TTL!.length > 100)
    return 60;

  const TTLTime: number = Math.floor(parse(TTL, 's') ?? 60);
  // cf requires the minimum number to be 60
  if (TTLTime < 60)
    return 60;

  return TTLTime;
}

// prevent accounts from being used/reported (mostly just other ScamGuard bots)
export function IsAccountProtected(account: string|null): boolean {
  if (account == null)
    return false;

  // check to see account is valid and has values
  if (!isEmpty(config.APP_SETTINGS.accounts)) {
    // prevent the bot accounts from being reported.
    if (config.APP_SETTINGS.accounts!.includes(account))
      return true;
  }
  return false;
}

export function IsAccountValid(account: string|null): boolean {
  if (account == null || account.length < 17 || account.length > 20)
    return false;

  if (IsAccountProtected(account))
    return false;

  // check if it's all numbers
  return /^\d+$/.test(account);
}

export async function IsAccountForbidden(account: string, env: Env): Promise<boolean> {
  // Can people be blocked from using this tool?
  // This function checks access.
  if (!config.COMMAND_SETTINGS.use_forbid_list)
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

export async function CheckAccountAllowed(account: string, env: Env): Promise<boolean> {
  try {
    const kvLookup = await env.CAN_REPORT.get(account);
    if (kvLookup != null)
      return true;
  } catch(err) {
    console.error(`Failed to lookup ${account} in CheckAccountAllowed with err ${err}`);
  }
  return false;
}

export async function CanAccountReport(account: string, env: Env): Promise<boolean> {
  if (config.REPORT_SETTINGS.allow_all)
    return true;
  return await CheckAccountAllowed(account, env);
}

export async function CanAccountLookup(account: string, env: Env): Promise<boolean> {
  if (config.LOOKUP_SETTINGS.allow_all)
    return true;
  return await CheckAccountAllowed(account, env);
}

export function GetSupportLink(env: Env): string {
  return "You are currently forbidden from using this tool. " +
  `Please [Open a Support ticket](${env.SUPPORT_THREAD}) ` +
  "if you believe this is an error.";
}