import { commands } from './commands';
import { SlashCreator, CloudflareWorkerServer } from 'slash-create/web';
import AddPermissionsHelper from './commands/add-permissions';
import ForbidAccessHelper from './commands/add-forbid';

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
  creator.registerCommand(new AddPermissionsHelper(creator, controlGuild));
  creator.registerCommand(new ForbidAccessHelper(creator, controlGuild));

  if (env.LOG_ERRORS as string !== "false") {
    creator.on('error', (error) => console.error(error.stack || error.toString()));
    creator.on('commandError', (command, error) =>
      console.error(`Command ${command.commandName} errored:`, error.stack || error.toString())
    );
  }

  if (env.LOG_COMMAND_RUN as string !== "false") {
    creator.on('commandRun', (command, _, ctx) =>
      console.info(`${ctx.user.username} (${ctx.user.id}) ran command ${command.commandName}`)
    );
  }
}

export default {
  async fetch(request: any, env: Record<string, any>, ctx: any) {
    if (!creator) 
      makeCreator(env);
    return cfServer.fetch(request, env, ctx);
  }
};
