import { CHAT_CHANNELS } from '../channel';
import { isChannelIgnored } from '../ignore';
import { LOCAL_PIPELINE } from '../pipeline';
import { formatMessage, formatProfession, formatSender } from '../style/format';
import { deliveryHandler } from './delivery';

/**
 * Discard messages from channels that players have ignored with
 * /ch leave <channel>.
 */
LOCAL_PIPELINE.addHandler('ignoredChannels', 0, (msg, receiver) => {
  if (isChannelIgnored(receiver, msg.channel)) {
    msg.discard = true; // Player won't see this message
  }
});

/**
 * Deliver only messages that have not been discarded earlier.
 */
const DELIVER_PRIORITY = 9999;

CHAT_CHANNELS.global.local.addHandler(
  'deliverMessage',
  DELIVER_PRIORITY,
  deliveryHandler((msg, theme) => [
    ...formatProfession(msg.sender, theme),
    formatSender(msg.sender, theme),
    formatMessage(msg.content, theme),
  ]),
);
