import { CloudflareWorkerServer, SlashCreator } from 'slash-create/web';
import { commands } from './commands';
import { config } from './config';
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
  // register base commands that can be used globally
  creator.withServer(cfServer).registerCommands(commands, true);

  // if we should log any errors
  if (config.COMMAND_SETTINGS.log_errors) {
    creator.on('error', (error) => console.error(error.stack || error.toString()));
    creator.on('commandError', (command, error) =>
      console.error(`Command ${command.commandName} errored:`, error.stack || error.toString())
    );
  }

  // If we should log all command executions (ideally true only in development)
  if (config.COMMAND_SETTINGS.log_run) {
    creator.on('commandRun', (command, _, ctx) =>
      console.info(`${ctx.user.username} (${ctx.user.id}) ran command ${command.commandName}`)
    );
  }
}

export default {
  async fetch(request: any, env: Env, ctx: ExecutionContext) {
    // handle redirects if this wasn't a request from Discord
    if (request.method !== "POST") {
      const requestLoc = new URL(request.url);
      // force run our scheduled command
      if (config.APP_SETTINGS.can_use_clean && requestLoc.pathname === "/clean") {
        return Response.json(await CleanThreadChain(env, ctx));
      }
      // otherwise redirect to the install URL
      if (config.APP_SETTINGS.redirect_to_install) {
        return Response.redirect(`https://discord.com/oauth2/authorize?client_id=${env.DISCORD_APP_ID}`);
      }
    }

    // inject our discord commands, if we don't have them (subcommands)
    if (!creator)
      makeCreator(env);
    return cfServer.fetch(request, env, ctx);
  },
  // handling cleanup operations
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    await CleanThreadChain(env, ctx);
  },
};
