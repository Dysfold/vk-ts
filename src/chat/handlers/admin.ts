import { GLOBAL_PIPELINE } from '../pipeline';

GLOBAL_PIPELINE.addHandler('logMessage', -9999, (msg) => {
  // TODO log the chat message
  log.info(`CHAT: (${msg.channel.name}) ${msg.sender.name}: ${msg.content}`);
});
