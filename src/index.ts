import isEmpty from 'just-is-empty';
import { CloudflareWorkerServer, SlashCreator } from 'slash-create/web';
import { commands } from './commands';
import ForbidAccessHelper from './commands/add-forbid';
import AddPermissionsHelper from './commands/add-permissions';
import SlashLookupCommand from './commands/slash-lookup';
import { CleanThreadChain } from './services/clean';

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

  // check to see if we should register the /lookup command
  if (env.LOOKUP_SETTINGS.slash_enabled) {
    creator.registerCommand(new SlashLookupCommand(creator));
  }

  // explicit guild only commands
  const controlGuild: string = env.CONTROL_GUILD;
  if (!isEmpty(controlGuild)) {
    creator.registerCommand(new AddPermissionsHelper(creator, controlGuild));
    creator.registerCommand(new ForbidAccessHelper(creator, controlGuild));
  }

  if (env.COMMAND_SETTINGS.log_errors) {
    creator.on('error', (error) => console.error(error.stack || error.toString()));
    creator.on('commandError', (command, error) =>
      console.error(`Command ${command.commandName} errored:`, error.stack || error.toString())
    );
  }

  if (env.COMMAND_SETTINGS.log_run) {
    creator.on('commandRun', (command, _, ctx) =>
      console.info(`${ctx.user.username} (${ctx.user.id}) ran command ${command.commandName}`)
    );
  }
}

export default {
  async fetch(request: any, env: Env, ctx: ExecutionContext) {
    if (request.method !== "POST") {
      const requestLoc = new URL(request.url);
      if (env.APP_SETTINGS.can_use_clean && requestLoc.pathname === "/clean") {
        return Response.json(await CleanThreadChain(env, ctx));
      }
      if (env.APP_SETTINGS.redirect_to_install) {
        return Response.redirect(`https://discord.com/oauth2/authorize?client_id=${env.DISCORD_APP_ID}`);
      }
    }

    if (!creator)
      makeCreator(env);
    return cfServer.fetch(request, env, ctx);
  },
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    await CleanThreadChain(env, ctx);
  },
};
