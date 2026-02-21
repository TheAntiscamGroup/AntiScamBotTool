// Overhead configurations for changing naming and other configurable fields
export const APP_NAME: string = "ScamGuard";
export const APP_EMBED_THUMBNAIL: string = "https://scamguard.app/assets/site-logo.png";
export const TOS_LINK: string = "https://scamguard.app/terms";
export const PRIVACY_LINK: string = "https://scamguard.app/privacy";

// A helper to make sure descriptions have consistent messaging and naming
// across different interactions
export const CommandDescription = {
  SlashCheck: `looks up the given account with ${APP_NAME}`,
  Check: `Check with ${APP_NAME}`,
  Report: `Report Message to ${APP_NAME}`,
  Forbid: "MOD: Forbid an user from using the tool",
  Add: "MOD: Add to Tool Reporter",
  Help: `Get help using the ${APP_NAME} User Tool`
};
