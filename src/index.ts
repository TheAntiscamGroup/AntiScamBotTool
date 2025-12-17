import { commands } from './commands';
import { SlashCreator, CloudflareWorkerServer } from 'slash-create/web';
import AddPermissionsHelper from './commands/add-permissions';
import ForbidAccessHelper from './commands/add-forbid';
import isEmpty from 'just-is-empty';
import { CheckAccountService } from './services';
import HelperUtils from './utils';

const cfServer = new CloudflareWorkerServer();
let creator: SlashCreator;
// Since we only get our secrets on fetch, set them before running
function makeCreator(env: Record<string, any>) {
  creator = new SlashCreator({
    applicationID: env.DISCORD_APP_ID,
    publicKey: env.DISCORD_PUBLIC_KEY,
    token: env.DISCORD_BOT_TOKEN
  });
  // base commands that can be used globally
  creator.withServer(cfServer).registerCommands(commands, false);
  
  // explicit guild only commands
  const controlGuild:string = env.CONTROL_GUILD;
  if (!isEmpty(controlGuild)) {
    creator.registerCommand(new AddPermissionsHelper(creator, controlGuild));
    creator.registerCommand(new ForbidAccessHelper(creator, controlGuild));
  }

  if (HelperUtils.CheckSetting(env.LOG_ERRORS, true)) {
    creator.on('error', (error) => console.error(error.stack || error.toString()));
    creator.on('commandError', (command, error) =>
      console.error(`Command ${command.commandName} errored:`, error.stack || error.toString())
    );
  }

  if (HelperUtils.CheckSetting(env.LOG_COMMAND_RUN, true)) {
    creator.on('commandRun', (command, _, ctx) =>
      console.info(`${ctx.user.username} (${ctx.user.id}) ran command ${command.commandName}`)
    );
  }
}

export default {
  async fetch(request: any, env: Record<string, any>, ctx: ExecutionContext) {
    if (!creator) 
      makeCreator(env);
    return cfServer.fetch(request, env, ctx);
  },
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    // Clean up the USER_TO_THREAD KV table if the user reported is banned.
    if (HelperUtils.CheckSetting(env.USE_USER_TO_THREAD, true)) {
      let options = { cursor: "", limit: 200 };
      // loop forever until we're done.
      while (true) {
        // list all the entries in the KV table
        const response = await env.REPORT_THREAD_CHAIN.list(options);
        // run through all the objects in the response
        for (const userEntry of response.keys) {
          try {
            // Check our API to see if that user is banned
            const apiResponse = await (env.API_SERVICE as CheckAccountService).checkAccount(userEntry.name);
            if (apiResponse.valid && apiResponse.banned) {
              // They are banned, push a future ctx to delete them.
              // This could also have been a bulk delete via the rest API but eh.
              ctx.waitUntil(env.REPORT_THREAD_CHAIN.delete(userEntry.name));
            }
          } catch(err) {
            console.error(`Encountered an error ${err} while trying to delete user ${userEntry} from the KV table`);
            continue;
          }
        }
        // loop again if we're not at the end of the KV table
        if (response.list_complete !== true)
          options.cursor = response.cursor;
        else
          break;
      }
      console.log("Finished processing cleanup.");
    }
  },
};
