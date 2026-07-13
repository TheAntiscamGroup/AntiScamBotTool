// Because of how wrangler bundles, we can't do a nice directory parse, so instead we have a big export of command objects
// if new commands are added, they should be placed into this array as well
export const commands = [
  require('./commands/click-lookup'),
  require('./commands/add-forbid'),
  require('./commands/add-permissions'),
  require('./commands/slash-lookup'),
  require('./commands/message-parse-id'),
  require('./commands/message-lookup'),
  require('./commands/message-report'),
  require('./commands/help')
];