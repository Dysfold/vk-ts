import { isChannelIgnored } from '../ignore';
import { LOCAL_PIPELINE } from '../pipeline';

/**
 * Discard messages from channels that players have ignored with
 * /ch leave <channel>.
 */
LOCAL_PIPELINE.addHandler('ignoredChannels', 0, (msg, receiver) => {
  if (isChannelIgnored(receiver, msg.channel)) {
    msg.discard = true; // Player won't see this message
  }
});
